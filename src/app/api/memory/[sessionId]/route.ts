// src/app/api/memory/[sessionId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMemoryForSession } from '@/lib/sessionMemory';

export const runtime = 'nodejs';

// Zod schema for validation
const ParamsSchema = z.object({
  sessionId: z.string().min(1),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  // 1) Await the params promise to get a real object
  const { sessionId } = await context.params;

  // 2) Validate with Zod
  const parsed = ParamsSchema.safeParse({ sessionId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Missing or invalid sessionId' },
      { status: 400 }
    );
  }

  // 3) Load memory
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

// Reject any non‑GET methods
export function POST() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}
