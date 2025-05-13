import { NextRequest, NextResponse } from 'next/server';
import { getMemoryForSession } from '@/lib/sessionMemory';

type RouteContext = {
  params: {
    sessionId: string;
  };
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { sessionId } = context.params;

  const memory = await getMemoryForSession(sessionId);
  return NextResponse.json({ memory });
}
