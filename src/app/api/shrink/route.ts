// src/app/api/shrink/route.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

import { fetchRecall } from '@/lib/fetchRecall';
import { inferToneFromEmbedding } from '@/lib/toneInference';
import classificationCaps from '../../../../classification_caps.json';
import engineTokenCaps from '../../../../engine_token_caps.json';
import { loadClassifier, SignalLabel } from '@/lib/predictSignal';

let classifier: Awaited<ReturnType<typeof loadClassifier>> | null = null;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = (await request.json()) as { prompt: string };
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    classifier ??= await loadClassifier();
    const [signal] = await classifier.predict([prompt]) as SignalLabel[];

    const { response_text: recallText, recallUsed } = await fetchRecall(prompt);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
    const embedInput = recallText || prompt;
    const embedding = await openai.embeddings.create({
      model: process.env.EMBED_MODEL || 'text-embedding-ada-002',
      input: embedInput
    });
    const tone_tags = await inferToneFromEmbedding(embedding.data[0].embedding);

    const useAlt = Math.random() < 0.5;
    const model = useAlt
      ? process.env.CHAT_MODEL_ALT!
      : process.env.CHAT_MODEL!;
    const caps = engineTokenCaps as Record<string, number>;
    const max_tokens = caps[signal] ?? 150;

    const start = Date.now();
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: classificationCaps[signal] ?? '' },
        { role: 'user', content: prompt }
      ],
      max_tokens,
      temperature: 0.7
    });
    const ms = Date.now() - start;
    const cost = completion.usage?.total_tokens;
    console.log({ model, useAlt, ms, cost, signal, recallUsed });

    const text = completion.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({
  response_text: text,
  recallUsed,
  tone_tags,
  signal,
  model,        // ← add this
  useAlt  // ← and this if you want
});

  } catch (err: unknown) {
    console.error('shrinker error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
