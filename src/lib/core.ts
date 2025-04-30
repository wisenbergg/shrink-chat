import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions/completions';
import { logSessionEntry } from './logSession'; // ✅ static import

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function handlePrompt(prompt: string, session_id?: string) {
  if (!prompt.trim()) throw new Error('Missing prompt');

  const chatModel = process.env.FINE_TUNED_MODEL ?? 'gpt-4o';
  const temperature = Number(process.env.TEMPERATURE) || 0.52;
  const maxTokens = Number(process.env.MAX_TOKENS) || 2048;

  const messages: ChatCompletionMessageParam[] = [
    { role: 'user', content: prompt }
  ];

  const response = await openai.chat.completions.create({
    model: chatModel,
    messages,
    max_tokens: maxTokens,
    temperature,
    presence_penalty: 0,
    frequency_penalty: 0
  });

  const response_text = response.choices[0].message?.content?.trim() ?? '';

  // 🔁 log session
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
