export interface QuizGenerationSourceInput {
  text?: string;
  materialText?: string;
  prompt?: string;
  sourceType: "material" | "prompt";
  sourceImageUrl?: string | null;
  documentImages?: string[];
}

export function resolveQuizGenerationSources(data: QuizGenerationSourceInput) {
  const legacyText = data.text?.trim() || "";
  const materialText = data.materialText?.trim() || (data.sourceType === "material" ? legacyText : "");
  const prompt = data.prompt?.trim() || (data.sourceType === "prompt" ? legacyText : "");
  const hasImages = Boolean(data.sourceImageUrl || data.documentImages?.length);

  return {
    materialText,
    prompt,
    promptOnly: Boolean(prompt) && !materialText && !hasImages,
    hasImages,
  };
}
