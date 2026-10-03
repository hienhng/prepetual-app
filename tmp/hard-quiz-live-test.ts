import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { extractTextFromPDFWithOCR } from "../server/pdf-extract.js";
import { chunkSourceText, formatRagContext } from "../server/rag-core.js";
import { hasPreparedQuestionFeedback } from "../shared/quiz-feedback.js";
import { isValidSelectionQuestion } from "../shared/selection-answer.js";
import { getKatexFormattingIssue } from "../server/math-format.js";
import katex from "katex";

const out = path.resolve(process.env.HARD_QUIZ_TEST_OUTPUT || "tmp/hard-quiz-live");
await fs.mkdir(out, { recursive: true });
const input = process.argv[2] || "C:/Users/Gia Hien/Downloads/Đề thi kscl giữa hk1 lần5 .pdf";
const start = Date.now();
const requests: any[] = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  let body: any;
  try { body = JSON.parse(String(init?.body)); } catch {}
  const entry: any = { model: body?.model, startedMs: Date.now() - start };
  requests.push(entry);
  try {
    const response = await originalFetch(url, init);
    entry.status = response.status;
    const clone = await response.clone().json().catch(() => null) as any;
    entry.durationMs = Date.now() - start - entry.startedMs;
    entry.usage = clone?.usage;
    entry.finishReason = clone?.choices?.[0]?.finish_reason;
    await fs.writeFile(path.join(out, "requests.json"), JSON.stringify(requests, null, 2));
    await fs.writeFile(path.join(out, `response-${requests.indexOf(entry) + 1}.json`), JSON.stringify(clone, null, 2));
    console.log("[LIVE PROVIDER]", JSON.stringify(entry));
    return response;
  } catch (error) {
    entry.error = error instanceof Error ? error.message : String(error);
    console.log("[LIVE PROVIDER FAILED]", JSON.stringify(entry));
    throw error;
  }
};
const progress = (step: string, percent: number, message: string) => console.log("[LIVE PROGRESS]", JSON.stringify({ elapsedSeconds: Math.round((Date.now() - start) / 1000), step, percent, message }));
const { generateQuizQuestions, resolveQuizOutputLanguage, transcribeExamImage, verifyExamPageTranscription } = await import("../server/openai.js");
try {
  console.log("[LIVE CONFIG]", JSON.stringify({ quizModel: process.env.AI_QUIZ_MODEL || "openai/gpt-oss-120b", visionModel: process.env.AI_VISION_MODEL || "qwen/qwen3.6-27b", keyConfigured: Boolean(process.env.AI_INTEGRATIONS_OPENAI_API_KEY) }));
  const buffer = await fs.readFile(input);
  const cache = path.join(out, "extraction.json");
  const extracted = process.argv.includes("--reuse-extraction") ? JSON.parse(await fs.readFile(cache, "utf8")) : await extractTextFromPDFWithOCR(buffer, {
    sparseTextThresholdChars: 60, maxPages: 100, renderScale: 1.4,
    maxRenderPixels: 2_500_000, performOcr: true, requireComplete: true,
    transcribePage: transcribeExamImage,
    verifyTranscription: verifyExamPageTranscription,
    onProgress: (completed, total) => progress("extracting", Math.round(completed / total * 100), `PDF page ${completed}/${total}`),
  });
  await fs.writeFile(cache, JSON.stringify(extracted, null, 2));
  await fs.writeFile(path.join(out, "source.txt"), extracted.text);
  const extractionMs = Date.now() - start;
  console.log("[LIVE EXTRACTION]", JSON.stringify({ extractionMs, chars: extracted.text.length, pages: extracted.pagesProcessed, ocrPages: extracted.pagesOcred, reasons: extracted.pages.map((p: any) => ({ page: p.pageNumber, reasons: p.ocrReasons })) }));
  const targetLanguage = await resolveQuizOutputLanguage({ outputLanguage: "auto", materialText: extracted.text });
  const chunks = chunkSourceText(extracted.text).map(chunk => ({ ...chunk, id: randomUUID(), similarity: 1 }));
  const context = formatRagContext(chunks, 30_000);
  await fs.writeFile(path.join(out, "context.json"), JSON.stringify({ chunks, context }, null, 2));
  const generationStart = Date.now();
  const quiz = await generateQuizQuestions({
    targetLanguage, text: context, questionCount: 20,
    questionTypes: ["multiple_choice", "selection", "true_false", "short_answer"],
    difficulty: "hard", isPromptBased: false,
    ragGrounding: { sourceId: "local-live-test", allowedChunkIds: chunks.map(c => c.id) },
    onProgress: progress,
    onCheckpoint: async checkpoint => { await fs.writeFile(path.join(out, "checkpoint.json"), JSON.stringify(checkpoint, null, 2)); },
  });
  const generationMs = Date.now() - generationStart;
  await fs.writeFile(path.join(out, "quiz.json"), JSON.stringify(quiz, null, 2));
  const issues: string[] = [];
  const typeCounts: Record<string, number> = {};
  for (const [i, q] of quiz.questions.entries()) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    if (!hasPreparedQuestionFeedback(q)) issues.push(`Q${i + 1}: feedback not prepared`);
    if (q.wrongAnswerExplanations) issues.push(`Q${i + 1}: eager mistake explanations`);
    if (q.type === "selection" && !isValidSelectionQuestion(q)) issues.push(`Q${i + 1}: invalid selection answer`);
    if (q.type === "multiple_choice" && (q.options?.length !== 4 || !q.options?.includes(q.correctAnswer))) issues.push(`Q${i + 1}: invalid multiple choice`);
    if (!q.sourceChunkIds?.length || q.sourceChunkIds.some(id => !chunks.some(c => c.id === id))) issues.push(`Q${i + 1}: invalid grounding`);
    for (const text of [q.question, q.explanation, ...(q.options || []), ...Object.values(q.wrongAnswerExplanations || {})]) {
      const formattingIssue = getKatexFormattingIssue(text);
      if (formattingIssue) issues.push(`Q${i + 1}: ${formattingIssue}`);
      for (const match of (text || "").matchAll(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g)) {
        try { katex.renderToString(match[1] || match[2], { throwOnError: true }); }
        catch (error) { issues.push(`Q${i + 1}: KaTeX ${String(error)}`); }
      }
    }
  }
  for (const type of ["multiple_choice", "selection", "true_false", "short_answer"]) if (!typeCounts[type]) issues.push(`Missing requested type: ${type}`);
  if (quiz.questions.length !== 20) issues.push(`Wrong count: ${quiz.questions.length}`);
  const report = { input, mode: "Live production parser and generator; full local source chunks supplied without database indexing, authentication, HTTP/SSE or persistence", difficulty: "hard", targetLanguage, questionCount: quiz.questions.length, typeCounts, extractionMs, generationMs, totalMs: Date.now() - start, providerRequests: requests.length, issues };
  await fs.writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(out, "quiz.md"), `# ${quiz.title}\n\n` + quiz.questions.map((q, i) => `## ${i + 1}. ${q.type}\n\n${q.question}\n\n${(q.options || []).map(o => `- ${o}`).join("\n")}\n\n**Answer:** ${q.correctAnswer}\n\n${q.explanation}`).join("\n\n"));
  console.log("[LIVE RESULT]", JSON.stringify(report));
} catch (error: any) {
  const report = { failed: true, error: error?.message, code: error?.code, stage: error?.stage, requested: error?.requested, generated: error?.generated, totalMs: Date.now() - start, providerRequests: requests.length };
  await fs.writeFile(path.join(out, "failure.json"), JSON.stringify(report, null, 2));
  console.log("[LIVE FAILURE]", JSON.stringify(report));
  process.exitCode = 1;
} finally { globalThis.fetch = originalFetch; }
