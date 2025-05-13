import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserProfile } from '@/lib/sessionMemory';

const ParamsSchema = z.object({
  threadId: z.string().min(1)
});

export const runtime = 'nodejs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(request: NextRequest, context: any) {
  const { threadId } = context.params;

  const parsed = ParamsSchema.safeParse({ threadId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid threadId' }, { status: 400 });
  }

  const profile = await getUserProfile(threadId);
  return NextResponse.json({ profile });
}
