// File: src/lib/core.ts

import OpenAI from 'openai';
import { logSessionEntry } from './logSession';
import { getMemoryForSession, getMemoryForThreads, MemoryTurn } from './sessionMemory';

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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function handlePrompt(input: PromptInput): Promise<PromptResult> {
  const { sessionId, threadIds, prompt, history = [] } = input;

  if (!prompt.trim()) throw new Error('Missing prompt');

  const systemPrompt =
    process.env.SYSTEM_PROMPT ??
    "don't be overly inquisitive; relax and hold space. When the user begins to open up about their feelings is the moment to dig deeper...";
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];

  if (threadIds && threadIds.length) {
    const memory: MemoryTurn[] = await getMemoryForThreads(threadIds, 5);
    for (const turn of memory) {
      messages.push({ role: 'user', content: turn.prompt });
      messages.push({ role: 'assistant', content: turn.response });
    }
  } else if (sessionId) {
    const memory = await getMemoryForSession(sessionId, 10);
    for (const turn of memory) {
      messages.push({ role: 'user', content: turn.prompt });
      messages.push({ role: 'assistant', content: turn.response });
    }
  }

  for (const h of history) messages.push({ role: h.role, content: h.content });
  messages.push({ role: 'user', content: prompt });

  const useMicro = history.length === 0 && (!threadIds || threadIds.length === 0) && !sessionId;
  const modelToUse = useMicro ? process.env.MICRO_MODEL! : process.env.FINE_TUNED_MODEL!;

  const completion = await openai.chat.completions.create({
    model: modelToUse,
    messages,
    temperature: Number(process.env.TEMPERATURE) || 0.7,
    max_tokens: Number(process.env.MAX_TOKENS) || 2048
  });
  const response = completion.choices[0].message?.content?.trim() ?? '';

  // Log session entry without sending timestamp so DB default applies
  await logSessionEntry({
    session_id: sessionId ?? threadIds?.[0] ?? 'anonymous',
    prompt,
    response,
    model: completion.model,
    signal: 'none',
    recallUsed: Boolean(sessionId || (threadIds && threadIds.length > 0))
  });

  return {
    response_text: response,
    recallUsed: Boolean(sessionId || (threadIds && threadIds.length > 0)),
    tone_tags: [],
    signal: 'none',
    model: completion.model
  };
}

export function healthCheck() {
  return { status: 'ok', uptime: process.uptime() };
}
