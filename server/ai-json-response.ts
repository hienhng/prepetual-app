type UnknownRecord = Record<string, unknown>;

export type AiJsonCompletionInspection = {
  finishReason: string | null;
  contentLength: number;
} & (
  | { result: UnknownRecord; retryReason: null }
  | { result: null; retryReason: "empty" | "truncated" | "invalid_json" }
);

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : null;
}

export function parseAiJsonObject(raw: string): UnknownRecord {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  if (!cleaned) {
    throw new Error("AI response was empty");
  }

  const parseObject = (value: string) => {
    const parsed = asRecord(JSON.parse(value));
    if (!parsed) throw new Error("AI response was not a JSON object");
    return parsed;
  };

  try {
    return parseObject(cleaned);
  } catch (initialError) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace <= firstBrace) throw initialError;
    return parseObject(cleaned.slice(firstBrace, lastBrace + 1));
  }
}

/**
 * Inspects a chat-completion response without logging its potentially sensitive
 * content. A length-limited response is always retried even if its partial JSON
 * happens to parse, because required fields may have been cut off.
 */
export function inspectAiJsonCompletion(completion: unknown): AiJsonCompletionInspection {
  const completionRecord = asRecord(completion);
  const choices = Array.isArray(completionRecord?.choices) ? completionRecord.choices : [];
  const choice = asRecord(choices[0]);
  const message = asRecord(choice?.message);
  const finishReason = typeof choice?.finish_reason === "string"
    ? choice.finish_reason
    : null;
  const content = typeof message?.content === "string" ? message.content : "";
  const contentLength = content.length;

  if (finishReason === "length") {
    return { result: null, retryReason: "truncated", finishReason, contentLength };
  }
  if (!content.trim()) {
    return { result: null, retryReason: "empty", finishReason, contentLength };
  }

  try {
    return {
      result: parseAiJsonObject(content),
      retryReason: null,
      finishReason,
      contentLength,
    };
  } catch {
    return { result: null, retryReason: "invalid_json", finishReason, contentLength };
  }
}

export function getFailedGenerationPayloads(error: unknown): string[] {
  const payloads: string[] = [];
  const queue: unknown[] = [error];
  const seen = new Set<unknown>();

  while (queue.length > 0 && seen.size < 12) {
    const current = queue.shift();
    const record = asRecord(current);
    if (!record || seen.has(current)) continue;
    seen.add(current);

    if (typeof record.failed_generation === "string" && record.failed_generation.trim()) {
      payloads.push(record.failed_generation);
    }

    if (record.error) queue.push(record.error);
    if (record.cause) queue.push(record.cause);
  }

  return payloads;
}

export function recoverFailedGenerationJson(error: unknown): UnknownRecord | null {
  for (const payload of getFailedGenerationPayloads(error)) {
    try {
      return parseAiJsonObject(payload);
    } catch {
      // Try the next nested provider payload before issuing another AI request.
    }
  }

  return null;
}

export function isJsonResponseFormatError(error: unknown): boolean {
  const record = asRecord(error);
  const nestedError = asRecord(record?.error);
  const status = record?.status ?? nestedError?.status;
  const code = String(record?.code ?? nestedError?.code ?? "").toLowerCase();
  const message = String(record?.message ?? nestedError?.message ?? "").toLowerCase();

  return Number(status) === 400 && (
    code === "json_validate_failed" ||
    message.includes("response_format") ||
    message.includes("failed to validate json") ||
    message.includes("json mode")
  );
}
