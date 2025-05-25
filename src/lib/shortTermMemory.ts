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
    /they call me (\w+)/i,
    /people know me as (\w+)/i,
    /(\w+) is my name/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const name = match[1];
      // Only store if it's a real name and not "Anonymous" (case-insensitive)
      if (name.toLowerCase() !== "anonymous" && name.length > 1) {
        storeInShortTermMemory(threadId, "userName", name);
        console.log(
          `[shortTermMemory] Extracted and stored user name: ${name}`
        );
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

  // Keep only the last 15 messages instead of 10 for better context
  const trimmedMessages = recentMessages.slice(-15);

  // Store back
  threadMemory[key] = {
    value: JSON.stringify(trimmedMessages),
    timestamp: Date.now(),
  };

  // Update the cache
  shortTermMemoryCache.set(threadId, threadMemory);

  // If it's a user message, perform enhanced analysis
  if (role === "user") {
    // Extract and store name
    extractAndStoreUserName(threadId, content);

    // Extract and store conversation insights
    extractConversationInsights(threadId, content, role);
  }

  // Update conversation length for personalization
  const conversationLength = getFromShortTermMemory(
    threadId,
    "conversationLength"
  );
  const currentLength = conversationLength
    ? parseInt(conversationLength, 10)
    : 0;
  storeInShortTermMemory(
    threadId,
    "conversationLength",
    String(currentLength + 1)
  );
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

/**
 * Extract and store conversation insights from messages
 * This function analyzes messages for topics, emotions, and other contextual clues
 */
export function extractConversationInsights(
  threadId: string,
  message: string,
  role: "user" | "assistant"
): void {
  if (!threadId || !message || role !== "user") return;

  const lowerMessage = message.toLowerCase();

  // Extract topics
  const topicPatterns = {
    work: [/\b(work|job|career|boss|coworker|colleague|office|workplace)\b/i],
    family: [
      /\b(family|mom|dad|mother|father|parent|sibling|brother|sister|child|kid)\b/i,
    ],
    health: [
      /\b(health|sick|ill|disease|doctor|hospital|symptom|pain|medication)\b/i,
    ],
    mental_health: [
      /\b(anxiety|depression|stress|therapy|counseling|psychiatrist|psychologist)\b/i,
    ],
    relationships: [
      /\b(relationship|partner|dating|marriage|girlfriend|boyfriend|spouse|divorce|breakup)\b/i,
    ],
    sleep: [
      /\b(sleep|insomnia|tired|exhausted|rest|nap|fatigue|dream|nightmare)\b/i,
    ],
    finance: [
      /\b(money|finance|debt|budget|expense|income|saving|investment)\b/i,
    ],
    education: [
      /\b(school|college|university|study|student|class|course|degree|learn)\b/i,
    ],
  };

  // Extract emotions
  const emotionPatterns = {
    happy: [/\b(happy|joy|glad|excited|delighted|pleased|cheerful)\b/i],
    sad: [
      /\b(sad|unhappy|depressed|down|miserable|grief|sorrow|upset|blue)\b/i,
    ],
    angry: [/\b(angry|mad|furious|upset|irritated|annoyed|frustrated)\b/i],
    afraid: [
      /\b(afraid|scared|fearful|terrified|anxious|worried|panic|phobia)\b/i,
    ],
    confused: [
      /\b(confused|puzzled|perplexed|unsure|uncertain|doubt|bewildered)\b/i,
    ],
    stressed: [/\b(stressed|overwhelmed|pressured|burdened|overloaded)\b/i],
    hopeful: [
      /\b(hopeful|optimistic|looking forward|expecting|anticipating)\b/i,
    ],
  };

  // Process topics
  const detectedTopics: string[] = [];
  Object.entries(topicPatterns).forEach(([topic, patterns]) => {
    if (patterns.some((pattern) => pattern.test(lowerMessage))) {
      detectedTopics.push(topic);
    }
  });

  // Process emotions
  const detectedEmotions: string[] = [];
  Object.entries(emotionPatterns).forEach(([emotion, patterns]) => {
    if (patterns.some((pattern) => pattern.test(lowerMessage))) {
      detectedEmotions.push(emotion);
    }
  });

  // Store detected topics
  if (detectedTopics.length > 0) {
    const existingTopics =
      getFromShortTermMemory(threadId, "conversationTopics") || "";
    const existingTopicsArray = existingTopics ? existingTopics.split(",") : [];
    const allTopics = [...new Set([...existingTopicsArray, ...detectedTopics])];
    storeInShortTermMemory(threadId, "conversationTopics", allTopics.join(","));
    console.log(`[shortTermMemory] Updated topics: ${allTopics.join(", ")}`);
  }

  // Store detected emotions
  if (detectedEmotions.length > 0) {
    const existingEmotions =
      getFromShortTermMemory(threadId, "userEmotions") || "";
    const existingEmotionsArray = existingEmotions
      ? existingEmotions.split(",")
      : [];
    const allEmotions = [
      ...new Set([...existingEmotionsArray, ...detectedEmotions]),
    ];
    storeInShortTermMemory(threadId, "userEmotions", allEmotions.join(","));
    console.log(
      `[shortTermMemory] Updated emotions: ${allEmotions.join(", ")}`
    );
  }

  // Extract and store user preferences
  if (
    lowerMessage.includes("like") ||
    lowerMessage.includes("enjoy") ||
    lowerMessage.includes("love")
  ) {
    const preferencePatterns = [
      /i (?:really )?(like|love|enjoy) (\w+(?:\s\w+){0,3})/i,
      /(\w+(?:\s\w+){0,3}) (?:is|are) my favorite/i,
    ];

    for (const pattern of preferencePatterns) {
      const match = message.match(pattern);
      if (match) {
        const preference = match[2] || match[1];
        const existingPreferences =
          getFromShortTermMemory(threadId, "userPreferences") || "";
        const existingPreferencesArray = existingPreferences
          ? existingPreferences.split(",")
          : [];

        if (!existingPreferencesArray.includes(preference)) {
          existingPreferencesArray.push(preference);
          storeInShortTermMemory(
            threadId,
            "userPreferences",
            existingPreferencesArray.join(",")
          );
          console.log(
            `[shortTermMemory] Stored user preference: ${preference}`
          );
        }
      }
    }
  }
}
