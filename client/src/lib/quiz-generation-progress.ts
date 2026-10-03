/** A zero update starts a new run; stage and checkpoint updates cannot rewind it. */
export function advanceQuizGenerationProgress(current: number, next: number): number {
  if (!Number.isFinite(next)) return current;
  if (next === 0) return 0;
  return Math.max(current, Math.min(100, Math.max(0, next)));
}
