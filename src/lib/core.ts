// Add this to your existing runShrinkEngine function
import type { UserProfile } from "./sessionMemory";
import {
  getUserProfile,
  insertMemoryForThread,
  getRelevantMemories,
} from "./sessionMemory";
import { fetchRecall } from "./fetchRecall";
import { inferToneTagsFromText } from "./toneInference";
import { predictSignal } from "./predictSignal";
import { logSessionEntry } from "./logSession";
import { friendlyPrimers } from "@/lib/stylePrimers/friendly";
import { professionalPrimers } from "@/lib/stylePrimers/professional";
import { createOpenAIClient } from "./apiKeyLoader";

const THERAPY_MODEL = process.env.FINE_TUNED_MODEL!;
const CASUAL_MODEL = process.env.MICRO_MODEL!;

function getClient() {
  // Use our custom client that handles API key issues
  return createOpenAIClient();
}

function classifyIntent(
  text: string
): "readiness" | "emotion" | "info" | "casual" {
  const lower = text.toLowerCase();
  if (/(i['']?m ready|let'?s start)/.test(lower)) return "readiness";
  if (/(sad|angry|anxious|upset|overwhelmed|nervous)/.test(lower))
    return "emotion";
  if (/(how (do|can)|what about|why)/.test(lower)) return "info";
  return "casual";
}

function detectLens(text: string): string {
  const lower = text.toLowerCase();
  if (/(angry|furious|pissed)/.test(lower)) return "anger";
  if (/(guilt|guilty|ashamed|sorry)/.test(lower)) return "guilt";
  if (/(numb|empty|nothing)/.test(lower)) return "numbness";
  return "neutral";
}

export interface PromptInput {
  sessionId?: string;
  threadIds?: string[];
  prompt: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  memoryContext?: string; // Add this parameter
}

export interface PromptResult {
  response_text: string;
  recallUsed: boolean;
  tone_tags: string[];
  signal: string;
  model: string;
}

export async function runShrinkEngine(
  input: PromptInput
): Promise<PromptResult> {
  const client = getClient();
  const {
    sessionId = "unknown",
    threadIds = [],
    prompt,
    history = [],
    memoryContext = "",
  } = input;
  const threadId = threadIds[0] || sessionId;

  /* 1️⃣ signal + tone */
  const signal = await predictSignal(prompt);
  const promptToneTags = await inferToneTagsFromText(prompt);

  /* 2️⃣ model pick */
  const intent = classifyIntent(prompt);
  let model = THERAPY_MODEL;
  if (intent === "casual" && !["high", "danger", "self-harm"].includes(signal))
    model = CASUAL_MODEL;

  /* 3️⃣ RAG */
  const recallEnabled = signal !== "low" && promptToneTags.length > 0;
  const { recallUsed, results: retrievedChunks } = recallEnabled
    ? await fetchRecall(prompt, promptToneTags, signal)
    : { recallUsed: false, results: [] };

  /* 3️⃣.5 Memory Context */
  // If memoryContext is provided, use it directly
  let personalMemoryContext = memoryContext;

  // If no memoryContext provided but we have a threadId, try to fetch relevant memories
  if (!personalMemoryContext && threadId !== "unknown") {
    try {
      const relevantMemories = await getRelevantMemories({
        threadId,
        inputText: prompt,
        threshold: 0.6,
        limit: 3,
      });

      if (relevantMemories.length > 0) {
        personalMemoryContext = `
Relevant context from previous conversations:
${relevantMemories.map((memory, i) => `${i + 1}. ${memory.summary}`).join("\n")}

Please consider this context when responding.
`;
      }
    } catch (err) {
      console.error("Error fetching memory context:", err);
      // Continue without memory context if retrieval fails
    }
  }

  /* 4️⃣ priming */
  const primerPool =
    signal === "high" || ["danger", "self-harm"].includes(detectLens(prompt))
      ? professionalPrimers
      : friendlyPrimers;
  const primer = primerPool[Math.floor(Math.random() * primerPool.length)];
  const fewShot = `Here's how a warm, natural therapist might speak:\n\n${primer}`;

  const userProfile: UserProfile | null = await getUserProfile(threadId);
  const profileContext = userProfile
    ? `The user is ${userProfile.name ?? "Anonymous"}, currently feeling ${
        (userProfile.emotional_tone ?? []).join(", ") || "varied emotions"
      }.\n\n`
    : "";

  const contextBlock = retrievedChunks
    .slice(0, 3)
    .map((c) => `(${c.discipline}) ${c.topic}: ${c.content}`)
    .join("\n\n");
  const ragBlock =
    recallUsed && signal === "high" && promptToneTags.includes("info")
      ? `\n\n—\n\nNotes:\n\n${contextBlock}`
      : "";

  const systemMessages = [
    { role: "system", content: fewShot },
    profileContext && { role: "system", content: profileContext },
    personalMemoryContext && { role: "system", content: personalMemoryContext }, // Add memory context
    ragBlock && { role: "system", content: ragBlock },
  ].filter(Boolean) as { role: string; content: string }[];

  /* 5️⃣ Chat completion */
  const completion = await client.chat.completions.create({
    model,
    messages: [
      ...systemMessages,
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });
  const response_text = completion.choices[0].message.content!;
  const responseToneTags = await inferToneTagsFromText(response_text);

  /* 6️⃣ Persist turns */
  await insertMemoryForThread({
    threadId,
    author_role: "user",
    summary: prompt,
    // Generate embedding automatically in the insertMemoryForThread function
  });
  await insertMemoryForThread({
    threadId,
    author_role: "engine",
    summary: response_text,
    // Generate embedding automatically in the insertMemoryForThread function
  });

  await logSessionEntry({
    sessionId,
    role: "assistant",
    content: response_text,
    signal,
    toneTags: responseToneTags,
    recallUsed,
  });

  return {
    response_text,
    recallUsed,
    tone_tags: responseToneTags,
    signal,
    model,
  };
}

export function healthCheck() {
  return { status: "ok" };
}
