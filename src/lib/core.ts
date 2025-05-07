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

  const systemPrompt = process.env.SYSTEM_PROMPT ?? "Your role is to be a compassionate, grounded, and effortlessly casual companion.";

  const messages: Array<{ role: string; content: string }> = [{ role: 'system', content: systemPrompt }];

  let recallUsed = false;
  let retrievedChunks: Array<{ discipline: string; topic: string; source: string; content: string; score: number }> = [];

  try {
    const recallResult = await fetchRecall(prompt);
    recallUsed = recallResult.recallUsed;
    retrievedChunks = recallResult.results;
  } catch (err) {
    console.warn('⚠️ Recall fetch failed, continuing without recall.', err);
  }

  if (recallUsed && retrievedChunks.length) {
    const contextBlock = retrievedChunks.slice(0, 3).map(entry => `(${entry.discipline}) ${entry.topic}: ${entry.content}`).join("\n\n");
    messages.unshift({
      role: 'system',
      content: `You are grounded in the following therapeutic references:\n\n${contextBlock}\n\nUse these insights conversationally.`,
    });
  }

  let memory: MemoryTurn[] = [];
  if (threadIds && threadIds.length) {
    memory = await getMemoryForThreads(threadIds, 5);
  } else if (sessionId) {
    memory = await getMemoryForSession(sessionId, 10);
  }

  for (const turn of memory) messages.push({ role: turn.role, content: turn.content });
  for (const h of history) messages.push({ role: h.role, content: h.content });
  messages.push({ role: 'user', content: prompt });

  const useMicro = history.length === 0 && (!threadIds || threadIds.length === 0) && !sessionId;
  const modelToUse = useMicro ? process.env.MICRO_MODEL! : process.env.FINE_TUNED_MODEL!;

  const completion = await openai.chat.completions.create({
    model: modelToUse,
    messages,
    temperature: Number(process.env.TEMPERATURE) || 1.0,
    top_p: Number(process.env.TOP_P) || 0.5,
    max_tokens: Number(process.env.MAX_TOKENS) || 2048,
  });

  let response = completion.choices[0].message?.content?.trim() ?? '';
  let inferredToneTags: string[] = [];
  try {
    inferredToneTags = await inferToneTagsFromText(response);
    console.log(`🎨 Inferred tone tags: ${inferredToneTags.join(', ')}`);
  } catch (err) {
    console.warn('⚠️ Tone inference failed.', err);
  }

  const repetitionFallbacks = process.env.REPETITION_FALLBACKS?.split('|') || [];
  const withdrawalFallbacks = process.env.WITHDRAWAL_FALLBACKS?.split('|') || [];
  const crisisFallback = process.env.CRISIS_FALLBACK || '';

  if (detectRepetition(history, response) && repetitionFallbacks.length) {
    response += `\n\n${randomChoice(repetitionFallbacks)}`;
  }
  if (detectWithdrawal(response) && withdrawalFallbacks.length) {
    response += `\n\n${randomChoice(withdrawalFallbacks)}`;
  }
  if (detectCrisisSignals(response) && crisisFallback) {
    response += `\n\n${crisisFallback}`;
  }

  await logSessionEntry({
    session_id: sessionId ?? threadIds?.[0] ?? 'anonymous',
    prompt,
    response,
    model: completion.model,
    signal: 'none',
    recallUsed,
  });

  return {
    response_text: response,
    recallUsed,
    tone_tags: inferredToneTags,
    signal: 'none',
    model: completion.model,
  };
}

function randomChoice(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectRepetition(history: { content: string }[], response: string): boolean {
  const lastResponse = history[history.length - 1]?.content || '';
  return lastResponse && response.includes(lastResponse);
}

function detectWithdrawal(response: string): boolean {
  return response.trim().length < 10;
}

function detectCrisisSignals(response: string): boolean {
  const crisisWords = ['end it', 'can’t take', 'suicide', 'self-harm', 'die', 'kill myself'];
  return crisisWords.some(word => response.toLowerCase().includes(word));
}

export function healthCheck() {
  return { status: 'ok', uptime: process.uptime() };
}
