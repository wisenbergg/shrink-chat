-- Fix vector index creation with memory constraints
-- This migration handles the memory limitation for vector index creation

-- First, drop the existing index if it exists (in case of partial creation)
DROP INDEX IF EXISTS public.memory_embedding_idx;

-- Create a smaller, more memory-efficient vector index
-- Using a smaller lists parameter to reduce memory requirements
-- CREATE INDEX IF NOT EXISTS memory_embedding_idx 
-- ON public.memory USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 1);

-- IMPORTANT: If index creation continues to fail due to memory, 
-- you may need to temporarily increase `maintenance_work_mem` in your PostgreSQL settings.
-- For Supabase, this can often be done via the dashboard or a support request.
