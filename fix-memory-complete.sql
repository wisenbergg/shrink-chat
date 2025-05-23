-- filepath: /Users/hipdev/dev/shrink-chat/fix-memory-complete.sql
-- Complete fix for memory triggers and functions

-- 1. First, identify all triggers on the memory table
SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgrelid = 'public.memory'::regclass;

-- 2. Drop ALL triggers on the memory table
DROP TRIGGER IF EXISTS check_memory_user_trigger ON public.memory;
DROP TRIGGER IF EXISTS memory_user_check ON public.memory;
DROP TRIGGER IF EXISTS memory_auto_create_trigger ON public.memory;
DROP TRIGGER IF EXISTS memory_user_isolation_trigger ON public.memory;

-- 3. Search for any functions containing the error message
SELECT proname, prosrc 
FROM pg_proc 
WHERE prosrc LIKE '%Cannot create memory entry%'
  OR prosrc LIKE '%No associated user found%';

-- 4. Drop ALL functions that might be causing the issue
DROP FUNCTION IF EXISTS public.check_memory_user CASCADE;
DROP FUNCTION IF EXISTS public.ensure_memory_user CASCADE;
DROP FUNCTION IF EXISTS public.validate_memory_user CASCADE;
DROP FUNCTION IF EXISTS public.memory_check_user CASCADE;
DROP FUNCTION IF EXISTS public.memory_user_validation CASCADE;

-- 5. Create a clean new function with debugging
CREATE OR REPLACE FUNCTION public.auto_create_dependencies()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'Trigger activated for thread_id: %', NEW.thread_id;
    
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
    
    RAISE NOTICE 'Memory trigger successful for thread_id: %', NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a trigger with a completely new name
CREATE TRIGGER memory_dependency_creator
    BEFORE INSERT ON public.memory
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_create_dependencies();

-- 7. Verify the trigger was created
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgrelid = 'public.memory'::regclass;

-- 8. Test inserting a memory record directly
DO $$
DECLARE
    test_thread_id UUID := gen_random_uuid();
    memory_id UUID;
BEGIN
    -- Try direct memory insertion
    RAISE NOTICE 'Testing memory insertion with thread ID: %', test_thread_id;
    
    INSERT INTO public.memory (thread_id, author_role, summary, salience)
    VALUES (test_thread_id, 'user', 'Test memory entry from SQL', 50)
    RETURNING id INTO memory_id;
    
    RAISE NOTICE 'Memory inserted successfully with ID: %', memory_id;
    
    -- Check if thread was auto-created
    IF EXISTS (SELECT 1 FROM public.threads WHERE id = test_thread_id) THEN
        RAISE NOTICE 'Thread auto-created successfully ✓';
    ELSE
        RAISE NOTICE 'Thread was NOT auto-created ✗';
    END IF;
    
    -- Check if profile was auto-created
    IF EXISTS (SELECT 1 FROM public.profiles WHERE thread_id = test_thread_id) THEN
        RAISE NOTICE 'Profile auto-created successfully ✓';
    ELSE
        RAISE NOTICE 'Profile was NOT auto-created ✗';
    END IF;
END $$;
