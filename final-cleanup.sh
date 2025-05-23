#!/bin/zsh
# Final cleanup script to remove any remaining debugging files

echo "🧹 Performing final cleanup of debugging and test files..."

# Removing debug scripts
echo "Removing debug scripts..."
rm -fv debug-api-key.mjs debug-env.mjs

# Removing test scripts
echo "Removing test scripts..."
rm -fv test-memory-system.sh testFT.cjs

# Removing debug files in src directory
echo "Removing debug files in src directory..."
rm -fv src/lib/debug-memory.js

# Removing temp files
echo "Removing temp files..."
rm -fv temp.css

echo "✅ Cleanup complete! Your workspace is now clean of debugging scripts."
echo "You can now run the application with: npm run dev"
