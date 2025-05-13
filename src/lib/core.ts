// src/lib/core.ts

import OpenAI from 'openai';
import { getUserProfile, logMemoryTurn } from './sessionMemory';
import { fetchRecall } from './fetchRecall';
import { inferToneTagsFromText } from './toneInference';
import { predictSignal } from './predictSignal';
import { logSessionEntry } from './logSession';
import { toneDriftFilter } from '../middleware';
import { stylePrimers } from './stylePrimers';

// ── Intent classifier ─────────────────────────────────────────────────────────

function classifyIntent(text: string): 'readiness' | 'emotion' | 'info' | 'casual' {
  const lower = text.toLowerCase();
  if (/(i['’]?m ready|let'?s start)/.test(lower)) return 'readiness';
  if (/(sad|angry|anxious|upset|overwhelmed|nervous)/.test(lower)) return 'emotion';
  if (/(how (do|can)|what about|why)/.test(lower)) return 'info';
  return 'casual';
}

// ── Strategy prompts ─────────────────────────────────────────────────────────

const strategyPrompts: Record<string, string> = {
  readiness: `
When the user says they’re ready, first **acknowledge** their readiness, then **invite** them to choose what to explore next.
For example:
> “Great—thank you for letting me know you’re ready. What would you like to talk about first?”`,

  emotion: `
When the user expresses emotion, **reflect** their feeling and gently **validate** it, then **offer** a supportive invitation.
For example:
> “I hear you’re feeling overwhelmed—that’s completely understandable. Would it help to talk about what feels most pressing right now?”`,

  info: `
When the user asks for information or advice, provide a **concise**, gentle suggestion and invite their thoughts.
For example:
> “One approach you might try is ____. How does that idea feel to you?”`,

  casual: `
When the user shares a casual comment or small talk, briefly **acknowledge** it and **steer** back to exploration.
For example:
> “I hear you. Whenever you’re ready, I’m here to listen—what’s on your mind today?”`,
};

// ── Prompt I/O interfaces ────────────────────────────────────────────────────

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

// ── Main engine function ─────────────────────────────────────────────────────

export async function runShrinkEngine(input: PromptInput): Promise<PromptResult> {
  const { sessionId = 'unknown', threadIds = [], prompt, history = [] } = input;

  // 1. Predict signal & log
  const signal = await predictSignal(prompt);
  console.log('🩺 Signal label:', signal);

  // 2. Infer tone tags
  const promptToneTags = await inferToneTagsFromText(prompt);

  // 3. RAG retrieval & debug
  console.log('Calling fetchRecall with:', { prompt, tone_tags: promptToneTags, signal });
  const recallEnabled = signal !== 'low' && promptToneTags.length > 0;
  const { recallUsed, results: retrievedChunks } = recallEnabled
    ? await fetchRecall(prompt, promptToneTags, signal)
    : { recallUsed: false, results: [] };
  console.log('⛓️ RAG enabled:', recallEnabled, 'recallUsed:', recallUsed);
  if (process.env.DEBUG_RAG === 'true') {
    console.log('🔎 Retrieved chunks:', retrievedChunks);
  }

  // 4. Few-shot style primer
  const primer = stylePrimers[
    Math.floor(Math.random() * stylePrimers.length)
  ];
  const fewShotBlock = `Here’s how a warm, natural therapist might speak:

  ${primer}
  
  Continue in that same natural, unquoted style.
  `;

  // 5. Intent-based strategy
  const intent = classifyIntent(prompt);
  const strategyBlock = strategyPrompts[intent] ?? strategyPrompts.casual;

  // 6. Diversity guidelines
  const diversityBlock = `
Use varied reflective openings. For example:
• I hear you saying…
• It seems like…
• You appear to be…
• It feels like…
Choose one randomly each time and do not repeat.
`;

  // 7. Profile context
  const threadId = threadIds[0] || sessionId;
  const userProfile = await getUserProfile(threadId);
  const profileContext = userProfile
    ? `The user is ${userProfile.name ?? 'Anonymous'}, currently feeling ${userProfile.emotional_tone?.join(', ') || 'varied emotions'}.\n\n`
    : '';

  // 8. Core instructions
  const coreInstructions =
    process.env.SYSTEM_PROMPT ??
    `Your role is to hold quiet, supportive space for the user.
Offer meaningful, intentional questions — never filler or generic invitations.
When the user asks for advice, offer it gently and concisely.
When they show openness to reflection, you may invite deeper exploration at their pace.
Above all, prioritize emotional safety, trust, and presence over productivity or solutions.`;

  // 9. Assemble the system prompt (context first)
  const contextBlock = retrievedChunks
    .slice(0, 3)
    .map(c => `(${c.discipline}) ${c.topic}: ${c.content}`)
    .join('\n\n');

  const shouldInjectRAG =
    recallUsed &&
    signal === 'high' &&
    promptToneTags.includes('info');

  const systemPrompt = [
    fewShotBlock,
    diversityBlock,
    strategyBlock,
    profileContext,
    coreInstructions,
    // ← only append RAG if both conditions are met
    shouldInjectRAG && contextBlock
      ? `\n\n—\n\nHere are some notes for reference:\n\n${contextBlock}`
      : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  // 10. Call the LLM
  const model = process.env.CHAT_MODEL || 'gpt-4o';
  console.log('🤖 Using model:', model);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({ model, messages: [
    { role: 'system' as const, content: systemPrompt },
    ...history,
    { role: 'user' as const, content: prompt },
  ]});
  const response_text = completion.choices[0].message.content ?? '';

  // 11. Apology count & tone tagging
  const apologyCount = (response_text.match(/I’m sorry|sorry/gi) || []).length;
  const responseToneTags = await inferToneTagsFromText(response_text);

  // 12. Log memory & metrics
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

  // 13. Tone drift warning
  if (!toneDriftFilter(response_text)) {
    console.warn('⚠️ Tone drift detected:', response_text);
  }

  // 14. Return the result
  return {
    response_text,
    recallUsed,
    tone_tags: responseToneTags,
    signal,
    model,
  };
}

// ── Health check ──────────────────────────────────────────────────────────────

export function healthCheck() {
  return { status: 'ok', timestamp: Date.now() };
}

// ── Test helpers ──────────────────────────────────────────────────────────────

export function testPrompt(prompt: string) {
  return runShrinkEngine({ prompt, history: [] });
}

export function testPromptWithHistory(
  prompt: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
) {
  return runShrinkEngine({ prompt, history });
}
