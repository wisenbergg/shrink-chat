import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions/completions';
import { logSessionEntry } from './logSession';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const LOG_PATH = path.join(process.cwd(), 'data', 'session_log.jsonl');

interface MemoryTurn {
  prompt: string;
  response: string;
}

async function getMemoryForSession(session_id: string): Promise<MemoryTurn[]> {
  try {
    const file = fs.readFileSync(LOG_PATH, 'utf-8');
    const lines = file.split('\n').filter(Boolean);
    return lines
      .map(line => JSON.parse(line))
      .filter(entry => entry.session_id === session_id)
      .map(entry => ({ prompt: entry.prompt, response: entry.response }))
      .slice(-10);
  } catch (err) {
    console.warn('⚠️ No memory available:', err);
    return [];
  }
}

export async function handlePrompt(prompt: string, session_id?: string) {
  if (!prompt.trim()) throw new Error('Missing prompt');

  const chatModel = process.env.FINE_TUNED_MODEL ?? 'gpt-4o';
  const temperature = Number(process.env.TEMPERATURE) || 0.52;
  const maxTokens = Number(process.env.MAX_TOKENS) || 2048;

  const memoryThreshold = 3;
  const messages: ChatCompletionMessageParam[] = [];


  if (session_id) {
    const memory = await getMemoryForSession(session_id);
    if (memory.length >= memoryThreshold) {
      for (const turn of memory) {
        messages.push({ role: 'user', content: turn.prompt });
        messages.push({ role: 'assistant', content: turn.response });
      }
    }
  }

  messages.push({ role: 'user', content: prompt });

  const response = await openai.chat.completions.create({
    model: chatModel,
    messages,
    max_tokens: maxTokens,
    temperature,
    presence_penalty: 0,
    frequency_penalty: 0
  });

  const response_text = response.choices[0].message?.content?.trim() ?? '';

  logSessionEntry({
    session_id: session_id || 'anonymous',
    timestamp: Date.now(),
    prompt,
    response: response_text,
    model: chatModel,
    signal: 'none',
    recallUsed: false
  });

  return {
    response_text,
    recallUsed: false,
    tone_tags: [],
    signal: 'none',
    model: chatModel
  };
}

export function healthCheck() {
  return { status: 'ok', uptime: process.uptime() };
}
