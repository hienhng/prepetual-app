const SUPADATA_TRANSCRIPT_ENDPOINT = "https://api.supadata.ai/v1/transcript";
const SUPADATA_TIMEOUT_MS = 20_000;

export interface SupadataTranscriptResult {
  text: string;
  segmentCount: number;
}

export class SupadataTranscriptError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SupadataTranscriptError";
  }
}

function cleanTranscriptText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export function parseSupadataTranscript(payload: unknown): SupadataTranscriptResult | null {
  if (!payload || typeof payload !== "object") return null;

  const content = (payload as { content?: unknown }).content;
  if (typeof content === "string") {
    const text = cleanTranscriptText(content);
    return text ? { text, segmentCount: 1 } : null;
  }

  if (!Array.isArray(content)) return null;

  const segments = content.filter(
    (segment): segment is { text: string } =>
      Boolean(segment) &&
      typeof segment === "object" &&
      typeof (segment as { text?: unknown }).text === "string",
  );
  const text = cleanTranscriptText(segments.map((segment) => segment.text).join(" "));

  return text ? { text, segmentCount: segments.length } : null;
}

export async function fetchSupadataTranscript(
  videoUrl: string,
  apiKey: string,
): Promise<SupadataTranscriptResult> {
  const endpoint = new URL(SUPADATA_TRANSCRIPT_ENDPOINT);
  endpoint.searchParams.set("url", videoUrl);
  endpoint.searchParams.set("text", "true");
  endpoint.searchParams.set("mode", "native");

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "x-api-key": apiKey,
    },
    signal: AbortSignal.timeout(SUPADATA_TIMEOUT_MS),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new SupadataTranscriptError(
      "Supadata returned a non-JSON response.",
      response.status,
    );
  }

  if (!response.ok) {
    const providerMessage =
      payload && typeof payload === "object"
        ? (payload as { message?: unknown; error?: unknown }).message ??
          (payload as { error?: unknown }).error
        : undefined;
    throw new SupadataTranscriptError(
      typeof providerMessage === "string"
        ? providerMessage
        : `Supadata request failed with status ${response.status}.`,
      response.status,
    );
  }

  const transcript = parseSupadataTranscript(payload);
  if (!transcript) {
    throw new SupadataTranscriptError(
      response.status === 202
        ? "Supadata unexpectedly queued a native transcript job."
        : "Supadata returned an empty transcript.",
      response.status,
    );
  }

  return transcript;
}
