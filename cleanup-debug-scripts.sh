#!/bin/bash

echo "🧹 CLEANING UP DEBUG AND TEST SCRIPTS"
echo "======================================="

# Scripts that were created for the user_id debugging/fixing process
# These can be safely removed now that the fix is implemented

DEBUG_SCRIPTS=(
    "apply-fix.mjs"
    "debug-api-key.mjs" 
    "debug-env.mjs"
    "deep-database-analysis.mjs"
    "deep-debug-analysis.mjs"
    "direct-fix-memory.mjs"
    "direct-fix-simple.mjs"
    "direct-fix-trigger.js"
    "direct-fix-trigger.mjs"
    "final-analysis-report.mjs"
    "final-comprehensive-test.mjs"
    "fix-memory-direct.js"
    "fix-memory-sql.js"
    "fix-trigger.mjs"
    "investigate-user-id-issue.mjs"
    "run-backfill.mjs"
    "test-anonymous-filtering.mjs"
    "test-connection.js"
    "test-connection.mjs"
    "test-direct-insert.mjs"
    "test-direct-memory.mjs"
    "test-env-simple.mjs"
    "test-fix-logic.js"
    "test-memory-fix.mjs"
    "test-memory-workflow.mjs"
    "test-memory.mjs"
    "test-user-id-fix.mjs"
    "verify-user-id-fix.mjs"
)

# Scripts to keep (essential or potentially useful)
KEEP_SCRIPTS=(
    "test-short-term-memory-standalone.mjs"  # Might be useful for testing short-term memory
    "test-short-term-memory.mjs"             # Might be useful for testing short-term memory
    "check-trigger-status.js"                # Might be useful for database maintenance
)

echo "📋 Scripts that will be removed:"
for script in "${DEBUG_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo "  ❌ $script"
    fi
done

echo ""
echo "📋 Scripts that will be kept:"
for script in "${KEEP_SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        echo "  ✅ $script"
    fi
done

echo ""
read -p "Do you want to proceed with cleanup? (y/N): " confirm

if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo ""
    echo "🗑️  Removing debug scripts..."
    
    removed_count=0
    for script in "${DEBUG_SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            rm "$script"
            echo "  ✅ Removed $script"
            ((removed_count++))
        fi
    done
    
    echo ""
    echo "🎉 Cleanup complete! Removed $removed_count debug scripts."
    echo ""
    echo "📁 Remaining .js/.mjs files in root:"
    find . -maxdepth 1 -name "*.mjs" -o -name "*.js" | grep -v node_modules | sort
    
else
    echo "❌ Cleanup cancelled."
fi
