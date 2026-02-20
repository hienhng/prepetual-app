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

export type ProgressCallback = (step: string, progress: number, message: string) => void;

export type ImageClassification = {
  url: string;
  hasIllustrations: boolean;
  description?: string;
};

export async function classifyImages(
  imageUrls: string[],
  onProgress?: ProgressCallback,
  isImageOnlyMode: boolean = false
): Promise<ImageClassification[]> {
  if (imageUrls.length === 0) {
    return [];
  }

  onProgress?.("classifying", 15, "Analyzing image content types...");

  const classificationPrompt = `Analyze each of the following images and classify them.

For EACH image, determine if it contains:
- ILLUSTRATIONS: Charts, graphs, diagrams, drawings, photographs, figures, scientific illustrations, maps, flowcharts, or any visual/graphical content beyond just text
- TEXT-ONLY: Pages that contain ONLY text content (typed or handwritten text, worksheets with just text questions, text documents, notes)

OUTPUT FORMAT (JSON):
{
  "images": [
    {
      "index": 0,
      "hasIllustrations": true or false,
      "description": "Brief description of what the image contains"
    }
  ]
}

Be strict: If an image contains ANY diagrams, charts, graphs, figures, drawings, or visual elements (other than decorative borders), classify it as having illustrations.
Only classify as text-only if the image is purely text content with no visual/graphical elements.

Respond with ONLY valid JSON, no markdown or additional text.`;

  try {
    // Match the 6-image limit used in question generation to ensure consistent classification
    const imagesToClassify = imageUrls.slice(0, 6);
    const imageContent = imagesToClassify.map(imageUrl => ({
      type: "image_url" as const,
      image_url: { url: imageUrl, detail: "low" as const }
    }));

    const response = await pRetry(
      async () => {
        const completion = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: classificationPrompt },
              ...imageContent
            ]
          }],
          response_format: { type: "json_object" },
          max_completion_tokens: 2000,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
          throw new Error("Empty response from AI for image classification");
        }
        return content;
      },
      {
        retries: 2,
        minTimeout: 2000,
        maxTimeout: 10000,
        onFailedAttempt: (error: any) => {
          console.log(`Image classification retry (attempt ${error.attemptNumber}): ${error.message || error}`);
          if (!isRateLimitError(error)) {
            throw error;
          }
        },
      }
    );

    const parsed = JSON.parse(response);
    
    if (!parsed.images || !Array.isArray(parsed.images)) {
      // Fallback behavior depends on mode:
      // - Image-only mode: treat as text-only (conservative, won't embed but will analyze)
      // - Mixed mode: treat as illustrations (include all, fallback to previous behavior)
      console.warn(`Invalid classification response, defaulting to ${isImageOnlyMode ? 'text-only' : 'illustrations'}`);
      return imageUrls.slice(0, 6).map(url => ({ url, hasIllustrations: !isImageOnlyMode }));
    }

    // Only classify the first 6 images (matches the generation limit)
    const classifiedUrls = imageUrls.slice(0, 6);
    const results: ImageClassification[] = classifiedUrls.map((url, index) => {
      const classification = parsed.images.find((img: any) => img.index === index);
      // Default for missing classifications depends on mode:
      // - Image-only mode: default to text-only (conservative)
      // - Mixed mode: default to illustrations (include, safe fallback)
      const defaultValue = !isImageOnlyMode;
      return {
        url,
        hasIllustrations: classification?.hasIllustrations ?? defaultValue,
        description: classification?.description,
      };
    });

    const illustrationCount = results.filter(r => r.hasIllustrations).length;
    const textOnlyCount = results.filter(r => !r.hasIllustrations).length;
    console.log(`Image classification complete: ${illustrationCount} with illustrations, ${textOnlyCount} text-only`);

    return results;
  } catch (error) {
    // Fallback behavior depends on mode (same as invalid response)
    console.error("Error classifying images:", error);
    return imageUrls.slice(0, 6).map(url => ({ url, hasIllustrations: !isImageOnlyMode }));
  }
}

interface QuizGenerationParams {
  text: string;
  questionCount: number;
  questionTypes: QuestionType[];
  difficulty?: DifficultyLevel;
  documentImages?: string[];
  onProgress?: ProgressCallback;
  isImageOnly?: boolean;
}

