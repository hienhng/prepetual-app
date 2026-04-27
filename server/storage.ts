import { eq, desc, and, gt, inArray, count, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  quizzes, 
  quizResults,
  quizComments,
  quizVotes,
  quizProgress,
  bugReports,
  verificationTokens,
  folders,
  type User, 
  type UpsertUser, 
  type Quiz, 
  type QuizResult,
  type QuizComment,
  type QuizVote,
  type QuizProgress,
  type InsertQuiz,
  type InsertQuizResult,
  type InsertComment,
  type InsertVote,
  type InsertQuizProgress,
  type InsertFolder,
  type Folder,
  type Question,
  type VerificationToken,
  type BugReport,
  type InsertBugReport
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: Omit<UpsertUser, "id">): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined>;
  createVerificationToken(userId: string, token: string, type: string, expiresAt: Date): Promise<VerificationToken>;
  getVerificationToken(token: string): Promise<VerificationToken | undefined>;
  deleteVerificationToken(token: string): Promise<void>;
  verifyUserEmail(userId: string): Promise<void>;
  saveQuiz(quiz: InsertQuiz & { id?: string }): Promise<Quiz>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  getAllQuizzes(): Promise<Quiz[]>;
  getQuizzesByUserId(userId: string): Promise<Quiz[]>;
  getQuizzesByUserIdLight(userId: string): Promise<(Omit<Quiz, "questions" | "sourceText" | "sourceImages"> & { questionCount: number })[]>;
  getPublicQuizzes(): Promise<(Quiz & { author?: { username: string | null; email: string | null; profileImageUrl: string | null } })[]>;
  updateQuiz(id: string, updates: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<boolean>;
  saveQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getQuizResult(quizId: string): Promise<QuizResult | undefined>;
  getQuizResultsByQuizId(quizId: string): Promise<QuizResult[]>;
  getAttemptCountsByQuizIds(quizIds: string[]): Promise<Map<string, number>>;
  batchUpdateQuizFolder(userId: string, toAdd: string[], toRemove: string[], folderId: string): Promise<void>;
  getUserAverageAccuracy(userId: string): Promise<{ averageAccuracy: number; totalAttempts: number }>;
  getUserResultHistory(userId: string): Promise<{ date: string; accuracy: number; quizTitle: string; correctAnswers: number; totalQuestions: number; category: string; quizId: string }[]>;
  // Comments
  addComment(comment: InsertComment): Promise<QuizComment>;
  getCommentsByQuizId(quizId: string): Promise<(QuizComment & { author: { username: string | null; profileImageUrl: string | null } })[]>;
  deleteComment(commentId: string, userId: string): Promise<boolean>;
  // Votes
  upsertVote(quizId: string, userId: string, voteType: number): Promise<QuizVote>;
  removeVote(quizId: string, userId: string): Promise<boolean>;
  getVotesByQuizId(quizId: string): Promise<{ upvotes: number; downvotes: number; userVote?: number }>;
  getUserVote(quizId: string, userId: string): Promise<number | null>;
  // Recommendations
  getUserRecommendationData(userId: string): Promise<{
    hasData: boolean;
    userCategories: string[];
    weakCategories: string[];
    recentQuizIds: string[];
  }>;
  // Quiz Progress (saved in-progress quizzes)
  getQuizProgressByUserId(userId: string): Promise<(QuizProgress & { quiz: Quiz })[]>;
  saveQuizProgress(progress: InsertQuizProgress): Promise<QuizProgress & { quiz: Quiz }>;
  deleteQuizProgress(userId: string, quizId: string): Promise<boolean>;
  // Bug Reports
  saveBugReport(report: InsertBugReport): Promise<BugReport>;
  // Folders
  createFolder(folder: InsertFolder): Promise<Folder>;
  getFoldersByUserId(userId: string): Promise<Folder[]>;
  updateFolder(id: string, userId: string, name: string): Promise<Folder | undefined>;
  deleteFolder(id: string, userId: string): Promise<boolean>;
  toggleFolderPin(id: string, userId: string): Promise<Folder | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: Omit<UpsertUser, "id">): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createVerificationToken(
    userId: string,
    token: string,
    type: string,
    expiresAt: Date
  ): Promise<VerificationToken> {
    const [created] = await db
      .insert(verificationTokens)
      .values({ userId, token, type, expiresAt })
      .returning();
    return created;
  }

  async getVerificationToken(token: string): Promise<VerificationToken | undefined> {
    const [found] = await db
      .select()
      .from(verificationTokens)
      .where(and(eq(verificationTokens.token, token), gt(verificationTokens.expiresAt, new Date())));
    return found;
  }

  async deleteVerificationToken(token: string): Promise<void> {
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token));
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async saveQuiz(quiz: InsertQuiz & { id?: string }): Promise<Quiz> {
    const [savedQuiz] = await db.insert(quizzes).values({
      userId: quiz.userId,
      title: quiz.title,
      sourceText: quiz.sourceText,
      sourceImageUrl: quiz.sourceImageUrl,
      sourceImages: (quiz.sourceImages as string[]) || null,
      questions: quiz.questions as Question[],
      difficulty: quiz.difficulty || "medium",
      category: quiz.category || "Others/General",
      generationMode: quiz.generationMode || "generate",
      isPublic: quiz.isPublic || 0,
    } as any).returning();
    return savedQuiz;
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz;
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes).orderBy(desc(quizzes.createdAt));
  }

  async getQuizzesByUserId(userId: string): Promise<Quiz[]> {
    return await db.select().from(quizzes).where(eq(quizzes.userId, userId)).orderBy(desc(quizzes.createdAt));
  }

  async getQuizzesByUserIdLight(userId: string): Promise<(Omit<Quiz, "questions" | "sourceText" | "sourceImages"> & { questionCount: number })[]> {
    const rows = await db.select({
      id: quizzes.id,
      userId: quizzes.userId,
      folderId: quizzes.folderId,
      title: quizzes.title,
      sourceImageUrl: quizzes.sourceImageUrl,
      difficulty: quizzes.difficulty,
      category: quizzes.category,
      generationMode: quizzes.generationMode,
      isPublic: quizzes.isPublic,
      createdAt: quizzes.createdAt,
      questionCount: sql<number>`jsonb_array_length(${quizzes.questions})`,
    })
    .from(quizzes)
    .where(eq(quizzes.userId, userId))
    .orderBy(desc(quizzes.createdAt));
    
    return rows;
  }

  async getPublicQuizzes(): Promise<(Quiz & { author?: { username: string | null; email: string | null; profileImageUrl: string | null } })[]> {
    const results = await db
      .select({
        quiz: quizzes,
        author: {
          username: users.username,
          email: users.email,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(quizzes)
      .leftJoin(users, eq(quizzes.userId, users.id))
      .where(eq(quizzes.isPublic, 1))
      .orderBy(desc(quizzes.createdAt));
    
    return results.map(r => ({
      ...r.quiz,
      author: r.author || undefined,
    }));
  }

  async updateQuiz(id: string, updates: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.sourceText !== undefined) updateData.sourceText = updates.sourceText;
    if (updates.sourceImageUrl !== undefined) updateData.sourceImageUrl = updates.sourceImageUrl;
    if (updates.questions !== undefined) updateData.questions = updates.questions as Question[];
    if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
    if (updates.folderId !== undefined) updateData.folderId = updates.folderId;
    if (updates.generationMode !== undefined) updateData.generationMode = updates.generationMode;
    
    const [updated] = await db.update(quizzes)
      .set(updateData)
      .where(eq(quizzes.id, id))
      .returning();
    return updated;
  }

  async deleteQuiz(id: string): Promise<boolean> {
    // Delete quiz results first
    await db.delete(quizResults).where(eq(quizResults.quizId, id));
    // Then delete the quiz
    await db.delete(quizzes).where(eq(quizzes.id, id));
    return true;
  }

  // Batch update folderId for multiple quizzes — 2 DB queries instead of N+M
  async batchUpdateQuizFolder(
    userId: string,
    toAdd: string[],
    toRemove: string[],
    folderId: string
  ): Promise<void> {
    const ops: Promise<any>[] = [];
    if (toAdd.length > 0) {
      ops.push(
        db.update(quizzes)
          .set({ folderId })
          .where(and(eq(quizzes.userId, userId), inArray(quizzes.id, toAdd)))
      );
    }
    if (toRemove.length > 0) {
      ops.push(
        db.update(quizzes)
          .set({ folderId: null } as any)
          .where(and(eq(quizzes.userId, userId), inArray(quizzes.id, toRemove)))
      );
    }
    await Promise.all(ops);
  }

  async saveQuizResult(result: InsertQuizResult): Promise<QuizResult> {
    const [savedResult] = await db.insert(quizResults).values({
      quizId: result.quizId,
      userId: result.userId,
      answers: result.answers as Record<string, string>,
      score: result.score,
      totalQuestions: result.totalQuestions,
      correctAnswers: result.correctAnswers,
      wrongQuestionIds: (result.wrongQuestionIds || []) as string[]
    } as any).returning();
    return savedResult;
  }

  async getQuizResult(quizId: string): Promise<QuizResult | undefined> {
    const [result] = await db.select()
      .from(quizResults)
      .where(eq(quizResults.quizId, quizId))
      .orderBy(desc(quizResults.completedAt))
      .limit(1);
    return result;
  }

  async getQuizResultsByQuizId(quizId: string): Promise<QuizResult[]> {
    return await db.select()
      .from(quizResults)
      .where(eq(quizResults.quizId, quizId))
      .orderBy(desc(quizResults.completedAt));
  }

  // Single query to get attempt counts for multiple quizzes — replaces N+1 per-quiz queries
  async getAttemptCountsByQuizIds(quizIds: string[]): Promise<Map<string, number>> {
    if (quizIds.length === 0) return new Map();
    const rows = await db
      .select({ quizId: quizResults.quizId, cnt: count() })
      .from(quizResults)
      .where(inArray(quizResults.quizId, quizIds))
      .groupBy(quizResults.quizId);
    return new Map(rows.map(r => [r.quizId, Number(r.cnt)]));
  }

  async getUserAverageAccuracy(userId: string): Promise<{ averageAccuracy: number; totalAttempts: number }> {
    // Single JOIN query — avoids the previous redundant getQuizzesByUserId call
    const allResults = await db
      .select({
        correctAnswers: quizResults.correctAnswers,
        totalQuestions: quizResults.totalQuestions,
      })
      .from(quizResults)
      .innerJoin(quizzes, eq(quizResults.quizId, quizzes.id))
      .where(eq(quizzes.userId, userId));

    if (allResults.length === 0) {
      return { averageAccuracy: 0, totalAttempts: 0 };
    }

    const totalCorrect = allResults.reduce((sum, r) => sum + r.correctAnswers, 0);
    const totalQuestionsSum = allResults.reduce((sum, r) => sum + r.totalQuestions, 0);
    const averageAccuracy = totalQuestionsSum > 0 ? Math.round((totalCorrect / totalQuestionsSum) * 100) : 0;

    return { averageAccuracy, totalAttempts: allResults.length };
  }

  async getUserResultHistory(userId: string): Promise<{ date: string; accuracy: number; quizTitle: string; correctAnswers: number; totalQuestions: number; category: string; quizId: string }[]> {
    const userQuizzes = await this.getQuizzesByUserId(userId);
    if (userQuizzes.length === 0) {
      return [];
    }

    const quizIds = userQuizzes.map(q => q.id);
    const quizMap = new Map(userQuizzes.map(q => [q.id, { title: q.title, category: q.category || "Others/General" }]));
    
    const allResults = await db.select()
      .from(quizResults)
      .where(inArray(quizResults.quizId, quizIds))
      .orderBy(quizResults.completedAt);

    return allResults.map(r => {
      const quizInfo = quizMap.get(r.quizId);
      return {
        date: r.completedAt.toISOString(),
        accuracy: r.totalQuestions > 0 ? Math.round((r.correctAnswers / r.totalQuestions) * 100) : 0,
        quizTitle: quizInfo?.title || "Unknown Quiz",
        correctAnswers: r.correctAnswers,
        totalQuestions: r.totalQuestions,
        category: quizInfo?.category || "Others/General",
        quizId: r.quizId,
      };
    });
  }

  // Comments
  async addComment(comment: InsertComment): Promise<QuizComment> {
    const [created] = await db.insert(quizComments).values(comment).returning();
    return created;
  }

  async getCommentsByQuizId(quizId: string): Promise<(QuizComment & { author: { username: string | null; profileImageUrl: string | null } })[]> {
    const results = await db
      .select({
        comment: quizComments,
        author: {
          username: users.username,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(quizComments)
      .leftJoin(users, eq(quizComments.userId, users.id))
      .where(eq(quizComments.quizId, quizId))
      .orderBy(desc(quizComments.createdAt));
    
    return results.map(r => ({
      ...r.comment,
      author: r.author || { username: null, profileImageUrl: null },
    }));
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    await db.delete(quizComments)
      .where(and(eq(quizComments.id, commentId), eq(quizComments.userId, userId)));
    return true;
  }

  // Votes
  async upsertVote(quizId: string, userId: string, voteType: number): Promise<QuizVote> {
    // Check if vote exists
    const [existing] = await db.select()
      .from(quizVotes)
      .where(and(eq(quizVotes.quizId, quizId), eq(quizVotes.userId, userId)));
    
    if (existing) {
      const [updated] = await db.update(quizVotes)
        .set({ voteType })
        .where(and(eq(quizVotes.quizId, quizId), eq(quizVotes.userId, userId)))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(quizVotes)
        .values({ quizId, userId, voteType })
        .returning();
      return created;
    }
  }

  async removeVote(quizId: string, userId: string): Promise<boolean> {
    await db.delete(quizVotes)
      .where(and(eq(quizVotes.quizId, quizId), eq(quizVotes.userId, userId)));
    return true;
  }

  async getVotesByQuizId(quizId: string): Promise<{ upvotes: number; downvotes: number }> {
    const votes = await db.select()
      .from(quizVotes)
      .where(eq(quizVotes.quizId, quizId));
    
    const upvotes = votes.filter(v => v.voteType === 1).length;
    const downvotes = votes.filter(v => v.voteType === -1).length;
    
    return { upvotes, downvotes };
  }

  async getUserVote(quizId: string, userId: string): Promise<number | null> {
    const [vote] = await db.select()
      .from(quizVotes)
      .where(and(eq(quizVotes.quizId, quizId), eq(quizVotes.userId, userId)));
    return vote?.voteType || null;
  }

  async getUserRecommendationData(userId: string): Promise<{
    hasData: boolean;
    userCategories: string[];
    weakCategories: string[];
    recentQuizIds: string[];
  }> {
    // Get quizzes the user has taken (from quiz results with userId)
    const userResults = await db.select()
      .from(quizResults)
      .where(eq(quizResults.userId, userId))
      .orderBy(desc(quizResults.completedAt));

    // Also get quizzes the user has created (ordered by creation date)
    const userCreatedQuizzes = await this.getQuizzesByUserId(userId);
    
    // Build recentQuizIds preserving recency order from results first
    const recentTakenQuizIds: string[] = [];
    const seenIds = new Set<string>();
    for (const result of userResults) {
      if (!seenIds.has(result.quizId)) {
        recentTakenQuizIds.push(result.quizId);
        seenIds.add(result.quizId);
      }
    }
    
    // Add created quiz IDs
    const createdQuizIds = userCreatedQuizzes.map(q => q.id);
    for (const id of createdQuizIds) {
      if (!seenIds.has(id)) {
        seenIds.add(id);
      }
    }
    
    const allUserQuizIds = Array.from(seenIds);
    
    // User has data if they've created quizzes OR taken quizzes with tracked results
    const hasCreatedQuizzes = userCreatedQuizzes.length > 0;
    const hasTakenQuizzes = userResults.length > 0;
    
    if (!hasCreatedQuizzes && !hasTakenQuizzes) {
      return { hasData: false, userCategories: [], weakCategories: [], recentQuizIds: [] };
    }

    // Get quiz details for category lookup
    const quizDetails = await db.select()
      .from(quizzes)
      .where(inArray(quizzes.id, allUserQuizIds));
    
    const quizMap = new Map(quizDetails.map(q => [q.id, q]));

    // Get categories from quizzes the user has interacted with
    const userCategories = Array.from(new Set(
      quizDetails.map(q => q.category || "Others/General")
    ));

    // Calculate accuracy per category from results
    const categoryStats: Record<string, { correct: number; total: number }> = {};
    
    for (const result of userResults) {
      const quiz = quizMap.get(result.quizId);
      if (!quiz) continue;
      
      const category = quiz.category || "Others/General";
      if (!categoryStats[category]) {
        categoryStats[category] = { correct: 0, total: 0 };
      }
      categoryStats[category].correct += result.correctAnswers;
      categoryStats[category].total += result.totalQuestions;
    }

    // Find weak categories (accuracy below 70%)
    const weakCategories = Object.entries(categoryStats)
      .filter(([_, stats]) => stats.total > 0 && (stats.correct / stats.total) < 0.7)
      .map(([category]) => category);

    // Use recency-ordered quiz IDs for exclusion (taken quizzes first, then created)
    const recentQuizIds = [...recentTakenQuizIds, ...createdQuizIds.filter(id => !recentTakenQuizIds.includes(id))].slice(0, 30);

    return {
      hasData: true,
      userCategories,
      weakCategories,
      recentQuizIds,
    };
  }

  // Quiz Progress methods
  async getQuizProgressByUserId(userId: string): Promise<(QuizProgress & { quiz: any })[]> {
    const results = await db
      .select({
        progress: quizProgress,
        quiz: {
          id: quizzes.id,
          userId: quizzes.userId,
          title: quizzes.title,
          difficulty: quizzes.difficulty,
          category: quizzes.category,
          generationMode: quizzes.generationMode,
          sourceImageUrl: quizzes.sourceImageUrl,
          createdAt: quizzes.createdAt,
          questions: quizzes.questions,
          questionCount: sql<number>`jsonb_array_length(${quizzes.questions})`,
        },
      })
      .from(quizProgress)
      .innerJoin(quizzes, eq(quizProgress.quizId, quizzes.id))
      .where(eq(quizProgress.userId, userId))
      .orderBy(desc(quizProgress.savedAt));

    return results.map(r => ({
      ...r.progress,
      quiz: r.quiz,
    }));
  }

  async saveQuizProgress(progress: InsertQuizProgress): Promise<QuizProgress & { quiz: Quiz }> {
    // Upsert: delete existing progress for this user+quiz, then insert new
    await db.delete(quizProgress)
      .where(and(
        eq(quizProgress.userId, progress.userId),
        eq(quizProgress.quizId, progress.quizId)
      ));

    const [saved] = await db.insert(quizProgress)
      .values({
        userId: progress.userId,
        quizId: progress.quizId,
        answers: progress.answers as Record<string, string>,
        checkedQuestions: (progress.checkedQuestions as string[]) || [],
        currentIndex: progress.currentIndex ?? 0,
        retryAnswers: (progress.retryAnswers as Record<string, string>) ?? {},
        retryCheckedQuestions: (progress.retryCheckedQuestions as string[]) || [],
      } as any)
      .returning();

    // Fetch the quiz to return joined data
    const quiz = await this.getQuiz(progress.quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    return { ...saved, quiz };
  }

  async deleteQuizProgress(userId: string, quizId: string): Promise<boolean> {
    await db.delete(quizProgress)
      .where(and(
        eq(quizProgress.userId, userId),
        eq(quizProgress.quizId, quizId)
      ));
    return true;
  }

  async createFolder(folder: InsertFolder): Promise<Folder> {
    const [created] = await db.insert(folders).values(folder).returning();
    return created;
  }

  async getFoldersByUserId(userId: string): Promise<Folder[]> {
    return db.select().from(folders).where(eq(folders.userId, userId)).orderBy(folders.name);
  }

  async updateFolder(id: string, userId: string, name: string): Promise<Folder | undefined> {
    const [updated] = await db.update(folders)
      .set({ name })
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .returning();
    return updated;
  }

  async deleteFolder(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)));
    return true;
  }

  async toggleFolderPin(id: string, userId: string): Promise<Folder | undefined> {
    const existing = await db.select().from(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .limit(1);
    if (existing.length === 0) return undefined;
    const [updated] = await db.update(folders)
      .set({ pinnedToSidebar: !existing[0].pinnedToSidebar })
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .returning();
    return updated;
  }

  async saveBugReport(report: InsertBugReport): Promise<BugReport> {
    const [saved] = await db.insert(bugReports).values(report).returning();
    return saved;
  }
}

export const storage = new DatabaseStorage();
