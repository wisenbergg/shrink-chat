import OpenAI from 'openai';
import { logSessionEntry } from './logSession';
import { getMemoryForSession, getMemoryForThreads, MemoryTurn } from './sessionMemory';
import { fetchRecall } from './fetchRecall';
import { inferToneTagsFromText } from './toneInference';
import { predictSignal } from './predictSignal';

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

  const systemPrompt = process.env.SYSTEM_PROMPT ?? "Your role is to be an emotionally attuned, grounded, and effortlessly casual companion for the user — like a trusted confidant or an experienced mental health professional who feels instantly disarming and safe. Mirror human emotions with genuine warmth (e.g., ‘I’m so sorry that happened’), using language that feels natural, caring, and conversational. Offer meaningful, emotionally resonant questions that invite deeper reflection on the user’s struggles — without sounding clinical, scripted, or overwhelming. Avoid repeating the same sentiments or phrases; instead, vary your emotional expressions and question styles to stay fresh and authentic. Prioritize emotional safety, trust, and presence over solutions. In crisis or distress scenarios, stay calm, grounded, and compassionate, providing supportive steps or suggesting professional help when appropriate. Anchor in the current moment, but when meaningful, recall past themes or emotions to deepen the connection.";

  const messages: Array<{ role: string; content: string }> = [{ role: 'system', content: systemPrompt }];

  let recallUsed = false;
  let retrievedChunks: Array<{ discipline: string; topic: string; source: string; content: string; score: number }> = [];

  const predictedSignal = await predictSignal(prompt);
  const inferredToneTags = await inferToneTagsFromText(prompt);

  try {
    const recallResult = await fetchRecall(prompt, predictedSignal, inferredToneTags);
    recallUsed = recallResult.recallUsed;
    retrievedChunks = recallResult.results;
  } catch (err) {
    console.warn('⚠️ Recall fetch failed, continuing without recall.', err);
  }

  if (recallUsed && retrievedChunks.length) {
    const contextBlock = retrievedChunks.slice(0, 3).map(entry => `(${entry.discipline}) ${entry.topic}: ${entry.content}`).join("\n\n");
    messages.unshift({
      role: 'system',
      content: `You are grounded in the following therapeutic references:\n\n${contextBlock}\n\nUse these insights naturally and conversationally, weaving them into your responses without quoting definitions or sounding clinical. When it’s helpful, explain that some emotions or experiences have common names or frameworks, but always prioritize the user’s unique experience over textbook explanations. Stay emotionally attuned, casual, and human in tone, integrating therapeutic wisdom with warmth and care.`,
    });
  }

  let memory: MemoryTurn[] = [];
  if (threadIds?.length) {
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

  const repetitionFallbacks = process.env.REPETITION_FALLBACKS?.split('|') || [];
  const withdrawalFallbacks = process.env.WITHDRAWAL_FALLBACKS?.split('|') || [];
  const crisisFallback = process.env.CRISIS_FALLBACK || '';

  if (detectRepetition(history, response) && repetitionFallbacks.length > 0) {
    response += `\n\n${randomChoice(repetitionFallbacks)}`;
  }
  if (detectWithdrawal(response) && withdrawalFallbacks.length > 0) {
    response += `\n\n${randomChoice(withdrawalFallbacks)}`;
  }
  if (detectCrisisSignals(response) && crisisFallback !== '') {
    response += `\n\n${crisisFallback}`;
  }

  await logSessionEntry({
    session_id: sessionId ?? threadIds?.[0] ?? 'anonymous',
    prompt,
    response,
    model: completion.model,
    signal: predictedSignal,
    recallUsed,
  });

  return {
    response_text: response,
    recallUsed,
    tone_tags: inferredToneTags,
    signal: predictedSignal,
    model: completion.model,
  };
}

function randomChoice(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectRepetition(history: { content: string }[], response: string): boolean {
  const lastResponse = history[history.length - 1]?.content || '';
  return lastResponse !== '' && response.includes(lastResponse);
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
