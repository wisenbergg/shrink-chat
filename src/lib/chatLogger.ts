// src/lib/chatLogger.ts - Client-side chat logging utility

export async function logChatClient(entry: {
  threadId: string;
  turn: number;
  role: "user" | "assistant";
  content: string;
}): Promise<string> {
  try {
    const response = await fetch("/api/chat/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to log chat: ${errorData.error || response.statusText}`
      );
    }

    const { messageId } = await response.json();
    return messageId;
  } catch (error) {
    console.error("Error logging chat message:", error);
    throw error;
  }
}
