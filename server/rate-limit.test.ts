import assert from "node:assert/strict";
import test from "node:test";

import {
  buildRateLimitBucketId,
  createRateLimitMiddleware,
  getRateLimitSubject,
  type RateLimitStore,
} from "./rate-limit.js";

function createResponse() {
  const headers = new Map<string, string>();
  let statusCode = 200;
  let body: unknown;

  return {
    headers,
    get statusCode() { return statusCode; },
    get body() { return body; },
    setHeader(name: string, value: string) { headers.set(name.toLowerCase(), value); },
    status(code: number) { statusCode = code; return this; },
    json(value: unknown) { body = value; return this; },
  };
}

async function invoke(middleware: ReturnType<typeof createRateLimitMiddleware>, req: any) {
  const res = createResponse();
  let nextCalled = false;
  await middleware(req, res as any, () => { nextCalled = true; });
  return { res, nextCalled };
}

test("hashes subjects into stable, window-specific database bucket ids", () => {
  const first = buildRateLimitBucketId({ scope: "ai", subject: "user:secret", nowMs: 12_345, windowMs: 10_000 });
  const sameWindow = buildRateLimitBucketId({ scope: "ai", subject: "user:secret", nowMs: 19_999, windowMs: 10_000 });
  const nextWindow = buildRateLimitBucketId({ scope: "ai", subject: "user:secret", nowMs: 20_000, windowMs: 10_000 });

  assert.equal(first.bucketId, sameWindow.bucketId);
  assert.notEqual(first.bucketId, nextWindow.bucketId);
  assert.equal(first.bucketId.includes("user:secret"), false);
  assert.equal(first.resetAtMs, 20_000);
});

test("uses an authenticated user before falling back to the request IP", () => {
  assert.equal(getRateLimitSubject({ user: { claims: { sub: "owner" } }, ip: "1.2.3.4" } as any), "user:owner");
  assert.equal(getRateLimitSubject({ ip: "1.2.3.4" } as any), "ip:1.2.3.4");
});

test("allows requests through the limit and rejects the next request", async () => {
  let count = 0;
  const store: RateLimitStore = { increment: async () => ++count };
  const middleware = createRateLimitMiddleware({
    scope: "test",
    limit: 2,
    windowMs: 60_000,
    store,
    now: () => 30_000,
  });
  const req = { ip: "1.2.3.4" };

  assert.equal((await invoke(middleware, req)).nextCalled, true);
  assert.equal((await invoke(middleware, req)).nextCalled, true);

  const blocked = await invoke(middleware, req);
  assert.equal(blocked.nextCalled, false);
  assert.equal(blocked.res.statusCode, 429);
  assert.equal(blocked.res.headers.get("ratelimit-remaining"), "0");
  assert.equal(blocked.res.headers.get("retry-after"), "30");
});

test("supports endpoint-specific subjects and safe response messages", async () => {
  let capturedBucketId = "";
  const middleware = createRateLimitMiddleware({
    scope: "auth-login",
    limit: 1,
    windowMs: 60_000,
    now: () => 30_000,
    subject: () => "email:user@example.com",
    limitMessage: "Too many attempts.",
    store: {
      increment: async (bucketId) => {
        capturedBucketId = bucketId;
        return 2;
      },
    },
  });

  const result = await invoke(middleware, { ip: "1.2.3.4" });
  assert.equal(result.res.statusCode, 429);
  assert.deepEqual(result.res.body, { message: "Too many attempts.", retryAfterSeconds: 30 });
  assert.equal(capturedBucketId.includes("user@example.com"), false);
});

test("fails closed when the shared counter store is unavailable", async () => {
  const middleware = createRateLimitMiddleware({
    scope: "test",
    limit: 1,
    windowMs: 60_000,
    store: { increment: async () => { throw new Error("database unavailable"); } },
  });

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const result = await invoke(middleware, { ip: "1.2.3.4" });
    assert.equal(result.nextCalled, false);
    assert.equal(result.res.statusCode, 503);
  } finally {
    console.error = originalConsoleError;
  }
});
