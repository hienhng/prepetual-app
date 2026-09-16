import pLimit from "p-limit";

type BatchWarning = (...values: unknown[]) => void;
type BatchLog = (message: string) => void;

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

export async function runValidationBatchesWithIsolation<T>(
  items: T[],
  options: {
    batchSize: number;
    concurrency: number;
    logPrefix: string;
    action: string;
    log?: BatchLog;
    warn?: BatchWarning;
    onCompleted?: (completed: number, total: number) => void;
  },
  validateBatch: (batch: T[], batchLogPrefix: string) => Promise<Set<T>>,
): Promise<Set<T>> {
  if (items.length === 0) return new Set<T>();

  const batchSize = Math.max(1, Math.floor(options.batchSize));
  const concurrency = Math.max(1, Math.floor(options.concurrency));
  const batchCount = Math.ceil(items.length / batchSize);
  const limit = pLimit(concurrency);
  const log = options.log ?? console.log;
  const warn = options.warn ?? console.warn;
  let completed = 0;

  const results = await Promise.all(
    Array.from({ length: batchCount }, (_, batchIndex) => {
      const start = batchIndex * batchSize;
      const batch = items.slice(start, start + batchSize);
      return limit(async () => {
        log(
          `${options.logPrefix} ${options.action} batch ${batchIndex + 1}/${batchCount} ` +
          `(questions ${start + 1}-${start + batch.length} of ${items.length}).`,
        );
        const result = await runValidationBatchWithIsolation(
          batch,
          `${options.logPrefix} BATCH ${batchIndex + 1}/${batchCount}`,
          validateBatch,
          warn,
        );
        completed += batch.length;
        options.onCompleted?.(completed, items.length);
        return result;
      });
    }),
  );

  const rejected = new Set<T>();
  for (const batchRejected of results) {
    batchRejected.forEach((item) => rejected.add(item));
  }
  return rejected;
}
