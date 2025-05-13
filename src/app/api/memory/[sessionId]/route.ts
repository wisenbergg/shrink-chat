import { NextRequest, NextResponse } from 'next/server';
import { getMemoryForSession } from '@/lib/sessionMemory';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: { sessionId: string } }
) {
  const { sessionId } = context.params;

  const memory = await getMemoryForSession(sessionId);
  return NextResponse.json({ memory });
}
