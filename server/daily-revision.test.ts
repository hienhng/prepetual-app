import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import type { AddressInfo } from "node:net";
import type { Question } from "../shared/schema.js";
import { createDailyRevisionHandler, isRevisionDate, selectRevisionQuestions } from "./daily-revision.js";

test("revision dates reject invalid calendar days and ambiguous query values", () => {
  for (const value of [undefined, ["2026-11-08"], "2026-2-03", "2026-02-29", "2026-04-31", "invalid"]) {
    assert.equal(isRevisionDate(value), false);
  }
  assert.equal(isRevisionDate("2024-02-29"), true);
  assert.equal(isRevisionDate("2026-11-08"), true);
});

test("daily questions are stable, distinct, and leave the quiz unchanged", () => {
  const questions: Question[] = Array.from({ length: 12 }, (_, index) => ({
    id: `q${index}`, type: "multiple_choice", question: `Question ${index}`,
    options: ["A", "B"], correctAnswer: "A",
  }));
  const original = structuredClone(questions);
  const selected = selectRevisionQuestions(questions, "quiz", "2026-11-08");
  assert.equal(selected.length, 4);
  assert.equal(new Set(selected.map(question => question.id)).size, 4);
  assert.deepEqual(selected, selectRevisionQuestions(questions, "quiz", "2026-11-08"));
  assert.notDeepEqual(selected, selectRevisionQuestions(questions, "quiz", "2026-11-09"));
  assert.deepEqual(questions, original);
});

test("daily revision API enforces authentication, validates dates, and returns a private response", async () => {
  const calls: unknown[][] = [];
  const app = express();
  app.use((req, _res, next) => {
    if (req.headers["x-test-user"]) req.session = { userId: "owner" } as typeof req.session;
    next();
  });
  const revision = { quiz: { id: "quiz", title: "Revision", category: "Math" }, questions: [] };
  app.get("/revision", createDailyRevisionHandler(async (...args) => {
    calls.push(args);
    return revision;
  }));
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>(resolve => server.once("listening", resolve));
  const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/revision`;
  try {
    assert.equal((await fetch(`${url}?date=2026-11-08`)).status, 401);
    const headers = { "x-test-user": "owner" };
    assert.equal((await fetch(`${url}?date=2026-02-30`, { headers })).status, 400);
    assert.equal((await fetch(`${url}?date=2026-11-08&date=2026-11-09`, { headers })).status, 400);
    assert.deepEqual(calls, []);
    const response = await fetch(`${url}?date=2026-11-08`, { headers });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(await response.json(), revision);
    assert.deepEqual(calls, [["owner", "2026-11-08"]]);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});
