import { createClient } from "@supabase/supabase-js";

export async function recallMemory(
  prompt: string,
  threadId: string,
  limit = 5,
  threshold = 0.0
) {
  if (!prompt.trim()) return { recallUsed: false, results: [] };

  // 1) Generate embedding for the prompt
  const openai = createOpenAIClient();
  const res = await openai.embeddings.create({
    model: process.env.EMBEDDING_MODEL!,
    input: prompt,
  });
  const inputEmbedding = res.data[0].embedding; // number[]

  // 2) Call your Supabase RPC
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
  );
  const { data, error } = await supabase.rpc(
    "get_relevant_memories",
    {
      p_embedding: JSON.stringify(inputEmbedding), // JSONB
      p_limit: limit,
      p_threshold: threshold,
      p_user_id: threadId,
    }
  );

  if (error) {
    console.error("Memory recall error:", error);
    return { recallUsed: false, results: [] };
  }

  // 3) Return the summaries (and scores)
  return {
    recallUsed: (data as any[]).length > 0,
    results: (data as any[]).map((row) => ({
      id: row.id,
      summary: row.summary,
      score: row.similarity_score,
    })),
  };
}
