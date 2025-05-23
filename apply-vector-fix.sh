#!/bin/zsh

echo "🔄 Applying memory vector conversion fix..."

# Check if our SQL file exists
SQL_FILE="fix-memory-vector-conversion.sql"
if [ ! -f "$SQL_FILE" ]; then
  echo "❌ SQL file not found: $SQL_FILE"
  exit 1
fi

# Try multiple methods to apply the fix

# Method 1: Try supabase CLI first
if command -v supabase >/dev/null 2>&1; then
  echo "🔹 Using Supabase CLI..."
  supabase db execute --file "$SQL_FILE"
  
  if [ $? -eq 0 ]; then
    echo "✅ Fix applied successfully using Supabase CLI!"
    exit 0
  else
    echo "⚠️ Supabase CLI failed, trying alternative methods..."
  fi
fi

# Method 2: Try to get the database URL from .env.local
DB_URL=""
if [ -f .env.local ]; then
  DB_URL=$(grep -E "^DATABASE_URL=" .env.local | cut -d'=' -f2-)
fi

if [ -z "$DB_URL" ]; then
  echo "⚠️ DATABASE_URL not found in .env.local"
  echo "🔹 Trying default local Supabase connection..."
  
  # Default connection for local Supabase
  DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"
fi

# Method 3: Try with psql
if command -v psql >/dev/null 2>&1; then
  echo "🔹 Using psql with connection: $DB_URL"
  
  # Execute SQL with psql
  psql "$DB_URL" -f "$SQL_FILE"
  
  if [ $? -eq 0 ]; then
    echo "✅ Fix applied successfully using psql!"
    exit 0
  else
    echo "⚠️ psql method failed."
  fi
else
  echo "❌ psql command not found."
fi

# Method 4: Direct curl to Supabase Edge Functions
# Get Supabase URL and Key from environment
echo "🔹 Attempting to use Supabase REST API..."

# Try to get Supabase URL and key from .env.local
SUPABASE_URL=$(grep -E "^NEXT_PUBLIC_SUPABASE_URL=" .env.local 2>/dev/null | cut -d'=' -f2-)
SUPABASE_KEY=$(grep -E "^SUPABASE_SERVICE_ROLE_KEY=" .env.local 2>/dev/null | cut -d'=' -f2-)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "⚠️ Could not find Supabase URL and key in .env.local"
  echo "❌ All methods failed to apply the fix."
  exit 1
fi

# Use curl to call the SQL through Supabase's REST API
SQL_CONTENT=$(cat "$SQL_FILE")
curl -X POST \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d "{\"query\": \"$SQL_CONTENT\"}" \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ Fix applied successfully using Supabase REST API!"
  exit 0
else
  echo "❌ All methods failed to apply the fix."
  exit 1
fi
