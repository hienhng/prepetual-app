import type { RequestHandler } from "express";
import type { Question } from "../shared/schema.js";
import { parseSelectionAnswer, selectionAnswersMatch } from "../shared/selection-answer.js";
import { answersMatch } from "../shared/answer-grading.js";
import { generateExplanationRequestSchema } from "./ai-input.js";
import { canReadQuiz } from "./quiz-access.js";
import type { IStorage } from "./storage.js";
import { UnverifiedAnswerError, type FeedbackEvidence } from "./verified-feedback.js";
import type { SubmittedAnswerFeedback } from "./submitted-answer-feedback.js";

export function createQuizFeedbackHandler(deps: {
  storage: Pick<IStorage, "getQuiz">;
  explain: (question: Question, selectedAnswer: string, evidence: FeedbackEvidence) => Promise<SubmittedAnswerFeedback>;
}): RequestHandler {
  return async (req, res) => {
    try {
      const validation = generateExplanationRequestSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ message: validation.error.errors[0]?.message || "Invalid request" });
        return;
      }
      const data = validation.data;
      let question: Question = {
        id: data.questionId || "feedback", type: data.type || (data.correctAnswer.startsWith("[") ? "selection" : "multiple_choice"),
        question: data.question, options: data.options, correctAnswer: data.correctAnswer, selectionMode: data.selectionMode,
      };
      let evidence: FeedbackEvidence = { sourceText: data.sourceText, quizLanguageContext: data.quizLanguageContext };
      if (data.quizId) {
        const quiz = await deps.storage.getQuiz(data.quizId);
        if (!quiz) { res.status(404).json({ message: "Quiz not found" }); return; }
        const requesterId = (req as typeof req & { user?: { claims?: { sub?: string } } }).user?.claims?.sub;
        if (!canReadQuiz(quiz, requesterId)) { res.status(403).json({ message: "You do not have access to this quiz" }); return; }
        const stored = quiz.questions.find(item => item.id === data.questionId);
        if (!stored) { res.status(404).json({ message: "Question not found" }); return; }
        question = stored;
        evidence = { sourceText: quiz.sourceText, images: [...(quiz.sourceImages || []), ...(quiz.sourceImageUrl ? [quiz.sourceImageUrl] : [])],
          quizLanguageContext: [quiz.title, ...quiz.questions.slice(0, 8).map(item => item.question)].join("\n").slice(0, 8_000) };
      }
      if (question.importReview) {
        res.status(422).json({ code: "ANSWER_REVIEW_REQUIRED", message: "Review this imported question first." });
        return;
      }
      if (question.type === "short_answer") {
        res.status(400).json({ message: "Use the short-answer model judge to grade this answer." });
        return;
      }
      const isCorrect = answersMatch(data.selectedAnswer, question.correctAnswer, question.type);
      const submitted = question.type === "selection" ? parseSelectionAnswer(data.selectedAnswer) : [data.selectedAnswer];
      const choices = question.type === "true_false" ? ["True", "False"] : question.options || [];
      if (submitted.some(option => !choices.includes(option)) ||
          (question.type === "selection" && !selectionAnswersMatch(data.selectedAnswer, data.selectedAnswer))) {
        res.status(400).json({ message: "Submit an available answer choice" }); return;
      }
      const feedback = await deps.explain(question, data.selectedAnswer, evidence);
      if (feedback.question.correctAnswer !== question.correctAnswer) {
        throw new UnverifiedAnswerError("The explanation attempted to change the saved answer key.");
      }
      res.json({
        ...feedback, verified: true, correctAnswer: question.correctAnswer, isCorrect,
      });
    } catch (error: any) {
      if (error instanceof UnverifiedAnswerError) {
        res.status(422).json({ code: "ANSWER_REVIEW_REQUIRED", message: error.message });
        return;
      }
      console.error("Quiz explanation generation failed:", error);
      res.status(error?.status === 429 ? 429 : 502).json({ message: "Unable to generate the explanation right now. Please try again shortly." });
    }
  };
}
