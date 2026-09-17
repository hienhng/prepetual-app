import assert from "node:assert/strict";
import { detectQuizSettingsFromPrompt } from "../server/openai.js";

const cases = [
  ["Tạo mười lăm câu hỏi khó về định luật Newton", 15, "hard"],
  ["Tao cho toi muoi hai cau hoi de ve sinh hoc", 12, "easy"],
  ["Crea diecisiete preguntas difíciles sobre física", 17, "hard"],
  ["Prépare huit questions faciles sur la biologie", 8, "easy"],
  ["Erstelle dreizehn mittelschwere Fragen über Chemie", 13, "medium"],
  ["请出十五道关于牛顿定律的高难度题目", 15, "hard"],
  ["生物学について簡単な問題を十二問作ってください", 12, "easy"],
  ["물리학에 관한 어려운 문제 열네 개를 만들어 줘", 14, "hard"],
  ["أنشئ ١٦ سؤالاً صعباً عن الفيزياء", 16, "hard"],
  ["जीव विज्ञान पर १२ आसान प्रश्न बनाओ", 12, "easy"],
  ["สร้างคำถามยากเกี่ยวกับฟิสิกส์จำนวนสิบห้าข้อ", 15, "hard"],
  ["Составь одиннадцать простых вопросов по биологии", 11, "easy"],
  ["Crie dezoito perguntas difíceis sobre química", 18, "hard"],
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
