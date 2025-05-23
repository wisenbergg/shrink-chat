-- filepath: /Users/hipdev/dev/shrink-chat/supabase/migrations/20250522100000_implement_vector_memory.sql
-- Implement vector-enabled memory table for efficient memory recall

-- First ensure pgvector extension is installed
CREATE EXTENSION IF NOT EXISTS vector;

-- Update the memory table to use vector type instead of jsonb for embeddings
ALTER TABLE public.memory
  ALTER COLUMN embedding TYPE vector(1536)
  USING (
    CASE
      -- preserve NULLs
      WHEN embedding IS NULL THEN NULL

      -- if it was stored as a JSONB string (i.e. '"[0.1,0.2,…]"')
      WHEN jsonb_typeof(embedding) = 'string' THEN
        trim(both '"' from embedding::text)::vector(1536)

      -- if it’s a proper JSONB array ([0.1,0.2,…])
      ELSE
        embedding::text::vector(1536)
    END
  );

-- Create vector search index for faster similarity searches
-- This index was manually created after a temporary increase in maintenance_work_mem.
-- The IF NOT EXISTS clause ensures this statement won't error if the index already exists.
CREATE INDEX IF NOT EXISTS memory_embedding_idx 
ON public.memory USING ivfflat (embedding vector_cosine_ops);

-- Update the get_relevant_memories function to use proper vector operations
CREATE OR REPLACE FUNCTION public.get_relevant_memories(
    p_embedding vector(1536),
    p_user_id uuid, -- Parameter without default moved before parameters with defaults
    p_threshold float DEFAULT 0.7,
    p_limit integer DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    thread_id uuid,
    summary text,
    similarity_score float
)
LANGUAGE plpgsql AS $$
BEGIN
    -- Check if thread_id for the given p_user_id exists in threads
    IF NOT EXISTS (SELECT 1 FROM public.threads WHERE public.threads.id = p_user_id) THEN
        RAISE WARNING 'No matching thread found for p_user_id: %', p_user_id;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        m.id,
        m.thread_id,
        m.summary,
        1 - (m.embedding <=> p_embedding) as similarity_score
    FROM public.memory m
    WHERE 
        m.thread_id = p_user_id 
        AND m.embedding IS NOT NULL
        AND 1 - (m.embedding <=> p_embedding) >= p_threshold
    ORDER BY similarity_score DESC
    LIMIT p_limit;
END;
$$;
