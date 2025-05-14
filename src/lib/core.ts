// src/lib/core.ts

import OpenAI from 'openai';
import { getUserProfile, logMemoryTurn } from './sessionMemory';
import { fetchRecall } from './fetchRecall';
import { inferToneTagsFromText } from './toneInference';
import { predictSignal } from './predictSignal';
import { logSessionEntry } from './logSession';
import { toneDriftFilter } from '../middleware';
import { friendlyPrimers } from '@/lib/stylePrimers/friendly';
import { professionalPrimers } from '@/lib/stylePrimers/professional';

// ---- Global stem cache typing (avoids `any`) --------------------
declare global {
  // eslint-disable-next-line no-var
  var __lastStem: Record<string, string> | undefined;
}

/* ── Intent classifier ─────────────────────────────────────────── */

function classifyIntent(text: string): 'readiness' | 'emotion' | 'info' | 'casual' {
  const lower = text.toLowerCase();
  if (/(i['’]?m ready|let'?s start)/.test(lower)) return 'readiness';
  if (/(sad|angry|anxious|upset|overwhelmed|nervous)/.test(lower)) return 'emotion';
  if (/(how (do|can)|what about|why)/.test(lower)) return 'info';
  return 'casual';
}

/* ── Simple keyword lens detector (stop‑gap) ───────────────────── */

function detectLens(text: string): string {
  const lower = text.toLowerCase();
  if (/(angry|furious|pissed)/.test(lower)) return 'anger';
  if (/(guilt|guilty|ashamed|sorry)/.test(lower)) return 'guilt';
  if (/(numb|empty|nothing)/.test(lower)) return 'numbness';
  return 'neutral';
}

/* ── Strategy prompts (unchanged) ──────────────────────────────── */

const strategyPrompts: Record<string, string> = { readiness: `
  When the user says they’re ready, first **acknowledge** it, then invite them to choose a focus.
  For example:
  > “Alright, let’s get started. Anything top‑of‑mind for you at the moment?”
  `, };

/* ── Prompt I/O interfaces ─────────────────────────────────────── */

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

/* ── Main Shrink Engine runner ─────────────────────────────────── */

export async function runShrinkEngine(input: PromptInput): Promise<PromptResult> {
  const { sessionId = 'unknown', threadIds = [], prompt, history = [] } = input;

  /* Declare threadId early (used by reflection stem helper) */
  const threadId = threadIds[0] || sessionId;

  /* 1. Signal detection ---------------------------------------------------- */
  const signal = await predictSignal(prompt);

  /* 2. Tone‑tag inference -------------------------------------------------- */
  const promptToneTags = await inferToneTagsFromText(prompt);

  /* 3. RAG retrieval ------------------------------------------------------- */
  const recallEnabled = signal !== 'low' && promptToneTags.length > 0;
  const { recallUsed, results: retrievedChunks } = recallEnabled
    ? await fetchRecall(prompt, promptToneTags, signal)
    : { recallUsed: false, results: [] };

  /* 4. Style primer pool selection ---------------------------------------- */
  const primerPool =
    signal === 'high' || ['danger', 'self-harm'].includes(detectLens(prompt))
      ? professionalPrimers
      : friendlyPrimers;

  const primer = primerPool[Math.floor(Math.random() * primerPool.length)];
  const fewShotBlock = `Here’s how a warm, natural therapist might speak:\n\n${primer}\n\nContinue in that same natural, unquoted style.`;

  /* 5. Intent‑based strategy ---------------------------------------------- */
  const intent = classifyIntent(prompt);
  const strategyBlock = strategyPrompts[intent] ?? strategyPrompts.casual;


  /* 6. Diversity guideline block ------------------------------------------ */
  const reflectionStems = [ /* 15 stems list … */ ];

  function nextReflectionStem(sid: string): string {
    const cache = globalThis.__lastStem ?? {};
    const lastUsed = cache[sid] ?? '';
    let candidate: string;
    do {
      candidate = reflectionStems[Math.floor(Math.random() * reflectionStems.length)];
    } while (candidate === lastUsed);
    cache[sid] = candidate;
    globalThis.__lastStem = cache;
    return candidate;
  }
  

  const diversityBlock = `
Use this reflective opening **once per assistant turn**, rotating without repeating the previous stem in the same session:

${nextReflectionStem(threadId)}
`;

  /* 7. Profile context ----------------------------------------------------- */
  const userProfile = await getUserProfile(threadId);
  const profileContext = userProfile
    ? `The user is ${userProfile.name ?? 'Anonymous'}, currently feeling ${userProfile.emotional_tone?.join(', ') || 'varied emotions'}.\n\n`
    : '';

  /* 8. Core system instructions ------------------------------------------- */
  const coreInstructions = process.env.SYSTEM_PROMPT ?? `Your role is to hold quiet, supportive space …`;

  /* 9. Contextual RAG block ------------------------------------------------ */
  const contextBlock = retrievedChunks
    .slice(0, 3)
    .map(c => `(${c.discipline}) ${c.topic}: ${c.content}`)
    .join('\n\n');

  const shouldInjectRAG =
    recallUsed && signal === 'high' && promptToneTags.includes('info');

  /* 10. Assemble final system prompt -------------------------------------- */
  const systemPrompt = [
    fewShotBlock,
    diversityBlock,
    strategyBlock,
    profileContext,
    coreInstructions,
    shouldInjectRAG && contextBlock
      ? `\n\n—\n\nHere are some notes for reference:\n\n${contextBlock}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  /* 11. Call OpenAI -------------------------------------------------------- */
  const model = process.env.CHAT_MODEL || 'gpt-4o';
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: prompt },
    ],
  });
  const response_text = completion.choices[0].message.content ?? '';

  /* 12. Post‑processing & logging ----------------------------------------- */
  const apologyCount = (response_text.match(/I’m sorry|sorry/gi) || []).length;
  const responseToneTags = await inferToneTagsFromText(response_text);

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

  if (!toneDriftFilter(response_text)) {
    console.warn('⚠️ Tone drift detected:', response_text);
  }

  return {
    response_text,
    recallUsed,
    tone_tags: responseToneTags,
    signal,
    model,
  };
}

/* Health check, test helpers unchanged … */
export function healthCheck() {
  return { status: 'ok' };
}