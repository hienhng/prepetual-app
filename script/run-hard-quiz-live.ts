import fs from "node:fs/promises";
import path from "node:path";
import { AsyncLocalStorage } from "node:async_hooks";
import OpenAI from "openai";
import pLimit from "p-limit";
import katex from "katex";
import type { Question } from "../shared/schema.js";
import { formatAnswer, isValidSelectionQuestion, parseSelectionAnswer, encodeSelectionAnswer } from "../shared/selection-answer.js";
import { getKatexFormattingIssue } from "../server/math-format.js";
import { inspectAiJsonCompletion, isJsonResponseFormatError } from "../server/ai-json-response.js";
import { createSubmittedAnswerExplainer } from "../server/submitted-answer-feedback.js";
import type { FeedbackCompletion } from "../server/verified-feedback.js";

// Run with dotenv -e .env -- tsx script/run-hard-quiz-live.ts.
// Reuse PDF extraction, but always make fresh live writer/reviewer requests.
const option = (name: string, fallback: string) => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
const sourceDir = path.resolve(option("source", "tmp/hard-quiz-planned-final"));
const out = path.resolve(option("output", "tmp/hard-quiz-current-live"));
const reviewOnly = process.argv.includes("--review-only");
const started = Date.now();
await fs.mkdir(out, { recursive: true });
const source = JSON.parse(await fs.readFile(path.join(sourceDir, "context.json"), "utf8"));
const extraction = JSON.parse(await fs.readFile(path.join(sourceDir, "extraction.json"), "utf8"));
const scopes = new AsyncLocalStorage<{ questionNumber?: number; submission?: string }>();
const requests: any[] = [];
const events: any[] = [];
const originalFetch = globalThis.fetch;
const originalWarn = console.warn;
const write = (name: string, data: unknown) => fs.writeFile(path.join(out, name), JSON.stringify(data, null, 2));
console.warn = (...args) => {
  events.push({ ...scopes.getStore(), elapsedMs: Date.now() - started, message: args[0], details: args.slice(1) });
  originalWarn(...args);
};
globalThis.fetch = async (url, init) => {
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;
  // Never capture HTTP headers, keys, or environment contents.
  const prompt = body?.messages?.map((message: any) => typeof message.content === "string" ? message.content : "").join("\n") || "";
  const stage = prompt.startsWith("Review these explanations") ? "feedback_review"
    : prompt.startsWith("Explain this submitted") ? "submitted_feedback"
      : prompt.includes("languageCode") || prompt.includes("targetLanguage") && !prompt.includes("questions") ? "language_resolution" : "generation";
  const entry: any = { id: requests.length + 1, ...scopes.getStore(), stage, model: body?.model, startedMs: Date.now() - started };
  requests.push(entry);
  await write(`request-${entry.id}.json`, body);
  try {
    const response = await originalFetch(url, init);
    const result: any = await response.clone().json().catch(() => null);
    Object.assign(entry, { status: response.status, durationMs: Date.now() - started - entry.startedMs,
      usage: result?.usage, finishReason: result?.choices?.[0]?.finish_reason });
    await write(`response-${entry.id}.json`, result);
    console.log("[LIVE REQUEST]", JSON.stringify(entry));
    return response;
  } catch (error) {
    entry.error = error instanceof Error ? error.message : String(error);
    throw error;
  }
};

// Match the route's model selection, budgets, JSON handling, and retry policy.
// Exercise the actual submitted-answer explainer without starting a DB/server.
const client = new OpenAI({ baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL, apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY });
const complete: FeedbackCompletion = async (prompt, images) => {
  const messages = images.length
    ? [{ role: "user" as const, content: [{ type: "text" as const, text: prompt }, ...images.map(url => ({ type: "image_url" as const, image_url: { url } }))] }]
    : [{ role: "user" as const, content: prompt }];
  let jsonMode = true;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: images.length ? (process.env.AI_VISION_MODEL || "qwen/qwen3.8-27b")
          : (process.env.AI_VALIDATION_MODEL || process.env.AI_QUIZ_MODEL || "openai/gpt-oss-120b"),
        messages, temperature: 0, max_tokens: attempt === 2 ? 6_000 : 4_000,
        ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
      }, { timeout: 30_000, maxRetries: 0 });
      const inspection = inspectAiJsonCompletion(response);
      if (inspection.result) return inspection.result;
      events.push({ ...scopes.getStore(), check: "completion", attempt, ...inspection });
    } catch (error) {
      if (!isJsonResponseFormatError(error)) throw error;
      jsonMode = false;
    }
  }
  throw new Error("Quiz feedback response was incomplete or invalid");
};

