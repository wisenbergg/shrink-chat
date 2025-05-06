import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const { sessionId, responseId, rating, comment } = await req.json();

  if (!sessionId || !responseId || !rating) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error } = await supabase.from('feedback').insert([
    { session_id: sessionId, response_id: responseId, rating, comment }
  ]);

  if (error) {
    console.error('❌ Supabase insert error:', error);
    return NextResponse.json({ error: 'Failed to store feedback' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
