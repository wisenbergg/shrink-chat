import 'dotenv/config';
import { runShrinkEngine } from '../src/lib/core';

async function test(prompt: string) {
  console.log('\n== PROMPT:', prompt);
  const result = await runShrinkEngine({
    prompt,
    sessionId: 'test-1',
    threadIds: ['test-1'],
    history: []
  });
  console.log('→ RESPONSE:', result.response_text);
}

async function main() {
  await test("yo yo yo!");
  await test("I'm feeling overwhelmed and anxious about my upcoming surgery.");
}

main().catch(console.error);
