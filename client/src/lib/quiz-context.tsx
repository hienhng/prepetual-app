import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Quiz, QuizResult, Question } from "@shared/schema";

export type SourceMaterialType = "pdf" | "image" | "document" | null;

interface SourceMaterial {
  type: SourceMaterialType;
  text: string | null;
  imageDataUrl: string | null;
  isOfficeWithImages?: boolean;
  documentImages?: string[];
}

export interface SavedQuizProgress {
  quizId: string;
  quiz: Quiz;
  answers: Record<string, string>;
  savedAt: string;
}

interface QuizState {
  extractedText: string | null;
  sourceMaterial: SourceMaterial;
  currentQuiz: Quiz | null;
  quizResult: QuizResult | null;
  userAnswers: Record<string, string>;
  savedProgresses: SavedQuizProgress[];
  isLoading: boolean;
  loadingMessage: string;
  processingProgress: number;
  currentGenerationStep: string;
  revisedQuestionsCount: number;
  retryCorrectCount: number;
}

interface QuizContextType extends QuizState {
  setExtractedText: (text: string | null) => void;
  setSourceMaterial: (material: SourceMaterial) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  setQuizResult: (result: QuizResult | null) => void;
  setUserAnswer: (questionId: string, answer: string) => void;
  clearUserAnswers: () => void;
  setIsLoading: (loading: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setProcessingProgress: (progress: number) => void;
  setCurrentGenerationStep: (step: string) => void;
  setRevisedQuestionsCount: (count: number) => void;
  setRetryCorrectCount: (count: number) => void;
  resetQuiz: () => void;
  saveCurrentProgress: () => void;
  loadSavedProgress: (quizId: string) => void;
  removeSavedProgress: (quizId: string) => void;
}

const SAVED_PROGRESSES_KEY = "saved_quiz_progresses";
const MAX_SAVED_PROGRESSES = 10;

function loadSavedProgressesFromStorage(): SavedQuizProgress[] {
  try {
    const saved = localStorage.getItem(SAVED_PROGRESSES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    localStorage.removeItem(SAVED_PROGRESSES_KEY);
  }
  return [];
}

function saveSavedProgressesToStorage(progresses: SavedQuizProgress[]) {
  localStorage.setItem(SAVED_PROGRESSES_KEY, JSON.stringify(progresses));
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuizState>(() => {
    const savedText = sessionStorage.getItem("extracted_text");
    const savedMaterial = sessionStorage.getItem("source_material");
    const savedQuizProgress = sessionStorage.getItem("quiz_progress");
    const savedProgresses = loadSavedProgressesFromStorage();
    
    let currentQuiz = null;
    let userAnswers = {};
    
    if (savedQuizProgress) {
      try {
        const progress = JSON.parse(savedQuizProgress);
        currentQuiz = progress.quiz || null;
        userAnswers = progress.answers || {};
      } catch (e) {
        sessionStorage.removeItem("quiz_progress");
      }
    }
    
    return {
      extractedText: savedText || null,
      sourceMaterial: savedMaterial ? JSON.parse(savedMaterial) : { type: null, text: null, imageDataUrl: null, isOfficeWithImages: false, documentImages: [] },
      currentQuiz,
      quizResult: null,
      userAnswers,
      savedProgresses,
      isLoading: false,
      loadingMessage: "",
      processingProgress: 0,
      currentGenerationStep: "",
      revisedQuestionsCount: 0,
      retryCorrectCount: 0,
    };
  });

  const setExtractedText = (text: string | null) => {
    setState((prev) => {
      if (prev.extractedText === text) return prev;
      return { ...prev, extractedText: text };
    });
    if (text === null || text === "") {
      sessionStorage.removeItem("extracted_text");
    } else {
      sessionStorage.setItem("extracted_text", text);
    }
  };

  const setSourceMaterial = (material: SourceMaterial) => {
    setState((prev) => {
      if (JSON.stringify(prev.sourceMaterial) === JSON.stringify(material)) return prev;
      return { ...prev, sourceMaterial: material };
    });
    if (material.type === null) {
      sessionStorage.removeItem("source_material");
    } else {
      sessionStorage.setItem("source_material", JSON.stringify(material));
    }
  };

  const setCurrentQuiz = (quiz: Quiz | null) => {
    setState((prev) => {
      const newState = { ...prev, currentQuiz: quiz };
      if (quiz) {
        sessionStorage.setItem("quiz_progress", JSON.stringify({ quiz, answers: prev.userAnswers }));
      } else {
        sessionStorage.removeItem("quiz_progress");
      }
      return newState;
    });
  };

  const setQuizResult = (result: QuizResult | null) => {
    setState((prev) => ({ ...prev, quizResult: result }));
  };

  const setUserAnswer = (questionId: string, answer: string) => {
    setState((prev) => {
      const newAnswers = { ...prev.userAnswers, [questionId]: answer };
      if (prev.currentQuiz) {
        sessionStorage.setItem("quiz_progress", JSON.stringify({ quiz: prev.currentQuiz, answers: newAnswers }));
      }
      return { ...prev, userAnswers: newAnswers };
    });
  };

  const clearUserAnswers = () => {
    setState((prev) => {
      sessionStorage.removeItem("quiz_progress");
      return { ...prev, userAnswers: {} };
    });
  };

  const saveCurrentProgress = useCallback(() => {
    setState((prev) => {
      if (!prev.currentQuiz || Object.keys(prev.userAnswers).length === 0) {
        return prev;
      }
      
      const quizId = prev.currentQuiz.id;
      const newProgress: SavedQuizProgress = {
        quizId,
        quiz: prev.currentQuiz,
        answers: prev.userAnswers,
        savedAt: new Date().toISOString(),
      };
      
      // Remove existing progress for this quiz if it exists
      let updatedProgresses = prev.savedProgresses.filter(p => p.quizId !== quizId);
      
      // Add new progress at the beginning
      updatedProgresses = [newProgress, ...updatedProgresses];
      
      // Keep only the most recent ones
      if (updatedProgresses.length > MAX_SAVED_PROGRESSES) {
        updatedProgresses = updatedProgresses.slice(0, MAX_SAVED_PROGRESSES);
      }
      
      saveSavedProgressesToStorage(updatedProgresses);
      
      // Clear current session progress
      sessionStorage.removeItem("quiz_progress");
      
      return { 
        ...prev, 
        savedProgresses: updatedProgresses,
        currentQuiz: null,
        userAnswers: {},
      };
    });
  }, []);

  const loadSavedProgress = useCallback((quizId: string) => {
    setState((prev) => {
      const progress = prev.savedProgresses.find(p => p.quizId === quizId);
      if (!progress) return prev;
      
      // Set current quiz and answers from saved progress
      sessionStorage.setItem("quiz_progress", JSON.stringify({ 
        quiz: progress.quiz, 
        answers: progress.answers 
      }));
      
      return {
        ...prev,
        currentQuiz: progress.quiz,
        userAnswers: progress.answers,
      };
    });
  }, []);

  const removeSavedProgress = useCallback((quizId: string) => {
    setState((prev) => {
      const updatedProgresses = prev.savedProgresses.filter(p => p.quizId !== quizId);
      saveSavedProgressesToStorage(updatedProgresses);
      
      // If the current quiz matches, clear it too
      if (prev.currentQuiz?.id === quizId) {
        sessionStorage.removeItem("quiz_progress");
        return { 
          ...prev, 
          savedProgresses: updatedProgresses,
          currentQuiz: null,
          userAnswers: {},
        };
      }
      
      return { ...prev, savedProgresses: updatedProgresses };
    });
  }, []);

  const setIsLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, isLoading: loading }));
  };

  const setLoadingMessage = (message: string) => {
    setState((prev) => ({ ...prev, loadingMessage: message }));
  };

  const setProcessingProgress = (progress: number) => {
    setState((prev) => ({ ...prev, processingProgress: progress }));
  };

  const setCurrentGenerationStep = (step: string) => {
    setState((prev) => ({ ...prev, currentGenerationStep: step }));
  };

  const setRevisedQuestionsCount = (count: number) => {
    setState((prev) => ({ ...prev, revisedQuestionsCount: count }));
  };

  const setRetryCorrectCount = (count: number) => {
    setState((prev) => ({ ...prev, retryCorrectCount: count }));
  };

  const resetQuiz = () => {
    sessionStorage.removeItem("extracted_text");
    sessionStorage.removeItem("source_material");
    sessionStorage.removeItem("quiz_progress");
    setState((prev) => ({
      ...prev,
      extractedText: null,
      sourceMaterial: { type: null, text: null, imageDataUrl: null, isOfficeWithImages: false, documentImages: [] },
      currentQuiz: null,
      quizResult: null,
      userAnswers: {},
      isLoading: false,
      loadingMessage: "",
      processingProgress: 0,
      currentGenerationStep: "",
      revisedQuestionsCount: 0,
      retryCorrectCount: 0,
    }));
  };

  return (
    <QuizContext.Provider
      value={{
        ...state,
        setExtractedText,
        setSourceMaterial,
        setCurrentQuiz,
        setQuizResult,
        setUserAnswer,
        clearUserAnswers,
        setIsLoading,
        setLoadingMessage,
        setProcessingProgress,
        setCurrentGenerationStep,
        setRevisedQuestionsCount,
        setRetryCorrectCount,
        resetQuiz,
        saveCurrentProgress,
        loadSavedProgress,
        removeSavedProgress,
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
