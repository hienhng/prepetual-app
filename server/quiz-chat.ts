import type { RequestHandler } from "express";
import type { IStorage } from "./storage.js";
import type { quizChatResponse } from "./openai.js";
import type { retrieveRagContext } from "./rag.js";
import { quizChatRequestSchema } from "./ai-input.js";
import { canReadQuiz } from "./quiz-access.js";

interface ChatDependencies {
  storage: Pick<IStorage, "getQuiz" | "getUser">;
  retrieveRagContext: typeof retrieveRagContext;
  quizChatResponse: typeof quizChatResponse;
}

export function createQuizChatHandler(deps: ChatDependencies): RequestHandler {
  return async (req, res) => {
    try {
      const validation = quizChatRequestSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({ message: validation.error.errors[0]?.message || "Invalid request" });
        return;
      }
      const { quizId, currentQuestionIndex, userMessage, chatHistory } = validation.data;
      const quiz = await deps.storage.getQuiz(quizId);
      if (!quiz) {
        res.status(404).json({ message: "Quiz not found" });
        return;
      }
      const requesterId = (req as typeof req & { user?: { claims?: { sub?: string } } }).user?.claims?.sub;
      if (!canReadQuiz(quiz, requesterId)) {
        res.status(403).json({ message: "You do not have access to this quiz" });
        return;
      }
      if (!quiz.questions.length) {
        res.status(409).json({ message: "This quiz does not contain any questions" });
        return;
      }

      const safeIndex = Math.min(currentQuestionIndex, quiz.questions.length - 1);
      const currentQuestion = quiz.questions[safeIndex];
      // Imported and older quizzes may not have an index. Their saved source
      // and questions still provide useful context without regenerating them.
      const retrieval = quiz.ragSourceId && quiz.userId ? await deps.retrieveRagContext({
        sourceId: quiz.ragSourceId,
        ownerUserId: quiz.userId,
        queries: [userMessage, currentQuestion.question, `${quiz.title}: ${userMessage}`],
        maxChunks: 6,
        maxChars: 8_000,
      }) : undefined;
      const chatUser = requesterId ? await deps.storage.getUser(requesterId) : undefined;
      const response = await deps.quizChatResponse({
        quizTitle: quiz.title,
        questions: quiz.questions,
        currentQuestionIndex: safeIndex,
        userMessage,
        chatHistory,
        sourceMaterial: retrieval?.context ?? quiz.sourceText ?? undefined,
        isRagGrounded: Boolean(retrieval),
        userPreferences: chatUser ? {
          persona: chatUser.persona,
          subjectInclination: chatUser.subjectInclination,
          feedbackStyle: chatUser.feedbackStyle,
          aiPartnership: chatUser.aiPartnership,
        } : undefined,
      });
      res.json({ response });
    } catch (error: any) {
      console.error("Quiz chat error:", error);
      const status = error?.status ?? error?.response?.status;
      if (status === 429) {
        res.status(429).json({ message: "Prepal is busy right now. Please try again shortly." });
        return;
      }
      res.status(502).json({ message: "Prepal is temporarily unavailable. Please try again shortly." });
    }
  };
}
