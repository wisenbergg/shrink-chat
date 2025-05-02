// src/lib/core.ts

import OpenAI from 'openai';
import { logSessionEntry } from './logSession';
import { logChat } from './logChat';
import { getMemoryForSession, getMemoryForThreads, MemoryTurn } from './sessionMemory';

export interface PromptInput {
  // support either single or multiple threads
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
    "don't be overly inquisitive; relax and hold space.";
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];

  // 1) multi‑thread recall if provided
  if (threadIds && threadIds.length) {
    const memory: MemoryTurn[] = await getMemoryForThreads(threadIds, 5);
    for (const turn of memory) {
      messages.push({ role: 'user', content: turn.prompt });
      messages.push({ role: 'assistant', content: turn.response });
    }
  }
  // 2) single‑thread fallback
  else if (sessionId) {
    const memory = await getMemoryForSession(sessionId, 10);
    for (const turn of memory) {
      messages.push({ role: 'user', content: turn.prompt });
      messages.push({ role: 'assistant', content: turn.response });
    }
  }

  // 3) any in‑flight history
  for (const h of history) {
    messages.push({ role: h.role, content: h.content });
  }

  // 4) log user  ← COMMENTED OUT to avoid duplicate logging in core
  // logChat({ threadId: sessionId ?? threadIds![0] ?? 'anon', turn: history.length + 1, role: 'user', content: prompt });

  // 5) call OpenAI
  messages.push({ role: 'user', content: prompt });
  const completion = await openai.chat.completions.create({
    model: process.env.FINE_TUNED_MODEL ?? 'gpt-4o',
    messages,
    temperature: Number(process.env.TEMPERATURE) || 0.7,
    max_tokens: Number(process.env.MAX_TOKENS) || 2048
  });
  const response = completion.choices[0].message?.content?.trim() ?? '';

  // 6) log assistant  ← COMMENTED OUT to centralize logging in route handler
  // logChat({ threadId: sessionId ?? threadIds![0] ?? 'anon', turn: history.length + 2, role: 'assistant', content: response });

  // 7) JSONL session log
  logSessionEntry({
    session_id: sessionId ?? 'anonymous',
    timestamp: Date.now(),
    prompt,
    response,
    model: completion.model,
    signal: 'none',
    recallUsed: Boolean(sessionId || (threadIds && threadIds.length))
  });

  return {
    response_text: response,
    recallUsed: Boolean(sessionId || (threadIds && threadIds.length)),
    tone_tags: [],
    signal: 'none',
    model: completion.model
  };
}

export function healthCheck() {
  return { status: 'ok', uptime: process.uptime() };
}
