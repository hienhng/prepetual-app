import { inspectAiJsonCompletion, isJsonResponseFormatError, recoverFailedGenerationJson } from "./ai-json-response.js";

/** Retry writer output once; only complete JSON objects reach local validation. */
export async function requestQuizWriterResponse(
  complete: (jsonMode: boolean, maxTokens: number) => Promise<unknown>,
  options: { jsonMode?: boolean; maxTokens: number },
): Promise<string> {
  let jsonMode = options.jsonMode ?? true;
  let maxTokens = options.maxTokens;
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: unknown;
    try {
      response = await complete(jsonMode, maxTokens);
    } catch (error) {
      if (!isJsonResponseFormatError(error)) throw error;
      const recovered = recoverFailedGenerationJson(error);
      if (Array.isArray(recovered?.questions)) {
        console.warn("Recovered complete quiz-writer JSON from the provider's failed generation.");
        return JSON.stringify(recovered);
      }
      if (attempt === 1) throw error;
      console.warn("Quiz-writer JSON mode was rejected; retrying once without response_format.");
      jsonMode = false;
      continue;
    }
    const inspection = inspectAiJsonCompletion(response);
    if (inspection.result && Array.isArray(inspection.result.questions)) return JSON.stringify(inspection.result);
    const issue = inspection.retryReason || "missing questions array";
    if (attempt === 1) throw new Error(`Quiz writer returned ${issue} after retry.`);
    console.warn(`Quiz writer returned ${issue}; retrying once.`);
    if (issue === "truncated") maxTokens = Math.min(20_480, maxTokens * 2);
    else jsonMode = false;
  }
  throw new Error("Quiz writer response could not be recovered.");
}
