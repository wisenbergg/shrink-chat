#!/bin/zsh

# This script will try multiple methods to apply the SQL fix

echo "🔄 Attempting to fix memory trigger issue..."

# Try to get the database URL from .env.local
DB_URL=""
if [ -f .env.local ]; then
  DB_URL=$(grep -E "^DATABASE_URL=" .env.local | cut -d'=' -f2-)
fi

if [ -z "$DB_URL" ]; then
  echo "⚠️ DATABASE_URL not found in .env.local"
  echo "Trying alternative default local Supabase connection..."
  
  # Default connection for local Supabase
  DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
fi

# Try to execute SQL using psql if available
if command -v psql >/dev/null 2>&1; then
  echo "✅ Found PostgreSQL client (psql)"
  
  SQL_FILE="fix-memory-trigger.sql"
  if [ -f "$SQL_FILE" ]; then
    echo "📄 Executing SQL from $SQL_FILE using psql..."
    echo "Using database URL: $DB_URL"
    
    psql "$DB_URL" -f "$SQL_FILE"
    RESULT=$?
    
    if [ $RESULT -eq 0 ]; then
      echo "✅ SQL executed successfully with psql!"
    else
      echo "❌ Failed to execute SQL with psql. Check the connection details."
    fi
  else
    echo "❌ SQL file not found: $SQL_FILE"
  fi
else
  echo "❌ PostgreSQL client (psql) not found."
fi

echo ""
echo "📋 SQL has been copied to clipboard. You can paste it in Supabase Studio SQL Editor."
cat fix-memory-trigger.sql | pbcopy

echo ""
echo "🔍 Next steps if the above methods failed:"
echo "1. Go to Supabase Studio"
echo "2. Open the SQL Editor"
echo "3. Paste the SQL (it's now in your clipboard)"
echo "4. Run the SQL"
echo ""

# Test the memory workflow after applying the fix
echo "🧪 Testing memory workflow after fix..."
node test-memory-workflow.mjs
