-- filepath: /Users/hipdev/dev/shrink-chat/implement-vector-memory.sql
-- Implement vector-enabled memory table

-- First ensure pgvector extension is installed
CREATE EXTENSION IF NOT EXISTS pgvector;

-- Alter memory table to add vector embedding column
-- (Only if your current memory table doesn't have it yet)
ALTER TABLE public.memory 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create vector search index
CREATE INDEX IF NOT EXISTS memory_embedding_idx 
ON public.memory USING ivfflat (embedding vector_cosine_ops);

-- Create a function for semantic search
CREATE OR REPLACE FUNCTION public.search_memories_by_embedding(
    p_embedding vector(1536),
    p_thread_id uuid,
    p_match_threshold float DEFAULT 0.7,
    p_match_count int DEFAULT 10
)
RETURNS TABLE (
    id uuid,
    thread_id uuid,
    summary text,
    created_at timestamptz,
    similarity float
)
LANGUAGE sql
AS $$
    SELECT 
        m.id,
        m.thread_id,
        m.summary,
        m.created_at,
        1 - (m.embedding <=> p_embedding) as similarity
    FROM 
        public.memory m
    WHERE 
        m.thread_id = p_thread_id
        AND m.embedding IS NOT NULL
        AND 1 - (m.embedding <=> p_embedding) >= p_match_threshold
    ORDER BY 
        similarity DESC
    LIMIT 
        p_match_count;
$$;
