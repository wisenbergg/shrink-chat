#!/bin/bash
# filepath: /Users/hipdev/dev/shrink-chat/run-all-tests.sh
# Comprehensive test script for shrink-chat API key setup

set -e # Exit on any error

echo "===================================="
echo "SHRINK-CHAT DIAGNOSTIC TEST SUITE"
echo "===================================="

# Step 1: Verify .env.local exists and has correct structure
echo -e "\n[ STEP 1 ] Checking .env.local file"
if [ -f .env.local ]; then
  echo "✅ .env.local file exists"
  
  # Count number of environment variables
  VAR_COUNT=$(grep -v '^#' .env.local | grep -v '^$' | wc -l | tr -d ' ')
  if [ "$VAR_COUNT" -gt 5 ]; then
    echo "✅ .env.local contains $VAR_COUNT environment variables"
  else
    echo "⚠️  .env.local contains only $VAR_COUNT environment variables, might be incomplete"
  fi
  
  # Check for OpenAI API key
  if grep -q "OPENAI_API_KEY" .env.local; then
    echo "✅ OPENAI_API_KEY is defined in .env.local"
  else
    echo "❌ OPENAI_API_KEY is not defined in .env.local"
    exit 1
  fi
else
  echo "❌ .env.local file not found"
  echo "Please create a .env.local file based on .env.example"
  exit 1
fi

# Step 2: Run the OpenAI API key check script
echo -e "\n[ STEP 2 ] Running API key validation"
node check-openai-key.mjs || {
  echo "❌ API key validation failed"
  echo "Please check your OpenAI API key and try again"
  exit 1
}

# Step 3: Test direct OpenAI API access
echo -e "\n[ STEP 3 ] Testing direct OpenAI API access"
node test-openai-key.mjs || {
  echo "❌ Direct OpenAI API test failed"
  exit 1
}

# Step 4: Test compiled code
echo -e "\n[ STEP 4 ] Building project"
npm run build || {
  echo "❌ Build failed. This might indicate type errors or other issues."
  exit 1
}

echo -e "\n===================================="
echo "🎉 All tests passed! The application is ready to run."
echo "Start the development server with: npm run dev"
echo "===================================="
