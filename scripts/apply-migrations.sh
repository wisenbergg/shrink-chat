#!/bin/bash

# Get Supabase URL and Key from environment
SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
SUPABASE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Check if required variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set"
  exit 1
fi

# Apply the first migration
echo "Applying jsonb_to_vector function..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d @supabase/migrations/20250524110000_add_jsonb_to_vector_function.sql \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql"

# Apply the second migration
echo "Updating get_relevant_memories function..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" \
  -d @supabase/migrations/20250524120000_update_get_relevant_memories_function.sql \
  "$SUPABASE_URL/rest/v1/rpc/exec_sql"

echo "Migrations applied successfully!"
