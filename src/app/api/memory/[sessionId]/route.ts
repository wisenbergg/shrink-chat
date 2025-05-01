// src/app/api/memory/[sessionId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getMemoryForSession } from '@/lib/sessionMemory';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // extract the last segment of the path as the sessionId:
  const pathname = request.nextUrl.pathname;       // e.g. "/api/memory/test"
  const parts = pathname.split('/');               // ["", "api", "memory", "test"]
  const sessionId = parts[parts.length - 1];       // "test"

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing sessionId in URL' },
      { status: 400 }
    );
  }

  try {
    const memory = await getMemoryForSession(sessionId);
    return NextResponse.json({ sessionId, memory }, { status: 200 });
  } catch (err) {
    console.error('Memory load failed:', err);
    return NextResponse.json(
      { error: 'Could not load memory' },
      { status: 500 }
    );
  }
}

export function POST() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}
