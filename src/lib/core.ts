// src/lib/core.ts
import OpenAI from 'openai';
import rawClassificationCaps from '@/classification_caps.json';
import rawEngineTokenCaps from '@/engine_token_caps.json';
import { loadClassifier, SignalLabel } from './predictSignal';
import { fetchRecall } from './fetchRecall';
import { inferToneFromEmbedding } from './toneInference';

// Assert the JSON shapes:
const classificationCaps = rawClassificationCaps as Record<SignalLabel, string>;
const engineTokenCaps = rawEngineTokenCaps as Record<SignalLabel, number>;

let classifier: Awaited<ReturnType<typeof loadClassifier>> | null = null;

export async function handlePrompt(prompt: string) {
  if (!prompt?.trim()) {
    throw new Error('Missing prompt');
  }

  classifier ??= await loadClassifier();
  const [signal] = await classifier.predict([prompt]);

  const { response_text: recallText, recallUsed } = await fetchRecall(prompt);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  const embedRes = await openai.embeddings.create({
    model: process.env.EMBED_MODEL || 'text-embedding-ada-002',
    input: recallText || prompt
  });
  const embedding = embedRes.data[0].embedding;
  const tone_tags = await inferToneFromEmbedding(embedding);

  const completion = await openai.chat.completions.create({
    model: process.env.CHAT_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: classificationCaps[signal] },
      { role: 'user', content: prompt }
    ],
    max_tokens: engineTokenCaps[signal]
  });

  return {
    response_text: completion.choices?.[0]?.message?.content?.trim() ?? '',
    recallUsed,
    tone_tags,
    signal
  };
}

export function healthCheck() {
  return {
    status: 'ok',
    uptime: process.uptime()
  };
}