export async function generateQuizQuestions(
  params: QuizGenerationParams,
): Promise<{ questions: Question[]; title: string; category: QuizCategory }> {
  const { text, questionCount, questionTypes, difficulty = "medium", documentImages = [], onProgress, isImageOnly = false } = params;

  const hasImages = documentImages.length > 0;
  
  // Step 1: Reading material
  onProgress?.("reading", 10, "Reading your study material...");
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
  
  const prompt = `You are an expert educator and subject-matter specialist. Based on the following content, generate ${questionCount} ${difficulty.toUpperCase()} difficulty quiz questions to help students study and learn the material. Also, generate a short, descriptive title (max 6 words) for this quiz and categorize it.

CONTENT:
${truncatedText}

LANGUAGE HANDLING:
- Detect the primary language of the content above (English, Vietnamese, or other)
- Generate ALL questions, options, correct answers, explanations, and the QUIZ TITLE in the SAME language as the content
- If the content is in Vietnamese, write everything in Vietnamese
- If the content is in English, write everything in English

REQUIREMENTS:
1. Generate exactly ${questionCount} questions
2. ONLY use these question types: ${questionTypeDescriptions}
3. Do NOT generate any question type that is not listed above. If only one type is specified, ALL questions MUST be that type.
4. Distribute question types roughly evenly among the selected types
5. DIFFICULTY LEVEL: ${difficulty.toUpperCase()} - ${difficultyDescriptions[difficulty]}
6. Include an explanation for why the correct answer is right
7. For multiple choice, include explanations for why EACH wrong answer is incorrect
8. For multiple choice, always provide exactly 4 options
9. CATEGORY: Assign exactly ONE category from: ${categoryList}
   - Math: arithmetic, algebra, geometry, calculus, statistics, etc.
   - English: grammar, literature, writing, reading comprehension, vocabulary (English language)
   - Science: biology, chemistry, physics, earth science, etc.
   - Social Studies: history, geography, civics, economics, etc.
   - Global Languages: foreign languages other than English (Spanish, French, Vietnamese, Chinese, etc.)
   - Others/General: anything that doesn't fit the above categories

FACTUAL ACCURACY AND SELF-CONSISTENCY (HIGHEST PRIORITY - FOLLOW STRICTLY):
- Every correct answer MUST be verifiably, objectively correct based on the source content and established knowledge
- If the source content contains a factual claim, use it as the basis for the correct answer
- For math/science: work through all calculations, unit conversions, and formulas step by step FIRST, arrive at the numerical result, THEN set the correctAnswer to the option that matches your calculated result
- SELF-CHECK (MANDATORY): After writing each question, re-read your own explanation. The value/conclusion stated in the explanation MUST match the correctAnswer field EXACTLY. If your explanation says the answer is "0.05kg" then correctAnswer MUST be "0,05kg" or "0.05kg" — NEVER a different value like "5kg". Fix any mismatch before moving to the next question.
- For true/false questions: make sure the statement is UNAMBIGUOUSLY true or false — avoid statements that are partially true or context-dependent
- For short answer questions: ensure the expected answer is the most standard, widely-accepted answer — not an obscure or ambiguous phrasing
- NEVER set a wrong answer as the correct answer. If you are unsure about the correct answer, use the most defensible and commonly accepted answer
- Each wrong option must be clearly and definitively wrong — not a "close second" or debatable alternative
- The explanation must logically and clearly justify why the correct answer is right and why each wrong answer is wrong
- wrongAnswerExplanations: for EACH wrong option, explain specifically why that value is wrong (e.g., "This is off by a factor of 100 due to a unit conversion error"). Do NOT just restate the correct answer — explain the specific mistake that would lead someone to pick that wrong option.

CRITICAL RULES:
- NEVER use placeholder text like "Option 1", "Option 2", "correctAnswer", "Wrong Option", etc. in actual options
- Do not contain any prefix like "A) ", "1. ", "a. ", etc. in the options or correct answer. Provide ONLY the answer text.
- All options must be real, meaningful answers related to the question
- The wrongAnswerExplanations keys must be the EXACT text of the wrong options (without any prefix)

ANSWER LENGTH BALANCING (EXTREMELY IMPORTANT - FOLLOW STRICTLY):
- The correct answer must NOT be noticeably longer or more detailed than wrong answers
- ALL four options MUST have similar word counts (within 2-3 words of each other)
- If the correct answer naturally requires more detail, ADD similar detail to wrong answers to match
- If the correct answer is short (1-3 words), keep ALL options short (1-3 words)
- If the correct answer is medium (4-8 words), make ALL options medium length
- If the correct answer is long (9+ words), make ALL options similarly long
- NEVER make the correct answer stand out by being the only "complete" or "detailed" option
- Wrong answers should be equally plausible and well-formed, not obviously wrong or shorter
- Randomize which position (1st, 2nd, 3rd, or 4th) contains the correct answer - do NOT always put it first or last

OUTPUT FORMAT (JSON):
{
  "title": "A short descriptive title for the quiz",
  "category": "One of: ${categoryList}",
  "questions": [
    {
      "type": "multiple_choice" | "true_false" | "short_answer",
      "question": "The question text",
      "options": ["Option with similar length", "Option with similar length", "Option with similar length", "Option with similar length"], // 4 plausible answers with MATCHING LENGTHS. NO placeholders, NO prefixes.
      "correctAnswer": "The exact correct option text (without any prefix)",
      "explanation": "Brief explanation of why this is correct",
      "wrongAnswerExplanations": {
        "Wrong option 1 text": "Why this specific option is incorrect",
        "Wrong option 2 text": "Why this specific option is incorrect",
        "Wrong option 3 text": "Why this specific option is incorrect"
      }
    }
  ]
}

Respond with ONLY valid JSON, no markdown or additional text.`;

  const visionPrompt = hasImages ? `You are an expert educator and subject-matter specialist. Based on the following document content AND the attached images/diagrams/charts from the document, generate ${questionCount} ${difficulty.toUpperCase()} difficulty quiz questions to help students study and learn the material.

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
2. ONLY use these question types: ${questionTypeDescriptions}
3. Do NOT generate any question type that is not listed above. If only one type is specified, ALL questions MUST be that type.
4. Distribute question types roughly evenly among the selected types
5. DIFFICULTY LEVEL: ${difficulty.toUpperCase()} - ${difficultyDescriptions[difficulty]}
6. Include an explanation for why the correct answer is right
7. For multiple choice, include explanations for why EACH wrong answer is incorrect
8. For multiple choice, always provide exactly 4 options labeled A, B, C, D
9. At least 30% of questions should be based on or reference the visual content (charts, diagrams, images)
10. For questions that reference a specific image, include the imageIndex (0-based index of the attached image)
11. CATEGORY: Assign exactly ONE category from: ${categoryList}
   - Math: arithmetic, algebra, geometry, calculus, statistics, etc.
   - English: grammar, literature, writing, reading comprehension, vocabulary (English language)
   - Science: biology, chemistry, physics, earth science, etc.
   - Social Studies: history, geography, civics, economics, etc.
   - Global Languages: foreign languages other than English (Spanish, French, Vietnamese, Chinese, etc.)
   - Others/General: anything that doesn't fit the above categories

FACTUAL ACCURACY AND SELF-CONSISTENCY (HIGHEST PRIORITY - FOLLOW STRICTLY):
- Every correct answer MUST be verifiably, objectively correct based on the source content and established knowledge
- If the source content contains a factual claim, use it as the basis for the correct answer
- For math/science: work through all calculations, unit conversions, and formulas step by step FIRST, arrive at the numerical result, THEN set the correctAnswer to the option that matches your calculated result
- SELF-CHECK (MANDATORY): After writing each question, re-read your own explanation. The value/conclusion stated in the explanation MUST match the correctAnswer field EXACTLY. If your explanation says the answer is "0.05kg" then correctAnswer MUST be "0,05kg" or "0.05kg" — NEVER a different value like "5kg". Fix any mismatch before moving to the next question.
- For true/false questions: make sure the statement is UNAMBIGUOUSLY true or false — avoid statements that are partially true or context-dependent
- For short answer questions: ensure the expected answer is the most standard, widely-accepted answer — not an obscure or ambiguous phrasing
- NEVER set a wrong answer as the correct answer. If you are unsure about the correct answer, use the most defensible and commonly accepted answer
- Each wrong option must be clearly and definitively wrong — not a "close second" or debatable alternative
- The explanation must logically and clearly justify why the correct answer is right and why each wrong answer is wrong
- wrongAnswerExplanations: for EACH wrong option, explain specifically why that value is wrong (e.g., "This is off by a factor of 100 due to a unit conversion error"). Do NOT just restate the correct answer — explain the specific mistake that would lead someone to pick that wrong option.

CRITICAL RULES:
- NEVER use placeholder text like "Option 1", "Option 2", "correctAnswer", "Wrong Option", etc. in actual options
- Do not contain any prefix like "A) ", "1. ", "a. ", etc. in the options or correct answer. Provide ONLY the answer text.
- All options must be real, meaningful answers related to the question
- The wrongAnswerExplanations keys must be the EXACT text of the wrong options (without any prefix)

ANSWER LENGTH BALANCING (EXTREMELY IMPORTANT - FOLLOW STRICTLY):
- The correct answer must NOT be noticeably longer or more detailed than wrong answers
- ALL four options MUST have similar word counts (within 2-3 words of each other)
- If the correct answer naturally requires more detail, ADD similar detail to wrong answers to match
- If the correct answer is short (1-3 words), keep ALL options short (1-3 words)
- If the correct answer is medium (4-8 words), make ALL options medium length
- If the correct answer is long (9+ words), make ALL options similarly long
- NEVER make the correct answer stand out by being the only "complete" or "detailed" option
- Wrong answers should be equally plausible and well-formed, not obviously wrong or shorter
- Randomize which position (1st, 2nd, 3rd, or 4th) contains the correct answer - do NOT always put it first or last

OUTPUT FORMAT (JSON):
{
  "title": "A short descriptive title for the quiz",
  "category": "One of: ${categoryList}",
  "questions": [
    {
      "type": "multiple_choice" | "true_false" | "short_answer",
      "question": "The question text",
      "options": ["Option with similar length", "Option with similar length", "Option with similar length", "Option with similar length"], // 4 plausible answers with MATCHING LENGTHS. NO placeholders, NO prefixes.
      "correctAnswer": "The exact correct option text (without any prefix)",
      "explanation": "Brief explanation of why this is correct",
      "wrongAnswerExplanations": {
        "Wrong option 1 text": "Why this specific option is incorrect",
        "Wrong option 2 text": "Why this specific option is incorrect",
        "Wrong option 3 text": "Why this specific option is incorrect"
      },
      "imageIndex": 0 // Optional: 0-based index of the attached image this question references (only if question is about a specific image)
    }
  ]
}

Respond with ONLY valid JSON, no markdown or additional text.` : prompt;

  // Special prompt for image-only uploads (no text content)
  const imageOnlyPrompt = `You are an expert educator and subject-matter specialist. Analyze the attached images carefully and generate ${questionCount} ${difficulty.toUpperCase()} difficulty quiz questions based ENTIRELY on what you see in the images.

IMPORTANT: These are study materials uploaded as images. They may contain:
- Study sheets, worksheets, or exam papers
- Charts, graphs, diagrams, and illustrations
- Text within images that should be read and understood
- Educational content in any language

Your task is to:
1. Carefully analyze ALL visual content in the attached images
2. Read and understand any text visible within the images
3. Generate questions that test understanding of the material shown

LANGUAGE HANDLING:
- Detect the primary language visible in the images
- Generate ALL questions, options, correct answers, explanations, and the QUIZ TITLE in the SAME language as the content
- If the content is in Vietnamese, write everything in Vietnamese
- If the content is in English, write everything in English

REQUIREMENTS:
1. Generate exactly ${questionCount} questions
2. ONLY use these question types: ${questionTypeDescriptions}
3. Do NOT generate any question type that is not listed above. If only one type is specified, ALL questions MUST be that type.
4. Distribute question types roughly evenly among the selected types
5. DIFFICULTY LEVEL: ${difficulty.toUpperCase()} - ${difficultyDescriptions[difficulty]}
6. Include an explanation for why the correct answer is right
7. For multiple choice, include explanations for why EACH wrong answer is incorrect
8. For multiple choice, always provide exactly 4 options
9. ALL questions should be based on the visual content
10. For questions that reference a specific image, include the imageIndex (0-based index of the attached image)
11. CATEGORY: Assign exactly ONE category from: ${categoryList}
   - Math: arithmetic, algebra, geometry, calculus, statistics, etc.
   - English: grammar, literature, writing, reading comprehension, vocabulary (English language)
   - Science: biology, chemistry, physics, earth science, etc.
   - Social Studies: history, geography, civics, economics, etc.
   - Global Languages: foreign languages other than English (Spanish, French, Vietnamese, Chinese, etc.)
   - Others/General: anything that doesn't fit the above categories

FACTUAL ACCURACY AND SELF-CONSISTENCY (HIGHEST PRIORITY - FOLLOW STRICTLY):
- Every correct answer MUST be verifiably, objectively correct based on the source content and established knowledge
- If the source content contains a factual claim, use it as the basis for the correct answer
- For math/science: work through all calculations, unit conversions, and formulas step by step FIRST, arrive at the numerical result, THEN set the correctAnswer to the option that matches your calculated result
- SELF-CHECK (MANDATORY): After writing each question, re-read your own explanation. The value/conclusion stated in the explanation MUST match the correctAnswer field EXACTLY. If your explanation says the answer is "0.05kg" then correctAnswer MUST be "0,05kg" or "0.05kg" — NEVER a different value like "5kg". Fix any mismatch before moving to the next question.
- For true/false questions: make sure the statement is UNAMBIGUOUSLY true or false — avoid statements that are partially true or context-dependent
- For short answer questions: ensure the expected answer is the most standard, widely-accepted answer — not an obscure or ambiguous phrasing
- NEVER set a wrong answer as the correct answer. If you are unsure about the correct answer, use the most defensible and commonly accepted answer
- Each wrong option must be clearly and definitively wrong — not a "close second" or debatable alternative
- The explanation must logically and clearly justify why the correct answer is right and why each wrong answer is wrong
- wrongAnswerExplanations: for EACH wrong option, explain specifically why that value is wrong (e.g., "This is off by a factor of 100 due to a unit conversion error"). Do NOT just restate the correct answer — explain the specific mistake that would lead someone to pick that wrong option.

CRITICAL RULES:
- NEVER use placeholder text like "Option 1", "Option 2", "correctAnswer", "Wrong Option", etc. in actual options
- Do not contain any prefix like "A) ", "1. ", "a. ", etc. in the options or correct answer. Provide ONLY the answer text.
- All options must be real, meaningful answers related to the question
- The wrongAnswerExplanations keys must be the EXACT text of the wrong options (without any prefix)

ANSWER LENGTH BALANCING (EXTREMELY IMPORTANT - FOLLOW STRICTLY):
- The correct answer must NOT be noticeably longer or more detailed than wrong answers
- ALL four options MUST have similar word counts (within 2-3 words of each other)
- If the correct answer naturally requires more detail, ADD similar detail to wrong answers to match
- If the correct answer is short (1-3 words), keep ALL options short (1-3 words)
- If the correct answer is medium (4-8 words), make ALL options medium length
- If the correct answer is long (9+ words), make ALL options similarly long
- NEVER make the correct answer stand out by being the only "complete" or "detailed" option
- Wrong answers should be equally plausible and well-formed, not obviously wrong or shorter
- Randomize which position (1st, 2nd, 3rd, or 4th) contains the correct answer - do NOT always put it first or last

OUTPUT FORMAT (JSON):
{
  "title": "A short descriptive title for the quiz",
  "category": "One of: ${categoryList}",
  "questions": [
    {
      "type": "multiple_choice" | "true_false" | "short_answer",
      "question": "The question text",
      "options": ["Option with similar length", "Option with similar length", "Option with similar length", "Option with similar length"],
      "correctAnswer": "The exact correct option text (without any prefix)",
      "explanation": "Brief explanation of why this is correct",
      "wrongAnswerExplanations": {
        "Wrong option 1 text": "Why this specific option is incorrect",
        "Wrong option 2 text": "Why this specific option is incorrect",
        "Wrong option 3 text": "Why this specific option is incorrect"
      },
      "imageIndex": 0 // 0-based index of the attached image this question references
    }
  ]
}

Respond with ONLY valid JSON, no markdown or additional text.`;

  // Choose the right prompt based on content type
  const finalPrompt = isImageOnly ? imageOnlyPrompt : visionPrompt;

  try {
    // Step 2: Analyzing content
    onProgress?.("analyzing", 25, "Analyzing content structure...");
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 3: Preparing AI request
    onProgress?.("preparing", 35, hasImages ? "Processing visual content..." : "Preparing quiz generation...");
    
    const response = await pRetry(
      async () => {
        let messages: any[];
        
        // Step 4: Generating questions
        onProgress?.("generating", 50, "AI is generating questions...");
        
        if (hasImages) {
          const imageContent = documentImages.slice(0, 6).map(imageUrl => ({
            type: "image_url" as const,
            image_url: { url: imageUrl, detail: "high" as const }
          }));
          
          messages = [{
            role: "user",
            content: [
              { type: "text", text: finalPrompt },
              ...imageContent
            ]
          }];
          
          console.log(`Generating quiz with ${imageContent.length} images using vision model (isImageOnly: ${isImageOnly})`);
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
            onProgress?.("processing", 70, "Processing AI response...");
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

    // Step 5: Validating response
    onProgress?.("validating", 80, "Validating generated questions...");
    
    const parsed = JSON.parse(response);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid AI response: missing questions array");
    }

    // Enforce question count limit - AI sometimes generates extra questions
    let rawQuestions = parsed.questions;
    if (rawQuestions.length > questionCount) {
      console.log(`AI generated ${rawQuestions.length} questions, trimming to requested ${questionCount}`);
      rawQuestions = rawQuestions.slice(0, questionCount);
    } else if (rawQuestions.length < questionCount) {
      console.warn(`AI generated only ${rawQuestions.length} questions, requested ${questionCount}`);
    }

    const title = parsed.title?.trim() || "Untitled Quiz";
    const rawCategory = parsed.category?.trim() || "Others/General";
    const category: QuizCategory = QUIZ_CATEGORIES.includes(rawCategory) ? rawCategory : "Others/General";
    const questions: Question[] = [];

    // Server-side answer-explanation consistency check
    for (const q of rawQuestions) {
      if (q.type === "multiple_choice" && q.explanation && q.correctAnswer && Array.isArray(q.options)) {
        const explanation = String(q.explanation).toLowerCase();
        const markedCorrect = String(q.correctAnswer).trim();
        const options = q.options.map((o: any) => String(o).trim());

        // Check if a different option's value appears at the end of the explanation
        // (the conclusion) but the marked correct answer does NOT
        const markedCorrectLower = markedCorrect.toLowerCase().replace(",", ".").replace(/\s/g, "");
        const explanationNorm = explanation.replace(",", ".").replace(/\s/g, "");

        // Extract numeric conclusions from explanation (patterns like "= 0.05", "= 0.05kg", "= 0,05 kg")
        const conclusionMatches = explanation.match(/[=→]\s*([0-9]+[.,]?[0-9]*)\s*(kg|g|m|cm|mm|s|n|j|w|v|a|hz|rad|mol|l|ml)?/gi);
        if (conclusionMatches && conclusionMatches.length > 0) {
          // Get the last conclusion (final answer in the derivation chain)
          const lastConclusion = conclusionMatches[conclusionMatches.length - 1];
          const conclusionValue = lastConclusion.replace(/^[=→]\s*/, "").trim().toLowerCase().replace(",", ".");

          // Find which option best matches the explanation's conclusion
          let bestMatchIdx = -1;
          for (let i = 0; i < options.length; i++) {
            const optNorm = options[i].toLowerCase().replace(",", ".").replace(/\s/g, "");
            if (conclusionValue.replace(/\s/g, "") === optNorm || optNorm.includes(conclusionValue.replace(/\s/g, ""))) {
              bestMatchIdx = i;
              break;
            }
          }

          if (bestMatchIdx !== -1 && options[bestMatchIdx] !== markedCorrect) {
            const derivedAnswer = options[bestMatchIdx];
            console.warn(`[ANSWER FIX] Explanation derives "${conclusionValue}" matching option "${derivedAnswer}" but correctAnswer was "${markedCorrect}". Fixing to "${derivedAnswer}".`);
            q.correctAnswer = derivedAnswer;
          }
        }
      }
    }

    for (const q of rawQuestions) {
      if (!q.type || !q.question || !q.correctAnswer) {
        console.warn("Skipping malformed question:", q);
        continue;
      }

      if (!["multiple_choice", "true_false", "short_answer"].includes(q.type)) {
        console.warn("Skipping question with invalid type:", q.type);
        continue;
      }

      if (!questionTypes.includes(q.type as QuestionType)) {
        console.warn(`AI generated ${q.type} but user only selected [${questionTypes.join(", ")}], converting...`);
        if (questionTypes.length === 1) {
          q.type = questionTypes[0];
          if (q.type === "short_answer") {
            q.options = undefined;
          }
        } else {
          continue;
        }
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

    // Step 6: Finalizing
    onProgress?.("finalizing", 95, "Finalizing your quiz...");
    
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

  const prompt = `You are an expert educator and subject-matter specialist. The following text appears to be from an existing exam, quiz, or worksheet that already contains questions with answer options.

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

FACTUAL ACCURACY AND SELF-CONSISTENCY (HIGHEST PRIORITY - FOLLOW STRICTLY):
- Every correct answer MUST be verifiably, objectively correct based on established academic knowledge
- For math/science: work through all calculations, unit conversions, and formulas step by step FIRST, arrive at the result, THEN set correctAnswer to the option matching your result
- SELF-CHECK (MANDATORY): After writing each question, re-read your own explanation. The value/conclusion in the explanation MUST match the correctAnswer field EXACTLY. If your explanation derives "0.05kg" then correctAnswer MUST be "0,05kg" or "0.05kg" — NEVER a different value. Fix any mismatch before moving on.
- NEVER mark a wrong answer as correct. If uncertain, use the most defensible and commonly accepted answer
- The explanation must clearly and logically justify why the correct answer is right
- wrongAnswerExplanations: for EACH wrong option, explain specifically why that value is wrong (e.g., "This is off by a factor of 100 due to a unit conversion error"). Do NOT just restate the correct answer.

IMPORTANT INSTRUCTIONS:
- Extract questions EXACTLY as they appear (preserving the original wording)
- For multiple choice, preserve all answer options as they appear (e.g., a, b, c, d or A, B, C, D)
- Use your expert knowledge to determine the correct answer with high confidence - DO NOT guess
- If a question is unclear or you cannot determine the answer confidently, still include it but note the uncertainty in the explanation
- AUTOMATICALLY DETECT QUESTION TYPE based on the options:
  * If options are exactly "True" and "False" (or similar like "T/F", "Đúng/Sai") → use "true_false" type
  * If there are NO options provided (open-ended question) → use "short_answer" type
  * Otherwise (multiple options A, B, C, D etc.) → use "multiple_choice" type
- The wrongAnswerExplanations keys must be the EXACT text of the wrong options (without any prefix)

OUTPUT FORMAT (JSON):
{
  "title": "A short descriptive title for the quiz",
  "questions": [
    {
      "type": "multiple_choice OR true_false OR short_answer",
      "question": "The exact question text as it appears",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"], // For multiple_choice/true_false only. Extract exactly as they appear, but REMOVE any prefixes like "A) ", "1. ", "a. ", etc. For short_answer, omit this field or use empty array.
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

  const visionPrompt = hasImages ? `You are an expert educator and subject-matter specialist. The following content appears to be from an existing exam, quiz, or worksheet that already contains questions with answer options. The content includes IMAGES that may contain questions, diagrams, or visual content that are part of the quiz.

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

FACTUAL ACCURACY AND SELF-CONSISTENCY (HIGHEST PRIORITY - FOLLOW STRICTLY):
- Every correct answer MUST be verifiably, objectively correct based on established academic knowledge
- For math/science: work through all calculations, unit conversions, and formulas step by step FIRST, arrive at the result, THEN set correctAnswer to the option matching your result
- SELF-CHECK (MANDATORY): After writing each question, re-read your own explanation. The value/conclusion in the explanation MUST match the correctAnswer field EXACTLY. If your explanation derives "0.05kg" then correctAnswer MUST be "0,05kg" or "0.05kg" — NEVER a different value. Fix any mismatch before moving on.
- NEVER mark a wrong answer as correct. If uncertain, use the most defensible and commonly accepted answer
- The explanation must clearly and logically justify why the correct answer is right
- wrongAnswerExplanations: for EACH wrong option, explain specifically why that value is wrong (e.g., "This is off by a factor of 100 due to a unit conversion error"). Do NOT just restate the correct answer.

IMPORTANT INSTRUCTIONS:
- Extract questions EXACTLY as they appear (from both text and images)
- For multiple choice, preserve all answer options as they appear
- Use your expert knowledge to determine the correct answer with high confidence - DO NOT guess
- AUTOMATICALLY DETECT QUESTION TYPE based on the options:
  * If options are exactly "True" and "False" (or similar like "T/F", "Đúng/Sai") → use "true_false" type
  * If there are NO options provided (open-ended question) → use "short_answer" type
  * Otherwise (multiple options A, B, C, D etc.) → use "multiple_choice" type
- The wrongAnswerExplanations keys must be the EXACT text of the wrong options (without any prefix)

OUTPUT FORMAT (JSON):
{
  "title": "A short descriptive title for the quiz",
  "questions": [
    {
      "type": "multiple_choice OR true_false OR short_answer",
      "question": "The exact question text as it appears",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"], // For multiple_choice/true_false only. Extract exactly as they appear, but REMOVE any prefixes. For short_answer, omit this field or use empty array.
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

    // Server-side answer-explanation consistency check for imported quizzes
    for (const q of parsed.questions) {
      if (q.explanation && q.correctAnswer && Array.isArray(q.options) && q.options.length > 0) {
        const explanation = String(q.explanation).toLowerCase();
        const markedCorrect = String(q.correctAnswer).trim();
        const opts = q.options.map((o: any) => String(o).trim());

        const conclusionMatches = explanation.match(/[=→]\s*([0-9]+[.,]?[0-9]*)\s*(kg|g|m|cm|mm|s|n|j|w|v|a|hz|rad|mol|l|ml)?/gi);
        if (conclusionMatches && conclusionMatches.length > 0) {
          const lastConclusion = conclusionMatches[conclusionMatches.length - 1];
          const conclusionValue = lastConclusion.replace(/^[=→]\s*/, "").trim().toLowerCase().replace(",", ".");

          let bestMatchIdx = -1;
          for (let i = 0; i < opts.length; i++) {
            const optNorm = opts[i].toLowerCase().replace(",", ".").replace(/\s/g, "");
            if (conclusionValue.replace(/\s/g, "") === optNorm || optNorm.includes(conclusionValue.replace(/\s/g, ""))) {
              bestMatchIdx = i;
              break;
            }
          }

          if (bestMatchIdx !== -1 && opts[bestMatchIdx] !== markedCorrect) {
            const derivedAnswer = opts[bestMatchIdx];
            console.warn(`[IMPORT ANSWER FIX] Explanation derives "${conclusionValue}" matching "${derivedAnswer}" but correctAnswer was "${markedCorrect}". Fixing.`);
            q.correctAnswer = derivedAnswer;
          }
        }
      }
    }

    for (const q of parsed.questions) {
      if (!q.question || !q.correctAnswer) {
        console.warn(
          "Skipping malformed question (missing question or answer):",
          q,
        );
        continue;
      }

      let options =
        Array.isArray(q.options) && q.options.length > 0
          ? q.options.map((o: any) => String(o).trim())
          : undefined;

      // Auto-detect question type based on options
      let questionType: QuestionType = "multiple_choice";
      
      if (!options || options.length === 0) {
        // No options = short answer
        questionType = "short_answer";
        options = undefined;
      } else if (options.length === 2) {
        // Check if it's true/false
        const normalizedOptions = options.map((o: string) => o.toLowerCase().trim());
        const trueFalsePatterns = [
          ["true", "false"],
          ["false", "true"],
          ["t", "f"],
          ["f", "t"],
          ["yes", "no"],
          ["no", "yes"],
          ["đúng", "sai"],
          ["sai", "đúng"],
        ];
        const isTrueFalse = trueFalsePatterns.some(pattern => 
          (normalizedOptions[0] === pattern[0] && normalizedOptions[1] === pattern[1]) ||
          (normalizedOptions.includes(pattern[0]) && normalizedOptions.includes(pattern[1]))
        );
        if (isTrueFalse) {
          questionType = "true_false";
          // Normalize options to "True" and "False"
          options = ["True", "False"];
        }
      } else if (q.type && ["multiple_choice", "true_false", "short_answer"].includes(q.type)) {
        // Use AI-detected type if valid
        questionType = q.type as QuestionType;
      }

      let correctAnswer = String(q.correctAnswer).trim();
      
      // Normalize correct answer for true/false questions
      if (questionType === "true_false") {
        const lowerAnswer = correctAnswer.toLowerCase();
        if (["true", "t", "yes", "đúng"].includes(lowerAnswer)) {
          correctAnswer = "True";
        } else if (["false", "f", "no", "sai"].includes(lowerAnswer)) {
          correctAnswer = "False";
        }
      }

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

export interface QuizChatParams {
  quizTitle: string;
  questions: Question[];
  currentQuestionIndex: number;
  userMessage: string;
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
  sourceMaterial?: string;
}

export async function quizChatResponse(params: QuizChatParams): Promise<string> {
  const { quizTitle, questions, currentQuestionIndex, userMessage, chatHistory, sourceMaterial } = params;
  
  const safeIndex = Math.max(0, Math.min(currentQuestionIndex, questions.length - 1));
  const currentQuestion = questions[safeIndex];
  
  const quizContext = `You are Pip, the friendly penguin study buddy of Prepetual! You're an adorable arctic penguin who loves helping students learn. You live in a cozy igloo within the Prepetual app and get excited when students understand new concepts.

ABOUT PREPETUAL (the app you're part of):
Prepetual is an AI-powered exam preparation web app that helps students turn any study material into interactive practice quizzes. Key features include:
- Upload documents (PDFs, Word, PowerPoint, Excel, images) to extract text and generate quizzes automatically
- AI-generated quizzes with multiple question types: multiple choice, true/false, and short answer
- Three difficulty levels: Easy, Medium, and Hard
- Study mode with flashcards for quick review
- Revision mode to focus on questions you got wrong
- Quiz sharing via shareable links
- Progress tracking with accuracy trends and study streaks
- You (Pip!) - the AI study companion who helps explain concepts without giving away answers
- Import existing exams/worksheets where AI identifies correct answers
- Support for multiple languages including Vietnamese

YOUR PERSONALITY:
- You're a cheerful, encouraging penguin who genuinely cares about helping students succeed
- You occasionally make cute penguin references (like giving flipper high-fives, mentioning your igloo, or making light icy puns) but keep it natural and don't overdo it
- You're patient and never make students feel bad for not understanding something
- You celebrate their progress with enthusiasm
- You're a bit nerdy and love explaining things in fun, approachable ways
- You're proud to be part of Prepetual and can tell users about its features if they ask

QUIZ CONTEXT:
Quiz: "${quizTitle}"
Total questions: ${questions.length}
Current question: #${currentQuestionIndex + 1}

CURRENT QUESTION:
Type: ${currentQuestion.type}
Question: ${currentQuestion.question}
${currentQuestion.options ? `Options: ${currentQuestion.options.join(", ")}` : ""}

ALL QUIZ QUESTIONS (for context):
${questions.map((q, i) => `Q${i + 1}: ${q.question}`).join("\n")}

${sourceMaterial ? `SOURCE MATERIAL (original study content):\n${sourceMaterial.substring(0, 4000)}${sourceMaterial.length > 4000 ? "..." : ""}` : ""}

INSTRUCTIONS:
- Help the student understand concepts WITHOUT giving away answers directly
- If asked for the answer, guide them with hints instead - be a good tutor, not an answer machine!
- Explain concepts from the source material when relevant
- Be encouraging and supportive - you're their study buddy!
- Keep responses concise but helpful
- If they ask about a specific question, reference it by number
- Respond in the same language as the quiz content
- IMPORTANT: When explaining mathematical formulas, equations, or expressions, use LaTeX notation:
  - Use $...$ for inline math (e.g., $x^2 + y^2 = z^2$)
  - Use $$...$$ for display/block math (e.g., $$\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$)
  - Examples: fractions like $\\frac{a}{b}$, square roots like $\\sqrt{x}$, exponents like $x^n$, subscripts like $x_i$, Greek letters like $\\alpha$, $\\beta$, integrals like $\\int_a^b f(x)dx$, sums like $\\sum_{i=1}^n$`;

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: quizContext },
    ...chatHistory.slice(-10).map(msg => ({ role: msg.role as "user" | "assistant", content: msg.content })),
    { role: "user", content: userMessage }
  ];

  try {
    const response = await pRetry(
      async () => {
        const completion = await openai.chat.completions.create({
          model: "gpt-4.1",
          messages,
          max_tokens: 500,
        });
        return completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
      },
      {
        retries: 3,
        minTimeout: 2000,
        maxTimeout: 10000,
        factor: 2,
        onFailedAttempt: (error: any) => {
          console.log(`Quiz chat retry (attempt ${error.attemptNumber}): ${error.message || error}`);
          if (!isRateLimitError(error)) {
            throw error;
          }
        },
      }
    );
    
    return response;
  } catch (error: any) {
    console.error("Quiz chat error:", error);
    throw new Error("Failed to get AI response. Please try again.");
  }
}

