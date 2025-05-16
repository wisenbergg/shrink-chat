import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getMemoryForThreads, deleteMemoryForThread } from '@/lib/sessionMemory';

export const runtime = 'nodejs';

const ParamsSchema = z.object({
  sessionId: z.string().uuid()
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const parsed = ParamsSchema.safeParse({ sessionId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid sessionId' }, { status: 400 });
  }

  try {
    const memory = await getMemoryForThreads(sessionId);
    return NextResponse.json({ sessionId, memory }, { status: 200 });
  } catch (err) {
    console.error('[Memory API] Error fetching memory:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const parsed = ParamsSchema.safeParse({ sessionId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid sessionId' }, { status: 400 });
  }

  try {
    await deleteMemoryForThread(sessionId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[Memory API] Failed to delete memory:', err);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}

export function POST() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405, headers: { Allow: 'GET, DELETE' } }
  );
}
