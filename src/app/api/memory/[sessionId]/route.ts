import { getMemoryForSession } from '@/lib/sessionMemory';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params: { sessionId } }: { params: { sessionId: string } }
) {
  const memory = await getMemoryForSession(sessionId);
  return NextResponse.json(memory);
}
