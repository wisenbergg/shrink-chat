-- Create threads table that is referenced by profiles and memory tables
CREATE TABLE IF NOT EXISTS public.threads (
    id          uuid PRIMARY KEY,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- Add foreign key from profiles to threads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint 
        WHERE  conname = 'fk_profiles_thread_id'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT fk_profiles_thread_id 
        FOREIGN KEY (thread_id) 
        REFERENCES public.threads(id) 
        ON DELETE CASCADE;
    END IF;
END;
$$;

-- Add foreign key from memory to threads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM   pg_constraint 
        WHERE  conname = 'fk_memory_thread_id'
    ) THEN
        ALTER TABLE public.memory 
        ADD CONSTRAINT fk_memory_thread_id 
        FOREIGN KEY (thread_id) 
        REFERENCES public.threads(id) 
        ON DELETE CASCADE;
    END IF;
END;
$$;

-- Trigger to update updated_at timestamp on threads
CREATE TRIGGER update_threads_updated_at
    BEFORE UPDATE ON public.threads
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- RLS policies for threads
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;

-- Allow full access during development
CREATE POLICY "dev open threads" ON public.threads
    FOR ALL USING (true) WITH CHECK (true);
