import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import type { QuizProgressSummary } from "@shared/quiz-progress";

export const quizProgressSummaryKey = ["/api/quiz-progress/summaries"] as const;
export const EMPTY_PROGRESS: QuizProgressSummary[] = [];

export function useQuizProgressSummaries() {
  const { user } = useAuth();
  return useQuery<QuizProgressSummary[]>({
    queryKey: [...quizProgressSummaryKey, user?.id],
    enabled: !!user,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const response = await fetch(quizProgressSummaryKey[0], { credentials: "include", signal });
      if (!response.ok) throw new Error("Failed to load saved progress");
      return response.json();
    },
  });
}
