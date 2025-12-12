import { createContext, useContext, useState, type ReactNode } from "react";
import type { Quiz, QuizResult, Question } from "@shared/schema";

interface QuizState {
  extractedText: string | null;
  currentQuiz: Quiz | null;
  quizResult: QuizResult | null;
  userAnswers: Record<string, string>;
  isLoading: boolean;
  loadingMessage: string;
  processingProgress: number;
}

interface QuizContextType extends QuizState {
  setExtractedText: (text: string | null) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  setQuizResult: (result: QuizResult | null) => void;
  setUserAnswer: (questionId: string, answer: string) => void;
  clearUserAnswers: () => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setProcessingProgress: (progress: number) => void;
  resetQuiz: () => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuizState>({
    extractedText: null,
    currentQuiz: null,
    quizResult: null,
    userAnswers: {},
    isLoading: false,
    loadingMessage: "",
    processingProgress: 0,
  });

  const setExtractedText = (text: string | null) => {
    setState((prev) => ({ ...prev, extractedText: text }));
  };

  const setCurrentQuiz = (quiz: Quiz | null) => {
    setState((prev) => ({ ...prev, currentQuiz: quiz }));
  };

  const setQuizResult = (result: QuizResult | null) => {
    setState((prev) => ({ ...prev, quizResult: result }));
  };

  const setUserAnswer = (questionId: string, answer: string) => {
    setState((prev) => ({
      ...prev,
      userAnswers: { ...prev.userAnswers, [questionId]: answer },
    }));
  };

  const clearUserAnswers = () => {
    setState((prev) => ({ ...prev, userAnswers: {} }));
  };

  const setIsLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  };

  const setLoadingMessage = (message: string) => {
    setState((prev) => ({ ...prev, loadingMessage: message }));
  };

  const setProcessingProgress = (progress: number) => {
    setState((prev) => ({ ...prev, processingProgress: progress }));
  };

  const resetQuiz = () => {
    setState({
      extractedText: null,
      currentQuiz: null,
      quizResult: null,
      userAnswers: {},
      isLoading: false,
      loadingMessage: "",
      processingProgress: 0,
    });
  };

  return (
    <QuizContext.Provider
      value={{
        ...state,
        setExtractedText,
        setCurrentQuiz,
        setQuizResult,
        setUserAnswer,
        clearUserAnswers,
        setIsLoading,
        setLoadingMessage,
        setProcessingProgress,
        resetQuiz,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
}
