-- Redefine the get_relevant_memories function with correct parameter order

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
    -- Check if thread_id for the given p_user_id exists in profiles
    -- Assuming p_user_id is the user's ID and we need to find their associated thread_id
    -- This part might need adjustment based on your exact schema and how p_user_id relates to threads.
    -- For now, proceeding with the logic that p_user_id is directly the thread_id to search for.
    IF NOT EXISTS (SELECT 1 FROM public.threads WHERE public.threads.id = p_user_id) THEN
        -- Or, if p_user_id is a user_id that links to a thread_id in profiles:
        -- IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.user_id = p_user_id AND public.profiles.thread_id IS NOT NULL) THEN
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
        m.thread_id = p_user_id -- Assuming p_user_id is the target thread_id
        AND m.embedding IS NOT NULL
        AND 1 - (m.embedding <=> p_embedding) >= p_threshold
    ORDER BY similarity_score DESC
    LIMIT p_limit;
END;
$$;
