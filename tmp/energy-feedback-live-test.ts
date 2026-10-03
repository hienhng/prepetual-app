import fs from "node:fs/promises";
import OpenAI from "openai";
import { createSubmittedAnswerExplainer } from "../server/submitted-answer-feedback.js";

const rows = JSON.parse(await fs.readFile("tmp/energy-feedback-cases.json", "utf8"));
const row = rows.find((item: any) => item.question.question === "Select ALL the examples that store energy:");
const client = new OpenAI({ apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY, baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL });
const transcripts: any[] = [];
const explain = createSubmittedAnswerExplainer(async (prompt, images) => {
  const model = images.length ? process.env.AI_VISION_MODEL || "qwen/qwen3.6-27b"
    : process.env.AI_VALIDATION_MODEL || process.env.AI_QUIZ_MODEL || "openai/gpt-oss-120b";
  const response = await client.chat.completions.create({ model, temperature: 0, max_tokens: 6000,
    response_format: { type: "json_object" }, messages: [{ role: "user", content: images.length
      ? [{ type: "text", text: prompt }, ...images.map(url => ({ type: "image_url" as const, image_url: { url } }))] : prompt }],
  }, { timeout: 30000, maxRetries: 0 });
  const result = JSON.parse(response.choices[0].message.content || "{}");
  const stage = prompt.startsWith("Review") ? "review" : prompt.includes("REVIEW CORRECTION REQUIREMENT") ? "correction" : "generation";
  transcripts.push({ model, stage, result });
  await fs.writeFile("tmp/energy-feedback-live-results.json", JSON.stringify(transcripts, null, 2));
  console.log(JSON.stringify({ model, stage, result }));
  return result;
});
const evidence = { sourceText: row.source_text,
  images: [...(row.source_images || []), ...(row.source_image_url ? [row.source_image_url] : [])],
  quizLanguageContext: [row.title, ...row.quiz_questions.slice(0, 8).map((q: any) => q.question)].join("\n").slice(0, 8000) };
const submissions = process.env.ENERGY_TEST_CORRECT_ONLY === "1" ? [row.question.correctAnswer]
  : [JSON.stringify(["A wooden table"]), row.question.correctAnswer];
for (const selectedAnswer of submissions) {
  try {
    const result = await explain(row.question, selectedAnswer, evidence);
    console.log(JSON.stringify({ status: "success", selectedAnswer, explanation: result.explanation }));
  } catch (error: any) {
    console.log(JSON.stringify({ status: "failure", selectedAnswer, name: error.name,
      message: error.name === "Error" || error.name === "UnverifiedAnswerError" ? error.message : "Provider request failed",
      providerStatus: error.status }));
    process.exitCode = 1;
  }
}
