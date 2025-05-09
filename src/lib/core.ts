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
function ruptureDetector(userText: string): boolean {
  const cues = [
    'you don’t get',
    'that’s not',
    'you missed',
    'you’re not',
    'that wasn’t',
    'you didn’t',
  ];
  const lower = userText.toLowerCase();
  return cues.some(c => lower.includes(c));
}

export type FirstEmptyInterface  = Record<string, unknown>;
export type SecondEmptyInterface = Record<string, unknown>;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function handlePrompt(input: PromptInput): Promise<PromptResult> {
  const { sessionId, threadIds, prompt, history = [] } = input;
  if (!prompt.trim()) throw new Error('Missing prompt');

  const systemPrompt = process.env.SYSTEM_PROMPT ?? 
    "Your role is to hold quiet, supportive space for the user. Offer meaningful, intentional questions — never filler or generic invitations. When the user asks for advice, offer it gently and concisely. When they show openness to reflection, you may invite deeper exploration at their pace. Above all, avoid overwhelming or pressuring the user; prioritize emotional safety, trust, and presence over productivity or solutions.";;

  const messages: Array<{ role: string; content: string }> = [{ role: 'system', content: systemPrompt }];

  // ─── 1) Turn‑level scaffold ─────────────────────────────────────────────
  const lens = /* obtain currentLens */ '';
  const tone = /* obtain currentTone */ '';
  messages.push({
    role: 'system',
    content: `You are a warm, nonjudgmental therapeutic presence.\nMaintain the “${lens}” lens and “${tone}” tone.\n\nAssistant’s internal 3‑step:\n1) Summarize the user’s last emotional tone.\n2) Mirror that tone (“I noticed …”).\n3) Offer the next gentle therapeutic move.`
  });

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
    const contextBlock = retrievedChunks.slice(0, 3)
      .map(e => `(${e.discipline}) ${e.topic}: ${e.content}`)
      .join("\n\n");
    messages.unshift({
      role: 'system',
      content: `You are grounded in the following therapeutic references:\n\n${contextBlock}\n\nUse these insights naturally and conversationally, weaving them into your responses without quoting definitions or sounding clinical. When it’s helpful, explain that some emotions or experiences have common names or frameworks, but always prioritize the user’s unique experience over textbook explanations. Stay emotionally attuned, casual, and human in tone, integrating therapeutic wisdom with warmth and care. `,
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

  // ─── 2) Rupture‑repair override ─────────────────────────────────────────
  if (ruptureDetector(prompt)) {
    messages.push({
      role: 'system',
      content: `Well, that's embarrassing. Think you can help me figure out what I missed?`,
    });
  }

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

function randomChoice(arr: string[]): string { return arr[Math.floor(Math.random() * arr.length)]; }
function detectRepetition(history: { content: string }[], response: string) { const last = history[history.length-1]?.content||''; return last && response.includes(last); }
function detectWithdrawal(response: string) { return response.trim().length < 10; }
function detectCrisisSignals(response: string) { const crisis = ['end it','suicide','self-harm']; return crisis.some(w=>response.includes(w)); }
export function healthCheck() { return { status:'ok', uptime: process.uptime() }; }
