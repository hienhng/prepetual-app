/** Provider reasoning is not a transcription and must never become evidence. */
export function normalizeVisionTextResponse(content: string): string {
  let text = content.trim();
  if (text.startsWith("<think>")) {
    const end = text.indexOf("</think>");
    if (end < 0) return "";
    text = text.slice(end + "</think>".length).trim();
  }
  const fenced = text.match(/^```(?:text|markdown|md)?\s*\r?\n([\s\S]*?)\r?\n```$/i);
  return (fenced?.[1] ?? text).trim();
}
