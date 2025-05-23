import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createOpenAIClient } from "./apiKeyLoader";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Add error handling for Supabase connection
let supabaseInstance: SupabaseClient | null = null;

export const supabase: SupabaseClient = (() => {
  if (supabaseInstance) return supabaseInstance;

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
    return supabaseInstance;
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    // Return a mock client that won't throw errors but will log them
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: null,
              error: new Error("Supabase client initialization failed"),
            }),
            limit: () => ({
              data: [],
              error: new Error("Supabase client initialization failed"),
            }),
          }),
          order: () => ({
            order: () => ({
              limit: () => ({
                data: [],
                error: new Error("Supabase client initialization failed"),
              }),
            }),
          }),
        }),
        delete: () => ({
          eq: () => ({
            error: new Error("Supabase client initialization failed"),
          }),
        }),
        insert: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: new Error("Supabase client initialization failed"),
            }),
          }),
        }),
        update: () => ({
          eq: () => ({
            error: new Error("Supabase client initialization failed"),
          }),
        }),
        upsert: () => ({
          onConflict: () => ({
            error: new Error("Supabase client initialization failed"),
          }),
        }),
        rpc: () => ({
          data: null,
          error: new Error("Supabase client initialization failed"),
        }),
      }),
      auth: {
        getUser: async () => ({
          data: { user: null },
          error: new Error("Supabase client initialization failed"),
        }),
      },
    } as unknown as SupabaseClient;
  }
})();

/* ─────────── types ─────────── */
export type UserProfile = {
  thread_id?: string;
  name?: string;
  emotional_tone?: string[];
  concerns?: string[];
  onboarding_complete?: boolean;
};

export interface MemoryEntry {
  id: string;
  thread_id: string;
  author_role: "user" | "engine";
  message_id?: string | null;
  summary: string;
  embedding?: number[];
  salience: number;
  tags: string[];
  created_at: string;
  last_accessed: string;
}

// Define a type for the memory payload
interface MemoryPayload {
  thread_id: string;
  author_role: "user" | "engine";
  summary: string;
  salience: number;
  message_id?: string;
  embedding?: number[] | string; // Accept both number[] and string
  tags?: string[];
}

/* ─────────── profile helpers ─────────── */
export async function updateUserProfile(
  threadId: string,
  profileData: Omit<UserProfile, "thread_id">
) {
  try {
    const { error } = await supabase
      .from("profiles")
      .upsert([{ thread_id: threadId, ...profileData }], {
        onConflict: "thread_id",
      });
    if (error) throw error;
  } catch (error) {
    console.error("[sessionMemory] updateUserProfile error:", error);
    // Don't throw, just log the error
  }
}

export async function markOnboardingComplete(threadId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("thread_id", threadId);
    if (error) throw error;
  } catch (error) {
    console.error("[sessionMemory] markOnboardingComplete error:", error);
    // Don't throw, just log the error
  }
}

