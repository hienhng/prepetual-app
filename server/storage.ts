import { eq, desc, and, gt, inArray } from "drizzle-orm";
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
  getUserAverageAccuracy(userId: string): Promise<{ averageAccuracy: number; totalAttempts: number }>;
  // Streak
  getUserStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number; lastActivityDate: string | null; isActive: boolean }>;
  // Streak Reminders
  getUsersForStreakReminder(): Promise<User[]>;
  updateLastStreakReminderSentAt(userId: string): Promise<void>;
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

  async getUserAverageAccuracy(userId: string): Promise<{ averageAccuracy: number; totalAttempts: number }> {
    const userQuizzes = await this.getQuizzesByUserId(userId);
    if (userQuizzes.length === 0) {
      return { averageAccuracy: 0, totalAttempts: 0 };
    }

    const quizIds = userQuizzes.map(q => q.id);
    const allResults = await db.select()
      .from(quizResults)
      .where(inArray(quizResults.quizId, quizIds));

    if (allResults.length === 0) {
      return { averageAccuracy: 0, totalAttempts: 0 };
    }

    const totalCorrect = allResults.reduce((sum, r) => sum + r.correctAnswers, 0);
    const totalQuestions = allResults.reduce((sum, r) => sum + r.totalQuestions, 0);
    const averageAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return { averageAccuracy, totalAttempts: allResults.length };
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

  async getUserStreak(userId: string): Promise<{ 
    currentStreak: number; 
    longestStreak: number; 
    lastActivityDate: string | null; 
    isActive: boolean;
    isFirstCompletionToday: boolean;
  }> {
    // Get all activity dates: quiz creation + quiz completions
    const userQuizzes = await db.select({ createdAt: quizzes.createdAt })
      .from(quizzes)
      .where(eq(quizzes.userId, userId));

    const userQuizIds = await db.select({ id: quizzes.id })
      .from(quizzes)
      .where(eq(quizzes.userId, userId));

    let completionDates: Date[] = [];
    if (userQuizIds.length > 0) {
      const quizIdList = userQuizIds.map(q => q.id);
      const results = await db.select({ completedAt: quizResults.completedAt })
        .from(quizResults)
        .where(inArray(quizResults.quizId, quizIdList));
      completionDates = results.map(r => r.completedAt);
    }

    // Combine all activity dates
    const allDates = [
      ...userQuizzes.map(q => q.createdAt),
      ...completionDates
    ].filter(Boolean) as Date[];

    if (allDates.length === 0) {
      return { 
        currentStreak: 0, 
        longestStreak: 0, 
        lastActivityDate: null, 
        isActive: false,
        isFirstCompletionToday: false
      };
    }

    // Convert to unique date strings (YYYY-MM-DD)
    const dateStrings = allDates.map(d => {
      const date = new Date(d);
      return date.toISOString().split('T')[0];
    });
    const uniqueDays = Array.from(new Set(dateStrings)).sort().reverse();

    if (uniqueDays.length === 0) {
      return { 
        currentStreak: 0, 
        longestStreak: 0, 
        lastActivityDate: null, 
        isActive: false,
        isFirstCompletionToday: false
      };
    }

    const lastActivityDate = uniqueDays[0];
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Calculate current streak
    let currentStreak = 0;
    let checkDate = today;
    const isActive = uniqueDays.includes(today);

    // Calculate completions specifically for today to determine if this is the first one
    // Note: The streak calculation uses both quiz creation and completions.
    // The user specifically asked for "one quiz completion only".
    const todayCompletions = completionDates.filter(d => 
      new Date(d).toISOString().split('T')[0] === today
    ).length;

    // Check if there's activity today or yesterday to start the streak
    if (uniqueDays.includes(today)) {
      currentStreak = 1;
      checkDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    } else if (uniqueDays.includes(yesterday)) {
      currentStreak = 1;
      checkDate = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
    } else {
      // No recent activity, streak is 0
      return { 
        currentStreak: 0, 
        longestStreak: this.calculateLongestStreak(uniqueDays), 
        lastActivityDate, 
        isActive: false,
        isFirstCompletionToday: false
      };
    }

    // Count consecutive days backwards
    while (uniqueDays.includes(checkDate)) {
      currentStreak++;
      const nextDate = new Date(new Date(checkDate).getTime() - 86400000);
      checkDate = nextDate.toISOString().split('T')[0];
    }

    const longestStreak = Math.max(currentStreak, this.calculateLongestStreak(uniqueDays));

    return { 
      currentStreak, 
      longestStreak, 
      lastActivityDate, 
      isActive,
      isFirstCompletionToday: todayCompletions === 1 && isActive
    };
  }

  async getUsersForStreakReminder(): Promise<User[]> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Get all users who:
    // 1. Have verified emails
    // 2. Have streak reminders enabled
    // 3. Haven't received a reminder in the last 24 hours (or never received one)
    const eligibleUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.emailVerified, true),
          eq(users.streakReminderEnabled, true)
        )
      );
    
    // Filter users who haven't received reminder in 24h
    return eligibleUsers.filter(user => {
      if (!user.lastStreakReminderSentAt) return true;
      return new Date(user.lastStreakReminderSentAt) < oneDayAgo;
    });
  }

  async updateLastStreakReminderSentAt(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ lastStreakReminderSentAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  private calculateLongestStreak(sortedDaysDesc: string[]): number {
    if (sortedDaysDesc.length === 0) return 0;

    const sortedDays = [...sortedDaysDesc].sort();
    let longestStreak = 1;
    let currentRun = 1;

    for (let i = 1; i < sortedDays.length; i++) {
      const prevDate = new Date(sortedDays[i - 1]);
      const currDate = new Date(sortedDays[i]);
      const diffDays = (currDate.getTime() - prevDate.getTime()) / 86400000;

      if (diffDays === 1) {
        currentRun++;
        longestStreak = Math.max(longestStreak, currentRun);
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }

    return longestStreak;
  }
}

export const storage = new DatabaseStorage();
