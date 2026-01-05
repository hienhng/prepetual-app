import OpenAI from "openai";
import pLimit from "p-limit";
import pRetry from "p-retry";
import type { Question, QuestionType, DifficultyLevel } from "@shared/schema";
import { randomUUID } from "crypto";

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
  difficulty?: DifficultyLevel;
}

export async function generateQuizQuestions(
  params: QuizGenerationParams,
): Promise<Question[]> {
  const { text, questionCount, questionTypes, difficulty = "medium" } = params;

  const truncatedText =
    text.length > 8000 ? text.substring(0, 8000) + "..." : text;

  const questionTypeDescriptions = questionTypes
    .map((type) => {
      switch (type) {
        case "multiple_choice":
          return "Multiple choice questions with 4 options (A, B, C, D)";
        case "true_false":
          return "True/False questions";
        case "short_answer":
          return "Short answer questions with brief 1-3 word answers";
      }
    })
    .join(", ");

  const difficultyDescriptions: Record<DifficultyLevel, string> = {
    easy: "simple recall and basic understanding questions that test fundamental concepts",
    medium:
      "moderate complexity questions requiring comprehension and application",
    hard: "challenging questions requiring analysis, synthesis, and deep understanding with tricky distractors",
  };

  const prompt = `You are an expert educator. Based on the following content, generate ${questionCount} ${difficulty.toUpperCase()} difficulty quiz questions to help students study and learn the material.

CONTENT:
${truncatedText}

LANGUAGE HANDLING:
- Detect the primary language of the content above (English, Vietnamese, or other)
- Generate ALL questions, options, correct answers, and explanations in the SAME language as the content
- If the content is in Vietnamese, write everything in Vietnamese
- If the content is in English, write everything in English

REQUIREMENTS:
1. Generate exactly ${questionCount} questions
2. Use these question types: ${questionTypeDescriptions}
3. Distribute question types roughly evenly among the selected types
4. DIFFICULTY LEVEL: ${difficulty.toUpperCase()} - ${difficultyDescriptions[difficulty]}
5. Include an explanation for each answer
6. For multiple choice, always provide exactly 4 options labeled A, B, C, D

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "type": "multiple_choice" | "true_false" | "short_answer",
      "question": "The question text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], // only for multiple_choice. Ensure the correct answer is randomly placed among A, B, C, and D. Avoid patterns like having the same letter as correct answer for multiple consecutive questions.
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
            throw error;
          }
        },
      },
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

      let options =
        q.type === "multiple_choice" && Array.isArray(q.options)
          ? q.options.map((o: any) => String(o).trim())
          : undefined;

      let correctAnswer = String(q.correctAnswer).trim();

      // Programmatically shuffle options to ensure maximum randomness
      if (q.type === "multiple_choice" && options && options.length > 0) {
        // Find the index of the current correct answer
        // Note: AI usually returns "A) Text" or just "Text"
        const currentCorrectAns = correctAnswer;
        const currentOptions = options;
        const correctIndex = currentOptions.findIndex(
          (o: string) =>
            o === currentCorrectAns ||
            o.split(") ")[1] === currentCorrectAns ||
            currentCorrectAns.includes(o),
        );

        if (correctIndex !== -1) {
          const correctText = currentOptions[correctIndex].replace(
            /^[A-D]\) /,
            "",
          );
          const plainOptions = currentOptions.map((o: string) =>
            o.replace(/^[A-D]\) /, ""),
          );

          // Shuffle
          for (let i = plainOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [plainOptions[i], plainOptions[j]] = [
              plainOptions[j],
              plainOptions[i],
            ];
          }

          // Re-label and find new correct
          options = plainOptions.map(
            (text: string, idx: number) =>
              `${String.fromCharCode(65 + idx)}) ${text}`,
          );
          const newCorrectIndex = plainOptions.findIndex(
            (t: string) => t === correctText,
          );
          correctAnswer = options[newCorrectIndex];
        }
      }

      const question: Question = {
        id: randomUUID(),
        type: q.type as QuestionType,
        question: String(q.question).trim(),
        options,
        correctAnswer,
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

interface ImportQuizParams {
  text: string;
}

export async function importExistingQuiz(
  params: ImportQuizParams,
): Promise<Question[]> {
  const { text } = params;

  const truncatedText =
    text.length > 8000 ? text.substring(0, 8000) + "..." : text;

  const prompt = `You are an expert educator. The following text appears to be from an existing exam, quiz, or worksheet that already contains questions with answer options.

Your task is to:
1. Parse and extract ALL existing questions from the content
2. Identify the correct answer for each question using your knowledge
3. Provide a brief explanation for why each answer is correct

