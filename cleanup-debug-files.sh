#!/bin/zsh
# filepath: /Users/hipdev/dev/shrink-chat/cleanup-debug-files.sh

echo "🧹 Starting cleanup of debugging scripts and temporary files..."

# Array of debugging files to remove
DEBUG_FILES=(
  # Test scripts
  "test-memory-workflow.mjs"
  "test-direct-insert.mjs"
  "test-memory-insert.js"
  "test-memory-system.sh"
  "check-trigger.js"
  "check-trigger-status.js"
  "check-db-status.mjs"
  "thread-test.ts"
  "testMemory.ts"

  # Fix scripts
  "fix-memory-trigger.cjs"
  "fix-memory-trigger.sh"
  "fix-memory-trigger-cli.sh"
  "fix-memory-direct.js"
  "fix-memory-constraints.sh"
  "direct-fix-trigger.cjs"
  "direct-fix-trigger.mjs"
  "direct-fix-simple.mjs"
  "apply-fix.mjs"
  "apply-fix.sh"
  "apply-sql-fix.sh"
  "apply-memory-fix.sh"
  "direct-memory-fix.sh"
  "fix-supabase-studio.sh"
  "fix-threads.sh"
  "fix-with-psql.sh"
  "copy-sql-to-clipboard.sh"
  "memory-debug.cjs"
  "memory-debug.js"

  # SQL files
  "fix-memory-trigger.sql"
  "fix-memory-trigger-final.sql"
  "fix-memory-trigger-direct.sql"
  "fix-memory-complete.sql"
  "fix-memory-syntax-fixed.sql"
  
  # Other temp files
  "debug-env.mjs"
  "debug-api-key.mjs"
  "extract.log"
  "directory-tree.txt"
)

# Keep a record of what we're doing
echo "# Debug files cleaned up on $(date)" > cleanup-record.txt

# Loop through and remove files if they exist
for file in "${DEBUG_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Removing: $file"
    echo "- Removed: $file" >> cleanup-record.txt
    rm "$file"
  else
    echo "Skipping (not found): $file"
    echo "- Not found: $file" >> cleanup-record.txt
  fi
done

# Keep the main migration file and updated schema
echo "\n✅ Keeping the following important files:"
echo "- apply-migration.sh (main migration script)"
echo "- supabase-schema.sql (complete database schema)"
echo "- updated-schema.sql (your updated schema design)"
echo "- implement-vector-memory.sql (vector memory implementation)"

echo "\n🧹 Cleanup complete! Created cleanup-record.txt with details."
echo "You can now focus on your application development without the clutter."
