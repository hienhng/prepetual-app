import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "./queryClient";
import type { Quiz, QuizResult, Question, QuizProgress } from "@shared/schema";

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
  checkedQuestions: string[];
  currentIndex: number;
  retryAnswers: Record<string, string>;
  retryCheckedQuestions: string[];
  savedAt: string;
}

interface QuizState {
  extractedText: string | null;
  sourceMaterial: SourceMaterial;
  currentQuiz: Quiz | null;
  quizResult: QuizResult | null;
  userAnswers: Record<string, string>;
  checkedQuestions: Set<string>;
  savedProgresses: SavedQuizProgress[];
  isLoading: boolean;
  loadingMessage: string;
  processingProgress: number;
  currentGenerationStep: string;
  revisedQuestionsCount: number;
  retryCorrectCount: number;
  lastSavedAnswersCount: number;
  restoredCurrentIndex: number | null;
  restoredRetryAnswers: Record<string, string> | null;
  restoredRetryCheckedQuestions: string[] | null;
  // Quiz player state for saving progress
  playerCurrentIndex: number;
  playerRetryAnswers: Record<string, string>;
  playerRetryCheckedQuestions: string[];
}

interface QuizContextType extends QuizState {
  setExtractedText: (text: string | null) => void;
  setSourceMaterial: (material: SourceMaterial) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  setQuizResult: (result: QuizResult | null) => void;
  setUserAnswer: (questionId: string, answer: string) => void;
  markQuestionChecked: (questionId: string) => void;
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
  clearRestoredState: () => void;
  syncPlayerState: (currentIndex: number, retryAnswers: Record<string, string>, retryCheckedQuestions: string[]) => void;
  hasUnsavedChanges: boolean;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Type for API response - includes the full quiz object
interface SavedProgressFromAPI extends QuizProgress {
  quiz: Quiz;
}

export function QuizProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch saved progresses from API
  const { data: apiProgresses = [], refetch: refetchProgresses } = useQuery<SavedProgressFromAPI[]>({
    queryKey: ["/api/quiz-progress"],
    staleTime: 30000, // 30 seconds
  });

