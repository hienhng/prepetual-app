import { randomUUID } from "node:crypto";

/** Logs durations and counts only; never source text, prompts, or credentials. */
export function createGenerationTiming() {
  const requestId = randomUUID();
  const started = performance.now();
  let previous = started;
  let stage = "starting";
  return {
    requestId,
    mark(next: string) {
      if (next === stage) return;
      const now = performance.now();
      console.info("[QUIZ TIMING]", { requestId, stage, durationMs: Math.round(now - previous) });
      previous = now;
      stage = next;
    },
    finish() {
      this.mark("finished");
      console.info("[QUIZ TIMING]", { requestId, totalMs: Math.round(performance.now() - started) });
    },
  };
}
