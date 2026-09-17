import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, index, uniqueIndex, boolean, vector } from "drizzle-orm/pg-core";
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
  onboardingCompleted: boolean("onboarding_completed").default(false),
  persona: varchar("persona").default("High School Student"),
  subjectInclination: varchar("subject_inclination").default("Science & STEM"),
  feedbackStyle: varchar("feedback_style").default("Encouraging & Patient"),
  aiPartnership: varchar("ai_partnership").default("The Strategic Breakdown (Step-by-Step)"),
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
  token: varchar("token", { length: 64 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type VerificationToken = typeof verificationTokens.$inferSelect;

// Question types
export type QuestionType = "multiple_choice" | "true_false" | "short_answer";
export type DifficultyLevel = "easy" | "medium" | "hard";

// Prefix stored with an internal Qwen image transcription. The transcription
// remains available to AI features, while user-facing material views can avoid
// presenting model-generated text as if it came directly from the document.
export const IMAGE_ANALYSIS_SOURCE_MARKER = "[[PREPETUAL_IMAGE_ANALYSIS]]";
export const IMAGE_ANALYSIS_DISPLAY_TEXT = "Images analyzed visually";

// Quiz categories - AI will assign one of these based on content
export const QUIZ_CATEGORIES = [
  "categories.math",
  "categories.english", 
  "categories.science",
  "categories.socialStudies",
  "categories.globalLanguages",
  "categories.general",
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
  sourceChunkIds: z.array(z.string()).optional(),
});

export type Question = z.infer<typeof questionSchema>;

export interface LectureSlide {
  title: string;
  subtitle?: string;
  body: string[];
}

export interface LectureTopic {
  id: string;
  title: string;
  slides: LectureSlide[];
}

export interface LectureStep extends LectureSlide {
  kind: "intro" | "topic" | "summary" | "quiz";
  topicIndex?: number;
}

export interface GeneratedLecture {
  title: string;
  intro: LectureSlide;
  topics: LectureTopic[];
  summary: LectureSlide;
  revisionQuiz: LectureSlide;
  sequence: LectureStep[];
  topicStartIndices: number[];
}

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

// Source material is indexed independently before quiz generation. Keeping the
// source separate from the quiz allows dense retrieval to happen before a quiz
// row exists and lets every generated question retain evidence provenance.
export const ragSources = pgTable("rag_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  contentHash: varchar("content_hash", { length: 64 }).notNull(),
  embeddingModel: text("embedding_model").notNull(),
  embeddingDimensions: integer("embedding_dimensions").notNull().default(1536),
  chunkCount: integer("chunk_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("rag_sources_user_idx").on(table.userId),
  index("rag_sources_content_hash_idx").on(table.contentHash),
]);

export const ragSourceChunks = pgTable("rag_source_chunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").notNull().references(() => ragSources.id, { onDelete: "cascade" }),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  startOffset: integer("start_offset").notNull(),
  endOffset: integer("end_offset").notNull(),
  sectionLabel: text("section_label"),
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("rag_source_chunks_source_position_idx").on(table.sourceId, table.chunkIndex),
  index("rag_source_chunks_source_idx").on(table.sourceId),
  index("rag_source_chunks_embedding_hnsw_idx")
    .using("hnsw", table.embedding.op("vector_cosine_ops"))
    // PostgreSQL exposes index reloptions as text. Keeping these values as
    // strings prevents drizzle-kit from rebuilding the unchanged index.
    .with({ m: "16", ef_construction: "64" }),
]);

export type RagSource = typeof ragSources.$inferSelect;
export type RagSourceChunk = typeof ragSourceChunks.$inferSelect;

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  folderId: varchar("folder_id").references(() => folders.id, { onDelete: "set null" }),
  ragSourceId: varchar("rag_source_id").references(() => ragSources.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  sourceText: text("source_text").notNull(),
  sourceImageUrl: text("source_image_url"),
  sourceImages: jsonb("source_images").$type<string[]>(),
  questions: jsonb("questions").notNull().$type<Question[]>(),
  lecture: jsonb("lecture").$type<GeneratedLecture | null>(),
  difficulty: text("difficulty").default("medium"),
  category: text("category").default("Others/General"),
  generationMode: text("generation_mode").$type<"generate" | "import" | "review">(),
  isPublic: integer("is_public").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("quizzes_rag_source_idx").on(table.ragSourceId),
]);

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Private generation checkpoints; these are not playable or public quizzes.
export const quizGenerationDrafts = pgTable("quiz_generation_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  payload: jsonb("payload"),
  questions: jsonb("questions").notNull().$type<Question[]>().default([]),
  title: text("title").notNull().default("Quiz in progress"),
  category: text("category").notNull().default("Others/General"),
  requested: integer("requested").notNull(),
  status: text("status").notNull().$type<"running" | "paused" | "complete">(),
  runToken: varchar("run_token").notNull(),
  leaseUntil: timestamp("lease_until").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [index("quiz_generation_drafts_user_idx").on(table.userId)]);

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
  timeTaken: integer("time_taken").default(0),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const insertQuizResultSchema = createInsertSchema(quizResults).omit({
  id: true,
  completedAt: true,
});

