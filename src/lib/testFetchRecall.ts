import { fetchRecall } from './fetchRecall';

async function runTest() {
  const prompt = 'I feel overwhelmed with anxiety and want to feel calmer.';
  const predictedSignal = 'medium';
  const inferredToneTags = ['calming', 'soothing'];

  const result = await fetchRecall(prompt, predictedSignal, inferredToneTags);

  console.log('✅ TEST RESULT:', JSON.stringify(result, null, 2));
}

runTest().catch(err => console.error('❌ TEST ERROR:', err));
