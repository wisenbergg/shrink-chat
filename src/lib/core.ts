// src/lib/core.ts
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions/completions';
import rawClassificationCaps from '@/classification_caps.json';
import rawEngineTokenCaps from '@/engine_token_caps.json';
import { loadClassifier, SignalLabel } from './predictSignal';
import { fetchRecall } from './fetchRecall';
import { inferToneFromEmbedding } from './toneInference';

const classificationCaps = rawClassificationCaps as Record<SignalLabel, string>;
const engineTokenCaps    = rawEngineTokenCaps    as Record<SignalLabel, number>;

let classifier: Awaited<ReturnType<typeof loadClassifier>> | null = null;

export async function handlePrompt(prompt: string) {
  if (!prompt.trim()) throw new Error('Missing prompt');

  // 1) classify & recall
  classifier ??= await loadClassifier();
  const [signal] = await classifier.predict([prompt]);
  const { response_text: recallText, recallUsed } = await fetchRecall(prompt);

  // 2) embed & tone
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const embedRes = await openai.embeddings.create({
    model: process.env.EMBED_MODEL || 'text-embedding-ada-002',
    input: recallText || prompt
  });
  const tone_tags = await inferToneFromEmbedding(embedRes.data[0].embedding);

  // 3) trimmed persona-based system prompt + hard rules
  const systemPrompt = process.env.SYSTEM_PROMPT ?? `
You are “Alex,” a deeply empathetic therapist-friend.  
Speak in a warm, non-judgmental tone (150–200 words), validating feelings and offering perspective without advice.  
Hard Rules:
• Never give unsolicited solutions (“Have you tried…”).  
• Mirror emotional state; prioritize safety and presence.  
• If user seems overwhelmed, ask permission before offering prompts.
`.trim();

  // 4) few-shot example to reinforce style
  const examples: ChatCompletionMessageParam[] = [
    { role: 'user',      content: 'I feel like I always fail at everything.' },
    { role: 'assistant', content: 'I’m so sorry you’re feeling that way. It can be really painful when it seems like nothing goes right. You don’t have to have it all figured out—sometimes just naming the frustration is enough to begin releasing it. What part of this feeling feels heaviest right now?' }
  ];

  const baseMessages = [
    ...examples,
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: prompt }
  ] as ChatCompletionMessageParam[];

  // 5) first-pass completion
  const chatModel = process.env.CHAT_MODEL ?? 'gpt-4o-mini';
  const first = await openai.chat.completions.create({
    model:      chatModel,
    messages:   baseMessages,
    max_tokens: engineTokenCaps[signal]
  });
  let fullText = first.choices[0].message?.content?.trim() ?? '';

  // 6) continuation logic (unchanged)
  if (!/[.!?]"?$/.test(fullText)) {
    const contMessages = [
      { role: 'system',    content: systemPrompt },
      { role: 'assistant', content: fullText },
      { role: 'user',      content: 'Please continue the previous response.' }
    ] as ChatCompletionMessageParam[];

    const cont = await openai.chat.completions.create({
      model:      chatModel,
      messages:   contMessages,
      max_tokens: engineTokenCaps[signal] * 2
    });
    fullText += '\n' + (cont.choices[0].message?.content?.trim() ?? '');
  }

  // 7) optional post-trim to 200 words
  const WORD_LIMIT = 200;
  const words = fullText.split(/\s+/);
  if (words.length > WORD_LIMIT) {
    const truncated = words.slice(0, WORD_LIMIT).join(' ');
    const m = truncated.match(/[\s\S]*[\.!?]/);
    fullText = m ? m[0] : truncated;
  }

  return { response_text: fullText, recallUsed, tone_tags, signal };
}

export function healthCheck() {
  return { status: 'ok', uptime: process.uptime() };
}