export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResults.$inferSelect;

export interface ShortAnswerGradingResult {
  isCorrect: boolean;
  isPartial: boolean;
  explanation: string;
  wrongExplanation?: string;
}

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
  shortAnswerGradingResults: jsonb("short_answer_grading_results").$type<Record<string, ShortAnswerGradingResult>>().default({}),
  timeTaken: integer("time_taken").default(0),
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
export const MAX_SOURCE_TEXT_CHARS = 200_000;
export const MAX_SOURCE_IMAGES = 5;
export const MAX_SOURCE_IMAGE_CHARS = 14_000_000;
export const MAX_SOURCE_IMAGES_TOTAL_CHARS = 28_000_000;

export const generateQuizRequestSchema = z.object({
  // `text` and `sourceType` are retained for older clients. New clients send
  // materialText and prompt independently so both can be used in one quiz.
  text: z.string().max(MAX_SOURCE_TEXT_CHARS, "Text is too large").optional(),
  materialText: z.string().max(MAX_SOURCE_TEXT_CHARS, "Study material is too large").optional(),
  prompt: z.string().max(1000, "Prompt must be 1000 characters or fewer").optional(),
  sourceType: z.enum(["material", "prompt"]).default("material"),
  questionCount: z.number().min(3).max(20).default(10),
  questionTypes: z
    .array(z.enum(["multiple_choice", "true_false", "short_answer"]))
    .min(1)
    .max(3)
    .refine((types) => new Set(types).size === types.length, "Question types must be unique"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  sourceImageUrl: z.string().max(MAX_SOURCE_IMAGE_CHARS, "Source image is too large").nullable().optional(),
  documentImages: z.array(z.string().max(MAX_SOURCE_IMAGE_CHARS, "Each source image is too large")).max(MAX_SOURCE_IMAGES, `A maximum of ${MAX_SOURCE_IMAGES} images is allowed`).optional(),
  isImageOnly: z.boolean().optional(),
}).superRefine((data, ctx) => {
  const legacyText = data.text?.trim() || "";
  const materialText = data.materialText?.trim() || (data.sourceType === "material" ? legacyText : "");
  const prompt = data.prompt?.trim() || (data.sourceType === "prompt" ? legacyText : "");
  const totalImageChars =
    (data.sourceImageUrl?.length || 0) +
    (data.documentImages || []).reduce((sum, image) => sum + image.length, 0);
  const totalImageCount = (data.sourceImageUrl ? 1 : 0) + (data.documentImages?.length || 0);

  if (totalImageCount > MAX_SOURCE_IMAGES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `A maximum of ${MAX_SOURCE_IMAGES} images is allowed`,
      path: ["documentImages"],
    });
  }

  if (totalImageChars > MAX_SOURCE_IMAGES_TOTAL_CHARS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "The combined source images are too large",
      path: ["documentImages"],
    });
  }

  if (!materialText && !prompt && totalImageCount === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add at least one study material, image, YouTube transcript, or prompt",
      path: ["materialText"],
    });
  }

  if (prompt && prompt.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Prompt must be at least 3 characters",
        path: ["prompt"],
      });
  }

  if (materialText && !data.isImageOnly && materialText.length < 50) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Text must be at least 50 characters (unless using image-only mode)",
      path: ["materialText"],
    });
  }
});

export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;

export const submitQuizRequestSchema = z.object({
  quizId: z.string().min(1).max(100),
  answers: z
    .record(z.string(), z.string().max(4_000, "An answer is too long"))
    .refine((answers) => Object.keys(answers).length <= 100, "Too many answers"),
  timeTaken: z.number().int().min(0).max(7 * 24 * 60 * 60).optional(),
});

export type SubmitQuizRequest = z.infer<typeof submitQuizRequestSchema>;

// Auth request schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email address").max(320, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
});

export type RegisterRequest = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address").max(320, "Email is too long"),
  password: z.string().min(1, "Password is required").max(128, "Password is too long"),
});

export type LoginRequest = z.infer<typeof loginSchema>;
