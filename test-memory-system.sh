#!/bin/bash

# Script to fix thread ID foreign key issues and test memory insertion
echo "🔄 Fixing database constraints and relationships..."

# Apply the latest migration with foreign key fixes
echo "📦 Applying database migration to fix thread constraints..."
npx supabase migration up 20250524000000_fix_thread_constraints.sql

# Create test thread if it doesn't exist
echo "🧵 Creating test thread and profile..."
cat > /tmp/generate-test-thread.js << 'EOF'
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createTestThread() {
  // Generate a test thread ID
  const threadId = uuidv4();
  
  console.log(`🧵 Creating test thread with ID: ${threadId}`);
  
  // Create thread record
  const { error: threadError } = await supabase
    .from('threads')
    .upsert({ id: threadId });
    
  if (threadError) {
    console.error('Error creating thread:', threadError);
    return null;
  }
  
  // Create profile record
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      thread_id: threadId,
      name: 'Test User',
      emotional_tone: ['neutral'],
      concerns: ['testing'],
      onboarding_complete: true
    });
    
  if (profileError) {
    console.error('Error creating profile:', profileError);
    return null;
  }
  
  // Try creating a test memory entry
  const { data: memory, error: memoryError } = await supabase
    .from('memory')
    .insert({
      thread_id: threadId,
      author_role: 'user',
      summary: 'This is a test memory entry',
      salience: 50
    })
    .select()
    .single();
    
  if (memoryError) {
    console.error('Error creating memory:', memoryError);
  } else {
    console.log('✅ Test memory created successfully!');
    console.log(memory);
  }
  
  return threadId;
}

createTestThread()
  .then((threadId) => {
    if (threadId) {
      console.log('✅ Test thread and profile created successfully!');
      console.log(`📋 Thread ID: ${threadId}`);
      console.log('You can use this ID in the memory-test page to test memory insertion.');
    } else {
      console.error('❌ Failed to create test thread and profile.');
    }
  })
  .catch((err) => {
    console.error('Error:', err);
  });
EOF

# Run the script to create a test thread
npm install -g uuid
node --loader ts-node/esm /tmp/generate-test-thread.js

echo "✅ Thread ID fix and testing script completed!"
echo "You can now visit the /memory-test page to test memory insertion."
