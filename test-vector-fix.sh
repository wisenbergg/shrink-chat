#!/bin/zsh

echo "🧪 Testing memory functionality..."

# Check if node is available
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js is required to run this test."
  exit 1
fi

# First, apply the vector fix
echo "1️⃣ Applying vector conversion fix..."
./apply-vector-fix.sh

if [ $? -ne 0 ]; then
  echo "❌ Failed to apply the vector fix."
  exit 1
fi

# Now run the memory test
echo "2️⃣ Running memory test..."
THREAD_ID="test-memory-$(date +%s)"

echo "📝 Using test thread ID: $THREAD_ID"
echo ""

# Run the memory test with our test thread ID
NODE_OPTIONS="--experimental-specifier-resolution=node" node test-memory.mjs

# Check the result
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Memory test completed successfully!"
else
  echo ""
  echo "❌ Memory test failed."
fi

echo ""
echo "🔍 Remember to check the logs above for any errors."
echo "If you see results with similarity scores and retrieved memories, the fix worked correctly!"
