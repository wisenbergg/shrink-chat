-- Supabase Schema for Shrink Chat Application
-- Created: May 22, 2025
-- This schema addresses the UUID thread ID issues and memory table relationship problems

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop triggers first to avoid conflicts when recreating tables
DROP TRIGGER IF EXISTS memory_user_check ON memory;

-- Drop existing tables with CASCADE to remove dependencies
DROP TABLE IF EXISTS memory CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS threads CASCADE;

-- Create threads table
-- This is the parent table that both profiles and memory depend on
CREATE TABLE public.threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    model_name TEXT,
    system_prompt TEXT,
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Add an update trigger for the updated_at field
CREATE OR REPLACE FUNCTION update_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER threads_updated_at
BEFORE UPDATE ON threads
FOR EACH ROW
EXECUTE FUNCTION update_threads_updated_at();

-- Create profiles table
-- Each thread has exactly one profile
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID UNIQUE NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    name TEXT DEFAULT 'New User',
    emotional_tone TEXT[] DEFAULT ARRAY[]::TEXT[],
    concerns TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Ensure one-to-one relationship with threads
    CONSTRAINT profiles_thread_id_unique UNIQUE (thread_id)
);

-- Add an update trigger for the updated_at field
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_updated_at();

-- Create memory table
CREATE TABLE public.memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster memory lookups
CREATE INDEX memory_thread_id_idx ON memory(thread_id);
CREATE INDEX memory_key_idx ON memory(key);

-- Create combined index for thread_id and key for common query patterns
CREATE INDEX memory_thread_key_idx ON memory(thread_id, key);

-- Create auto-creation trigger for memory
-- This trigger will automatically create thread and profile records if they don't exist
CREATE OR REPLACE FUNCTION public.check_memory_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-create thread if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.threads WHERE id = NEW.thread_id) THEN
        INSERT INTO public.threads (id) 
        VALUES (NEW.thread_id);
    END IF;
    
    -- Auto-create profile if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE thread_id = NEW.thread_id) THEN
        INSERT INTO public.profiles (thread_id, name, emotional_tone, concerns) 
        VALUES (NEW.thread_id, 'Auto-created', ARRAY[]::text[], ARRAY[]::text[]);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to the memory table
CREATE TRIGGER memory_user_check
BEFORE INSERT ON memory
FOR EACH ROW
EXECUTE FUNCTION public.check_memory_user();

-- Create RLS policies
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for authenticated users
-- In a production environment, you would want to restrict these further
CREATE POLICY "Allow all operations for authenticated users" ON public.threads
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.profiles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.memory
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create a view that joins memory with profile information for easy querying
CREATE OR REPLACE VIEW memory_with_profile AS
SELECT 
    m.id as memory_id,
    m.thread_id,
    m.key,
    m.value,
    m.created_at as memory_created_at,
    p.id as profile_id,
    p.name as profile_name,
    p.emotional_tone,
    p.concerns
FROM 
    memory m
JOIN 
    profiles p ON m.thread_id = p.thread_id;

-- Create a function to help with memory insertion that ensures thread and profile exist
CREATE OR REPLACE FUNCTION insert_memory_with_thread(
    p_thread_id UUID,
    p_key TEXT,
    p_value TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
) 
RETURNS UUID AS $$
DECLARE
    v_memory_id UUID;
BEGIN
    -- Insert memory (trigger will handle thread and profile creation)
    INSERT INTO memory (thread_id, key, value, metadata)
    VALUES (p_thread_id, p_key, p_value, p_metadata)
    RETURNING id INTO v_memory_id;
    
    RETURN v_memory_id;
END;
$$ LANGUAGE plpgsql;

-- Create a helper function to retrieve all memory for a thread
CREATE OR REPLACE FUNCTION get_thread_memory(p_thread_id UUID)
RETURNS TABLE (
    memory_id UUID,
    key TEXT,
    value TEXT,
    created_at TIMESTAMPTZ,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id as memory_id,
        m.key,
        m.value,
        m.created_at,
        m.metadata
    FROM
        memory m
    WHERE
        m.thread_id = p_thread_id
    ORDER BY
        m.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments:
-- 1. This schema fixes the issue with UUID thread IDs by ensuring proper foreign key relationships
-- 2. The check_memory_user trigger auto-creates threads and profiles instead of blocking insertion
-- 3. The one-to-one relationship between threads and profiles is enforced
-- 4. Helper functions simplify common operations
-- 5. Proper indexing improves query performance
