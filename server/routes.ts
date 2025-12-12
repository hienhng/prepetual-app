import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { generateQuizQuestions, generateQuizTitle } from "./openai";
import { generateQuizRequestSchema, submitQuizRequestSchema } from "@shared/schema";
import type { Quiz, QuizResult } from "@shared/schema";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
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

// Extract text from PDF using pdf.js with proper text normalization
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      
      // Better text extraction with proper spacing
      let lastY: number | null = null;
      const pageTextParts: string[] = [];
      
      for (const item of content.items as any[]) {
        if (item.str) {
          // Check if we need a line break (different Y position)
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
    
    // Normalize whitespace and remove artifacts
    return fullText
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// Singleton Tesseract worker for OCR
let tesseractWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

async function getOCRWorker() {
  if (!tesseractWorker) {
    tesseractWorker = await createWorker("eng");
  }
  return tesseractWorker;
}

// Extract text from image using Tesseract OCR
async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    const worker = await getOCRWorker();
    const { data: { text } } = await worker.recognize(buffer);
    return text.trim();
  } catch (error) {
    console.error("OCR error:", error);
    // Reset worker on error
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
  // File upload and text extraction endpoint
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

  // Quiz generation endpoint
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const validation = generateQuizRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: validation.error.errors[0]?.message || "Invalid request",
        });
      }

      const { text, questionCount, questionTypes } = validation.data;

      // Generate quiz questions using AI
      const questions = await generateQuizQuestions({
        text,
        questionCount,
        questionTypes,
      });

      // Generate a title for the quiz
      const title = await generateQuizTitle(text);

      const quiz: Quiz = {
        id: randomUUID(),
        title,
        sourceText: text,
        questions,
        createdAt: new Date().toISOString(),
      };

      // Save quiz to storage
      await storage.saveQuiz(quiz);

      res.json(quiz);
    } catch (error) {
      console.error("Quiz generation error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to generate quiz",
      });
    }
  });

  // Quiz submission endpoint
  app.post("/api/submit-quiz", async (req, res) => {
    try {
      const validation = submitQuizRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          message: validation.error.errors[0]?.message || "Invalid request",
        });
      }

      const { quizId, answers } = validation.data;

      // Get the quiz
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      // Calculate score
      let correctAnswers = 0;
      for (const question of quiz.questions) {
        const userAnswer = answers[question.id];
        if (userAnswer) {
          // Normalize answers for comparison
          const normalizedUserAnswer = userAnswer.toLowerCase().trim();
          const normalizedCorrectAnswer = question.correctAnswer.toLowerCase().trim();
          
          if (normalizedUserAnswer === normalizedCorrectAnswer) {
            correctAnswers++;
          }
        }
      }

      const result: QuizResult = {
        quizId,
        answers,
        score: Math.round((correctAnswers / quiz.questions.length) * 100),
        totalQuestions: quiz.questions.length,
        correctAnswers,
        completedAt: new Date().toISOString(),
      };

      // Save result
      await storage.saveQuizResult(result);

      res.json(result);
    } catch (error) {
      console.error("Quiz submission error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to submit quiz",
      });
    }
  });

  // Get quiz by ID
  app.get("/api/quiz/:id", async (req, res) => {
    try {
      const quiz = await storage.getQuiz(req.params.id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quiz" });
    }
  });

  return httpServer;
}
