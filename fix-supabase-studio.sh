#!/bin/bash
# filepath: /Users/hipdev/dev/shrink-chat/fix-supabase-studio.sh

echo "📋 Copying SQL to clipboard for pasting into Supabase Studio..."

# SQL to fix the memory trigger issue
SQL="-- Direct SQL script to fix memory trigger issue

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS check_memory_user_trigger ON public.memory;
DROP FUNCTION IF EXISTS public.check_memory_user;

-- Create new function that auto-creates necessary records
CREATE OR REPLACE FUNCTION public.check_memory_user()
RETURNS TRIGGER AS \$\$
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
\$\$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER check_memory_user_trigger
    BEFORE INSERT ON public.memory
    FOR EACH ROW
    EXECUTE FUNCTION public.check_memory_user();

-- Add foreign keys if they don't exist
DO \$\$ 
BEGIN
    -- Add foreign key from profiles to threads if it doesn't exist
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
    
    -- Add foreign key from memory to threads if it doesn't exist
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
END \$\$;"

# Copy SQL to clipboard
echo "$SQL" | pbcopy

echo "✅ SQL copied to clipboard!"
echo ""
echo "🔄 Please follow these steps to apply the fix:"
echo "1. Go to https://app.supabase.com"
echo "2. Select your project: $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '/' -f3)"
echo "3. Click on 'SQL Editor' in the left sidebar"
echo "4. Click 'New Query'"
echo "5. Paste the SQL from your clipboard (Command+V)"
echo "6. Click 'Run' to execute"
echo ""
echo "After running the SQL, come back here and press Enter to test if it worked."

# Wait for user to press Enter
read -p "Press Enter when you've applied the SQL in Supabase Studio... " dummy

echo ""
echo "🧪 Testing if the fix worked..."
node test-memory-workflow.mjs
