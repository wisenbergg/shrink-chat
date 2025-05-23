-- Install pgvector extension in Supabase
CREATE EXTENSION IF NOT EXISTS vector;

-- Check if vector extension is installed
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
