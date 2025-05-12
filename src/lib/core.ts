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
  // Destructure inputs
  const { sessionId = 'unknown', threadIds = [], prompt, history = [] } = input;

  // 0. Few-shot style primer
  const primer = stylePrimers[
    Math.floor(Math.random() * stylePrimers.length)
  ];
  const fewShotBlock = `Here’s an example of how a warm, natural therapist speaks:

${primer}

Now, continue in that same style.
`;

  // 1. Signal & tone
  const signal = await predictSignal(prompt);
  const promptToneTags = await inferToneTagsFromText(prompt);

  // 2. RAG retrieval
  const recallEnabled = signal !== 'low' && promptToneTags.length > 0;
  const { recallUsed, results: retrievedChunks } = recallEnabled
    ? await fetchRecall(prompt, promptToneTags, signal)
    : { recallUsed: false, results: [] };

  // 3a. Intent-based strategy
  const intent = classifyIntent(prompt);
  const strategyBlock = strategyPrompts[intent] ?? strategyPrompts.casual;

  // 3b. Diversity guidelines
  const diversityBlock = `
Use varied reflective openings. For example:
• “I hear you saying…”
• “It seems like…”
• “You appear to be…”
• “It feels like…”
Choose one randomly each time and do not repeat.
`;

  // 3c. Profile context
  const threadId = threadIds[0] || sessionId;
  const userProfile = await getUserProfile(threadId);
  const profileContext = userProfile
    ? `The user is ${userProfile.name ?? 'Anonymous'}, currently feeling ${userProfile.emotional_tone?.join(', ') || 'varied emotions'}.\n\n`
    : '';

  // 3d. Core instructions
  const coreInstructions =
    process.env.SYSTEM_PROMPT ??
    `Your role is to hold quiet, supportive space for the user.
Offer meaningful, intentional questions — never filler or generic invitations.
When the user asks for advice, offer it gently and concisely.
When they show openness to reflection, you may invite deeper exploration at their pace.
Above all, avoid overwhelming or pressuring the user; prioritize emotional safety, trust, and presence over productivity or solutions.`;

  // 3e. Assemble the system prompt
  const systemPrompt = [
    fewShotBlock,
    diversityBlock,
    strategyBlock,    // new injection
    profileContext,
    coreInstructions
  ].join('\n\n');

  // 4. Build message array
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

  // 5. Query the LLM
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: process.env.CHAT_MODEL || 'gpt-4o',
    messages,
  });
  const response_text = completion.choices[0].message.content ?? '';

  // 6. Apology count & tone tagging
  const apologyCount = (response_text.match(/I’m sorry|sorry/gi) || []).length;
  const responseToneTags = await inferToneTagsFromText(response_text);

  // 7. Log memory & session metrics
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

  // 9. Return final result
  return {
    response_text,
    recallUsed,
    tone_tags: responseToneTags,
    signal,
    model: process.env.CHAT_MODEL || 'gpt-4o',
  };
}

// ── Health check export ──────────────────────────────────────────────────────

export function healthCheck() {
  return { status: 'ok', timestamp: Date.now() };
}
