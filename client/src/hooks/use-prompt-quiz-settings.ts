import { useEffect, useRef, useState } from "react";
import type { DifficultyLevel } from "@shared/schema";

export function usePromptQuizSettings(prompt: string, enabled: boolean) {
  const normalizedPrompt = prompt.trim();
  const [questionCount, updateCount] = useState(10);
  const [difficulty, updateDifficulty] = useState<DifficultyLevel>("medium");
  const [resolvedPrompt, setResolvedPrompt] = useState<string | null>(null);
  const [error, setError] = useState("");
  const edits = useRef({ prompt: normalizedPrompt, count: false, difficulty: false });
  if (edits.current.prompt !== normalizedPrompt) {
    edits.current = { prompt: normalizedPrompt, count: false, difficulty: false };
  }

  useEffect(() => {
    if (!enabled || !normalizedPrompt || resolvedPrompt === normalizedPrompt) return;
    const controller = new AbortController();
    setError("");
    const detectSettings = async () => {
      try {
        const response = await fetch("/api/quiz-prompt-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ prompt: normalizedPrompt }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || `Could not read prompt settings (${response.status}). Please retry.`);
        }
        const settings = await response.json();
        if (!Number.isInteger(settings.questionCount) || settings.questionCount < 3 || settings.questionCount > 20 ||
            !["easy", "medium", "hard"].includes(settings.difficulty)) {
          throw new Error("The settings response was invalid. Please retry.");
        }
        if (controller.signal.aborted) return;
        if (!edits.current.count) updateCount(settings.questionCount);
        if (!edits.current.difficulty) updateDifficulty(settings.difficulty);
      } catch (error) {
        if (controller.signal.aborted) return;
        setError(error instanceof Error ? error.message : "Set quiz settings manually.");
      }
      if (!controller.signal.aborted) setResolvedPrompt(normalizedPrompt);
    };
    void detectSettings();
    return () => { controller.abort(); };
  }, [normalizedPrompt, enabled, resolvedPrompt]);

  return {
    questionCount,
    difficulty,
    setQuestionCount: (value: number) => { edits.current.count = true; updateCount(value); },
    setDifficulty: (value: DifficultyLevel) => { edits.current.difficulty = true; updateDifficulty(value); },
    isDetectingSettings: enabled && Boolean(normalizedPrompt) && resolvedPrompt !== normalizedPrompt,
    settingsError: error,
    retrySettings: () => { setError(""); setResolvedPrompt(null); },
  };
}
