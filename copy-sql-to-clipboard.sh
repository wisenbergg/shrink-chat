#!/bin/zsh

echo "📋 Copying memory fix SQL to clipboard..."
cat fix-memory-trigger.sql | pbcopy

echo "✅ SQL copied to clipboard!"
echo "Next steps:"
echo "1. Go to Supabase Studio"
echo "2. Open the SQL Editor"
echo "3. Paste the SQL (Cmd+V)"
echo "4. Run the SQL"
echo "5. Return to the app and test using the /memory-test page"
