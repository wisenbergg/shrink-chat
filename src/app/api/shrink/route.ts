export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { handlePrompt } from '@/lib/core';

interface ErrorBody {
  error: string;
}

export async function POST(request: NextRequest) {
  // 1) Parse JSON body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ErrorBody>(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  // 2) Extract prompt
  const prompt = typeof body === 'object' && body !== null && 'prompt' in body
    ? (body as { prompt: unknown }).prompt
    : undefined;

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json<ErrorBody>(
      { error: 'Missing prompt' },
      { status: 400 }
    );
  }

  // 3) Process with fine-tuned engine
  try {
    console.log("🧪 Prompt received:", prompt);

    const result: Awaited<ReturnType<typeof handlePrompt>> & { model?: string } = await handlePrompt(prompt);

    if (result.model) {
      console.log("🧠 Model used:", result.model);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'internal';
    return NextResponse.json<ErrorBody>(
      { error: message },
      { status: message === 'Missing prompt' ? 400 : 500 }
    );
  }
}

export function GET() {
  return NextResponse.json<ErrorBody>(
    { error: 'Method GET not allowed' },
    { status: 405 }
  );
}
