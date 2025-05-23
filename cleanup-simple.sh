#!/bin/zsh
# filepath: /Users/hipdev/dev/shrink-chat/cleanup-simple.sh

echo "🧹 Cleaning up ALL debugging and test scripts..."

# Comprehensive cleanup of all debugging files
echo "Removing all test scripts..."
rm -fv test-*.mjs test-*.js testMemory.ts thread-test.ts test-memory-system.sh testFT.cjs

echo "Removing all check and debug scripts..."
rm -fv check-*.js check-*.mjs check-openai-key.mjs check-db-status.mjs 
rm -fv debug-*.js debug-*.mjs debug-*.cjs debug-api-key.mjs debug-env.mjs
rm -fv memory-debug.cjs memory-debug.js api-test.mjs clear-session.mjs

echo "Removing all fix and apply scripts..."
rm -fv fix-*.js fix-*.cjs fix-*.mjs fix-*.sh
rm -fv apply-*.sh apply-*.mjs
rm -fv direct-*.sh direct-*.mjs direct-*.cjs
rm -fv update-db.sh update-threads.sh

echo "Removing SQL fix files (preserving important schema files)..."
rm -fv fix-*.sql
# Ensure we don't delete important schema files
echo "Preserving important schema files..."
ls -la *schema*.sql

echo "Removing other utility scripts..."
rm -fv copy-sql-to-clipboard.sh extract.log directory-tree.txt login
rm -fv config\;wq

# Clean up all cleanup scripts (including this one)
echo "Cleaning up all cleanup scripts..."
rm -fv cleanup-debug-files.sh cleanup-fix-files.sh final-cleanup.sh cleanup.sh

echo "✅ Cleanup complete!"
echo "Important files preserved: implement-vector-memory.sql, supabase-schema.sql, updated-schema.sql"
echo "You can now run your application with: npm run dev"

# Remove self
echo "Self-removing cleanup script..."
rm -f $0

echo "✅ Your workspace is now completely clean of debugging scripts."
