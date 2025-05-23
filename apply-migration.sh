#!/bin/zsh

echo "🔄 Applying memory trigger fix migration..."

# Check if supabase command is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Error: Supabase CLI is not installed. Please install it with 'npm install -g supabase'"
    echo "🔍 Alternatively, you can apply the migration manually using the Supabase Studio SQL Editor."
    echo "📝 SQL to execute is in: /Users/hipdev/dev/shrink-chat/fix-memory-trigger.sql"
    exit 1
fi

# Test the memory workflow directly
echo "🔄 Testing memory workflow..."
node test-memory-workflow.mjs

echo "✅ Memory diagnostic completed - trigger issue confirmed."
echo "To fix this issue, copy the SQL from fix-memory-trigger.sql and run it in Supabase Studio SQL Editor."
echo "This will update the memory trigger to auto-create threads and profiles as needed."
echo "Once fixed, you can use the /memory-test page to test memory insertion with any thread ID."
