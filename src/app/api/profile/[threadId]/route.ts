// src/app/api/profile/[threadId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/sessionMemory';
import { z } from 'zod';

const ParamsSchema = z.object({
  threadId: z.string().min(1),
});

export async function GET(
  req: NextRequest,
  { params }  // no explicit type here
) {
  const { threadId } = params;
  const parsed = ParamsSchema.safeParse({ threadId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Missing or invalid threadId' },
      { status: 400 }
    );
  }

  try {
    const profile = await getUserProfile(threadId);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
