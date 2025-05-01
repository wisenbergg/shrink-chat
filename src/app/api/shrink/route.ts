// src/app/api/shrink/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    // parse body & default history
    const { prompt, threadId, priorMessages = [] } = await request.json();

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    // build messages array
    const systemPrompt = process.env.SYSTEM_PROMPT ?? "be helpful";
    const messages = [
      { role: 'system', content: systemPrompt },
      ...priorMessages.map((m: any) => ({
        role: m.sender === 'assistant' ? 'assistant' : 'user',
        content: m.text
      })),
      { role: 'user', content: prompt }
    ];

    // call OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.FINE_TUNED_MODEL ?? 'gpt-4o',
      messages,
      temperature: parseFloat(process.env.TEMPERATURE ?? '0.7'),
      max_tokens: parseInt(process.env.MAX_TOKENS ?? '2048', 10)
    });

    const text = completion.choices[0].message?.content ?? '';
    return NextResponse.json(
      { response_text: text, signal: 'none', tone_tags: [], recallUsed: false },
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in /api/shrink POST:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// optional ping
export async function GET() {
  return NextResponse.json({ status: 'shrink endpoint ready' }, { status: 200 });
}
