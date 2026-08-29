import crypto from "crypto";
import type { Request, RequestHandler } from "express";

export interface RateLimitStore {
  increment(bucketId: string, expiresAt: Date): Promise<number>;
}

export interface RateLimitOptions {
  scope: string;
  limit: number;
  windowMs: number;
  store: RateLimitStore;
  now?: () => number;
  subject?: (req: Request) => string;
  limitMessage?: string;
  unavailableMessage?: string;
}

type RequestWithOptionalUser = Request & {
  user?: { claims?: { sub?: string } };
};

export function readPositiveIntegerEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getRateLimitSubject(req: RequestWithOptionalUser): string {
  const userId = req.user?.claims?.sub;
  if (userId) return `user:${userId}`;

  const address = req.ip || req.socket?.remoteAddress || "unknown";
  return `ip:${address}`;
}

export function buildRateLimitBucketId(params: {
  scope: string;
  subject: string;
  nowMs: number;
  windowMs: number;
}): { bucketId: string; resetAtMs: number } {
  const windowStartMs = Math.floor(params.nowMs / params.windowMs) * params.windowMs;
  const resetAtMs = windowStartMs + params.windowMs;
  const subjectHash = crypto.createHash("sha256").update(params.subject).digest("hex");

  return {
    bucketId: `rate-limit:${params.scope}:${subjectHash}:${windowStartMs}`,
    resetAtMs,
  };
}

export function createRateLimitMiddleware(options: RateLimitOptions): RequestHandler {
  if (!Number.isSafeInteger(options.limit) || options.limit <= 0) {
    throw new Error("Rate limit must be a positive integer");
  }
  if (!Number.isSafeInteger(options.windowMs) || options.windowMs <= 0) {
    throw new Error("Rate limit window must be a positive integer");
  }

  return async (req: RequestWithOptionalUser, res, next) => {
    const nowMs = options.now?.() ?? Date.now();
    const { bucketId, resetAtMs } = buildRateLimitBucketId({
      scope: options.scope,
      subject: options.subject?.(req) || getRateLimitSubject(req),
      nowMs,
      windowMs: options.windowMs,
    });

    try {
      const count = await options.store.increment(bucketId, new Date(resetAtMs));
      const remaining = Math.max(0, options.limit - count);
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));

      res.setHeader("RateLimit-Limit", String(options.limit));
      res.setHeader("RateLimit-Remaining", String(remaining));
      res.setHeader("RateLimit-Reset", String(Math.ceil(resetAtMs / 1000)));

      if (count > options.limit) {
        res.setHeader("Retry-After", String(retryAfterSeconds));
        return res.status(429).json({
          message: options.limitMessage || "Too many AI requests. Please wait before trying again.",
          retryAfterSeconds,
        });
      }

      next();
    } catch (error) {
      console.error(`Rate limiter failed for ${options.scope}:`, error);
      res.status(503).json({
        message: options.unavailableMessage || "AI usage controls are temporarily unavailable. Please try again shortly.",
      });
    }
  };
}
