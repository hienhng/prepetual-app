import OpenAI from "openai";
import pLimit from "p-limit";
import pRetry from "p-retry";
import type { Question, QuestionType } from "@shared/schema";
import { randomUUID } from "crypto";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access
// without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

interface QuizGenerationParams {
  text: string;
  questionCount: number;
  questionTypes: QuestionType[];
}

export async function generateQuizQuestions(params: QuizGenerationParams): Promise<Question[]> {
  const { text, questionCount, questionTypes } = params;
  const limit = pLimit(2);

  const truncatedText = text.length > 8000 ? text.substring(0, 8000) + "..." : text;

  const questionTypeDescriptions = questionTypes.map(type => {
    switch (type) {
      case "multiple_choice":
        return "Multiple choice questions with 4 options (A, B, C, D)";
      case "true_false":
        return "True/False questions";
      case "short_answer":
        return "Short answer questions with brief 1-3 word answers";
    }
  }).join(", ");

  const prompt = `You are an expert educator. Based on the following content, generate ${questionCount} quiz questions to help students study and learn the material.

CONTENT:
${truncatedText}

REQUIREMENTS:
1. Generate exactly ${questionCount} questions
2. Use these question types: ${questionTypeDescriptions}
3. Distribute question types roughly evenly among the selected types
4. Questions should test understanding, not just memorization
5. Include an explanation for each answer
6. For multiple choice, always provide exactly 4 options labeled A, B, C, D

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "type": "multiple_choice" | "true_false" | "short_answer",
      "question": "The question text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], // only for multiple_choice
      "correctAnswer": "The correct answer text (for MC, include the letter e.g. 'A) Option 1', for T/F use 'True' or 'False')",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Respond with ONLY valid JSON, no markdown or additional text.`;

  try {
    const response = await pRetry(
      async () => {
        const completion = await openai.chat.completions.create({
          // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          model: "gpt-5",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_completion_tokens: 8192,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("No response from AI");
        }

        return content;
      },
      {
        retries: 5,
        minTimeout: 2000,
        maxTimeout: 60000,
        factor: 2,
        onFailedAttempt: (error) => {
          if (!isRateLimitError(error)) {
            throw new pRetry.AbortError(error);
          }
        },
      }
    );

    const parsed = JSON.parse(response);
    
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid AI response: missing questions array");
    }

    const questions: Question[] = [];
    
    for (const q of parsed.questions) {
      // Validate required fields
      if (!q.type || !q.question || !q.correctAnswer) {
        console.warn("Skipping malformed question:", q);
        continue;
      }
      
      // Validate question type
      if (!["multiple_choice", "true_false", "short_answer"].includes(q.type)) {
        console.warn("Skipping question with invalid type:", q.type);
        continue;
      }

      const question: Question = {
        id: randomUUID(),
        type: q.type as QuestionType,
        question: String(q.question).trim(),
        options: q.type === "multiple_choice" && Array.isArray(q.options) 
          ? q.options.map((o: any) => String(o).trim())
          : undefined,
        correctAnswer: String(q.correctAnswer).trim(),
        explanation: q.explanation ? String(q.explanation).trim() : undefined,
      };

      questions.push(question);
    }

    if (questions.length === 0) {
      throw new Error("AI failed to generate valid questions");
    }

    return questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions. Please try again.");
  }
}

export async function generateQuizTitle(text: string): Promise<string> {
  const truncatedText = text.substring(0, 500);

  try {
    const response = await pRetry(
      async () => {
        const completion = await openai.chat.completions.create({
          // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
          model: "gpt-5",
          messages: [
            {
              role: "user",
              content: `Based on this content, generate a short, descriptive title (max 6 words) for a study quiz:

${truncatedText}

Respond with ONLY the title, no quotes or additional text.`,
            },
          ],
          max_completion_tokens: 50,
        });

        return completion.choices[0]?.message?.content?.trim() || "Study Quiz";
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2,
      }
    );

    return response;
  } catch (error) {
    return "Study Quiz";
  }
}
