import OpenAI from "openai";
import pLimit from "p-limit";
import pRetry from "p-retry";
import type { Question, QuestionType, DifficultyLevel, QuizCategory } from "@shared/schema";
import { QUIZ_CATEGORIES } from "@shared/schema";
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
  documentImages?: string[];
}

export async function generateQuizQuestions(
  params: QuizGenerationParams,
): Promise<{ questions: Question[]; title: string; category: QuizCategory }> {
  const { text, questionCount, questionTypes, difficulty = "medium", documentImages = [] } = params;

  const hasImages = documentImages.length > 0;
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

  const categoryList = QUIZ_CATEGORIES.join(", ");
  
  const prompt = `You are an expert educator. Based on the following content, generate ${questionCount} ${difficulty.toUpperCase()} difficulty quiz questions to help students study and learn the material. Also, generate a short, descriptive title (max 6 words) for this quiz and categorize it.

CONTENT:
${truncatedText}

LANGUAGE HANDLING:
- Detect the primary language of the content above (English, Vietnamese, or other)
- Generate ALL questions, options, correct answers, explanations, and the QUIZ TITLE in the SAME language as the content
- If the content is in Vietnamese, write everything in Vietnamese
- If the content is in English, write everything in English

REQUIREMENTS:
1. Generate exactly ${questionCount} questions
2. Use these question types: ${questionTypeDescriptions}
3. Distribute question types roughly evenly among the selected types
4. DIFFICULTY LEVEL: ${difficulty.toUpperCase()} - ${difficultyDescriptions[difficulty]}
5. Include an explanation for why the correct answer is right
6. For multiple choice, include explanations for why EACH wrong answer is incorrect
7. For multiple choice, always provide exactly 4 options
8. CATEGORY: Assign exactly ONE category from: ${categoryList}
   - Math: arithmetic, algebra, geometry, calculus, statistics, etc.
   - English: grammar, literature, writing, reading comprehension, vocabulary (English language)
   - Science: biology, chemistry, physics, earth science, etc.
   - Social Studies: history, geography, civics, economics, etc.
   - Global Languages: foreign languages other than English (Spanish, French, Vietnamese, Chinese, etc.)
   - Others/General: anything that doesn't fit the above categories

CRITICAL RULES:
- NEVER use placeholder text like "Option 1", "Option 2", "correctAnswer", "Wrong Option", etc. in actual options
- Do not contain any prefix like "A) ", "1. ", "a. ", etc. in the options or correct answer. Provide ONLY the answer text.
- All options must be real, meaningful answers related to the question
- The wrongAnswerExplanations keys must be the EXACT text of the wrong options (without any prefix)

OUTPUT FORMAT (JSON):
{
  "title": "A short descriptive title for the quiz",
  "category": "One of: ${categoryList}",
  "questions": [
    {
      "type": "multiple_choice" | "true_false" | "short_answer",
      "question": "The question text",
      "options": ["Actual answer A", "Actual answer B", "Actual answer C", "Actual answer D"], // 4 real answers, NO placeholders, NO prefixes like "A) " or "1. ". IMPORTANT: Ensure options are of roughly similar length and grammatical structure to avoid making the correct answer obvious.
      "correctAnswer": "The exact correct option text (without any prefix)",
      "explanation": "Brief explanation of why this is correct",
      "wrongAnswerExplanations": { // Keys must be EXACT wrong option text from options array
        "Actual answer A": "Why this specific option is incorrect",
        "Actual answer C": "Why this specific option is incorrect",
        "Actual answer D": "Why this specific option is incorrect"
      }
    }
  ]
}

Respond with ONLY valid JSON, no markdown or additional text.`;

  const visionPrompt = hasImages ? `You are an expert educator. Based on the following document content AND the attached images/diagrams/charts from the document, generate ${questionCount} ${difficulty.toUpperCase()} difficulty quiz questions to help students study and learn the material.

IMPORTANT: Carefully analyze ALL attached images. These may contain:
- Charts, graphs, and diagrams with important data
- Illustrations and figures that explain concepts
- Tables with information
- Screenshots or visual examples

Generate questions that test understanding of BOTH the text content AND the visual content from the images.

TEXT CONTENT:
${truncatedText}

LANGUAGE HANDLING:
- Detect the primary language of the content above (English, Vietnamese, or other)
- Generate ALL questions, options, correct answers, explanations, and the QUIZ TITLE in the SAME language as the content
- If the content is in Vietnamese, write everything in Vietnamese
- If the content is in English, write everything in English

REQUIREMENTS:
1. Generate exactly ${questionCount} questions
2. Use these question types: ${questionTypeDescriptions}
3. Distribute question types roughly evenly among the selected types
4. DIFFICULTY LEVEL: ${difficulty.toUpperCase()} - ${difficultyDescriptions[difficulty]}
5. Include an explanation for why the correct answer is right
6. For multiple choice, include explanations for why EACH wrong answer is incorrect
7. For multiple choice, always provide exactly 4 options labeled A, B, C, D
8. At least 30% of questions should be based on or reference the visual content (charts, diagrams, images)
9. For questions that reference a specific image, include the imageIndex (0-based index of the attached image)
10. CATEGORY: Assign exactly ONE category from: ${categoryList}
   - Math: arithmetic, algebra, geometry, calculus, statistics, etc.
   - English: grammar, literature, writing, reading comprehension, vocabulary (English language)
   - Science: biology, chemistry, physics, earth science, etc.
   - Social Studies: history, geography, civics, economics, etc.
   - Global Languages: foreign languages other than English (Spanish, French, Vietnamese, Chinese, etc.)
   - Others/General: anything that doesn't fit the above categories

CRITICAL RULES:
- NEVER use placeholder text like "Option 1", "Option 2", "correctAnswer", "Wrong Option", etc. in actual options
- Do not contain any prefix like "A) ", "1. ", "a. ", etc. in the options or correct answer. Provide ONLY the answer text.
- All options must be real, meaningful answers related to the question
- The wrongAnswerExplanations keys must be the EXACT text of the wrong options (without any prefix)

OUTPUT FORMAT (JSON):
{
  "title": "A short descriptive title for the quiz",
  "category": "One of: ${categoryList}",
  "questions": [
    {
      "type": "multiple_choice" | "true_false" | "short_answer",
      "question": "The question text",
      "options": ["Actual answer A", "Actual answer B", "Actual answer C", "Actual answer D"], // 4 real answers, NO placeholders, NO prefixes like "A) " or "1. ". IMPORTANT: Ensure options are of roughly similar length and grammatical structure to avoid making the correct answer obvious.
      "correctAnswer": "The exact correct option text (without any prefix)",
      "explanation": "Brief explanation of why this is correct",
      "wrongAnswerExplanations": { // Keys must be EXACT wrong option text from options array
        "Actual answer A": "Why this specific option is incorrect",
        "Actual answer C": "Why this specific option is incorrect",
        "Actual answer D": "Why this specific option is incorrect"
      },
      "imageIndex": 0 // Optional: 0-based index of the attached image this question references (only if question is about a specific image)
    }
  ]
}

Respond with ONLY valid JSON, no markdown or additional text.` : prompt;

  try {
    const response = await pRetry(
      async () => {
        let messages: any[];
        
        if (hasImages) {
          const imageContent = documentImages.slice(0, 6).map(imageUrl => ({
            type: "image_url" as const,
            image_url: { url: imageUrl, detail: "high" as const }
          }));
          
          messages = [{
            role: "user",
            content: [
              { type: "text", text: visionPrompt },
              ...imageContent
            ]
          }];
          
          console.log(`Generating quiz with ${imageContent.length} images using vision model`);
        } else {
          messages = [{ role: "user", content: prompt }];
        }
        
        // Retry loop for empty responses
        let content: string | null = null;
        let emptyRetries = 0;
        const maxEmptyRetries = 3;
        
        while (!content && emptyRetries < maxEmptyRetries) {
          const completion = await openai.chat.completions.create({
            model: hasImages ? "gpt-4.1" : "gpt-5",
            messages,
            response_format: { type: "json_object" },
            max_completion_tokens: 12000,
          });

          content = completion.choices[0]?.message?.content;
          
          if (!content) {
            emptyRetries++;
            console.error(`Empty AI response for quiz generation (attempt ${emptyRetries}/${maxEmptyRetries}), retrying...`);
            if (emptyRetries < maxEmptyRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000 * emptyRetries));
            }
          } else {
            console.log("Quiz generation AI response received successfully");
          }
        }
        
        if (!content) {
          throw new Error("No response from AI after multiple attempts");
        }

        return content;
      },
      {
        retries: 3,
        minTimeout: 3000,
        maxTimeout: 60000,
        factor: 2,
        onFailedAttempt: (error: any) => {
          console.log(`Quiz generation rate limit retry (attempt ${error.attemptNumber}): ${error.message || error}`);
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

    const title = parsed.title?.trim() || "Untitled Quiz";
    const rawCategory = parsed.category?.trim() || "Others/General";
    const category: QuizCategory = QUIZ_CATEGORIES.includes(rawCategory) ? rawCategory : "Others/General";
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
          options = plainOptions;
          const newCorrectIndex = plainOptions.findIndex(
            (t: string) => t === correctText,
          );
          correctAnswer = options[newCorrectIndex];
        }
      }

      // Process wrong answer explanations if present
      let wrongAnswerExplanations: Record<string, string> | undefined;
      if (q.type === "multiple_choice" && q.wrongAnswerExplanations && typeof q.wrongAnswerExplanations === "object") {
        wrongAnswerExplanations = {};
        for (const [key, value] of Object.entries(q.wrongAnswerExplanations)) {
          if (typeof value === "string") {
            wrongAnswerExplanations[String(key).trim()] = String(value).trim();
          }
        }
      }

      // Map imageIndex to actual image URL if present
      let imageUrl: string | undefined;
      if (typeof q.imageIndex === "number" && q.imageIndex >= 0 && q.imageIndex < documentImages.length) {
        imageUrl = documentImages[q.imageIndex];
      }

      const question: Question = {
        id: randomUUID(),
        type: q.type as QuestionType,
        question: String(q.question).trim(),
        options,
        correctAnswer,
        explanation: q.explanation ? String(q.explanation).trim() : undefined,
        wrongAnswerExplanations,
        imageUrl,
      };

      questions.push(question);
    }

    if (questions.length === 0) {
      throw new Error("AI failed to generate valid questions");
    }

    return { questions, title, category };
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions. Please try again.");
  }
}

