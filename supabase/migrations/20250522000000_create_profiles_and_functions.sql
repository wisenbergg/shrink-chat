-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid UNIQUE,
    thread_id     uuid UNIQUE,
    name          text,
    emotional_tone text[] NOT NULL DEFAULT '{}'::text[],
    concerns      text[] NOT NULL DEFAULT '{}'::text[],
    onboarding_completed boolean DEFAULT false,
    created_at    timestamptz DEFAULT now(),
    updated_at    timestamptz DEFAULT now() -- Added updated_at column
);

-- Index for thread_id lookup
CREATE INDEX IF NOT EXISTS profiles_thread_id_idx ON public.profiles(thread_id);

-- Function to get relevant memories by vector similarity
CREATE OR REPLACE FUNCTION public.get_relevant_memories(
    p_embedding jsonb,
    p_threshold float,
    p_limit integer,
    p_thread_id uuid
) RETURNS TABLE (
    id uuid,
    summary text,
    similarity_score float
) LANGUAGE plpgsql AS $$
BEGIN
    -- Check if thread exists in profiles
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE thread_id = p_thread_id) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        m.id,
        m.summary,
        1 - (m.embedding::text::vector <-> p_embedding::text::vector) as similarity_score
    FROM public.memory m
    WHERE 
        m.thread_id = p_thread_id
        AND m.embedding IS NOT NULL
        AND 1 - (m.embedding::text::vector <-> p_embedding::text::vector) >= p_threshold
    ORDER BY similarity_score DESC
    LIMIT p_limit;
END;
$$;

-- Trigger to update updated_at timestamp on profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow full access during development
CREATE POLICY "dev open profiles" ON public.profiles
    FOR ALL USING (true) WITH CHECK (true);

-- Function to ensure user exists before memory creation
CREATE OR REPLACE FUNCTION public.check_memory_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE thread_id = NEW.thread_id) THEN
        RAISE EXCEPTION 'Cannot create memory entry: No associated user found for thread_id %', NEW.thread_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for memory table to ensure user exists
CREATE TRIGGER check_memory_user_trigger
    BEFORE INSERT ON public.memory
    FOR EACH ROW
    EXECUTE FUNCTION public.check_memory_user();
