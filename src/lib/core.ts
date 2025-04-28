// src/lib/core.ts
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions/completions';
import rawClassificationCaps from '@/classification_caps.json';
import rawEngineTokenCaps from '@/engine_token_caps.json';
import { loadClassifier, SignalLabel } from './predictSignal';
import { fetchRecall } from './fetchRecall';
import { inferToneFromEmbedding } from './toneInference';

const classificationCaps = rawClassificationCaps as Record<SignalLabel, string>;
const engineTokenCaps = rawEngineTokenCaps as Record<SignalLabel, number>;

let classifier: Awaited<ReturnType<typeof loadClassifier>> | null = null;

export async function handlePrompt(prompt: string) {
  if (!prompt.trim()) throw new Error('Missing prompt');
  classifier ??= await loadClassifier();
  const [signal] = await classifier.predict([prompt]);
  const { response_text: recallText, recallUsed } = await fetchRecall(prompt);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const embedRes = await openai.embeddings.create({
    model: process.env.EMBED_MODEL || 'text-embedding-ada-002',
    input: recallText || prompt
  });
  const tone_tags = await inferToneFromEmbedding(embedRes.data[0].embedding);

  const systemPrompt = classificationCaps[signal];
  const brevityInstr = 'Please respond in no more than 200 words, but preserve tone and nuance.';
  const baseMessages = [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: brevityInstr },
    { role: 'user', content: prompt }
  ] as ChatCompletionMessageParam[];

  const first = await openai.chat.completions.create({
    model: process.env.CHAT_MODEL!,
    messages: baseMessages,
    max_tokens: engineTokenCaps[signal]
  });
  let fullText = first.choices[0].message?.content?.trim() ?? '';

  if (!/[.!?]"?$/.test(fullText)) {
    const contMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: fullText },
      { role: 'user', content: 'Please continue the previous response.' }
    ] as ChatCompletionMessageParam[];

    const cont = await openai.chat.completions.create({
      model: process.env.CHAT_MODEL!,
      messages: contMessages,
      max_tokens: engineTokenCaps[signal] * 2
    });
    fullText += '\n' + (cont.choices[0].message?.content?.trim() ?? '');
  }

  return { response_text: fullText, recallUsed, tone_tags, signal };
}

export function healthCheck() {
  return { status: 'ok', uptime: process.uptime() };
}
