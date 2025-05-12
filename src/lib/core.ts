// src/lib/core.ts  (or wherever runShrinkEngine lives)

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
  const {
    sessionId = 'unknown',
    prompt,
    history = [],
    threadIds = [],
  } = input;

  // 1. Predict signal & tone on user prompt
  const signal = await predictSignal(prompt);
  const promptToneTags = await inferToneTagsFromText(prompt);

  // 2. RAG retrieval
  const recallEnabled = signal !== 'low' && promptToneTags.length > 0;
  const { recallUsed, results: retrievedChunks } = recallEnabled
    ? await fetchRecall(prompt, promptToneTags, signal)
    : { recallUsed: false, results: [] };

  // 3. Build system prompt with user profile & RAG context
  const threadId = threadIds[0] || sessionId;
  const userProfile = await getUserProfile(threadId);
  const profileContext = userProfile
    ? `\n\nThe user you're speaking with ${
        userProfile.name ? `is named ${userProfile.name}` : `has not shared their name`
      }. They’ve recently felt ${userProfile.emotional_tone?.join(', ') || 'varied emotions'}.\n`
    : '';

  const contextBlock = retrievedChunks
    .slice(0, 3)
    .map(c => `(${c.discipline}) ${c.topic}: ${c.content}`)
    .join('\n\n');

  const systemPrompt = [
    profileContext,
    process.env.SYSTEM_PROMPT ||
    "Your role is to hold quiet, supportive space for the user. Offer meaningful, intentional questions — never filler or generic invitations. When the user asks for advice, offer it gently and concisely. When they show openness to reflection, you may invite deeper exploration at their pace. Above all, avoid overwhelming or pressuring the user; prioritize emotional safety, trust, and presence over productivity or solutions."
  ].join('');

  // 4. Assemble messages
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...(retrievedChunks.length
      ? [
          {
            role: 'system' as const,
            content: `You are grounded in the following therapeutic references:\n\n${contextBlock}\n\nUse these insights naturally and conversationally. Do not quote definitions. Do not sound clinical. Do not use textbook phrasing. Weave them into your voice as if they were your own reflections.\n\nPrioritize the user’s unique experience. Let the information deepen your curiosity, not harden your answers.`
          },
        ]
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

  // Single-argument call to match signature
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

export function healthCheck() {
  return { status: 'ok', timestamp: Date.now() };
}