import assert from "node:assert/strict";
import { detectQuizSettingsFromPrompt } from "../server/openai.js";

const cases = [
  ["Make me 15 difficult questions focusing on Newton's laws and conceptual reasoning", 15, "hard"],
  ["Give me seven beginner questions about photosynthesis", 7, "easy"],
  ["I'd like a dozen challenging questions about probability", 12, "hard"],
  ["Five questions on forces and seven on motion, intermediate difficulty", 12, "medium"],
  ["Make 15 hard questions. Actually, make that 8 easy questions.", 8, "easy"],
  ["Tạo cho tôi 9 câu hỏi khó về lịch sử Việt Nam", 9, "hard"],
  ["Quiz me on World War 2 for grade 8", 10, "medium"],
  ["Create 18 questions on algebra", 18, "medium"],
  ["Create twenty-five advanced questions about biology", 20, "hard"],
] as const;
for (const [prompt, questionCount, difficulty] of cases) {
  try {
    const actual = await detectQuizSettingsFromPrompt(prompt);
    assert.equal(actual.questionCount, questionCount);
    assert.equal(actual.difficulty, difficulty);
    console.log("PASS", JSON.stringify({ prompt, ...actual }));
  } catch (error) {
    console.error("FAIL", prompt, error instanceof Error ? error.message : "Detection failed");
    process.exitCode = 1;
  }
}
