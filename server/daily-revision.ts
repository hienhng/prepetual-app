import type { RequestHandler } from "express";
import type { Question } from "../shared/schema.js";
import type { DailyRevision } from "../shared/daily-revision.js";

export function isRevisionDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function revisionDayNumber(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000);
}

export function selectRevisionQuestions(questions: Question[], quizId: string, date: string): Question[] {
  let seed = `${date}-${quizId}`.split("")
    .reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, 4);
}

export function createDailyRevisionHandler(
  load: (userId: string, date: string) => Promise<DailyRevision | null>,
): RequestHandler {
  return async (req, res) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!req.session?.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    if (!isRevisionDate(req.query.date)) {
      res.status(400).json({ message: "A valid date in YYYY-MM-DD format is required" });
      return;
    }
    try {
      res.json(await load(req.session.userId, req.query.date));
    } catch (error) {
      console.error("Daily revision fetch error:", error);
      res.status(500).json({ message: "Failed to load daily revision" });
    }
  };
}
