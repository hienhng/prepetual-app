import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import multer from "multer";
import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { generateQuizQuestions, generateQuizTitle, importExistingQuiz } from "./openai";
import { generateQuizRequestSchema, submitQuizRequestSchema } from "@shared/schema";
import type { Question, DifficultyLevel } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPG, and PNG are allowed."));
    }
  },
});

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      let lastY: number | null = null;
      const pageTextParts: string[] = [];
      
      for (const item of content.items as any[]) {
        if (item.str) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageTextParts.push("\n");
          } else if (pageTextParts.length > 0 && !pageTextParts[pageTextParts.length - 1].endsWith(" ")) {
            pageTextParts.push(" ");
          }
          pageTextParts.push(item.str);
          lastY = item.transform[5];
        }
      }
      
      fullText += pageTextParts.join("") + "\n\n";
    }
    
    return fullText
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

let tesseractWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

async function getOCRWorker() {
  if (!tesseractWorker) {
    tesseractWorker = await createWorker("eng+vie");
  }
  return tesseractWorker;
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    const worker = await getOCRWorker();
    const { data: { text } } = await worker.recognize(buffer);
    return text.trim();
  } catch (error) {
    console.error("OCR error:", error);
    if (tesseractWorker) {
      try { await tesseractWorker.terminate(); } catch {}
      tesseractWorker = null;
    }
    throw new Error("Failed to extract text from image");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup custom auth
  setupAuth(app);

  app.post("/api/extract-text", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { buffer, mimetype } = req.file;
      let extractedText = "";

      if (mimetype === "application/pdf") {
        extractedText = await extractTextFromPDF(buffer);
      } else if (mimetype.startsWith("image/")) {
        extractedText = await extractTextFromImage(buffer);
      } else {
        return res.status(400).json({ message: "Unsupported file type" });
      }

      if (!extractedText || extractedText.length < 50) {
        return res.status(400).json({
          message: "Could not extract enough text from the document. Please try a different file with more readable content.",
        });
      }

      res.json({ text: extractedText });
    } catch (error) {
      console.error("Text extraction error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to extract text from file",
      });
    }
  });

  app.post("/api/generate-quiz", isAuthenticated, async (req: any, res) => {
    try {
      const validation = generateQuizRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: validation.error.errors[0]?.message || "Invalid request",
        });
      }

      const { text, questionCount, questionTypes, difficulty } = validation.data;
      const userId = req.user.claims.sub;

      const questions = await generateQuizQuestions({
        text,
        questionCount,
        questionTypes,
        difficulty: difficulty as DifficultyLevel,
      });

      const title = await generateQuizTitle(text);

      const quiz = await storage.saveQuiz({
        userId,
        title,
        sourceText: text,
        questions: questions as Question[],
        difficulty: difficulty || "medium",
        isPublic: 0,
      });

      res.json({
        ...quiz,
        createdAt: quiz.createdAt.toISOString(),
      });
    } catch (error) {
      console.error("Quiz generation error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to generate quiz",
      });
    }
  });

  app.post("/api/import-quiz", isAuthenticated, async (req: any, res) => {
    try {
      const { text } = req.body;
      const userId = req.user.claims.sub;
      
      if (!text || typeof text !== "string") {
        return res.status(400).json({
          message: "Text content is required",
        });
      }

      if (text.length < 50) {
        return res.status(400).json({
          message: "Text content is too short. Please upload a document with quiz questions.",
        });
      }

      const questions = await importExistingQuiz({ text });
      const title = await generateQuizTitle(text);

      const quiz = await storage.saveQuiz({
        userId,
        title,
        sourceText: text,
        questions: questions as Question[],
        difficulty: "medium",
        isPublic: 0,
      });

      res.json({
        ...quiz,
        createdAt: quiz.createdAt.toISOString(),
      });
    } catch (error) {
      console.error("Quiz import error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to import quiz",
      });
    }
  });

  app.post("/api/submit-quiz", async (req, res) => {
    try {
      const validation = submitQuizRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: validation.error.errors[0]?.message || "Invalid request",
        });
      }

      const { quizId, answers } = validation.data;

      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      let correctAnswers = 0;
      const questions = quiz.questions as Question[];
      
      for (const question of questions) {
        const userAnswer = answers[question.id];
        if (userAnswer) {
          const normalizedUserAnswer = userAnswer.toLowerCase().trim();
          const normalizedCorrectAnswer = question.correctAnswer.toLowerCase().trim();
          
          if (normalizedUserAnswer === normalizedCorrectAnswer) {
            correctAnswers++;
          }
        }
      }

      const result = await storage.saveQuizResult({
        quizId,
        answers,
        score: Math.round((correctAnswers / questions.length) * 100),
        totalQuestions: questions.length,
        correctAnswers,
      });

      res.json({
        ...result,
        completedAt: result.completedAt.toISOString(),
      });
    } catch (error) {
      console.error("Quiz submission error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to submit quiz",
      });
    }
  });

  app.get("/api/quiz/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json({
        ...quiz,
        createdAt: quiz.createdAt.toISOString(),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get quiz" });
    }
  });

  app.get("/api/quizzes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const quizzes = await storage.getQuizzesByUserId(userId);
      res.json(quizzes.map(q => ({
        ...q,
        createdAt: q.createdAt.toISOString(),
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to get quizzes" });
    }
  });

  app.put("/api/quiz/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, questions, isPublic } = req.body;
      
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (questions !== undefined) updates.questions = questions;
      if (isPublic !== undefined) updates.isPublic = isPublic ? 1 : 0;

      const quiz = await storage.updateQuiz(id, updates);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.json({
        ...quiz,
        createdAt: quiz.createdAt.toISOString(),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update quiz" });
    }
  });

  app.delete("/api/quiz/:id", async (req, res) => {
    try {
      await storage.deleteQuiz(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete quiz" });
    }
  });

  app.get("/api/quiz/:id/results", async (req, res) => {
    try {
      const results = await storage.getQuizResultsByQuizId(req.params.id);
      res.json(results.map(r => ({
        ...r,
        completedAt: r.completedAt.toISOString(),
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to get quiz results" });
    }
  });

  app.get("/api/share/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json({
        ...quiz,
        createdAt: quiz.createdAt.toISOString(),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get shared quiz" });
    }
  });

  return httpServer;
}