CONTENT:
${truncatedText}

LANGUAGE HANDLING:
- Detect the primary language of the content above (English, Vietnamese, or other)
- Preserve the original language of the questions and options
- Write explanations in the SAME language as the content
- If the content is in Vietnamese, write explanations in Vietnamese
- If the content is in English, write explanations in English

IMPORTANT INSTRUCTIONS:
- Extract questions EXACTLY as they appear (preserving the original wording)
- For multiple choice, preserve all answer options as they appear (e.g., a, b, c, d or A, B, C, D)
- Use your knowledge to determine the correct answer - DO NOT just guess
- If a question is unclear or you cannot determine the answer confidently, still include it but note the uncertainty in the explanation
- Convert all questions to multiple_choice type since they appear to have options

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "The exact question text as it appears",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"], // Ensure the correct answer is randomly placed among the options. Avoid repetitive patterns in the position of the correct answer.
      "correctAnswer": "A) The correct option with its full text",
      "explanation": "Brief explanation of why this is the correct answer"
    }
  ]
}

Respond with ONLY valid JSON, no markdown or additional text.`;

  try {
    const response = await pRetry(
      async () => {
        const completion = await openai.chat.completions.create({
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
            throw error;
          }
        },
      },
    );

    const parsed = JSON.parse(response);

    console.log("AI import response:", JSON.stringify(parsed, null, 2));

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error(
        "No quiz questions detected in this document. Please upload a document that contains multiple choice questions.",
      );
    }

    if (parsed.questions.length === 0) {
      throw new Error(
        "No quiz questions detected in this document. Please upload a document that contains multiple choice questions.",
      );
    }

    const questions: Question[] = [];

    for (const q of parsed.questions) {
      if (!q.question || !q.correctAnswer) {
        console.warn(
          "Skipping malformed question (missing question or answer):",
          q,
        );
        continue;
      }

      const questionType =
        q.type &&
        ["multiple_choice", "true_false", "short_answer"].includes(q.type)
          ? (q.type as QuestionType)
          : "multiple_choice";

      let options =
        Array.isArray(q.options) && q.options.length > 0
          ? q.options.map((o: any) => String(o).trim())
          : undefined;

      let correctAnswer = String(q.correctAnswer).trim();

      // Programmatically shuffle options to ensure maximum randomness even for imported quizzes
      if (questionType === "multiple_choice" && options && options.length > 0) {
        const currentCorrectAns = correctAnswer;
        const currentOptions = options;
        const correctIndex = currentOptions.findIndex(
          (o: string) =>
            o === currentCorrectAns ||
            o.split(") ")[1] === currentCorrectAns ||
            currentCorrectAns.includes(o),
        );

        if (correctIndex !== -1) {
          const correctText = currentOptions[correctIndex].replace(
            /^[A-D]\) /,
            "",
          );
          const plainOptions = currentOptions.map((o: string) =>
            o.replace(/^[A-D]\) /, ""),
          );

          for (let i = plainOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [plainOptions[i], plainOptions[j]] = [
              plainOptions[j],
              plainOptions[i],
            ];
          }

          options = plainOptions.map(
            (text: string, idx: number) =>
              `${String.fromCharCode(65 + idx)}) ${text}`,
          );
          const newCorrectIndex = plainOptions.findIndex(
            (t: string) => t === correctText,
          );
          correctAnswer = options[newCorrectIndex];
        }
      }

      const question: Question = {
        id: randomUUID(),
        type: questionType,
        question: String(q.question).trim(),
        options,
        correctAnswer,
        explanation: q.explanation ? String(q.explanation).trim() : undefined,
      };

      questions.push(question);
    }

    if (questions.length === 0) {
      throw new Error(
        "No quiz questions detected in this document. Make sure you're uploading an exam paper or worksheet with multiple choice questions.",
      );
    }

    return questions;
  } catch (error: any) {
    console.error("Error importing quiz:", error);
    if (error.message && error.message.includes("No quiz questions")) {
      throw error;
    }
    throw new Error("Failed to import quiz questions. Please try again.");
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
              content: `Based on this content, generate a short, descriptive title (max 6 words) for a study quiz.

LANGUAGE: Detect the language of the content and write the title in the SAME language. If Vietnamese, write in Vietnamese. If English, write in English.

${truncatedText}

Respond with ONLY the title, no quotes or additional text.`,
            },
          ],
          max_completion_tokens: 50,
        });

        return (
          completion.choices[0]?.message?.content?.trim() || "Untitled Quiz"
        );
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 10000,
        factor: 2,
      },
    );

    return response;
  } catch (error) {
    return "Untitled Quiz";
  }
}