export async function getUserProfile(
  threadId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("thread_id", threadId)
      .single<UserProfile>();

    if (error) {
      // If the error is just that no rows were found, return null without logging an error
      if (error.code === "PGRST116") {
        console.log(
          `[sessionMemory] No profile found for threadId: ${threadId}`
        );
        return null;
      }

      console.error("[sessionMemory] getUserProfile error:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[sessionMemory] getUserProfile error:", error);
    return null;
  }
}
// Add this function to ensure a profile exists
export async function ensureProfileExists(threadId: string): Promise<boolean> {
  try {
    if (!threadId) {
      console.error("[sessionMemory] Invalid threadId provided: ", threadId);
      return false;
    }

    // First, make sure the thread exists
    const { data: threadExists, error: threadCheckError } = await supabase
      .from("threads")
      .select("id")
      .eq("id", threadId)
      .single();

    if (threadCheckError && threadCheckError.code !== "PGRST116") {
      // PGRST116 means no rows returned - expected if thread doesn't exist yet
      console.error("[sessionMemory] Error checking thread:", threadCheckError);
    }

    // If thread doesn't exist, create it first
    if (!threadExists) {
      const { error: threadCreateError } = await supabase
        .from("threads")
        .insert({ id: threadId });

      if (threadCreateError) {
        console.error(
          "[sessionMemory] Error creating thread:",
          JSON.stringify(threadCreateError)
        );
        return false;
      }
    }

    // Now that we're sure the thread exists, create the profile
    const { error } = await supabase.from("profiles").upsert(
      {
        thread_id: threadId,
        name: "Anonymous",
        emotional_tone: [],
        concerns: [],
      },
      { onConflict: "thread_id" }
    );

    if (error) {
      console.error(
        "[sessionMemory] Error upserting profile:",
        JSON.stringify(error)
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "[sessionMemory] ensureProfileExists error:",
      error instanceof Error ? error.message : JSON.stringify(error)
    );
    return false;
  }
}

/* ─────────── embedding helpers ─────────── */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const openai = createOpenAIClient();
    console.log(
      "[sessionMemory] generateEmbedding: Using model:",
      process.env.EMBEDDING_MODEL || "text-embedding-3-small"
    ); // Added log
    const response = await openai.embeddings.create({
      model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
      input: text,
    });

    console.log(
      "[sessionMemory] generateEmbedding: Successfully generated embedding for text:",
      text.substring(0, 100) + "..."
    ); // Added log, increased substring length
    return response.data[0].embedding;
  } catch (error) {
    console.error(
      "[sessionMemory] generateEmbedding: Error generating embedding:",
      error instanceof Error ? error.message : JSON.stringify(error),
      error
    ); // Modified log to include full error object
    throw error;
  }
}

/* ─────────── memory helpers ─────────── */
export async function insertMemoryForThread({
  threadId,
  author_role,
  message_id,
  summary,
  embedding,
  tags,
}: {
  threadId: string;
  author_role: "user" | "engine";
  message_id?: string;
  summary: string;
  embedding?: number[] | string;
  tags?: string[];
}) {
  try {
    if (!threadId) {
      console.error(
        "[sessionMemory] insertMemoryForThread: Invalid threadId provided:",
        threadId
      ); // Modified log
      return null;
    }

    console.log(
      `[sessionMemory] insertMemoryForThread: Processing memory for thread ${threadId}, role: ${author_role}, summary: ${summary.substring(
        0,
        100
      )}...` // Modified log
    );

    // Generate embedding if not provided
    let finalEmbedding = embedding;
    if (!embedding && summary) {
      try {
        console.log(
          "[sessionMemory] insertMemoryForThread: Attempting to generate embedding for summary...",
          summary.substring(0, 100) + "..."
        ); // Modified log
        finalEmbedding = await generateEmbedding(summary);
        console.log(
          "[sessionMemory] insertMemoryForThread: Embedding generated successfully. Length:",
          (finalEmbedding as number[]).length
        ); // Added log
      } catch (err) {
        console.error(
          "[sessionMemory] insertMemoryForThread: Error generating embedding during insert:", // Modified log
          err instanceof Error ? err.message : JSON.stringify(err),
          err // Added full error object to log
        );
        // Continue without embedding if generation fails
      }
    }

    const payload: MemoryPayload = {
      thread_id: threadId,
      author_role,
      summary,
      salience: 50, // Default salience
    };

    if (message_id) payload.message_id = message_id;
    if (finalEmbedding) {
      // Store the embedding as-is (array of numbers)
      // PostgreSQL's pgvector extension will handle the conversion
      payload.embedding = finalEmbedding;
      console.log(
        "[sessionMemory] insertMemoryForThread: Embedding prepared for Supabase. Type:",
        typeof payload.embedding,
        "Is Array?",
        Array.isArray(finalEmbedding),
        "Length:",
        Array.isArray(finalEmbedding) ? finalEmbedding.length : "unknown"
      );
    }
    if (tags) payload.tags = tags;

    console.log(
      "[sessionMemory] insertMemoryForThread: Inserting memory with payload:",
      JSON.stringify(
        payload,
        (key, value) =>
          key === "embedding" && typeof value === "string" && value.length > 100
            ? value.substring(0, 100) + "..."
            : value,
        2
      )
    ); // Modified log, truncate long embedding string

    const { data, error } = await supabase
      .from("memory")
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error(
        "[sessionMemory] insertMemoryForThread: Error inserting memory into Supabase:", // Modified log
        JSON.stringify(error)
      );
      throw error;
    }

    console.log(
      "[sessionMemory] insertMemoryForThread: Memory inserted successfully into Supabase:",
      data
    ); // Modified log
    return data;
  } catch (error) {
    console.error(
      "[sessionMemory] insertMemoryForThread: General catch block error:", // Modified log
      error instanceof Error ? error.message : JSON.stringify(error),
      error // Added full error object to log
    );
    return null;
  }
}