const types = ["multiple_choice", "selection", "true_false", "short_answer"] as const;
const reviews: any[] = [];
const issues: string[] = [];
let quiz: { title: string; questions: Question[] } | undefined;
let failure: unknown;
let generationMs = 0;
try {
  if (reviewOnly) {
    quiz = JSON.parse(await fs.readFile(path.resolve(option("quiz", "tmp/hard-quiz-current-live/quiz.json")), "utf8"));
  } else {
    const { generateQuizQuestions, resolveQuizOutputLanguage } = await import("../server/openai.js");
    const targetLanguage = await resolveQuizOutputLanguage({ outputLanguage: "auto", materialText: extraction.text });
    const generationStart = Date.now();
    const resumePath = option("resume", "");
    const resumeState = resumePath ? JSON.parse(await fs.readFile(path.resolve(resumePath), "utf8")) : undefined;
    quiz = await generateQuizQuestions({ targetLanguage, text: source.context, questionCount: 20, resumeState,
      questionTypes: [...types], difficulty: "hard", isPromptBased: false,
      ragGrounding: { sourceId: "saved-hard-exam-live", allowedChunkIds: source.chunks.map((chunk: any) => chunk.id) },
      onProgress: (step, percent, message) => console.log("[LIVE PROGRESS]", JSON.stringify({ seconds: Math.round((Date.now() - started) / 1000), step, percent, message })),
      onCheckpoint: checkpoint => write("checkpoint.json", checkpoint),
    });
    generationMs = Date.now() - generationStart;
    await write("quiz.json", quiz);
  }
  const typeCounts: Record<string, number> = {};
  for (const [index, q] of quiz!.questions.entries()) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    if (q.type === "selection" && !isValidSelectionQuestion(q)) issues.push(`Q${index + 1}: invalid selection`);
    if (q.type === "multiple_choice" && (q.options?.length !== 4 || !q.options.includes(q.correctAnswer))) issues.push(`Q${index + 1}: invalid multiple choice`);
    if (!q.sourceChunkIds?.length || q.sourceChunkIds.some(id => !source.chunks.some((chunk: any) => chunk.id === id))) issues.push(`Q${index + 1}: invalid citation IDs`);
    for (const [field, value] of Object.entries({ question: q.question, explanation: q.explanation || "", correctAnswer: formatAnswer(q.correctAnswer, q.type), ...(q.options || []).reduce((fields, option, i) => ({ ...fields, [`option${i}`]: option }), {}) })) {
      const issue = getKatexFormattingIssue(value);
      if (issue) issues.push(`Q${index + 1} ${field}: ${issue}`);
      for (const match of value.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g)) {
        try { katex.renderToString(match[1] || match[2], { throwOnError: true }); }
        catch (error) { issues.push(`Q${index + 1} ${field}: ${String(error)}`); }
      }
    }
  }
  for (const type of types) if (!typeCounts[type]) issues.push(`Missing requested type: ${type}`);
  if (quiz!.questions.length !== 20) issues.push(`Wrong count: ${quiz!.questions.length}`);
  await write("generation-checks.json", { typeCounts, issues, generationMs });
  const explain = createSubmittedAnswerExplainer(complete);
  const evidence = { sourceText: extraction.text,
    quizLanguageContext: [quiz!.title, ...quiz!.questions.slice(0, 8).map(q => q.question)].join("\n").slice(0, 8_000) };
  const filter = option("questions", "").split(",").filter(Boolean).map(Number);
  const limit = pLimit(2);
  await Promise.all(quiz!.questions.map((q, index) => limit(async () => {
    const questionNumber = index + 1;
    if (filter.length && !filter.includes(questionNumber)) return;
    // Correct-key submissions test saved-key support. Wrong submissions exercise
    // selected wrong-option explanations and selection omissions as well.
    const selectedAnswer = q.type === "short_answer" ? q.correctAnswer
      : q.type === "selection" ? encodeSelectionAnswer([parseSelectionAnswer(q.correctAnswer)[0], q.options!.find(option => !parseSelectionAnswer(q.correctAnswer).includes(option))!])
        : (q.type === "true_false" ? ["True", "False"] : q.options!).find(option => option !== q.correctAnswer)!;
    await scopes.run({ questionNumber, submission: q.type === "short_answer" ? "saved_answer" : "incorrect_choice" }, async () => {
      const review: any = { questionNumber, id: q.id, type: q.type, selectedAnswer };
      try {
        const feedback = await explain(q, selectedAnswer, evidence);
        review.accepted = true;
        await write(`feedback-q${questionNumber}.json`, feedback);
      } catch (error) {
        review.accepted = false;
        review.error = error instanceof Error ? error.message : String(error);
      }
      reviews.push(review);
      await write(`review-q${questionNumber}.json`, review);
      console.log("[LIVE REVIEW]", JSON.stringify(review));
    });
  })));
} catch (error) {
  failure = error instanceof Error ? { ...error, name: error.name, message: error.message } : String(error);
  const checkpoint = await fs.readFile(path.join(out, "checkpoint.json"), "utf8").then(JSON.parse).catch(() => null);
  if (!quiz && checkpoint?.questions) quiz = checkpoint;
  console.error("[LIVE FAILURE]", failure);
  process.exitCode = 1;
} finally {
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
  await write("requests.json", requests);
  await write("events.json", events);
  reviews.sort((a, b) => a.questionNumber - b.questionNumber);
  const typeCounts = (quiz?.questions || []).reduce<Record<string, number>>((counts, q) => ({ ...counts, [q.type]: (counts[q.type] || 0) + 1 }), {});
  const report = { mode: "Live production writer and submitted-answer feedback core; saved six-page PDF extraction and full local source context. No fresh OCR, DB retrieval, authentication, HTTP/SSE, persistence, or short-answer grading route. Short-answer review checks saved-key support only.",
    sourceDir, reviewOnly, requested: 20, generated: quiz?.questions.length || 0, generationMs,
    typeCounts, issues, reviewed: reviews.length, approved: reviews.filter(review => review.accepted).length,
    rejected: reviews.filter(review => !review.accepted), failure, providerRequests: requests.length, totalMs: Date.now() - started };
  await write("report.json", report);
  console.log("[LIVE RESULT]", JSON.stringify(report));
  if (failure || issues.length || report.rejected.length) process.exitCode = 1;
}
