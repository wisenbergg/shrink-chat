# Memory Functionality Fix - Quick Guide

## What's Fixed

This fix addresses the error: `function jsonb_to_vector(vector) does not exist`

The issue was that when requesting relevant memories, the vector embedding data was sent in a format that PostgreSQL couldn't process directly. We've added a conversion function and updated the code to handle embeddings correctly.

## How to Apply the Fix

### Option 1: Automated Fix (Recommended)

Run the direct fix script:

```bash
node direct-fix-memory.mjs
```

This will:

1. Apply the SQL changes to your database
2. Run a test to verify it works
3. Show results

### Option 2: Manual Fix

If the automated fix doesn't work, apply the steps manually:

1. Apply the SQL fix:

   ```bash
   ./apply-vector-fix.sh
   ```

2. Test the fix:
   ```bash
   ./test-vector-fix.sh
   ```

## Verification

The fix is successful when:

- Memories can be stored with proper embeddings
- Semantic search returns relevant memories with similarity scores

## Troubleshooting

If issues persist:

- Make sure pgvector extension is installed in PostgreSQL
- Check that embedding column has type vector(1536)
- Review logs for any errors in embedding generation

For detailed documentation, see `docs/memory-fix.md`.
