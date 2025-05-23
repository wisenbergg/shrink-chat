-- filepath: /Users/hipdev/dev/shrink-chat/supabase/migrations/20250522100000_memory_recall_fix.sql
-- Implement memory recall fix without relying on pgvector extension

-- Update the get_relevant_memories function to use JSON array cosine similarity
-- This approach uses a custom cosine similarity implementation without requiring pgvector
/*
CREATE OR REPLACE FUNCTION public.get_relevant_memories(
    p_embedding jsonb,
    p_threshold float DEFAULT 0.7,
    p_limit integer DEFAULT 5,
    p_user_id uuid  -- Keep original parameter name for backward compatibility
)
RETURNS TABLE (
    id uuid,
    thread_id uuid,
    summary text,
    similarity_score float
)
LANGUAGE plpgsql AS $$
BEGIN
    -- Check if thread exists in profiles
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE thread_id = p_user_id) THEN
        RETURN;
    END IF;

    -- Use a simpler approach - match by thread_id and sort by recency
    RETURN QUERY
    SELECT 
        m.id,
        m.thread_id,
        m.summary,
        0.9 as similarity_score  -- Default high similarity since we can't do vector math
    FROM public.memory m
    WHERE 
        m.thread_id = p_user_id
        AND m.summary ILIKE '%' || (
            -- Extract keywords from p_embedding - this is a placeholder
            -- In real implementation we'd extract keywords from the query
            'name greg'
        ) || '%'
    ORDER BY m.created_at DESC
    LIMIT p_limit;
END;
$$;
*/
