// test-memory.mjs
import {
  getRelevantMemories,
  insertMemoryForThread,
} from "./src/lib/sessionMemory.ts";

// Use command line arg for thread ID if provided, otherwise generate one
const TEST_THREAD_ID = process.argv[2] || "test-thread-" + Date.now();

async function test() {
  try {
    console.log(`🧪 Testing with thread ID: ${TEST_THREAD_ID}`);

    // First, insert a memory
    console.log("\n📌 Inserting test memory...");
    const memoryData = await insertMemoryForThread({
      threadId: TEST_THREAD_ID,
      author_role: "user",
      summary:
        "This is a test memory about artificial intelligence and machine learning. It contains specific keywords like Python, TensorFlow, and neural networks.",
    });
    console.log(
      "✅ Memory inserted successfully:",
      memoryData ? "ID: " + memoryData.id : "No data returned"
    );

    // Wait a bit for the embedding to be processed
    console.log("\n⏳ Waiting for embedding processing...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Then retrieve relevant memories
    console.log(
      "\n🔍 Retrieving relevant memories with query: 'Tell me about AI and Python'"
    );
    const memories = await getRelevantMemories({
      threadId: TEST_THREAD_ID,
      inputText: "Tell me about AI and Python",
      threshold: 0.5,
      limit: 5,
    });

    if (memories && memories.length > 0) {
      console.log(`✅ Retrieved ${memories.length} relevant memories:`);
      memories.forEach((memory, index) => {
        console.log(`\n📎 Memory #${index + 1}:`);
        console.log(`   ID: ${memory.id}`);
        console.log(`   Summary: ${memory.summary}`);
        console.log(
          `   Similarity: ${memory.similarity_score?.toFixed(4) || "N/A"}`
        );
      });
    } else {
      console.log("❌ No relevant memories found");
    }

    console.log("\n🏁 Test completed");
  } catch (err) {
    console.error("❌ Error during test:", err);
    process.exit(1);
  }
}

test();
