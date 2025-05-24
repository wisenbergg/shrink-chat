// Short-term memory cache to supplement vector database
import { LRUCache } from "lru-cache";

// Define types for the short-term memory system
interface MemoryItem {
  value: string;
  timestamp: number;
}

interface ShortTermMemory {
  [key: string]: MemoryItem;
}

// Create an LRU cache for thread-specific data
// Structure: { threadId: { key: { value, timestamp } } }
const shortTermMemoryCache = new LRUCache<string, ShortTermMemory>({
  max: 1000, // Maximum number of threads to track
  ttl: 1000 * 60 * 30, // Items expire after 30 minutes
});

/**
 * Store information in short-term memory
 */
export function storeInShortTermMemory(
  threadId: string,
  key: string,
  value: string
): void {
  if (!threadId || !key || !value) return;

  // Get or create thread memory
  const threadMemory = shortTermMemoryCache.get(threadId) || {};

  // Store the value with current timestamp
  threadMemory[key] = {
    value,
    timestamp: Date.now(),
  };

  // Update the cache
  shortTermMemoryCache.set(threadId, threadMemory);
  console.log(
    `[shortTermMemory] Stored "${key}": "${value}" for thread ${threadId}`
  );
}

/**
 * Extract and store name from message
 */
export function extractAndStoreUserName(
  threadId: string,
  message: string
): void {
  if (!threadId || !message) return;

  // Common name introduction patterns
  const patterns = [
    /my name is (\w+)/i,
    /i am (\w+)/i,
    /i'm (\w+)/i,
    /call me (\w+)/i,
    /name'?s (\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const name = match[1];
      // Only store if it's a real name and not "Anonymous" (case-insensitive)
      if (name.toLowerCase() !== "anonymous") {
        storeInShortTermMemory(threadId, "userName", name);
        break;
      }
    }
  }
}

/**
 * Get information from short-term memory
 */
export function getFromShortTermMemory(
  threadId: string,
  key: string
): string | null {
  if (!threadId || !key) return null;

  const threadMemory = shortTermMemoryCache.get(threadId);
  if (!threadMemory) return null;

  const item = threadMemory[key];
  if (!item) return null;

  return item.value;
}

/**
 * Get user's name from short-term memory
 */
export function getUserNameFromShortTermMemory(
  threadId: string
): string | null {
  return getFromShortTermMemory(threadId, "userName");
}

/**
 * Check if a query is asking about user's name
 */
export function isAskingForName(query: string): boolean {
  const patterns = [
    /what (is|was) my name/i,
    /do you (know|remember) my name/i,
    /what did you (call|just call) me/i,
    /(do you know|remember) who I am/i,
  ];

  return patterns.some((pattern) => pattern.test(query));
}

/**
 * Get the recent conversation context
 * This function stores recent messages and returns them as context
 */
export function storeConversationMessage(
  threadId: string,
  role: "user" | "assistant",
  content: string
): void {
  if (!threadId || !content) return;

  const key = "recentMessages";
  const threadMemory = shortTermMemoryCache.get(threadId) || {};

  // Get existing messages or initialize
  const existingItem = threadMemory[key];
  const recentMessages = existingItem ? JSON.parse(existingItem.value) : [];

  // Add the new message
  recentMessages.push({ role, content });

  // Keep only the last 10 messages
  const trimmedMessages = recentMessages.slice(-10);

  // Store back
  threadMemory[key] = {
    value: JSON.stringify(trimmedMessages),
    timestamp: Date.now(),
  };

  // Update the cache
  shortTermMemoryCache.set(threadId, threadMemory);

  // If it's a user message, check for name
  if (role === "user") {
    extractAndStoreUserName(threadId, content);
  }
}

/**
 * Get recent conversation history
 */
export function getRecentConversation(
  threadId: string
): Array<{ role: "user" | "assistant"; content: string }> {
  if (!threadId) return [];

  const messagesStr = getFromShortTermMemory(threadId, "recentMessages");
  if (!messagesStr) return [];

  try {
    return JSON.parse(messagesStr);
  } catch (e) {
    console.error("[shortTermMemory] Error parsing recent messages:", e);
    return [];
  }
}

/**
 * Combined function to check if user is asking for their name and retrieve it
 */
export function handleNameQuery(
  threadId: string,
  query: string
): { isNameQuery: boolean; name: string | null } {
  const isNameQuery = isAskingForName(query);
  const name = isNameQuery ? getUserNameFromShortTermMemory(threadId) : null;

  return { isNameQuery, name };
}
