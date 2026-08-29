type BatchWarning = (...values: unknown[]) => void;

/**
 * Retries a failed validator batch in smaller groups so one malformed model
 * response cannot cause unrelated questions to be rejected. Validation remains
 * fail-closed: an item whose one-item batch still fails is rejected.
 */
export async function runValidationBatchWithIsolation<T>(
  items: T[],
  logPrefix: string,
  validateBatch: (batch: T[], batchLogPrefix: string) => Promise<Set<T>>,
  warn: BatchWarning = console.warn,
): Promise<Set<T>> {
  if (items.length === 0) return new Set<T>();

  try {
    return await validateBatch(items, logPrefix);
  } catch (error) {
    if (items.length === 1) {
      warn(`${logPrefix} Validation failed for one isolated question; rejecting it:`, error);
      return new Set(items);
    }

    const splitIndex = Math.ceil(items.length / 2);
    const left = items.slice(0, splitIndex);
    const right = items.slice(splitIndex);
    warn(
      `${logPrefix} Batch response failed for ${items.length} questions; ` +
      `retrying as groups of ${left.length} and ${right.length}.`,
      error,
    );

    const rejected = await runValidationBatchWithIsolation(
      left,
      `${logPrefix} SPLIT 1`,
      validateBatch,
      warn,
    );
    const rightRejected = await runValidationBatchWithIsolation(
      right,
      `${logPrefix} SPLIT 2`,
      validateBatch,
      warn,
    );
    rightRejected.forEach((item) => rejected.add(item));
    return rejected;
  }
}
