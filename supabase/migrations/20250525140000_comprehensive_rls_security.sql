-- Comprehensive RLS Security Implementation
-- This migration ensures all tables have proper Row Level Security policies

-- Check if feedback table exists and enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback' AND table_schema = 'public') THEN
        ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for feedback table
        DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.feedback;
        CREATE POLICY "Allow all operations for authenticated users" ON public.feedback
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Check if users table exists and enable RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        -- Create policy for users table - users can only see their own data
        DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
        CREATE POLICY "Users can view their own data" ON public.users
            FOR SELECT
            TO authenticated
            USING (auth.uid()::text = id);
            
        DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
        CREATE POLICY "Users can update their own data" ON public.users
            FOR UPDATE
            TO authenticated
            USING (auth.uid()::text = id)
            WITH CHECK (auth.uid()::text = id);
            
        DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
        CREATE POLICY "Users can insert their own data" ON public.users
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid()::text = id);
    END IF;
END $$;

-- Enhance existing table policies with more specific rules

-- Update threads table policies for better security
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.threads;
CREATE POLICY "Users can manage their own threads" ON public.threads
    FOR ALL
    TO authenticated
    USING (auth.uid() = id OR auth.role() = 'service_role')
    WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- Update profiles table policies
DROP POLICY IF EXISTS "dev open profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.profiles;
CREATE POLICY "Users can manage their own profiles" ON public.profiles
    FOR ALL
    TO authenticated
    USING (auth.uid() = thread_id OR auth.role() = 'service_role')
    WITH CHECK (auth.uid() = thread_id OR auth.role() = 'service_role');

-- Update memory table policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.memory;
CREATE POLICY "Users can manage their own memories" ON public.memory
    FOR ALL
    TO authenticated
    USING (auth.uid() = thread_id OR auth.role() = 'service_role')
    WITH CHECK (auth.uid() = thread_id OR auth.role() = 'service_role');

-- Update messages table policies
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.messages;
CREATE POLICY "Users can manage their own messages" ON public.messages
    FOR ALL
    TO authenticated
    USING (
        auth.uid() = (SELECT t.id FROM threads t WHERE t.id = messages.thread_id)
        OR auth.role() = 'service_role'
    )
    WITH CHECK (
        auth.uid() = (SELECT t.id FROM threads t WHERE t.id = messages.thread_id)
        OR auth.role() = 'service_role'
    );

-- Create a function to check RLS status
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE(
    table_name text,
    rls_enabled boolean,
    policy_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::text,
        t.rowsecurity,
        COUNT(p.policyname)
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
        AND t.tablename NOT LIKE 'pg_%'
        AND t.tablename NOT LIKE 'sql_%'
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_rls_status() TO authenticated;

-- Create a security audit function
CREATE OR REPLACE FUNCTION security_audit()
RETURNS TABLE(
    table_name text,
    rls_status text,
    recommendation text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::text,
        CASE 
            WHEN t.rowsecurity THEN 'Enabled'
            ELSE 'DISABLED - HIGH RISK'
        END as rls_status,
        CASE 
            WHEN NOT t.rowsecurity THEN 'Enable RLS immediately'
            WHEN COUNT(p.policyname) = 0 THEN 'Add RLS policies'
            ELSE 'Review policy effectiveness'
        END as recommendation
    FROM pg_tables t
    LEFT JOIN pg_policies p ON t.tablename = p.tablename
    WHERE t.schemaname = 'public'
        AND t.tablename NOT LIKE 'pg_%'
        AND t.tablename NOT LIKE 'sql_%'
    GROUP BY t.tablename, t.rowsecurity
    ORDER BY t.rowsecurity ASC, t.tablename;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION security_audit() TO authenticated;
