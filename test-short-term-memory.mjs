// Test script for short-term memory implementation
import {
  storeInShortTermMemory,
  getFromShortTermMemory,
  extractAndStoreUserName,
  isAskingForName,
  handleNameQuery,
  storeConversationMessage,
  getRecentConversation,
} from "./src/lib/shortTermMemory";

// Mock thread ID
const threadId = "test-thread-123";

console.log("Testing short-term memory system...");

// Test basic storage and retrieval
storeInShortTermMemory(threadId, "testKey", "testValue");
const retrievedValue = getFromShortTermMemory(threadId, "testKey");
console.log(
  "Basic storage test:",
  retrievedValue === "testValue" ? "PASSED" : "FAILED"
);

// Test name extraction
const nameMessage = "Hi there, my name is Alice.";
extractAndStoreUserName(threadId, nameMessage);
const storedName = getFromShortTermMemory(threadId, "userName");
console.log(
  "Name extraction test:",
  storedName === "Alice" ? "PASSED" : "FAILED"
);

// Test name querying
const nameQuery = "Do you remember my name?";
const notNameQuery = "How are you today?";
console.log(
  "Name query detection test:",
  isAskingForName(nameQuery) ? "PASSED" : "FAILED"
);
console.log(
  "Not-name query detection test:",
  !isAskingForName(notNameQuery) ? "PASSED" : "FAILED"
);

// Test handleNameQuery
const { isNameQuery, name } = handleNameQuery(threadId, nameQuery);
console.log(
  "Name query handling test:",
  isNameQuery && name === "Alice" ? "PASSED" : "FAILED"
);

// Test conversation storage and retrieval
storeConversationMessage(threadId, "user", "Hello, how are you?");
storeConversationMessage(threadId, "assistant", "I'm fine, thanks for asking!");

const messages = getRecentConversation(threadId);
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

console.log("All tests completed.");
