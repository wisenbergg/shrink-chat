import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  getMemoryForThreads,
  deleteMemoryForThread
} from '@/lib/sessionMemory';

export const runtime = 'nodejs';

const ParamsSchema = z.object({
  threadId: z.string().min(1)
});

// GET /api/memory/[threadId]
export async function GET(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const { threadId } = params;
  const parsed = ParamsSchema.safeParse({ threadId });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid threadId' }, { status: 400 });
  }

  try {
    const memory = await getMemoryForThreads(threadId);
    return NextResponse.json({ threadId, memory }, { status: 200 });
  } catch (err) {
    console.error('[Memory API] Error fetching memory:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/memory/[threadId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { threadId: string } }
) {
  const { threadId } = params;
  const parsed = ParamsSchema.safeParse({ threadId });

  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid threadId' }, { status: 400 });
  }

  try {
    await deleteMemoryForThread(threadId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[Memory API] Failed to delete memory:', err);
    return NextResponse.json({ error: 'Failed to delete memory' }, { status: 500 });
  }
}

// POST not allowed
export function POST() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405, headers: { Allow: 'GET, DELETE' } }
  );
}
