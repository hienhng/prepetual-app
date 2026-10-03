import fs from "node:fs/promises";
import path from "node:path";
import { hasPreparedQuestionFeedback } from "../shared/quiz-feedback.js";
import { isValidSelectionQuestion, formatAnswer } from "../shared/selection-answer.js";
import { getKatexFormattingIssue } from "../server/math-format.js";
import katex from "katex";
import { formatRagContext } from "../server/rag-core.js";

const out = path.resolve(process.env.QUIZ_LIVE_TEST_OUTPUT || "tmp/quiz-writer-three-live");
await fs.mkdir(out, { recursive: true });
const started = Date.now();
const requests: any[] = [];
const originalFetch = globalThis.fetch;
const prefixes: Record<string, string> = {
  "QUIZ SOURCE RECORD EXTRACTION": "source_records",
  "QUIZ SOURCE RECORD REVIEW": "source_review",
  "QUIZ QUESTION PLANNING": "question_plans",
  "QUIZ QUESTION PLAN REVIEW": "plan_review",
  "QUIZ QUESTION PLAN REVISION": "plan_revision",
  "QUIZ PLAN SOLVING": "plan_solutions",
  "QUIZ SOLUTION PRESENTATION": "question_writing",
  "QUIZ FOCUSED REPAIR": "focused_repairs",
};
globalThis.fetch = async (url, init) => {
  let body: any;
  try { body = JSON.parse(String(init?.body)); } catch {}
  const content = body?.messages?.[0]?.content;
  const prompt = typeof content === "string" ? content : "";
  const stage = Object.entries(prefixes).find(([prefix]) => prompt.startsWith(prefix))?.[1]
    || (prompt.includes("independent quiz answer auditor") ? "answer_audit"
      : prompt.includes("language-consistency auditor") ? "final_review" : "other");
  const id = requests.length + 1;
  const entry: any = { id, stage, model: body?.model, startedMs: Date.now() - started };
  requests.push(entry);
  await fs.writeFile(path.join(out, `request-${id}.json`), JSON.stringify(body, null, 2));
  try {
    const response = await originalFetch(url, init);
    const result: any = await response.clone().json().catch(() => null);
    Object.assign(entry, { status: response.status, durationMs: Date.now() - started - entry.startedMs,
      usage: result?.usage, finishReason: result?.choices?.[0]?.finish_reason });
    await fs.writeFile(path.join(out, `response-${id}.json`), JSON.stringify(result, null, 2));
    await fs.writeFile(path.join(out, "requests.json"), JSON.stringify(requests, null, 2));
    console.log("[LIVE REQUEST]", JSON.stringify(entry));
    return response;
  } catch (error) {
    entry.error = error instanceof Error ? error.message : String(error);
    await fs.writeFile(path.join(out, "requests.json"), JSON.stringify(requests, null, 2));
    console.log("[LIVE REQUEST FAILED]", JSON.stringify(entry));
    throw error;
  }
};
const types = ["multiple_choice", "selection", "short_answer"] as const;
const progress = (step: string, percent: number, message: string) => console.log("[LIVE PROGRESS]",
  JSON.stringify({ seconds: Math.round((Date.now() - started) / 1000), step, percent, message }));
