import { eq, desc, and, gt } from "drizzle-orm";
import { db } from "./db";
import { 
  users, 
  quizzes, 
  quizResults,
  quizComments,
  quizVotes,
  verificationTokens,
  type User, 
  type UpsertUser, 
  type Quiz, 
  type QuizResult,
  type QuizComment,
  type QuizVote,
  type InsertQuiz,
  type InsertQuizResult,
  type InsertComment,
  type InsertVote,
  type Question,
  type VerificationToken
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
  getPublicQuizzes(): Promise<(Quiz & { author?: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } })[]>;
  updateQuiz(id: string, updates: Partial<InsertQuiz>): Promise<Quiz | undefined>;
  deleteQuiz(id: string): Promise<boolean>;
  saveQuizResult(result: InsertQuizResult): Promise<QuizResult>;
  getQuizResult(quizId: string): Promise<QuizResult | undefined>;
  getQuizResultsByQuizId(quizId: string): Promise<QuizResult[]>;
  // Comments
  addComment(comment: InsertComment): Promise<QuizComment>;
  getCommentsByQuizId(quizId: string): Promise<(QuizComment & { author: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } })[]>;
  deleteComment(commentId: string, userId: string): Promise<boolean>;
  // Votes
  upsertVote(quizId: string, userId: string, voteType: number): Promise<QuizVote>;
  removeVote(quizId: string, userId: string): Promise<boolean>;
  getVotesByQuizId(quizId: string): Promise<{ upvotes: number; downvotes: number; userVote?: number }>;
  getUserVote(quizId: string, userId: string): Promise<number | null>;
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
      questions: quiz.questions as Question[],
      difficulty: quiz.difficulty || "medium",
      isPublic: quiz.isPublic || 0,
    }).returning();
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

  async getPublicQuizzes(): Promise<(Quiz & { author?: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } })[]> {
    const results = await db
      .select({
        quiz: quizzes,
        author: {
          firstName: users.firstName,
          lastName: users.lastName,
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
    if (updates.isPublic !== undefined) updateData.isPublic = updates.isPublic;
    
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

  async saveQuizResult(result: InsertQuizResult): Promise<QuizResult> {
    const [savedResult] = await db.insert(quizResults).values(result).returning();
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

  // Comments
  async addComment(comment: InsertComment): Promise<QuizComment> {
    const [created] = await db.insert(quizComments).values(comment).returning();
    return created;
  }

  async getCommentsByQuizId(quizId: string): Promise<(QuizComment & { author: { firstName: string | null; lastName: string | null; profileImageUrl: string | null } })[]> {
    const results = await db
      .select({
        comment: quizComments,
        author: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(quizComments)
      .leftJoin(users, eq(quizComments.userId, users.id))
      .where(eq(quizComments.quizId, quizId))
      .orderBy(desc(quizComments.createdAt));
    
    return results.map(r => ({
      ...r.comment,
      author: r.author || { firstName: null, lastName: null, profileImageUrl: null },
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
}

export const storage = new DatabaseStorage();
