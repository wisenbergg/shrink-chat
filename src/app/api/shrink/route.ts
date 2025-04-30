export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { handlePrompt } from '@/lib/core';

interface ErrorBody {
  error: string;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ErrorBody>(
      { error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  const { prompt, session_id } =
    typeof body === 'object' && body !== null ? (body as any) : {};

  if (typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json<ErrorBody>(
      { error: 'Missing prompt' },
      { status: 400 }
    );
  }

  try {
    console.log("🧪 Prompt received:", prompt);

    const result: Awaited<ReturnType<typeof handlePrompt>> & { model?: string } =
      await handlePrompt(prompt, session_id);

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
