// Test script for short-term memory implementation
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { LRUCache } = require("lru-cache");

console.log("Starting short-term memory test...");

// Mock the shortTermMemory module
const shortTermMemoryCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 30,
});

// Define the shortTermMemory functions
function storeInShortTermMemory(threadId, key, value) {
  if (!threadId || !key || !value) return;
  const threadMemory = shortTermMemoryCache.get(threadId) || {};
  threadMemory[key] = {
    value,
    timestamp: Date.now(),
  };
  shortTermMemoryCache.set(threadId, threadMemory);
  console.log(
    `[shortTermMemory] Stored "${key}": "${value}" for thread ${threadId}`
  );
}

function getFromShortTermMemory(threadId, key) {
  if (!threadId || !key) return null;
  const threadMemory = shortTermMemoryCache.get(threadId);
  if (!threadMemory) return null;
  const item = threadMemory[key];
  if (!item) return null;
  return item.value;
}

function extractAndStoreUserName(threadId, message) {
  if (!threadId || !message) return;
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
      storeInShortTermMemory(threadId, "userName", name);
      break;
    }
  }
}

function getUserNameFromShortTermMemory(threadId) {
  return getFromShortTermMemory(threadId, "userName");
}

function isAskingForName(query) {
  const patterns = [
    /what (is|was) my name/i,
    /do you (know|remember) my name/i,
    /what did you (call|just call) me/i,
    /(do you know|remember) who I am/i,
  ];
  return patterns.some((pattern) => pattern.test(query));
}

function storeConversationMessage(threadId, role, content) {
  if (!threadId || !content) return;
  const key = "recentMessages";
  const threadMemory = shortTermMemoryCache.get(threadId) || {};
  const existingItem = threadMemory[key];
  const recentMessages = existingItem ? JSON.parse(existingItem.value) : [];
  recentMessages.push({ role, content });
  const trimmedMessages = recentMessages.slice(-10);
  threadMemory[key] = {
    value: JSON.stringify(trimmedMessages),
    timestamp: Date.now(),
  };
  shortTermMemoryCache.set(threadId, threadMemory);
  if (role === "user") {
    extractAndStoreUserName(threadId, content);
  }
}

function getRecentConversation(threadId) {
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

function handleNameQuery(threadId, query) {
  const isNameQuery = isAskingForName(query);
  const name = isNameQuery ? getUserNameFromShortTermMemory(threadId) : null;
  return { isNameQuery, name };
}

// Mock thread ID
const threadId = "test-thread-123";

console.log("========================================");
console.log("Testing short-term memory system...");
console.log("========================================");

try {
  // Test basic storage and retrieval
  console.log("\nTest 1: Basic storage and retrieval");
  storeInShortTermMemory(threadId, "testKey", "testValue");
  const retrievedValue = getFromShortTermMemory(threadId, "testKey");
  console.log("Retrieved value:", retrievedValue);
  console.log(
    "Basic storage test:",
    retrievedValue === "testValue" ? "PASSED" : "FAILED"
  );

  // Test name extraction
  console.log("\nTest 2: Name extraction");
  const nameMessage = "Hi there, my name is Alice.";
  console.log("Message:", nameMessage);
  extractAndStoreUserName(threadId, nameMessage);
  const storedName = getFromShortTermMemory(threadId, "userName");
  console.log("Extracted name:", storedName);
  console.log(
    "Name extraction test:",
    storedName === "Alice" ? "PASSED" : "FAILED"
  );

  // Test name querying
  console.log("\nTest 3: Name query detection");
  const nameQuery = "Do you remember my name?";
  const notNameQuery = "How are you today?";
  console.log("Name query:", nameQuery);
  console.log("Not name query:", notNameQuery);
  const nameQueryResult = isAskingForName(nameQuery);
  const notNameQueryResult = isAskingForName(notNameQuery);
  console.log("Is asking for name (should be true):", nameQueryResult);
  console.log("Is asking for name (should be false):", notNameQueryResult);
  console.log(
    "Name query detection test:",
    nameQueryResult ? "PASSED" : "FAILED"
  );
  console.log(
    "Not-name query detection test:",
    !notNameQueryResult ? "PASSED" : "FAILED"
  );

  // Test handleNameQuery
  console.log("\nTest 4: Handle name query");
  const { isNameQuery, name } = handleNameQuery(threadId, nameQuery);
  console.log("isNameQuery:", isNameQuery);
  console.log("name:", name);
  console.log(
    "Name query handling test:",
    isNameQuery && name === "Alice" ? "PASSED" : "FAILED"
  );

  // Test conversation storage and retrieval
  console.log("\nTest 5: Conversation storage");
  storeConversationMessage(threadId, "user", "Hello, how are you?");
  storeConversationMessage(
    threadId,
    "assistant",
    "I'm fine, thanks for asking!"
  );
  const messages = getRecentConversation(threadId);
  console.log("Retrieved messages:", JSON.stringify(messages, null, 2));
  console.log(
    "Conversation storage test:",
    messages.length === 2 &&
      messages[0].role === "user" &&
      messages[0].content === "Hello, how are you?" &&
      messages[1].role === "assistant" &&
      messages[1].content === "I'm fine, thanks for asking!"
      ? "PASSED"
      : "FAILED"
  );

  // Test name extraction through conversation message
  console.log("\nTest 6: Name extraction via conversation");
  storeConversationMessage(threadId, "user", "By the way, I'm Bob.");
  const newName = getFromShortTermMemory(threadId, "userName");
  console.log("New name extracted:", newName);
  console.log(
    "Name extraction via conversation test:",
    newName === "Bob" ? "PASSED" : "FAILED"
  );

  // Test immediate name query after introduction
  console.log("\nTest 7: Immediate name recall");
  storeConversationMessage(threadId, "user", "My name is Charlie.");
  storeConversationMessage(threadId, "user", "Do you remember my name?");
  const immediateNameQuery = handleNameQuery(
    threadId,
    "Do you remember my name?"
  );
  console.log(
    "Immediate name query result:",
    JSON.stringify(immediateNameQuery)
  );
  console.log(
    "Immediate name recall test:",
    immediateNameQuery.isNameQuery && immediateNameQuery.name === "Charlie"
      ? "PASSED"
      : "FAILED"
  );

  console.log("\n========================================");
  console.log("All tests completed.");
  console.log("========================================");
} catch (error) {
  console.error("Error running tests:", error);
}
