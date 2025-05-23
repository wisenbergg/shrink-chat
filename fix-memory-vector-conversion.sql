-- Fix memory search by adding jsonb_to_vector function

-- Make sure the pgvector extension is available
CREATE EXTENSION IF NOT EXISTS pgvector;

-- First, create the jsonb_to_vector function to convert JSON arrays to vectors
CREATE OR REPLACE FUNCTION public.jsonb_to_vector(embedding_json jsonb)
RETURNS vector
LANGUAGE plpgsql
AS $$
DECLARE
    vector_array float[];
    vector_result vector;
BEGIN
    -- Convert the jsonb array to a float array
    SELECT array_agg(x::float) INTO vector_array
    FROM jsonb_array_elements_text(embedding_json) x;
    
    -- Convert float array to vector
    vector_result = vector_array::vector;
    
    RETURN vector_result;
END;
$$;

-- Now update the get_relevant_memories function to properly handle JSON inputs
CREATE OR REPLACE FUNCTION public.get_relevant_memories(
    p_embedding jsonb,
    p_user_id uuid,
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
DECLARE
    vector_embedding vector(1536);
BEGIN
    -- Check if thread_id exists
    IF NOT EXISTS (SELECT 1 FROM public.threads WHERE id = p_user_id) THEN
        RAISE WARNING 'No matching thread found for thread_id: %', p_user_id;
        RETURN;
    END IF;

    -- Convert JSON embedding to vector using our jsonb_to_vector function
    vector_embedding := jsonb_to_vector(p_embedding);
    
    RETURN QUERY
    SELECT 
        m.id,
        m.thread_id,
        m.summary,
        1 - (m.embedding <=> vector_embedding) as similarity_score
    FROM public.memory m
    WHERE 
        m.thread_id = p_user_id
        AND m.embedding IS NOT NULL
        AND 1 - (m.embedding <=> vector_embedding) >= p_threshold
    ORDER BY similarity_score DESC
    LIMIT p_limit;
END;
$$;
