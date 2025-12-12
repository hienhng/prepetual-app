import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Question types
export type QuestionType = "multiple_choice" | "true_false" | "short_answer";

// Question schema for validation
export const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "true_false", "short_answer"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
});

export type Question = z.infer<typeof questionSchema>;

// Quiz schema for validation
export const quizSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceText: z.string(),
  questions: z.array(questionSchema),
  createdAt: z.string(),
});

export type Quiz = z.infer<typeof quizSchema>;

// Quiz result schema
export const quizResultSchema = z.object({
  quizId: z.string(),
  answers: z.record(z.string(), z.string()),
  score: z.number(),
  totalQuestions: z.number(),
  correctAnswers: z.number(),
  completedAt: z.string(),
});

export type QuizResult = z.infer<typeof quizResultSchema>;

// API request schemas
export const generateQuizRequestSchema = z.object({
  text: z.string().min(50, "Text must be at least 50 characters"),
  questionCount: z.number().min(3).max(20).default(10),
  questionTypes: z.array(z.enum(["multiple_choice", "true_false", "short_answer"])).min(1),
});

export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;

export const submitQuizRequestSchema = z.object({
  quizId: z.string(),
  answers: z.record(z.string(), z.string()),
});

export type SubmitQuizRequest = z.infer<typeof submitQuizRequestSchema>;
