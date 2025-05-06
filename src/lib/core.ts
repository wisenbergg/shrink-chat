// File: src/lib/core.ts

import OpenAI from 'openai';
import { logSessionEntry } from './logSession';
import { getMemoryForSession, getMemoryForThreads, MemoryTurn } from './sessionMemory';
import { fetchRecall } from './fetchRecall';
import { inferToneTagsFromText } from './toneInference';

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
    "Your role is to hold quiet, supportive space for the user. Offer meaningful, intentional questions — never filler or generic invitations. When the user asks for advice, offer it gently and concisely. When they show openness to reflection, you may invite deeper exploration at their pace. Above all, avoid overwhelming or pressuring the user; prioritize emotional safety, trust, and presence over productivity or solutions.";

  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];

  // Fetch recall material
  let recallUsed = false;
  let retrievedChunks: Array<{
    discipline: string;
    topic: string;
    source: string;
    content: string;
    score: number;
  }> = [];

  try {
    const recallResult = await fetchRecall(prompt);
    recallUsed = recallResult.recallUsed;
    retrievedChunks = recallResult.results;
  } catch (err) {
    console.warn('⚠️ Recall fetch failed, continuing without recall.', err);
  }

  if (recallUsed && retrievedChunks.length) {
    const contextBlock = retrievedChunks
      .map(
        (entry, i) =>
          `${i + 1}. ${entry.discipline} – ${entry.topic} (${entry.source}): ${entry.content}`
      )
      .join("\n\n");

    messages.unshift({
      role: 'system',
      content: `You are grounded in the following therapeutic references:\n\n${contextBlock}\n\nUse these materials to support the user with clarity and care — stay emotionally attuned, not robotically clinical.`
    });
  }

  // Add thread/session memory (now streaming full turns)
  let memory: MemoryTurn[] = [];
  if (threadIds && threadIds.length) {
    memory = await getMemoryForThreads(threadIds, 5);
  } else if (sessionId) {
    memory = await getMemoryForSession(sessionId, 10);
  }

  for (const turn of memory) {
    messages.push({ role: turn.role, content: turn.content });
  }

  for (const h of history) {
    messages.push({ role: h.role, content: h.content });
  }

  messages.push({ role: 'user', content: prompt });

  const useMicro = history.length === 0 && (!threadIds || threadIds.length === 0) && !sessionId;
  const modelToUse = useMicro ? process.env.MICRO_MODEL! : process.env.FINE_TUNED_MODEL!;

  const completion = await openai.chat.completions.create({
    model: modelToUse,
    messages,
    temperature: Number(process.env.TEMPERATURE) || 1.00,
    top_p: Number(process.env.TOP_P) || 0.5,
    max_tokens: Number(process.env.MAX_TOKENS) || 2048
  });

  const response = completion.choices[0].message?.content?.trim() ?? '';

  // Infer tone tags from response
  let inferredToneTags: string[] = [];
  try {
    inferredToneTags = await inferToneTagsFromText(response);
    console.log(`🎨 Inferred tone tags: ${inferredToneTags.join(', ')}`);
  } catch (err) {
    console.warn('⚠️ Tone inference failed, falling back to empty.', err);
  }

  // Log session entry without sending timestamp so DB default applies
  await logSessionEntry({
    session_id: sessionId ?? threadIds?.[0] ?? 'anonymous',
    prompt,
    response,
    model: completion.model,
    signal: 'none', // signal classifier disabled for now
    recallUsed
  });

  return {
    response_text: response,
    recallUsed,
    tone_tags: inferredToneTags,
    signal: 'none',
    model: completion.model
  };
}

export function healthCheck() {
  return { status: 'ok', uptime: process.uptime() };
}
