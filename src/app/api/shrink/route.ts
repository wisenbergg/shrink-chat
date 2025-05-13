console.log('> env OPENAI_API_KEY =', process.env.OPENAI_API_KEY);


import { NextRequest, NextResponse } from 'next/server';
import { runShrinkEngine } from '@/lib/core';
import { logChat } from '@/lib/logChat';

interface PriorMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

  try {
    // 1) Parse and validate
    const { prompt, threadId, threadIds, priorMessages = [] } = await request.json();
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const primary = threadId ?? threadIds?.[0];
    if (!primary) {
      return NextResponse.json({ error: 'Missing threadId or threadIds[0]' }, { status: 400 });
    }

    // 2) Log user turn
    logChat({ threadId: primary, turn: 1, role: 'user', content: prompt });

    // 3) Build full input for engine
    const result = await runShrinkEngine({
      sessionId: primary,
      threadIds: [primary],
      prompt,
      history: (priorMessages as PriorMessage[]).map((m) => ({
        role: m.sender,
        content: m.text
      }))
    });

    const text = result.response_text;

    // 4) Log assistant turn
    logChat({ threadId: primary, turn: 2, role: 'assistant', content: text });

    // 5) Respond
    return NextResponse.json(
      {
        response_text: text,
        signal: result.signal,
        tone_tags: result.tone_tags,
        recallUsed: result.recallUsed
      },
      { status: 200 }
    );

  } catch (err) {
    console.error('Error in /api/shrink POST:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'shrink endpoint ready' }, { status: 200 });
}
