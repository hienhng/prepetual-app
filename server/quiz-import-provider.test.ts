import assert from "node:assert/strict";
import test from "node:test";

test("import provider retries truncated output and includes every supplied image", async (t) => {
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-only";
  process.env.GEMINI_API_KEY = "test-only";
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "http://test.invalid/v1";
  const originalFetch = globalThis.fetch;
  let calls = 0;
  let auditCalls = 0;
  const imageCounts: number[] = [];
  const respond = (data: unknown, reason = "stop") => new Response(JSON.stringify({ choices: [{ finish_reason: reason, message: { content: JSON.stringify(data) } }] }), { headers: { "Content-Type": "application/json" } });
  globalThis.fetch = async (_url, init) => {
    calls++;
    const body = JSON.parse(String(init?.body));
    const content = body.messages[0].content;
    imageCounts.push(content.filter((part: any) => part.type === "image_url").length);
    const prompt = content[0].text;
    if (prompt.startsWith("Transcribe ALL")) return new Response(JSON.stringify({ choices: [{ finish_reason: "length", message: { content: "1. A readable question, but the rest of this page was cut off" } }] }), { headers: { "Content-Type": "application/json" } });
    if (prompt.startsWith("Classify")) {
      const items = JSON.parse(prompt.split("\nSOURCE ITEMS:\n")[1]);
      return respond({ classifications: items.map((item: any) => ({ sourceId: item.sourceId, type: "multiple_choice" })) });
    }
    if (prompt.includes("\nITEMS:\n")) {
      if (++auditCalls === 1) return respond({ title: "Truncated", questions: [] }, "length");
      const items = JSON.parse(prompt.split("\nITEMS:\n")[1]);
      return respond({ answers: items.map((item: any) => ({ sourceId: item.sourceId, solution: "Two is greater than one.", correctAnswer: "B", verified: true })) });
    }
    const items = JSON.parse(prompt.split("ASSIGNED SOURCE ITEMS:\n")[1].split("\n")[0]);
    return respond({ title: "Exam", category: "categories.math", questions: items.map((item: any) => ({ sourceId: item.id, question: item.text.split("\n")[0], options: ["A. One", "B. Two"], correctAnswer: "B", answerVerified: true })) });
  };
  try {
    const { importExistingQuiz, transcribeExamImage } = await import("./openai.js");
    const quiz = await importExistingQuiz({ text: "1. Which is greater?\nA. One\nB. Two\n2. Which is larger?\nA. One\nB. Two", documentImages: ["one", "two", "three", "four", "five"] });
    assert.equal(quiz.questions.length, 2);
    assert.equal(calls, 4);
    assert.ok(imageCounts.every((count) => count === 5));
    await t.test("exam transcription rejects a partial page even when it contains readable text", async () => {
      await assert.rejects(transcribeExamImage("data:image/png;base64,abc"), /complete exam image/);
    });
  } finally { globalThis.fetch = originalFetch; }
});
