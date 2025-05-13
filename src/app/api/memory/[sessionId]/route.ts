import { NextRequest, NextResponse } from 'next/server';
import { getMemoryForSession } from '@/lib/sessionMemory';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context: any) {
  const { sessionId } = context.params;
  const memory = await getMemoryForSession(sessionId);
  return NextResponse.json({ memory });
}
