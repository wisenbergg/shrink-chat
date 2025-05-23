-- filepath: /Users/hipdev/dev/shrink-chat/fix-memory-trigger-final.sql
-- FINAL FIX: Replace memory trigger with auto-creation version

-- First, explicitly drop any existing triggers on memory table
DROP TRIGGER IF EXISTS memory_user_check ON public.memory;
DROP TRIGGER IF EXISTS check_memory_user_trigger ON public.memory;

-- Then drop the existing function with CASCADE to ensure all dependencies are removed
DROP FUNCTION IF EXISTS public.check_memory_user CASCADE;

-- Now create the new function that auto-creates threads and profiles
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

-- Finally create the new trigger with a unique name
CREATE TRIGGER memory_auto_create_trigger
    BEFORE INSERT ON public.memory
    FOR EACH ROW
    EXECUTE FUNCTION public.check_memory_user();

-- Verify by showing triggers on memory table
SELECT tgname, tgrelid::regclass AS table_name, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'public.memory'::regclass;
