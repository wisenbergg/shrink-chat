// src/lib/core.ts

import OpenAI from 'openai';
import {
  getUserProfile,
  logMemoryTurn,
} from './sessionMemory';
import { fetchRecall } from './fetchRecall';
import { inferToneTagsFromText } from './toneInference';
import { predictSignal } from './predictSignal';
import { logSessionEntry } from './logSession';
import { toneDriftFilter } from '../middleware';
import { stylePrimers } from './stylePrimers';


export interface PromptInput {
  sessionId?: string;
  threadIds?: string[];
  prompt: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface PromptResult {
  response_text: string;
  recallUsed: boolean;
  tone_tags: string[];
  signal: string;
  model: string;
}


export async function runShrinkEngine(input: PromptInput): Promise<PromptResult> {
  // Destructure inputs
  const { sessionId = 'unknown', threadIds = [], prompt, history = [] } = input;

  // 0. Pick a random style primer
  const primer = stylePrimers[
    Math.floor(Math.random() * stylePrimers.length)
  ];
  const fewShotBlock = `Here’s an example of how a warm, natural therapist speaks:

${primer}

Now, continue in that same style.

`;

  // 1. Predict signal & tone on user prompt
  const signal = await predictSignal(prompt);
  const promptToneTags = await inferToneTagsFromText(prompt);

  // 2. RAG retrieval
  const recallEnabled = signal !== 'low' && promptToneTags.length > 0;
  const { recallUsed, results: retrievedChunks } = recallEnabled
    ? await fetchRecall(prompt, promptToneTags, signal)
    : { recallUsed: false, results: [] };

  // 3. Build system prompt with primer + profile + core instructions
  const threadId = threadIds[0] || sessionId;
  const userProfile = await getUserProfile(threadId);
  const profileContext = userProfile
    ? `The user is ${userProfile.name ?? 'Anonymous'}, currently feeling ${userProfile.emotional_tone?.join(', ') || 'varied emotions'}.\n\n`
    : '';

  const systemPrompt = [
    fewShotBlock,               // injected primer
    profileContext,
    process.env.SYSTEM_PROMPT!, // your main instructions
  ].join('');

  // 4. Assemble messages
  const contextBlock = retrievedChunks
    .slice(0, 3)
    .map(c => `(${c.discipline}) ${c.topic}: ${c.content}`)
    .join('\n\n');

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...(retrievedChunks.length
      ? [{
          role: 'system' as const,
          content: `Grounded in these references:\n\n${contextBlock}`
        }]
      : []),
    ...history,
    { role: 'user' as const, content: prompt },
  ];

  // 5. Call the LLM
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: process.env.CHAT_MODEL || 'gpt-4o',
    messages,
  });
  const response_text = completion.choices[0].message.content ?? '';

  // 6. Apology count & tone on the assistant's reply
  const apologyCount = (response_text.match(/I’m sorry|sorry/gi) || []).length;
  const responseToneTags = await inferToneTagsFromText(response_text);

  // 7. Log memory and metrics
  await logMemoryTurn(threadId, 'user', prompt);
  await logMemoryTurn(threadId, 'assistant', response_text);
  await logSessionEntry({
    sessionId,
    role: 'assistant',
    content: response_text,
    apologyCount,
    toneTags: responseToneTags,
    signal,
    recallUsed,
  });

  // 8. Tone drift warning
  if (!toneDriftFilter(response_text)) {
    console.warn('⚠️ Tone drift detected:', response_text);
  }

  return {
    response_text,
    recallUsed,
    tone_tags: responseToneTags,
    signal,
    model: process.env.CHAT_MODEL || 'gpt-4o',
  };
}
