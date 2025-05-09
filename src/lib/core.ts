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

// ── fix empty-interface lint errors ───────────────────────────────────────────
export type FirstEmptyInterface  = Record<string, unknown>;
export type SecondEmptyInterface = Record<string, unknown>;

// ── dynamic scaffolding templates ────────────────────────────────────────────
const openingTemplates = [
  "I’m here whenever you’re ready. What would you like to share today?",
  "No rush—take your time. What’s on your mind?",
  "Whenever you feel comfortable, I’m listening. What’s up for you right now?",
];
const followupTemplates = [
  (tone: string) => `I’m noticing a sense of ${tone}—would you like to explore that more?`,
  (tone: string) => `That sounds ${tone}. What’s that like for you in this moment?`,
  (tone: string) => `You seem to be feeling ${tone}. Can you say more about that?`,
];
function pickOpeningScaffold() {
  return openingTemplates[Math.floor(Math.random() * openingTemplates.length)];
}
function pickFollowupScaffold(tone: string) {
  const fn = followupTemplates[Math.floor(Math.random() * followupTemplates.length)];
  return fn(tone || 'your feelings');
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function handlePrompt(input: PromptInput): Promise<PromptResult> {
  const { sessionId, threadIds, prompt, history = [] } = input;
  if (!prompt.trim()) throw new Error('Missing prompt');

  const systemPrompt = process.env.SYSTEM_PROMPT ??
    "Your role is to hold quiet, supportive space for the user. Offer meaningful, intentional questions — never filler or generic invitations. When the user asks for advice, offer it gently and concisely. When they show openness to reflection, you may invite deeper exploration at their pace. Above all, avoid overwhelming or pressuring the user; prioritize emotional safety, trust, and presence over productivity or solutions.";

  // start building the messages for the LLM
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt }
  ];

  // ─── 1) Turn‑level scaffold ─────────────────────────────────────────────
  // infer tone asap so we can use it in our scaffold
  const inferredToneTags = await inferToneTagsFromText(prompt);
  const primaryTone = inferredToneTags[0] || 'your feelings';

  const scaffold = history.length === 0
    ? pickOpeningScaffold()
    : pickFollowupScaffold(primaryTone);

  messages.push({
    role: 'system',
    content: scaffold
  });

  // ─── the rest of your pipeline ───────────────────────────────────────────
  let recallUsed = false;
  let retrievedChunks: Array<{ discipline: string; topic: string; source: string; content: string; score: number }> = [];

  const predictedSignal = await predictSignal(prompt);

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
      content: `You are grounded in the following therapeutic references:\n\n${contextBlock}\n\nUse these insights naturally and conversationally, weaving them into your responses without quoting definitions or sounding clinical. Prioritize the user’s unique experience.`
    });
  }

  // memory & history
  let memory: MemoryTurn[] = [];
  if (threadIds?.length) {
    memory = await getMemoryForThreads(threadIds, 5);
  } else if (sessionId) {
    memory = await getMemoryForSession(sessionId, 10);
  }
  for (const turn of memory)    messages.push({ role: turn.role,    content: turn.content });
  for (const h of history)      messages.push({ role: h.role,       content: h.content });

  // rupture‑repair override
  if (ruptureDetector(prompt)) {
    messages.push({
      role: 'system',
      content: `Well, that's embarrassing. Think you can help me figure out what I missed?`
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

  // fallbacks ...
  const repetitionFallbacks = process.env.REPETITION_FALLBACKS?.split('|') || [];
  const withdrawalFallbacks = process.env.WITHDRAWAL_FALLBACKS?.split('|') || [];
  const crisisFallback      = process.env.CRISIS_FALLBACK || '';

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

function randomChoice(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
function detectRepetition(history: { content: string }[], response: string) {
  const last = history[history.length - 1]?.content || '';
  return last && response.includes(last);
}
function detectWithdrawal(response: string) {
  return response.trim().length < 10;
}
function detectCrisisSignals(response: string) {
  const crisis = ['end it', 'suicide', 'self-harm'];
  return crisis.some(w => response.includes(w));
}
export function healthCheck() {
  return { status: 'ok', uptime: process.uptime() };
}
