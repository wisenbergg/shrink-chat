#!/bin/zsh

# This script executes SQL directly on the Supabase database using the Supabase CLI

echo "🔄 Applying memory trigger fix..."

# Connect to local Supabase database with the Supabase CLI
# Replace the parameters with your actual connection details
# This assumes your local Supabase is running the standard way

# Determine if we have supabase CLI installed
if command -v supabase >/dev/null 2>&1; then
  echo "✅ Found Supabase CLI"
  
  # Try to execute SQL using the Supabase CLI
  SQL_FILE="fix-memory-trigger.sql"
  if [ -f "$SQL_FILE" ]; then
    echo "📄 Executing SQL from $SQL_FILE..."
    supabase db execute --file "$SQL_FILE"
    RESULT=$?
    
    if [ $RESULT -eq 0 ]; then
      echo "✅ SQL executed successfully!"
    else
      echo "❌ Failed to execute SQL with Supabase CLI."
    fi
  else
    echo "❌ SQL file not found: $SQL_FILE"
  fi
else
  echo "❌ Supabase CLI not found. Please install it or apply the SQL manually."
  echo "📋 SQL has been copied to clipboard. Paste it in Supabase Studio SQL Editor."
  cat fix-memory-trigger.sql | pbcopy
fi

# Test the memory workflow after applying the fix
echo "🧪 Testing memory workflow after fix..."
node test-memory-workflow.mjs
