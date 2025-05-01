// src/app/api/shrink/route.ts

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define the shape of prior messages coming from the client
interface PriorMessage {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

// If you extend your OpenAI response with custom fields, define them here
interface APIResponseFields {
  signal?: string;
  tone_tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse the incoming JSON with type safety
    const { prompt, priorMessages }: { prompt: string; priorMessages: PriorMessage[] } = await request.json();

    // 2. Load your env vars (with sensible defaults)
    const systemPrompt =
      process.env.SYSTEM_PROMPT ?? "don't be overly inquisitive. relax";
    const temperature = parseFloat(process.env.TEMPERATURE ?? '0.7');
    const maxTokens = parseInt(process.env.MAX_TOKENS ?? '2048', 10);
    const model = process.env.FINE_TUNED_MODEL!;

    // 3. Build the full messages array for the chat completion
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...priorMessages.map((msg: PriorMessage) => ({
        role: msg.sender,
        content: msg.text
      })),
      { role: 'user', content: prompt }
    ];

    // 4. Call OpenAI's chat completion endpoint
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    });

    // 5. Safely extract the assistant's reply
    const responseText = completion.choices[0]?.message?.content ?? '';

    // 6. If your model or pipeline adds metadata fields, pull them out
    const apiResponse = completion as unknown as APIResponseFields;
    const signal = apiResponse.signal ?? 'unknown';
    const tone_tags = apiResponse.tone_tags ?? [];

    // 7. Return a structured JSON response to the frontend
    return NextResponse.json({
      response_text: responseText,
      signal,
      tone_tags,
      recallUsed: false
    });
  } catch (err) {
    console.error('Error in /api/shrink:', err);
    return NextResponse.error();
  }
}
