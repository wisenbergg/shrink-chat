import { NextRequest, NextResponse } from 'next/server';
import { getMemoryForSession } from '@/lib/sessionMemory';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: { sessionId: string } }
) {
  // ✏️ Await the params wrapper
  const { sessionId } = await context.params;

  const memory = await getMemoryForSession(sessionId);
  return NextResponse.json({ memory });
}
