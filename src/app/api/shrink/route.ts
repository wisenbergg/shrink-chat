/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */


import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

import { fetchRecall } from '@/lib/fetchRecall';
import { inferToneFromEmbedding } from '@/lib/toneInference';
import classificationCaps from '@/classification_caps.json';
import engineTokenCaps from '@/engine_token_caps.json';
import { loadClassifier, SignalLabel } from '@/lib/predictSignal';

let classifier: Awaited<ReturnType<typeof loadClassifier>> | null = null;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = (await request.json()) as { prompt: string };
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    

    classifier ??= await loadClassifier();
    const signal = (await classifier.predict([prompt]))[0];

    const { response_text: recallText, recallUsed } = await fetchRecall(prompt);

    console.log(
  JSON.stringify({
    prompt: prompt.slice(0, 60),
    signal,
    recallUsed,
    recallSnippet: recallText?.slice(0, 60)
  })
);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const embedInput = recallText || prompt;
const embedding = await openai.embeddings.create({
  model: 'text-embedding-ada-002',
  input: embedInput
});

    const tone_tags = await inferToneFromEmbedding(embedding.data[0].embedding);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: (classificationCaps as any)[signal] || '' },
        { role: 'user', content: prompt }
      ],
      max_tokens: (engineTokenCaps as any)[signal] || 150
    });

    return NextResponse.json({
      response_text: completion.choices?.[0]?.message?.content?.trim() ?? '',
      recallUsed,
      tone_tags,
      signal
    });
  } catch (err: any) {
    console.error('shrinker error:', err);
    return NextResponse.json({ error: err.message || 'internal' }, { status: 500 });
  }
}