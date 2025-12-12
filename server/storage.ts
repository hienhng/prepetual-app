import { type User, type InsertUser, type Quiz, type QuizResult } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveQuiz(quiz: Quiz): Promise<Quiz>;
  getQuiz(id: string): Promise<Quiz | undefined>;
  saveQuizResult(result: QuizResult): Promise<QuizResult>;
  getQuizResult(quizId: string): Promise<QuizResult | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private quizzes: Map<string, Quiz>;
  private quizResults: Map<string, QuizResult>;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.quizResults = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async saveQuiz(quiz: Quiz): Promise<Quiz> {
    this.quizzes.set(quiz.id, quiz);
    return quiz;
  }

  async getQuiz(id: string): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async saveQuizResult(result: QuizResult): Promise<QuizResult> {
    this.quizResults.set(result.quizId, result);
    return result;
  }

  async getQuizResult(quizId: string): Promise<QuizResult | undefined> {
    return this.quizResults.get(quizId);
  }
}

export const storage = new MemStorage();
