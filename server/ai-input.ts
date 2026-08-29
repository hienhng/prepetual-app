import { z } from "zod";

import {
  MAX_SOURCE_IMAGE_CHARS,
  MAX_SOURCE_IMAGES,
  MAX_SOURCE_IMAGES_TOTAL_CHARS,
  MAX_SOURCE_TEXT_CHARS,
} from "../shared/schema.js";

export const MAX_SUMMARY_TEXT_CHARS = 50_000;
export const MAX_UPLOAD_TOTAL_BYTES = 25 * 1024 * 1024;
export const MAX_AI_GRADED_SHORT_ANSWERS_PER_SUBMISSION = 20;

const sourceImagesSchema = z
  .array(z.string().max(MAX_SOURCE_IMAGE_CHARS, "Each source image is too large"))
  .max(MAX_SOURCE_IMAGES, `A maximum of ${MAX_SOURCE_IMAGES} images is allowed`)
  .optional();

function addTotalImageSizeIssue(
  data: { sourceImageUrl?: string | null; documentImages?: string[] },
  ctx: z.RefinementCtx,
) {
  const totalImageCount = (data.sourceImageUrl ? 1 : 0) + (data.documentImages?.length || 0);
  const totalChars =
    (data.sourceImageUrl?.length || 0) +
    (data.documentImages || []).reduce((sum, image) => sum + image.length, 0);

  if (totalImageCount > MAX_SOURCE_IMAGES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `A maximum of ${MAX_SOURCE_IMAGES} images is allowed`,
      path: ["documentImages"],
    });
  }

  if (totalChars > MAX_SOURCE_IMAGES_TOTAL_CHARS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "The combined source images are too large",
      path: ["documentImages"],
    });
  }
}

export const importQuizRequestSchema = z
  .object({
    text: z.string().min(1, "Text content is required").max(MAX_SOURCE_TEXT_CHARS, "Text content is too large"),
    sourceImageUrl: z.string().max(MAX_SOURCE_IMAGE_CHARS, "Source image is too large").nullable().optional(),
    documentImages: sourceImagesSchema,
  })
  .superRefine(addTotalImageSizeIssue);

export const summarizeTextRequestSchema = z.object({
  text: z
    .string()
    .min(100, "Text is too short to summarize")
    .max(MAX_SUMMARY_TEXT_CHARS, "Text is too large to summarize at once"),
});

export const gradeShortAnswerRequestSchema = z.object({
  question: z.string().min(1).max(2_000),
  correctAnswer: z.string().max(2_000).optional().default(""),
  userAnswer: z.string().min(1).max(4_000),
  sourceText: z.string().max(MAX_SUMMARY_TEXT_CHARS).optional().default(""),
  category: z.string().max(100).optional(),
});

export const generateExplanationRequestSchema = z.object({
  question: z.string().min(1).max(2_000),
  options: z.array(z.string().max(2_000)).max(10).optional(),
  correctAnswer: z.string().min(1).max(2_000),
  selectedAnswer: z.string().min(1).max(2_000),
  isCorrect: z.boolean().optional().default(false),
  sourceText: z.string().max(MAX_SUMMARY_TEXT_CHARS).optional().default(""),
  brief: z.boolean().optional().default(false),
  category: z.string().max(100).optional(),
});

export const generateLectureRequestSchema = z.object({
  topicCount: z.number().int().min(2).max(5).optional().default(4),
});

export const reviseQuizRequestSchema = z.object({
  questionIndex: z.number().int().min(0).max(1_000).optional(),
  userCorrectAnswer: z.string().max(4_000).optional(),
});

export const quizChatRequestSchema = z.object({
  quizId: z.string().min(1).max(100),
  currentQuestionIndex: z.number().int().min(0).max(1_000),
  userMessage: z.string().trim().min(1).max(2_000),
  chatHistory: z
    .array(z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().max(4_000),
    }))
    .max(20)
    .optional()
    .default([]),
});
