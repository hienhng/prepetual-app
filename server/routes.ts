import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { sendStreakReminderEmail, sendContactEmail } from "./email";
import multer from "multer";
import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { parseOffice } from "officeparser";
import { generateQuizQuestions, importExistingQuiz } from "./openai";
import { generateQuizRequestSchema, submitQuizRequestSchema } from "@shared/schema";
import type { Question, DifficultyLevel } from "@shared/schema";
import { createJob, getJob, storeBuffer, processJob, deleteJob } from "./upload-jobs";
import crypto from "crypto";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword",
      "application/vnd.ms-powerpoint",
      "application/vnd.ms-excel",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, images, and Office documents (docx, pptx, xlsx) are allowed."));
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

async function extractTextFromOfficeDocument(buffer: Buffer): Promise<string> {
  try {
    const result = await parseOffice(buffer);
    const text = typeof result === 'string' ? result : String(result);
    return text.trim();
  } catch (error) {
    console.error("Office document extraction error:", error);
    throw new Error("Failed to extract text from document");
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup custom auth
  setupAuth(app);

  // Public config endpoint for frontend (Google Client ID is public, not sensitive)
  app.get("/api/config", (req, res) => {
    res.json({
      googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    });
  });

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
      } else if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimetype === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        mimetype === "application/msword" ||
        mimetype === "application/vnd.ms-powerpoint" ||
        mimetype === "application/vnd.ms-excel"
      ) {
        extractedText = await extractTextFromOfficeDocument(buffer);
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

  app.post("/api/upload-async", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { buffer, mimetype } = req.file;
      const jobId = crypto.randomUUID();
      
      const job = createJob(jobId, mimetype);
      storeBuffer(jobId, buffer);
      
      setImmediate(() => {
        processJob(jobId);
      });

      res.json({ jobId, status: job.status, message: job.message });
    } catch (error) {
      console.error("Async upload error:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to start upload",
      });
    }
  });

  app.get("/api/upload-status/:jobId", async (req, res) => {
    try {
      const job = getJob(req.params.jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found", expired: true });
      }

      res.json({
        status: job.status,
        progress: job.progress,
        message: job.message,
        text: job.text,
        error: job.error,
        isOfficeWithImages: job.isOfficeWithImages || false,
        documentImages: job.documentImages || [],
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get job status" });
    }
  });

  app.delete("/api/upload-job/:jobId", async (req, res) => {
    try {
      deleteJob(req.params.jobId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete job" });
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

      const { text, questionCount, questionTypes, difficulty, documentImages } = validation.data;
      const { sourceImageUrl } = req.body;
      const userId = req.user.claims.sub;

      const { questions, title } = await generateQuizQuestions({
        text,
        questionCount,
        questionTypes,
        difficulty: difficulty as DifficultyLevel,
        documentImages: documentImages || undefined,
      });

      const quiz = await storage.saveQuiz({
        userId,
        title,
        sourceText: text,
        sourceImageUrl: sourceImageUrl || null,
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
      const { text, sourceImageUrl, documentImages } = req.body;
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

      const { questions, title } = await importExistingQuiz({ 
        text,
        documentImages: Array.isArray(documentImages) ? documentImages : undefined,
      });

      const quiz = await storage.saveQuiz({
        userId,
        title,
        sourceText: text,
        sourceImageUrl: sourceImageUrl || null,
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
      
      // Get attempt counts for each quiz
      const quizzesWithAttempts = await Promise.all(
        quizzes.map(async (q) => {
          const results = await storage.getQuizResultsByQuizId(q.id);
          return {
            ...q,
            createdAt: q.createdAt.toISOString(),
            attemptCount: results.length,
          };
        })
      );
      
      res.json(quizzesWithAttempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get quizzes" });
    }
  });

  app.get("/api/user/streak", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const streak = await storage.getUserStreak(userId);
      res.json(streak);
    } catch (error) {
      console.error("Streak fetch error:", error);
      res.status(500).json({ message: "Failed to get streak" });
    }
  });

  app.get("/api/user/streak-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dates = await storage.getUserStreakHistory(userId);
      res.json(dates);
    } catch (error) {
      console.error("Streak history fetch error:", error);
      res.status(500).json({ message: "Failed to get streak history" });
    }
  });

  app.get("/api/user/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserAverageAccuracy(userId);
      res.json(stats);
    } catch (error) {
      console.error("Stats fetch error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  app.get("/api/user/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        themePreference: user.themePreference || "system",
        autoDeleteFiles: user.autoDeleteFiles || false,
      });
    } catch (error) {
      console.error("Settings fetch error:", error);
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.patch("/api/user/settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, themePreference, autoDeleteFiles, profileImageUrl } = req.body;
      
      const updates: any = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (themePreference !== undefined) updates.themePreference = themePreference;
      if (autoDeleteFiles !== undefined) updates.autoDeleteFiles = autoDeleteFiles;
      if (profileImageUrl !== undefined) updates.profileImageUrl = profileImageUrl;

      const updatedUser = await storage.updateUser(userId, updates);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        profileImageUrl: updatedUser.profileImageUrl,
        themePreference: updatedUser.themePreference || "system",
        autoDeleteFiles: updatedUser.autoDeleteFiles || false,
      });
    } catch (error) {
      console.error("Settings update error:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.post("/api/user/upload-profile-image", isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      const userId = req.user.claims.sub;
      
      await storage.updateUser(userId, { profileImageUrl: base64Image });
      
      res.json({ imageUrl: base64Image });
    } catch (error) {
      console.error("Profile image upload error:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
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

  app.get("/api/public-quizzes", async (req, res) => {
    try {
      const publicQuizzes = await storage.getPublicQuizzes();
      res.json(publicQuizzes.map(q => ({
        ...q,
        createdAt: q.createdAt.toISOString(),
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to get public quizzes" });
    }
  });

  // Comments endpoints
  app.get("/api/quiz/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByQuizId(req.params.id);
      res.json(comments.map(c => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to get comments" });
    }
  });

  app.post("/api/quiz/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      const comment = await storage.addComment({
        quizId: req.params.id,
        userId,
        content: content.trim(),
      });
      
      // Get user info for the response
      const user = await storage.getUser(userId);
      
      res.json({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        author: {
          firstName: user?.firstName || null,
          lastName: user?.lastName || null,
          profileImageUrl: user?.profileImageUrl || null,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.delete("/api/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteComment(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Votes endpoints
  app.get("/api/quiz/:id/votes", async (req: any, res) => {
    try {
      const votes = await storage.getVotesByQuizId(req.params.id);
      
      // Get user's vote if authenticated
      let userVote: number | null = null;
      if (req.user?.claims?.sub) {
        userVote = await storage.getUserVote(req.params.id, req.user.claims.sub);
      }
      
      res.json({ ...votes, userVote });
    } catch (error) {
      res.status(500).json({ message: "Failed to get votes" });
    }
  });

  app.post("/api/quiz/:id/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { voteType } = req.body;
      
      if (voteType !== 1 && voteType !== -1) {
        return res.status(400).json({ message: "Vote type must be 1 (upvote) or -1 (downvote)" });
      }
      
      // Check if user already has this vote type
      const existingVote = await storage.getUserVote(req.params.id, userId);
      
      if (existingVote === voteType) {
        // Same vote type, remove the vote (toggle off)
        await storage.removeVote(req.params.id, userId);
      } else {
        // Different or no vote, upsert the new vote
        await storage.upsertVote(req.params.id, userId, voteType);
      }
      
      // Get updated vote counts
      const votes = await storage.getVotesByQuizId(req.params.id);
      const userVote = await storage.getUserVote(req.params.id, userId);
      
      res.json({ ...votes, userVote });
    } catch (error) {
      res.status(500).json({ message: "Failed to vote" });
    }
  });

  // Streak reminder endpoint (can be called by a cron job or manually)
  app.post("/api/send-streak-reminders", async (req: any, res) => {
    try {
      // Require STREAK_REMINDER_SECRET to be set for security
      const expectedSecret = process.env.STREAK_REMINDER_SECRET;
      
      if (!expectedSecret) {
        console.error("[Streak Reminder] STREAK_REMINDER_SECRET environment variable is not set");
        return res.status(500).json({ message: "Server configuration error: STREAK_REMINDER_SECRET not configured" });
      }
      
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${expectedSecret}`) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const eligibleUsers = await storage.getUsersForStreakReminder();
      let sentCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];
      
      for (const user of eligibleUsers) {
        try {
          // Get user's streak info
          const streakInfo = await storage.getUserStreak(user.id);
          
          // Only send reminder if user has an active streak (>= 1 day)
          // and hasn't completed a quiz today (streak would be lost tomorrow)
          if (streakInfo.currentStreak >= 1) {
            const today = new Date().toISOString().split('T')[0];
            const lastActivity = streakInfo.lastActivityDate;
            
            // If last activity was yesterday, they need a reminder today
            if (lastActivity && lastActivity !== today) {
              await sendStreakReminderEmail(
                user.email,
                user.firstName,
                streakInfo.currentStreak
              );
              await storage.updateLastStreakReminderSentAt(user.id);
              sentCount++;
            } else {
              skippedCount++;
            }
          } else {
            skippedCount++;
          }
        } catch (error) {
          errors.push(`Failed to send to ${user.email}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      
      res.json({
        success: true,
        sent: sentCount,
        skipped: skippedCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Streak reminder error:", error);
      res.status(500).json({ message: "Failed to send streak reminders" });
    }
  });

  // Manual test endpoint for sending streak reminder to current user
  app.post("/api/test-streak-reminder", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const streakInfo = await storage.getUserStreak(userId);
      
      await sendStreakReminderEmail(
        user.email,
        user.firstName,
        Math.max(streakInfo.currentStreak, 1) // Use at least 1 for testing
      );
      
      res.json({ success: true, message: "Test streak reminder sent to your email" });
    } catch (error) {
      console.error("Test streak reminder error:", error);
      res.status(500).json({ message: "Failed to send test streak reminder" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      await sendContactEmail({ name, email, subject, message });
      
      res.json({ success: true, message: "Your message has been sent successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ 
        message: "Failed to send message. Please try again later." 
      });
    }
  });

  return httpServer;
}
