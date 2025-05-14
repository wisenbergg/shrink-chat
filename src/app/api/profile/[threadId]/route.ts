import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserProfile, updateUserProfile, markOnboardingComplete } from '@/lib/sessionMemory';

export const runtime = 'nodejs';

const ParamsSchema = z.object({
  threadId: z.string().uuid()
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;
  const parsed = ParamsSchema.safeParse({ threadId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid threadId' }, { status: 400 });
  }

  try {
    const profile = await getUserProfile(threadId);
    return NextResponse.json({ threadId, profile }, { status: 200 });
  } catch (err) {
    console.error('[Profile API] Error fetching profile:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;
  const parsed = ParamsSchema.safeParse({ threadId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Missing or invalid threadId' }, { status: 400 });
  }

  const body = await req.json();
  try {
    if (body.onboardingComplete) {
      await markOnboardingComplete(threadId);
    } else {
      await updateUserProfile(threadId, body);
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('[Profile API] Error updating profile:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
