import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Parse body as an object with a single string property
  const { prompt } = (await request.json()) as { prompt: string };

  // Call your Vercel function
  const apiRes = await fetch(
    `${process.env.NEXT_PUBLIC_SHRINK_API_URL}/api/shrink`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }
  );

  if (!apiRes.ok) {
    const errorText = await apiRes.text();
    return NextResponse.json(
      { error: 'Backend error', detail: errorText },
      { status: apiRes.status }
    );
  }

  const data = await apiRes.json(); // typed response: { response_text, recallUsed, tone_tags }
  return NextResponse.json(data);
}
