-- Drop existing trigger and function
DROP TRIGGER IF EXISTS check_memory_user_trigger ON public.memory;
DROP FUNCTION IF EXISTS public.check_memory_user;

-- Create new function that auto-creates necessary records
CREATE OR REPLACE FUNCTION public.check_memory_user()
RETURNS TRIGGER AS $$
BEGIN
    -- First check if thread exists
    IF NOT EXISTS (SELECT 1 FROM public.threads WHERE id = NEW.thread_id) THEN
        -- Auto-create thread if it doesn't exist
        INSERT INTO public.threads (id) VALUES (NEW.thread_id);
        RAISE NOTICE 'Auto-created thread with ID %', NEW.thread_id;
    END IF;
    
    -- Now check if profile exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE thread_id = NEW.thread_id) THEN
        -- Auto-create profile if it doesn't exist
        INSERT INTO public.profiles (thread_id, name, emotional_tone, concerns) 
        VALUES (NEW.thread_id, 'Auto-created', ARRAY[]::text[], ARRAY[]::text[]);
        RAISE NOTICE 'Auto-created profile for thread ID %', NEW.thread_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER check_memory_user_trigger
    BEFORE INSERT ON public.memory
    FOR EACH ROW
    EXECUTE FUNCTION public.check_memory_user();

-- Add foreign key from profiles to threads if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_profiles_thread_id' 
        AND table_name = 'profiles'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT fk_profiles_thread_id 
        FOREIGN KEY (thread_id) 
        REFERENCES public.threads(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key from memory to threads if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_memory_thread_id' 
        AND table_name = 'memory'
    ) THEN
        ALTER TABLE public.memory 
        ADD CONSTRAINT fk_memory_thread_id 
        FOREIGN KEY (thread_id) 
        REFERENCES public.threads(id) 
        ON DELETE CASCADE;
    END IF;
END $$;
