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
  username: varchar("username").unique(),
  passwordHash: varchar("password_hash"),
  profileImageUrl: varchar("profile_image_url"),
  emailVerified: boolean("email_verified").default(false),
  googleId: varchar("google_id").unique(),
  authProvider: varchar("auth_provider").default("email"),
  themePreference: varchar("theme_preference").default("system"),
  autoDeleteFiles: boolean("auto_delete_files").default(false),
  consecutiveCorrectConfetti: boolean("consecutive_correct_confetti").default(true),
  skipRevisionQuestions: boolean("skip_revision_questions").default(false),
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

// Quiz categories - AI will assign one of these based on content
export const QUIZ_CATEGORIES = [
  "Math",
  "English", 
  "Science",
  "Social Studies",
  "Global Languages",
  "Others/General",
] as const;

export type QuizCategory = typeof QUIZ_CATEGORIES[number];

// Question schema for validation
export const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["multiple_choice", "true_false", "short_answer"]),
  question: z.string(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  wrongAnswerExplanations: z.record(z.string(), z.string()).optional(),
  imageUrl: z.string().optional(),
});

export type Question = z.infer<typeof questionSchema>;

// Folders table for organizing quizzes
export const folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  pinnedToSidebar: boolean("pinned_to_sidebar").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFolderSchema = createInsertSchema(folders).omit({
  id: true,
  createdAt: true,
});

export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof folders.$inferSelect;

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  folderId: varchar("folder_id").references(() => folders.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  sourceText: text("source_text").notNull(),
  sourceImageUrl: text("source_image_url"),
  sourceImages: jsonb("source_images").$type<string[]>(),
  questions: jsonb("questions").notNull().$type<Question[]>(),
  difficulty: text("difficulty").default("medium"),
  category: text("category").default("Others/General"),
  generationMode: text("generation_mode").$type<"generate" | "import">(),
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
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull().$type<Record<string, string>>(),
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  wrongQuestionIds: jsonb("wrong_question_ids").$type<string[]>(),
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

// Quiz progress table for saving in-progress quizzes (synced across sessions)
export const quizProgress = pgTable("quiz_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull().$type<Record<string, string>>(),
  checkedQuestions: jsonb("checked_questions").$type<string[]>().default([]),
  currentIndex: integer("current_index").default(0),
  retryAnswers: jsonb("retry_answers").$type<Record<string, string>>().default({}),
  retryCheckedQuestions: jsonb("retry_checked_questions").$type<string[]>().default([]),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
});

export const insertQuizProgressSchema = createInsertSchema(quizProgress).omit({
  id: true,
  savedAt: true,
});

export type InsertQuizProgress = z.infer<typeof insertQuizProgressSchema>;
export type QuizProgress = typeof quizProgress.$inferSelect;

// Bug reports table for reporting incorrect AI answers
export const bugReports = pgTable("bug_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  questionId: varchar("question_id").notNull(),
  questionText: text("question_text").notNull(),
  reportReason: text("report_reason").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBugReportSchema = createInsertSchema(bugReports).omit({
  id: true,
  createdAt: true,
});

export type InsertBugReport = z.infer<typeof insertBugReportSchema>;
export type BugReport = typeof bugReports.$inferSelect;

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
  text: z.string().min(1, "Text is required"),
  questionCount: z.number().min(3).max(20).default(10),
  questionTypes: z.array(z.enum(["multiple_choice", "true_false", "short_answer"])).min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  documentImages: z.array(z.string()).optional(),
  isImageOnly: z.boolean().optional(),
}).refine(
  (data) => data.isImageOnly || data.text.length >= 50,
  { message: "Text must be at least 50 characters (unless using image-only mode)", path: ["text"] }
);

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
});

export type RegisterRequest = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
