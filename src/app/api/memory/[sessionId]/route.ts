// src/app/api/memory/[sessionId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getMemoryForSession } from '@/lib/sessionMemory';

export async function GET(
  request: NextRequest,
  { params }         // ← no explicit type here
) {
  const sessionId = params.sessionId;
  const memory = await getMemoryForSession(sessionId);
  return NextResponse.json(memory);
}
