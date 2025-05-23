#!/bin/bash

# Check if supabase is installed
if ! command -v supabase &> /dev/null; then
  echo "Error: Supabase CLI is not installed. Please install it: https://supabase.com/docs/guides/cli"
  echo "Or use the apply-migrations.sh script instead."
  exit 1
fi

# Navigate to the project root
cd "$(dirname "$0")/.."

# Apply the migrations
echo "Applying migrations to local Supabase database..."
supabase migration up

echo "Migrations applied successfully! If this was a local instance, you'll need to apply these to production separately."
