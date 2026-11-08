import type { RequestHandler } from "express";
import type { QuizProgressDetail, QuizProgressSummary } from "../shared/quiz-progress.js";

export function createProgressSummaryHandler(
  load: (userId: string) => Promise<QuizProgressSummary[]>,
): RequestHandler {
  return async (req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!req.session?.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    try { res.json(await load(req.session.userId)); } catch (error) { next(error); }
  };
}

export function createProgressDetailHandler(
  load: (userId: string, quizId: string) => Promise<QuizProgressDetail | undefined>,
): RequestHandler {
  return async (req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    if (!req.session?.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }
    try {
      const progress = await load(req.session.userId, req.params.quizId);
      if (!progress) { res.status(404).json({ message: "Saved progress not found" }); return; }
      res.json(progress);
    } catch (error) { next(error); }
  };
}
