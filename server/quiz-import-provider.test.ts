import assert from "node:assert/strict";
import test from "node:test";

test("import provider retries truncated output and includes every supplied image", async (t) => {
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-only";
  process.env.GEMINI_API_KEY = "test-only";
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = "http://test.invalid/v1";
  const originalFetch = globalThis.fetch;
  let calls = 0;
  let auditCalls = 0;
  let requireRecovery = false;
  let recoveryCalls = 0;
  let pageReviewText = "Câu 1. Complete question.\nCâu 2. Restored question with missing mass $4\\,\\mathrm{kg}$.";
  let pageReviewTruncated = false;
  const imageCounts: number[] = [];
  const respond = (data: unknown, reason = "stop") => new Response(JSON.stringify({ choices: [{ finish_reason: reason, message: { content: JSON.stringify(data) } }] }), { headers: { "Content-Type": "application/json" } });
  globalThis.fetch = async (_url, init) => {
    calls++;
    const body = JSON.parse(String(init?.body));
    const content = body.messages[0].content;
    imageCounts.push(content.filter((part: any) => part.type === "image_url").length);
    const prompt = content[0].text;
    if (prompt.startsWith("EXAM PAGE TRANSCRIPTION REVIEW")) {
      assert.equal(content.filter((part: any) => part.type === "image_url").length, 1);
      return respond({ transcription: pageReviewText }, pageReviewTruncated ? "length" : "stop");
    }
    if (prompt.startsWith("Transcribe ALL")) return new Response(JSON.stringify({ choices: [{ finish_reason: "length", message: { content: "1. A readable question, but the rest of this page was cut off" } }] }), { headers: { "Content-Type": "application/json" } });
    if (prompt.startsWith("Classify")) {
      const items = JSON.parse(prompt.split("\nSOURCE ITEMS:\n")[1]);
      return respond({ classifications: items.map((item: any) => ({ sourceId: item.sourceId, type: "multiple_choice" })) });
    }
    if (prompt.includes("\nITEMS:\n")) {
      if (++auditCalls === 1) return respond({ title: "Truncated", questions: [] }, "length");
      const items = JSON.parse(prompt.split("\nITEMS:\n")[1]);
      if (prompt.startsWith("Reassess")) {
        if (requireRecovery) recoveryCalls++;
        assert.equal(items.length, 1);
        assert.equal(content.filter((part: any) => part.type === "image_url").length, 5);
        if (requireRecovery) assert.equal(items[0].previousReview.reason, "Recheck the diagram layout.");
        return respond({
          questions: items.map((item: any) => ({ sourceId: item.sourceId, singleQuestion: true, type: "multiple_choice", stemBlockIds: ["b1"], optionBlockIds: [["b2"], ["b3"]], ignoredBlocks: [] })),
          answers: items.map((item: any) => ({ sourceId: item.sourceId, solution: "Rechecked the diagram and source choices.", correctOptionIndex: 1, verified: true })),
        });
      }
      if (requireRecovery) return respond({ answers: items.map((item: any) => ({ sourceId: item.sourceId, verified: false, reason: "Recheck the diagram layout." })) });
      return respond({ answers: items.map((item: any) => ({ sourceId: item.sourceId, solution: "Two is greater than one.", correctAnswer: "B", verified: true })) });
    }
    const items = JSON.parse(prompt.split("ASSIGNED SOURCE ITEMS:\n")[1].split("\n")[0]);
    return respond({ title: "Exam", category: "categories.math", questions: items.map((item: any) => ({ sourceId: item.id, question: item.text.split("\n")[0], options: ["A. One", "B. Two"], correctAnswer: "B", answerVerified: true })) });
  };
  try {
    const { importExistingQuiz, transcribeExamImage, verifyExamPageTranscription } = await import("./openai.js");
    const quiz = await importExistingQuiz({ text: "1. Which is greater?\nA. One\nB. Two\n2. Which is larger?\nA. One\nB. Two", documentImages: ["one", "two", "three", "four", "five"] });
    assert.equal(quiz.questions.length, 2);
    assert.ok(quiz.questions.every(question => !question.importReview && question.correctAnswer === "Two"));
    assert.equal(calls, 4);
    assert.ok(imageCounts.every((count) => count === 5));
    await t.test("flagged question recovery receives the original images and resolves layout and answer in one call", async () => {
      requireRecovery = true;
      const before = calls;
      const recovered = await importExistingQuiz({ text: "Câu 1. Which is greater?\nA. One\nB. Two", documentImages: ["one", "two", "three", "four", "five"] });
      assert.equal(calls - before, 3);
      assert.equal(recoveryCalls, 1);
      assert.equal(recovered.questions[0].correctAnswer, "Two");
      assert.equal(recovered.questions[0].importReview, undefined);
      requireRecovery = false;
    });
    await t.test("exam transcription rejects a partial page even when it contains readable text", async () => {
      await assert.rejects(transcribeExamImage("data:image/png;base64,abc"), /complete exam image/);
    });
    await t.test("visual reconciliation restores selectable-only questions and rejects omissions and truncation", async () => {
      const image = "data:image/png;base64,abc";
      const selectable = "Câu 1. Complete question.\nCâu 2. Question whose mass was missing from transcription.";
      const initial = "Câu 1. Complete question.";
      assert.match(await verifyExamPageTranscription(image, selectable, initial), /4/);
      pageReviewText = initial;
      await assert.rejects(verifyExamPageTranscription(image, selectable, initial), /omitted an original numbered question/);
      pageReviewText = selectable;
      pageReviewTruncated = true;
      await assert.rejects(verifyExamPageTranscription(image, selectable, initial), /complete exam page transcription/);
    });
  } finally { globalThis.fetch = originalFetch; }
});
