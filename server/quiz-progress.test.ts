import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import { createProgressSummaryHandler, createProgressDetailHandler } from "./quiz-progress.js";

test("progress routes authenticate, scope reads to the session, and do not cache private responses", async () => {
  const calls: unknown[][] = [];
  const app = express();
  app.use((req, _res, next) => {
    if (req.headers["x-test-user"]) req.session = { userId: "owner" } as typeof req.session;
    next();
  });
  app.get("/summaries", createProgressSummaryHandler(async userId => {
    calls.push([userId]); return [];
  }));
  app.get("/detail/:quizId", createProgressDetailHandler(async (userId, quizId) => {
    calls.push([userId, quizId]); return undefined;
  }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const path of ["/summaries", "/detail/quiz"]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 401);
      assert.equal(response.headers.get("cache-control"), "private, no-store");
    }
    assert.deepEqual(calls, []);
    const headers = { "x-test-user": "owner" };
    const summaries = await fetch(base + "/summaries?userId=another-user", { headers });
    assert.equal(summaries.status, 200);
    assert.deepEqual(await summaries.json(), []);
    assert.equal(summaries.headers.get("cache-control"), "private, no-store");
    const detail = await fetch(base + "/detail/quiz?userId=another-user", { headers });
    assert.equal(detail.status, 404);
    assert.deepEqual(calls, [["owner"], ["owner", "quiz"]]);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
