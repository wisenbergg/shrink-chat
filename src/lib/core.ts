import OpenAI from 'openai';
import {
  getMemoryForSession,
  getMemoryForThreads,
  getUserProfile,
  logMemoryTurn
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

export function healthCheck() {
  return { status: 'ok', timestamp: Date.now() };
}

function ruptureDetector(userText: string): boolean {
  const cues = [
    'you don’t get',
    'that’s not',
    'you missed',
    'you’re not',
    'that wasn’t',
    'you didn’t'
  ];
  const lower = userText.toLowerCase();
  return cues.some(c => lower.includes(c));
}

export async function runShrinkEngine(input: PromptInput): Promise<PromptResult> {
  const openai = new OpenAI();
  const { sessionId, prompt, history, threadIds } = input;

  const signal = await predictSignal(prompt);
  const tone_tags = await inferToneTagsFromText(prompt);
  const rupture = ruptureDetector(prompt);

  // temporarily disabling unused memory until it's reintegrated into prompt flow
  // const memory = sessionId
  //   ? await getMemoryForSession(sessionId)
  //   : threadIds
  //   ? await getMemoryForThreads(threadIds[0])
  //   : [];

  const threadId = threadIds?.[0] ?? sessionId ?? 'unknown';

  const userProfile = await getUserProfile(threadId);

  const profileContext = userProfile
    ? `\n\nThe user you're speaking with ${
        userProfile.name ? `is named ${userProfile.name}` : `has not shared their name`
      }. They’ve recently described feeling ${userProfile.emotional_tone?.join(', ') || 'various emotions'} and are currently exploring concerns like ${userProfile.concerns?.join(', ') || 'general life questions'}. Please speak with continuity and care.\n`
    : '';

  const recallEnabled = signal !== 'low' && tone_tags.length > 0;
  const retrievedChunks = recallEnabled
    ? await fetchRecall(prompt, tone_tags, signal)
    : { recallUsed: false, results: [] };

  const contextBlock = retrievedChunks.results
    .slice(0, 3)
    .map(e => `(${e.discipline}) ${e.topic}: ${e.content}`)
    .join('\n\n');

  const systemPrompt = `${profileContext}${process.env.SYSTEM_PROMPT ?? `
Your role is to hold quiet, supportive space for the user.

You are a therapeutic companion known for being calm, emotionally attuned, and never overreaching. You reflect, not fix. You invite, not direct. You never apologize unless something is truly your fault.

Offer meaningful, intentional questions — never filler or generic invitations. When the user asks for advice, offer it gently and concisely. When they show openness to reflection, you may invite deeper exploration at their pace.

Above all, prioritize emotional safety, trust, and presence over productivity or solutions. Speak in a single steady voice, consistent across turns. No performance of empathy — just grounded, attuned presence.`}`;

  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...(retrievedChunks.results.length
      ? [{
          role: 'system' as const,
          content: `You are grounded in the following therapeutic references:\n\n${contextBlock}\n\nUse these insights naturally and conversationally. Do not quote definitions. Do not sound clinical. Do not use textbook phrasing. Weave them into your voice as if they were your own reflections.\n\nPrioritize the user’s unique experience. Let the information deepen your curiosity, not harden your answers.`
        }]
      : []),
    ...(history ?? []),
    { role: 'user', content: prompt }
  ];

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages
  });

  const response_text = completion.choices[0].message.content ?? '';

  await logMemoryTurn(threadId, 'user', prompt);
  await logMemoryTurn(threadId, 'assistant', response_text);

  if (!toneDriftFilter(response_text)) {
    console.warn('⚠️ Tone drift detected in response:', response_text);
  }

  await logSessionEntry({
    sessionId: sessionId ?? 'unknown',
    prompt,
    response: response_text,
    tone_tags,
    signal,
    rupture,
    recallUsed: retrievedChunks.recallUsed
  });

  return {
    response_text,
    recallUsed: retrievedChunks.recallUsed,
    tone_tags,
    signal,
    model: 'gpt-4o'
  };
}