const mode = "One live production generation using a synthetic Vietnamese physics fixture with no personal data; excludes upload/OCR, database retrieval, HTTP/SSE and persistence";
try {
  const fixture = [
    "NGUỒN GIẢ LẬP: Các số liệu sau là tình huống vật lý giả định dùng để kiểm thử, không phải dữ liệu người dùng.\nBình nhiệt lượng kế: Có 0,40 kg nước ở 80 độ C trong bình có nhiệt dung 150 J/K, ban đầu bình ở 20 độ C. Thả 0,10 kg nước đá ở -10 độ C vào bình. Tổng năng lượng mất ra môi trường từ lúc trộn đến khi cân bằng là 10000 J, và giả định tổn thất này giữ nguyên nếu thay đổi khối lượng đá. Nhiệt dung riêng của nước là 4200 J/(kg.K), của đá là 2100 J/(kg.K), nhiệt nóng chảy riêng là 334000 J/kg; nước đá nóng chảy ở 0 độ C. Không có bay hơi. Năng lượng nước và bình tỏa ra bằng năng lượng đá nhận cộng tổn thất. Nếu năng lượng sẵn có không đủ để đá tan hết, cân bằng có thể còn cả nước và đá ở 0 độ C. Nhiệt dung của bình phải được tính theo nhiệt độ ban đầu riêng của bình.",
    "NGUỒN GIẢ LẬP: Piston khí lý tưởng chứa một lượng khí cố định trong xi lanh, ban đầu thể tích 2,00 lít, nhiệt độ tuyệt đối 300 K, áp suất tuyệt đối 100 kPa. Piston không ma sát, chịu tải giữ áp suất khí ở 100 kPa khi piston còn chuyển động. Chốt chặn giới hạn thể tích lớn nhất ở 3,00 lít. Khi chạm chốt, piston không chuyển động thêm nên khí tiếp tục được nung ở thể tích không đổi. Giới hạn an toàn áp suất tuyệt đối là 150 kPa, đạt đúng giới hạn vẫn được xem là an toàn. Xét nung chậm đến 600 K hoặc các nhiệt độ giả định khác; lượng khí không thoát ra. Phương trình khí lý tưởng cho lượng khí cố định là PV/T không đổi. Các đại lượng áp suất đều là áp suất tuyệt đối; chuyển tiếp quá trình xảy ra khi thể tích đạt chốt chặn.",
    "NGUỒN GIẢ LẬP: Một máy lạnh có hai chế độ đo ở cùng điều kiện: chế độ A, mỗi chu trình lấy 540 kJ từ ngăn lạnh, nhận công điện 180 kJ và mất 60 giây; chế độ B, mỗi chu trình lấy 600 kJ từ ngăn lạnh, nhận công điện 240 kJ và mất 40 giây. Nhiệt thải ra ngoài bằng nhiệt lấy từ ngăn lạnh cộng công điện. Hệ số hiệu quả COP là nhiệt lấy từ ngăn lạnh chia công điện. Tải cần lấy khỏi ngăn lạnh là 2160 kJ. Bộ điều khiển cho phép chạy một phần chu trình và giả định các dòng năng lượng không đổi trong mỗi chế độ. Tổng thời gian tối đa là 200 giây và ngân sách điện tối đa là 800 kJ. Có thể dùng một chế độ hoặc phối hợp hai chế độ; bỏ qua thời gian chuyển chế độ và mọi dòng nhiệt khác. Mọi so sánh thay đổi ngân sách phải nêu rõ đó là tình huống giả định."
  ];
  const chunks = fixture.map((text, index) => ({ id: `synthetic-physics-${index + 1}`, content: text,
    chunkIndex: index, startOffset: 0, endOffset: text.length, similarity: 1 }));
  const source = { chunks, context: formatRagContext(chunks, 30_000) };
  await fs.writeFile(path.join(out, "source.txt"), fixture.join("\n\n"));
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) throw new Error("Live provider key is not configured");
  const { generateQuizQuestions, resolveQuizOutputLanguage } = await import("../server/openai.js");
  const targetLanguage = await resolveQuizOutputLanguage({ outputLanguage: "auto", materialText: source.context });
  await fs.writeFile(path.join(out, "config.json"), JSON.stringify({ mode, difficulty: "hard", requested: 3,
    types, targetLanguage, contextChars: source.context.length }, null, 2));
  const quiz = await generateQuizQuestions({ text: source.context, targetLanguage, questionCount: 3,
    questionTypes: [...types], difficulty: "hard", isPromptBased: false,
    ragGrounding: { sourceId: "writer-three-live", allowedChunkIds: source.chunks.map((chunk: any) => chunk.id) },
    onProgress: progress,
    onCheckpoint: async checkpoint => {
      await fs.writeFile(path.join(out, "checkpoint.json"), JSON.stringify(checkpoint, null, 2));
    },
  });
  await fs.writeFile(path.join(out, "quiz.json"), JSON.stringify(quiz, null, 2));
  const issues: string[] = [];
  const typeCounts: Record<string, number> = {};
  for (const [i, q] of quiz.questions.entries()) {
    typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
    if (!hasPreparedQuestionFeedback(q)) issues.push(`Q${i + 1}: missing verification marker`);
    if (q.wrongAnswerExplanations) issues.push(`Q${i + 1}: eager wrong-answer explanations`);
    if (q.type === "selection" && !isValidSelectionQuestion(q)) issues.push(`Q${i + 1}: invalid selection`);
    if (q.type === "multiple_choice" && (q.options?.length !== 4 || !q.options.includes(q.correctAnswer))) issues.push(`Q${i + 1}: invalid multiple choice`);
    if (!q.sourceChunkIds?.length || q.sourceChunkIds.some(id => !source.chunks.some((chunk: any) => chunk.id === id))) issues.push(`Q${i + 1}: invalid grounding`);
    for (const field of [q.question, q.explanation, formatAnswer(q.correctAnswer, q.type), ...(q.options || [])]) {
      const issue = getKatexFormattingIssue(field);
      if (issue) issues.push(`Q${i + 1}: ${issue}`);
      for (const match of field.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$/g)) {
        try { katex.renderToString(match[1] || match[2], { throwOnError: true }); }
        catch (error) { issues.push(`Q${i + 1}: ${String(error)}`); }
      }
    }
  }
  for (const type of types) if (!typeCounts[type]) issues.push(`Missing type: ${type}`);
  if (quiz.questions.length !== 3) issues.push(`Wrong count: ${quiz.questions.length}`);
  const report = { mode, completed: true, requested: 3, accepted: quiz.questions.length, difficulty: "hard",
    targetLanguage, typeCounts, totalMs: Date.now() - started, providerRequests: requests.length, issues };
  await fs.writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(out, "quiz.md"), `# ${quiz.title}\n\n` + quiz.questions.map((q, i) =>
    `## ${i + 1}. ${q.type}\n\n${q.question}\n\n${(q.options || []).map(option => `- ${option}`).join("\n")}\n\n**Answer:** ${q.correctAnswer}\n\n${q.explanation}`).join("\n\n"));
  console.log("[LIVE RESULT]", JSON.stringify(report));
  if (issues.length) process.exitCode = 2;
} catch (error: any) {
  const checkpoint: any = await fs.readFile(path.join(out, "checkpoint.json"), "utf8").then(JSON.parse).catch(() => null);
  const report = { mode, completed: false, requested: 3, accepted: checkpoint?.questions?.length || error?.generated || 0,
    error: error?.message, code: error?.code, stage: error?.stage, totalMs: Date.now() - started,
    providerRequests: requests.length };
  await fs.writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  console.log("[LIVE FAILURE]", JSON.stringify(report));
  process.exitCode = 1;
} finally { globalThis.fetch = originalFetch; }
