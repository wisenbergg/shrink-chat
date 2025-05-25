-- Create the missing messages table that feedback table references
-- This table is used by logChat.ts and referenced by feedback table

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    turn INTEGER NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS messages_thread_id_idx ON messages(thread_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS messages_thread_turn_idx ON messages(thread_id, turn);

-- Enable RLS (Row Level Security)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY IF NOT EXISTS "Allow all operations for authenticated users" ON public.messages
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Verify the feedback table constraint now works
-- (The foreign key constraint should now be valid)