  // Mutation to save progress
  const saveProgressMutation = useMutation({
    mutationFn: async (data: { 
      quizId: string; 
      answers: Record<string, string>; 
      checkedQuestions: string[];
      currentIndex: number;
      retryAnswers: Record<string, string>;
      retryCheckedQuestions: string[];
    }) => {
      const response = await apiRequest("POST", "/api/quiz-progress", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-progress"] });
    },
  });

  // Mutation to delete progress
  const deleteProgressMutation = useMutation({
    mutationFn: async (quizId: string) => {
      await apiRequest("DELETE", `/api/quiz-progress/${quizId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quiz-progress"] });
    },
  });

  const [state, setState] = useState<QuizState>(() => {
    const savedText = sessionStorage.getItem("extracted_text");
    const savedMaterial = sessionStorage.getItem("source_material");
    const savedQuizProgress = sessionStorage.getItem("quiz_progress");
    
    let currentQuiz = null;
    let userAnswers = {};
    let checkedQuestions = new Set<string>();
    
    if (savedQuizProgress) {
      try {
        const progress = JSON.parse(savedQuizProgress);
        currentQuiz = progress.quiz || null;
        userAnswers = progress.answers || {};
        checkedQuestions = new Set(progress.checkedQuestions || []);
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
      checkedQuestions,
      savedProgresses: [], // Start empty, will be synced from API
      isLoading: false,
      loadingMessage: "",
      processingProgress: 0,
      currentGenerationStep: "",
      revisedQuestionsCount: 0,
      retryCorrectCount: 0,
      lastSavedAnswersCount: Object.keys(userAnswers).length,
      restoredCurrentIndex: null,
      restoredRetryAnswers: null,
      restoredRetryCheckedQuestions: null,
      playerCurrentIndex: 0,
      playerRetryAnswers: {},
      playerRetryCheckedQuestions: [],
    };
  });

  // Sync savedProgresses from API data
  useEffect(() => {
    const converted: SavedQuizProgress[] = apiProgresses.map((p) => ({
      quizId: p.quizId,
      quiz: p.quiz,
      answers: p.answers,
      checkedQuestions: p.checkedQuestions || [],
      currentIndex: p.currentIndex ?? 0,
      retryAnswers: p.retryAnswers ?? {},
      retryCheckedQuestions: p.retryCheckedQuestions ?? [],
      savedAt: p.savedAt instanceof Date ? p.savedAt.toISOString() : String(p.savedAt),
    }));
    setState((prev) => {
      // Only update if data actually changed
      if (JSON.stringify(prev.savedProgresses) !== JSON.stringify(converted)) {
        return { ...prev, savedProgresses: converted };
      }
      return prev;
    });
  }, [apiProgresses]);

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
      const newState = { 
        ...prev, 
        currentQuiz: quiz,
        lastSavedAnswersCount: quiz ? 0 : prev.lastSavedAnswersCount,
        // Clear player state when quiz is cleared
        ...(quiz === null ? {
          playerCurrentIndex: 0,
          playerRetryAnswers: {},
          playerRetryCheckedQuestions: [],
        } : {}),
      };
      if (quiz) {
        sessionStorage.setItem("quiz_progress", JSON.stringify({ 
          quiz, 
          answers: prev.userAnswers,
          checkedQuestions: Array.from(prev.checkedQuestions)
        }));
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
        sessionStorage.setItem("quiz_progress", JSON.stringify({ 
          quiz: prev.currentQuiz, 
          answers: newAnswers,
          checkedQuestions: Array.from(prev.checkedQuestions)
        }));
      }
      return { ...prev, userAnswers: newAnswers };
    });
  };

  const markQuestionChecked = (questionId: string) => {
    setState((prev) => {
      const newChecked = new Set(prev.checkedQuestions);
      newChecked.add(questionId);
      if (prev.currentQuiz) {
        sessionStorage.setItem("quiz_progress", JSON.stringify({ 
          quiz: prev.currentQuiz, 
          answers: prev.userAnswers,
          checkedQuestions: Array.from(newChecked)
        }));
      }
      return { ...prev, checkedQuestions: newChecked };
    });
  };

  const clearUserAnswers = () => {
    setState((prev) => {
      sessionStorage.removeItem("quiz_progress");
      return { ...prev, userAnswers: {}, checkedQuestions: new Set() };
    });
  };

  const syncPlayerState = useCallback((currentIndex: number, retryAnswers: Record<string, string>, retryCheckedQuestions: string[]) => {
    setState((prev) => ({
      ...prev,
      playerCurrentIndex: currentIndex,
      playerRetryAnswers: retryAnswers,
      playerRetryCheckedQuestions: retryCheckedQuestions,
    }));
  }, []);

  const saveCurrentProgress = useCallback(() => {
    // Get current state values synchronously
    const currentQuiz = state.currentQuiz;
    const userAnswers = state.userAnswers;
    const checkedQuestions = state.checkedQuestions;
    const currentIndex = state.playerCurrentIndex;
    const retryAnswers = state.playerRetryAnswers;
    const retryCheckedQuestions = state.playerRetryCheckedQuestions;

    if (!currentQuiz || Object.keys(userAnswers).length === 0) {
      return;
    }
    
    const quizId = currentQuiz.id;
    
    // Save to API with full quiz state including retry information
    saveProgressMutation.mutate({
      quizId,
      answers: userAnswers,
      checkedQuestions: Array.from(checkedQuestions),
      currentIndex,
      retryAnswers,
      retryCheckedQuestions,
    }, {
      onSuccess: () => {
        // Clear current session progress after successful save
        sessionStorage.removeItem("quiz_progress");
        setState((prev) => ({ 
          ...prev, 
          currentQuiz: null,
          userAnswers: {},
          checkedQuestions: new Set(),
          restoredCurrentIndex: null,
          restoredRetryAnswers: null,
          restoredRetryCheckedQuestions: null,
          playerCurrentIndex: 0,
          playerRetryAnswers: {},
          playerRetryCheckedQuestions: [],
        }));
      },
      onError: (error) => {
        console.error("Failed to save quiz progress:", error);
      }
    });
  }, [state.currentQuiz, state.userAnswers, state.checkedQuestions, state.playerCurrentIndex, state.playerRetryAnswers, state.playerRetryCheckedQuestions, saveProgressMutation]);

  const loadSavedProgress = useCallback((quizId: string) => {
    setState((prev) => {
      const progress = prev.savedProgresses.find(p => p.quizId === quizId);
      if (!progress) return prev;
      
      const loadedCheckedQuestions = new Set(progress.checkedQuestions || []);
      const answersCount = Object.keys(progress.answers).length;
      
      // Set current quiz and answers from saved progress
      sessionStorage.setItem("quiz_progress", JSON.stringify({ 
        quiz: progress.quiz, 
        answers: progress.answers,
        checkedQuestions: progress.checkedQuestions || []
      }));
      
      return {
        ...prev,
        currentQuiz: progress.quiz,
        userAnswers: progress.answers,
        checkedQuestions: loadedCheckedQuestions,
        lastSavedAnswersCount: answersCount,
        restoredCurrentIndex: progress.currentIndex ?? 0,
        restoredRetryAnswers: progress.retryAnswers ?? {},
        restoredRetryCheckedQuestions: progress.retryCheckedQuestions ?? [],
      };
    });
  }, []);

  const clearRestoredState = useCallback(() => {
    setState((prev) => ({
      ...prev,
      restoredCurrentIndex: null,
      restoredRetryAnswers: null,
      restoredRetryCheckedQuestions: null,
    }));
  }, []);

  const removeSavedProgress = useCallback((quizId: string) => {
    // Delete from API with proper callback handling
    deleteProgressMutation.mutate(quizId, {
      onSuccess: () => {
        setState((prev) => {
          // If the current quiz matches, clear it too
          if (prev.currentQuiz?.id === quizId) {
            sessionStorage.removeItem("quiz_progress");
            return { 
              ...prev, 
              currentQuiz: null,
              userAnswers: {},
              checkedQuestions: new Set(),
            };
          }
          return prev;
        });
      },
      onError: (error) => {
        console.error("Failed to delete quiz progress:", error);
      }
    });
  }, [deleteProgressMutation]);

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
      checkedQuestions: new Set(),
      isLoading: false,
      loadingMessage: "",
      processingProgress: 0,
      currentGenerationStep: "",
      revisedQuestionsCount: 0,
      retryCorrectCount: 0,
      lastSavedAnswersCount: 0,
      restoredCurrentIndex: null,
      restoredRetryAnswers: null,
      restoredRetryCheckedQuestions: null,
      playerCurrentIndex: 0,
      playerRetryAnswers: {},
      playerRetryCheckedQuestions: [],
    }));
  };

  // Check if there are unsaved changes (new answers since last save)
  const hasUnsavedChanges = Object.keys(state.userAnswers).length > state.lastSavedAnswersCount;

  return (
    <QuizContext.Provider
      value={{
        ...state,
        setExtractedText,
        setSourceMaterial,
        setCurrentQuiz,
        setQuizResult,
        setUserAnswer,
        markQuestionChecked,
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
        clearRestoredState,
        syncPlayerState,
        hasUnsavedChanges,
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
