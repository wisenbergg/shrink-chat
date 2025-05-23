-- Update get_relevant_memories function to use jsonb_to_vector function

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
BEGIN
    -- Check if thread_id for the given p_user_id exists in threads
    IF NOT EXISTS (SELECT 1 FROM public.threads WHERE public.threads.id = p_user_id) THEN
        RAISE WARNING 'No matching thread found for p_user_id: %', p_user_id;
        RETURN;
    END IF;

    -- Convert the jsonb embedding to a vector using our new function
    DECLARE
        vector_embedding vector(1536);
    BEGIN
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
END;
$$;
