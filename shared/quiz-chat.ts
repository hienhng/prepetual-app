export const MAX_CHAT_MESSAGE_CHARS = 2_000;
export const MAX_CHAT_HISTORY_CHARS = 4_000;
export const MAX_CHAT_HISTORY_MESSAGES = 20;

// Keep the visible transcript intact while bounding what is sent to the API.
export function prepareChatHistory(messages: ReadonlyArray<{
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}>) {
  return messages
    .filter(message => !message.isError)
    .slice(-MAX_CHAT_HISTORY_MESSAGES)
    .map(({ role, content }) => ({ role, content: content.slice(0, MAX_CHAT_HISTORY_CHARS) }));
}
