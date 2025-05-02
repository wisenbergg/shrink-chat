// src/app/api/shrink/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { handlePrompt } from '@/lib/core';
import { logChat } from '@/lib/logChat';

interface PriorMessage {
  sender: 'user' | 'assistant';
  text: string;
}

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // 1) parse body
    const { prompt, threadId, threadIds, priorMessages = [] } = await request.json();

    // 2) validate prompt
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    // 3) pick a “primary” thread ID for logging
    const primary = threadId ?? threadIds?.[0];
    if (!primary) {
      return NextResponse.json({ error: 'Missing threadId or threadIds[0]' }, { status: 400 });
    }

    // 4) log the incoming user turn
    logChat({ threadId: primary, turn: 1, role: 'user', content: prompt });

    // 5) assemble the core input (include sessionId = primary)
    const input = {
      sessionId: primary,
      threadIds,
      prompt,
      history: (priorMessages as PriorMessage[]).map(m => ({
        role: m.sender,
        content: m.text
      }))
    };

    // 6) delegate to handlePrompt
    const result = await handlePrompt(input);
    const text = result.response_text;

    // 7) log the assistant’s turn
    logChat({ threadId: primary, turn: 2, role: 'assistant', content: text });

    // 8) respond
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
