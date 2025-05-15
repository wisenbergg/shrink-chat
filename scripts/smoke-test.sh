#!/usr/bin/env bash
# scripts/smoke-test.sh
# Smoke tests for Next.js API routes (positive + negative)

set -e

echo "🔍 Testing /api/health..."
curl -s http://localhost:3000/api/health | jq .

echo "🔍 Testing /api/shrink (positive)..."
curl -s -X POST http://localhost:3000/api/shrink \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test prompt for smoke test"}' | jq .

echo "🔍 Testing /api/shrink (negative: missing prompt)..."
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/shrink \
  -H "Content-Type: application/json" \
  -d '{}')
if [ "$status" -ne 400 ]; then
  echo "❌ Expected HTTP 400 for missing prompt, but got $status"
  exit 1
fi
echo "✅ Negative test passed (HTTP 400)."