export async function getRelevantMemories({
  threadId,
  inputText,
  limit = 10,
  threshold = 0.75,
}: {
  threadId: string;
  inputText: string;
  limit?: number;
  threshold?: number;
}): Promise<MemoryEntry[]> {
  try {
    if (!threadId) {
      console.error(
        "[sessionMemory] getRelevantMemories: Invalid threadId provided"
      );
      return [];
    }
    if (!inputText) {
      console.error(
        "[sessionMemory] getRelevantMemories: No input text provided for search"
      );
      return [];
    }

    console.log(
      `[sessionMemory] getRelevantMemories: Searching for memories in thread ${threadId} similar to: "${inputText.substring(
        0,
        50
      )}..." with limit ${limit} and threshold ${threshold}`
    );

    const embedding = await generateEmbedding(inputText);
    console.log(
      "[sessionMemory] getRelevantMemories: Embedding generated for search query."
    );

    // Supabase expects the embedding to be passed as a JSON object
    const { data, error } = await supabase.rpc("get_relevant_memories", {
      p_user_id: threadId, // Parameter name changed from thread_id_input to p_user_id
      p_embedding: embedding, // Passing the embedding as an array which will be converted to jsonb in PostgreSQL
      p_threshold: threshold, // Parameter name changed from similarity_threshold to p_threshold
      p_limit: limit, // Parameter name changed from match_count to p_limit
    });

    if (error) {
      console.error(
        "[sessionMemory] getRelevantMemories: Error calling RPC:",
        JSON.stringify(error)
      );
      throw error;
    }

    console.log(
      "[sessionMemory] getRelevantMemories: Found relevant memories:",
      data
    );
    return (data as MemoryEntry[]) || []; // Cast to MemoryEntry[] and provide a fallback
  } catch (error) {
    console.error(
      "[sessionMemory] getRelevantMemories: General catch block error:",
      error instanceof Error ? error.message : JSON.stringify(error),
      error
    );
    return [];
  }
}

// Get all memories for a thread (not using semantic search)
export async function getMemoryForSession(
  threadId: string
): Promise<MemoryEntry[]> {
  try {
    if (!threadId) {
      console.error(
        "[sessionMemory] getMemoryForSession: Invalid threadId provided"
      );
      return [];
    }

    console.log(
      `[sessionMemory] getMemoryForSession: Retrieving all memories for thread ${threadId}`
    );

    const { data, error } = await supabase
      .from("memory")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "[sessionMemory] getMemoryForSession: Error retrieving memories:",
        JSON.stringify(error)
      );
      throw error;
    }

    console.log(
      `[sessionMemory] getMemoryForSession: Retrieved ${data.length} memories for thread ${threadId}`
    );
    return data as MemoryEntry[];
  } catch (error) {
    console.error(
      "[sessionMemory] getMemoryForSession: General error:",
      error instanceof Error ? error.message : JSON.stringify(error),
      error
    );
    return [];
  }
}

// Delete all memories for a thread
export async function deleteMemoryForThread(threadId: string): Promise<void> {
  try {
    if (!threadId) {
      console.error(
        "[sessionMemory] deleteMemoryForThread: Invalid threadId provided"
      );
      return;
    }

    console.log(
      `[sessionMemory] deleteMemoryForThread: Deleting memories for thread ${threadId}`
    );

    const { error } = await supabase
      .from("memory")
      .delete()
      .eq("thread_id", threadId);

    if (error) {
      console.error(
        "[sessionMemory] deleteMemoryForThread: Error deleting memories:",
        JSON.stringify(error)
      );
      throw error;
    }

    console.log(
      `[sessionMemory] deleteMemoryForThread: Successfully deleted memories for thread ${threadId}`
    );
  } catch (error) {
    console.error(
      "[sessionMemory] deleteMemoryForThread: General error:",
      error instanceof Error ? error.message : JSON.stringify(error),
      error
    );
    throw error;
  }
}
