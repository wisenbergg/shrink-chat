// src/lib/core.ts
import OpenAI from 'openai';
import rawClassificationCaps from '@/classification_caps.json';
import rawEngineTokenCaps from '@/engine_token_caps.json';
import { loadClassifier, SignalLabel } from './predictSignal';
import { fetchRecall } from './fetchRecall';
import { inferToneFromEmbedding } from './toneInference';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions/completions'; 


// We know these JSON files map each SignalLabel to a string or number:
const classificationCaps = rawClassificationCaps as Record<SignalLabel, string>;
const engineTokenCaps = rawEngineTokenCaps as Record<SignalLabel, number>;

let classifier: Awaited<ReturnType<typeof loadClassifier>> | null = null;

export async function handlePrompt(prompt: string) {
  if (!prompt?.trim()) throw new Error('Missing prompt');

  classifier ??= await loadClassifier();
  const [signal] = await classifier.predict([prompt]);

  const { response_text: recallText, recallUsed } = await fetchRecall(prompt);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

  // Build embeddings and tone tags as before
  const embedRes = await openai.embeddings.create({
    model: process.env.EMBED_MODEL || 'text-embedding-ada-002',
    input: recallText || prompt
  });
  const embedding = embedRes.data[0].embedding;
  const tone_tags = await inferToneFromEmbedding(embedding);

  // 1) First completion with concision instruction
  const baseMessages = [
    { role: 'system', content: classificationCaps[signal] },
    { role: 'system', content: 'Please respond in no more than 200 words, but preserve tone and nuance.' },
    { role: 'user', content: prompt }
  ] as ChatCompletionMessageParam[];
  
  const first = await openai.chat.completions.create({
    model: process.env.CHAT_MODEL || 'gpt-4o-mini',
    messages: baseMessages,
    max_tokens: engineTokenCaps[signal]
  });
  let fullText = first.choices[0].message?.content?.trim() ?? '';

  // 2) If the text ends without sentence punctuation, ask it to continue
  if (!/[.!?]"?$/.test(fullText)) {
    const cont = await openai.chat.completions.create({
      model: process.env.CHAT_MODEL || 'gpt-4o-mini',
      messages: [
        ...baseMessages,
        { role: 'user', content: 'Please continue the previous response.' }
      ],
      max_tokens: engineTokenCaps[signal]
    });
    fullText += '\n' + (cont.choices[0].message?.content?.trim() ?? '');
  }

  return {
    response_text: fullText,
    recallUsed,
    tone_tags,
    signal
  };
}

export function healthCheck() {
  return { status: 'ok', uptime: process.uptime() };
}
