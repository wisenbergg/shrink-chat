import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFeedbackSystem() {
  console.log('🔍 Testing feedback system integration...\n');

  // 1. Check if messages table exists and has data
  console.log('1. Checking messages table...');
  const { data: messagesData, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .limit(5);

  if (messagesError) {
    console.error('❌ Messages table error:', messagesError);
  } else {
    console.log(`✅ Messages table exists with ${messagesData.length} records`);
    if (messagesData.length > 0) {
      console.log('Sample message:', messagesData[0]);
    }
  }

  // 2. Check feedback table structure
  console.log('\n2. Checking feedback table...');
  const { data: feedbackData, error: feedbackError } = await supabase
    .from('feedback')
    .select('*')
    .limit(5);

  if (feedbackError) {
    console.error('❌ Feedback table error:', feedbackError);
  } else {
    console.log(`✅ Feedback table exists with ${feedbackData.length} records`);
    if (feedbackData.length > 0) {
      console.log('Sample feedback:', feedbackData[0]);
    }
  }

  // 3. Test the foreign key relationship using correct column names
  console.log('\n3. Testing foreign key relationship...');
  if (messagesData && messagesData.length > 0) {
    const messageId = messagesData[0].id;
    console.log(`Testing with message ID: ${messageId}`);
    
    // Try to insert a test feedback record with correct column names
    const { data: testFeedback, error: testError } = await supabase
      .from('feedback')
      .insert({
        message_id: messageId,
        rating: 5,
        comment: 'Test feedback - system integration test'
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Failed to insert test feedback:', testError);
    } else {
      console.log('✅ Successfully inserted test feedback:', testFeedback);
      
      // Clean up test data
      await supabase.from('feedback').delete().eq('id', testFeedback.id);
      console.log('🧹 Cleaned up test feedback record');
    }
  }

  // 4. Test if feedback API endpoint works
  console.log('\n4. Testing feedback API endpoint...');
  if (messagesData && messagesData.length > 0) {
    const messageId = messagesData[0].id;
    
    try {
      const response = await fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: messagesData[0].thread_id,
          responseId: messageId,
          rating: 4,
          comment: 'API test feedback'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Feedback API endpoint working:', result);
        
        // Verify feedback was stored
        const { data: verifyData } = await supabase
          .from('feedback')
          .select('*')
          .eq('message_id', messageId)
          .eq('comment', 'API test feedback')
          .single();
        
        if (verifyData) {
          console.log('✅ Feedback successfully stored via API');
          // Clean up
          await supabase.from('feedback').delete().eq('id', verifyData.id);
          console.log('🧹 Cleaned up API test feedback');
        }
      } else {
        console.error('❌ Feedback API endpoint failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('❌ Error testing feedback API:', error);
    }
  }

  console.log('\n🎉 Feedback system test complete!');
}

testFeedbackSystem().catch(console.error);