interface ImportQuizParams {
  text: string;
  documentImages?: string[];
}

export async function importExistingQuiz(
  params: ImportQuizParams,
): Promise<{ questions: Question[]; title: string }> {
  const { text, documentImages = [] } = params;
  
  const hasImages = documentImages.length > 0;
  const truncatedText =
    text.length > 8000 ? text.substring(0, 8000) + "..." : text;

  const prompt = `You are an expert educator. The following text appears to be from an existing exam, quiz, or worksheet that already contains questions with answer options.

Your task is to:
1. Parse and extract ALL existing questions from the content
2. Identify the correct answer for each question using your knowledge
3. Provide a brief explanation for why each answer is correct
4. For each WRONG answer option, provide a brief explanation of why it is incorrect
5. Generate a short, descriptive title (max 6 words) for this quiz.

CONTENT:
${truncatedText}

LANGUAGE HANDLING:
- Detect the primary language of the content above (English, Vietnamese, or other)
- Preserve the original language of the questions and options
- Write explanations and the QUIZ TITLE in the SAME language as the content
- If the content is in Vietnamese, write explanations and title in Vietnamese
- If the content is in English, write explanations and title in English

IMPORTANT INSTRUCTIONS:
- Extract questions EXACTLY as they appear (preserving the original wording)
- For multiple choice, preserve all answer options as they appear (e.g., a, b, c, d or A, B, C, D)
- Use your knowledge to determine the correct answer - DO NOT just guess
- If a question is unclear or you cannot determine the answer confidently, still include it but note the uncertainty in the explanation
- Convert all questions to multiple_choice type since they appear to have options
- The wrongAnswerExplanations keys must be the EXACT text of the wrong options (without any prefix)

OUTPUT FORMAT (JSON):
{
  "title": "A short descriptive title for the quiz",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "The exact question text as it appears",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"], // Extract exactly as they appear, but REMOVE any prefixes like "A) ", "1. ", "a. ", etc. from the start of each option.
      "correctAnswer": "The exact full text of the correct option (without any prefix)",
      "explanation": "Brief explanation of why this is the correct answer",
      "wrongAnswerExplanations": {
        "Option 1": "Why this option is incorrect",
        "Option 2": "Why this option is incorrect"
      }
    }
  ]
}

Respond with ONLY valid JSON, no markdown or additional text.`;

  const visionPrompt = hasImages ? `You are an expert educator. The following content appears to be from an existing exam, quiz, or worksheet that already contains questions with answer options. The content includes IMAGES that may contain questions, diagrams, or visual content that are part of the quiz.

Your task is to:
1. Parse and extract ALL existing questions from BOTH the text content AND the attached images
2. Questions may appear in the images - extract those too
3. Identify the correct answer for each question using your knowledge
4. Provide a brief explanation for why each answer is correct
5. For each WRONG answer option, provide a brief explanation of why it is incorrect
6. Generate a short, descriptive title (max 6 words) for this quiz.

TEXT CONTENT:
${truncatedText}

LANGUAGE HANDLING:
- Detect the primary language of the content (English, Vietnamese, or other)
- Preserve the original language of the questions and options
- Write explanations and the QUIZ TITLE in the SAME language as the content

IMPORTANT INSTRUCTIONS:
- Extract questions EXACTLY as they appear (from both text and images)
- For multiple choice, preserve all answer options as they appear
- Use your knowledge to determine the correct answer - DO NOT just guess
- Convert all questions to multiple_choice type since they appear to have options
- The wrongAnswerExplanations keys must be the EXACT text of the wrong options (without any prefix)

OUTPUT FORMAT (JSON):
{
  "title": "A short descriptive title for the quiz",
  "questions": [
    {
      "type": "multiple_choice",
      "question": "The exact question text as it appears",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"], // Extract exactly as they appear, but REMOVE any prefixes like "A) ", "1. ", "a. ", etc. from the start of each option.
      "correctAnswer": "The exact full text of the correct option (without any prefix)",
      "explanation": "Brief explanation of why this is the correct answer",
      "wrongAnswerExplanations": {
        "Option 1": "Why this option is incorrect",
        "Option 2": "Why this option is incorrect"
      }
    }
  ]
}

Respond with ONLY valid JSON, no markdown or additional text.` : prompt;

  try {
    const response = await pRetry(
      async () => {
        let messages: any[];
        
        if (hasImages) {
          const imageContent = documentImages.slice(0, 6).map(imageUrl => ({
            type: "image_url" as const,
            image_url: { url: imageUrl, detail: "high" as const }
          }));
          
          messages = [{
            role: "user",
            content: [
              { type: "text", text: visionPrompt },
              ...imageContent
            ]
          }];
          
          console.log(`Importing quiz with ${imageContent.length} images using vision model`);
        } else {
          messages = [{ role: "user", content: prompt }];
        }
        
        const completion = await openai.chat.completions.create({
          model: hasImages ? "gpt-4.1" : "gpt-5",
          messages,
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

    const title = parsed.title?.trim() || "Imported Quiz";
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

          options = plainOptions;
          const newCorrectIndex = plainOptions.findIndex(
            (t: string) => t === correctText,
          );
          correctAnswer = options[newCorrectIndex];
        }
      }

      // Process wrongAnswerExplanations for imported quizzes
      let wrongAnswerExplanations: Record<string, string> | undefined;
      if (questionType === "multiple_choice" && q.wrongAnswerExplanations && typeof q.wrongAnswerExplanations === "object") {
        wrongAnswerExplanations = {};
        for (const [key, value] of Object.entries(q.wrongAnswerExplanations)) {
          if (value && typeof value === "string") {
            wrongAnswerExplanations[String(key).trim()] = String(value).trim();
          }
        }
      }

      const question: Question = {
        id: randomUUID(),
        type: questionType,
        question: String(q.question).trim(),
        options,
        correctAnswer,
        explanation: q.explanation ? String(q.explanation).trim() : undefined,
        wrongAnswerExplanations,
      };

      questions.push(question);
    }

    if (questions.length === 0) {
      throw new Error(
        "No quiz questions detected in this document. Make sure you're uploading an exam paper or worksheet with multiple choice questions.",
      );
    }

    return { questions, title };
  } catch (error: any) {
    console.error("Error importing quiz:", error);
    if (error.message && error.message.includes("No quiz questions")) {
      throw error;
    }
    throw new Error("Failed to import quiz questions. Please try again.");
  }
}

