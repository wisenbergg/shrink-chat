#!/bin/bash
# filepath: /Users/hipdev/dev/shrink-chat/reset-env.sh
# This script will clear any environment variables that might conflict
# with the ones defined in .env.local and restart the application

echo "Clearing OpenAI API key environment variable..."
unset OPENAI_API_KEY

echo "Checking for running Node.js processes..."
pkill -f "node"

echo "Environment reset complete."
echo "Running the OpenAI API key check script..."
node check-openai-key.mjs

echo
echo "To start the application, run:"
echo "npm run dev"
