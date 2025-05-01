import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface PriorMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export const runtime = 'nodejs';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(request: NextRequest) {
  try {
    const { prompt, priorMessages = [] } = await request.json();

    const messages = [
      { role: 'system', content: 'be helpful' },
      ...(priorMessages as PriorMessage[]).map(m => ({
        role: m.sender,
        content: m.text
      })),
      { role: 'user', content: prompt }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages
    });
    const text = completion.choices[0].message?.content ?? '';
    return NextResponse.json({ response_text: text }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal' }, { status: 500 });
  }
}
