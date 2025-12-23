import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, index, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with custom auth fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  emailVerified: boolean("email_verified").default(false),
  googleId: varchar("google_id").unique(),
  authProvider: varchar("auth_provider").default("email"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Email verification tokens
export const verificationTokens = pgTable("verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  type: varchar("type").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type VerificationToken = typeof verificationTokens.$inferSelect;

// Question types
export type QuestionType = "multiple_choice" | "true_false" | "short_answer";
export type DifficultyLevel = "easy" | "medium" | "hard";

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

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  title: text("title").notNull(),
  sourceText: text("source_text").notNull(),
  sourceImageUrl: text("source_image_url"),
  questions: jsonb("questions").notNull().$type<Question[]>(),
  difficulty: text("difficulty").default("medium"),
  isPublic: integer("is_public").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Quiz results table
export const quizResults = pgTable("quiz_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull().$type<Record<string, string>>(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  completedAt: true,
});

export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResults.$inferSelect;

// Quiz comments table
export const quizComments = pgTable("quiz_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(quizComments).omit({
  id: true,
  createdAt: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type QuizComment = typeof quizComments.$inferSelect;

// Quiz votes table (upvotes/downvotes)
export const quizVotes = pgTable("quiz_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  voteType: integer("vote_type").notNull(), // 1 for upvote, -1 for downvote
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVoteSchema = createInsertSchema(quizVotes).omit({
  id: true,
  createdAt: true,
});

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type QuizVote = typeof quizVotes.$inferSelect;

// Legacy types for backward compatibility with frontend
export const quizSchemaLegacy = z.object({
  id: z.string(),
  title: z.string(),
  sourceText: z.string(),
  questions: z.array(questionSchema),
  difficulty: z.string().optional(),
  isPublic: z.number().optional(),
  createdAt: z.union([z.string(), z.date()]),
});

export type QuizLegacy = z.infer<typeof quizSchemaLegacy>;

export const quizResultSchemaLegacy = z.object({
  id: z.string().optional(),
  quizId: z.string(),
  answers: z.record(z.string(), z.string()),
  score: z.number(),
  totalQuestions: z.number(),
  correctAnswers: z.number(),
  completedAt: z.union([z.string(), z.date()]),
});

export type QuizResultLegacy = z.infer<typeof quizResultSchemaLegacy>;

// API request schemas
export const generateQuizRequestSchema = z.object({
  text: z.string().min(50, "Text must be at least 50 characters"),
  questionCount: z.number().min(3).max(20).default(10),
  questionTypes: z.array(z.enum(["multiple_choice", "true_false", "short_answer"])).min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
});

export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;

export const submitQuizRequestSchema = z.object({
  quizId: z.string(),
  answers: z.record(z.string(), z.string()),
});

export type SubmitQuizRequest = z.infer<typeof submitQuizRequestSchema>;

// Auth request schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
