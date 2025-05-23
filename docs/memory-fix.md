# Memory Functionality Fix

This document outlines the fix for the vector memory functionality in the Shrink Chat application.

## Problem

The application was encountering an error when trying to retrieve relevant memories:

```
function jsonb_to_vector(vector) does not exist
```

The issue occurred because:

1. Embeddings were being stored in the database correctly
2. When retrieving memories, the embedding was passed as a JSON array, but the PostgreSQL function expected a vector type
3. No conversion function existed to transform the JSON into a PostgreSQL vector

## Solution

The fix consists of three main components:

1. **SQL Fix**: Adding a `jsonb_to_vector` function to the PostgreSQL database
2. **Client Code Fix**: Ensuring embeddings are passed correctly to the PostgreSQL RPC functions
3. **Tests**: Scripts to validate the fix works correctly

### 1. SQL Fix

We created a database function `jsonb_to_vector` that converts a JSON array to a PostgreSQL vector:

```sql
CREATE OR REPLACE FUNCTION public.jsonb_to_vector(embedding_json jsonb)
RETURNS vector
LANGUAGE plpgsql
AS $$
DECLARE
    vector_array float[];
    vector_result vector;
BEGIN
    -- Convert the jsonb array to a float array
    SELECT array_agg(x::float) INTO vector_array
    FROM jsonb_array_elements_text(embedding_json) x;

    -- Convert float array to vector
    vector_result = vector_array::vector;

    RETURN vector_result;
END;
$$;
```

We also updated the `get_relevant_memories` function to use this conversion function:

```sql
CREATE OR REPLACE FUNCTION public.get_relevant_memories(
    p_embedding jsonb,
    p_user_id uuid,
    p_threshold float DEFAULT 0.7,
    p_limit integer DEFAULT 5
)
RETURNS TABLE (
    id uuid,
    thread_id uuid,
    summary text,
    similarity_score float
)
LANGUAGE plpgsql AS $$
DECLARE
    vector_embedding vector(1536);
BEGIN
    -- Check if thread_id exists
    IF NOT EXISTS (SELECT 1 FROM public.threads WHERE id = p_user_id) THEN
        RAISE WARNING 'No matching thread found for thread_id: %', p_user_id;
        RETURN;
    END IF;

    -- Convert JSON embedding to vector using our jsonb_to_vector function
    vector_embedding := jsonb_to_vector(p_embedding);

    RETURN QUERY
    SELECT
        m.id,
        m.thread_id,
        m.summary,
        1 - (m.embedding <=> vector_embedding) as similarity_score
    FROM public.memory m
    WHERE
        m.thread_id = p_user_id
        AND m.embedding IS NOT NULL
        AND 1 - (m.embedding <=> vector_embedding) >= p_threshold
    ORDER BY similarity_score DESC
    LIMIT p_limit;
END;
$$;
```

### 2. Client Code Fix

We updated the `getRelevantMemories` function in `sessionMemory.ts` to pass the embedding correctly:

```typescript
const { data, error } = await supabase.rpc("get_relevant_memories", {
  p_user_id: threadId,
  p_embedding: embedding, // Pass the embedding as an array, PostgreSQL will convert it to jsonb
  p_threshold: threshold,
  p_limit: limit,
});
```

We also ensured that the `insertMemoryForThread` function correctly stores embeddings as arrays:

```typescript
if (finalEmbedding) {
  // Store the embedding as-is (array of numbers)
  // PostgreSQL's pgvector extension will handle the conversion
  payload.embedding = finalEmbedding;
}
```

### 3. Testing Scripts

Three scripts were created to test the functionality:

1. `fix-memory-vector-conversion.sql` - The SQL file with the database fix
2. `apply-vector-fix.sh` - Script to apply the SQL fix to the database
3. `test-vector-fix.sh` - Script to test that memory retrieval works correctly

## How to Apply the Fix

1. Run the SQL fix:

   ```bash
   ./apply-vector-fix.sh
   ```

2. Test that everything works:
   ```bash
   ./test-vector-fix.sh
   ```

## Validation

The fix is working correctly when:

1. Memories can be stored in the database with proper embeddings
2. Relevant memories can be retrieved using semantic search
3. The returned memories have a similarity score and are sorted by relevance

If the tests pass, you should see outputs with memories and similarity scores in the test results.

## Troubleshooting

If issues persist:

1. Check that the pgvector extension is installed in your PostgreSQL database:

   ```sql
   CREATE EXTENSION IF NOT EXISTS pgvector;
   ```

2. Verify the embedding column in the memory table has the correct type:

   ```sql
   ALTER TABLE public.memory ADD COLUMN IF NOT EXISTS embedding vector(1536);
   ```

3. Check the logs for any errors in the embedding generation process

## References

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Supabase Vector Documentation](https://supabase.com/docs/guides/ai/vector-columns)
