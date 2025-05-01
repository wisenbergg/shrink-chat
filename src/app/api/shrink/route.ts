// src/app/api/shrink/route.ts

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'  // or 'experimental-edge' if you prefer edge runtime

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    // 1. Parse incoming JSON (we expect { prompt, priorMessages })
    const { prompt, priorMessages } = await request.json()

    // 2. Load your env vars (with sensible defaults)
    const systemPrompt = process.env.SYSTEM_PROMPT ?? "don't be overly inquisitive. relax"
    const temperature = parseFloat(process.env.TEMPERATURE ?? '0.7')
    const maxTokens = parseInt(process.env.MAX_TOKENS ?? '2048', 10)
    const model = process.env.FINE_TUNED_MODEL!

    // 3. Build the full `messages` array for the chat completion
    const messages = [
      { role: 'system', content: systemPrompt },
      ...priorMessages.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: prompt }
    ]

    // 4. Call OpenAI
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    })

    // 5. Extract and return
    const responseText = completion.choices[0].message.content
    return NextResponse.json({
      response_text: responseText,
      // if you implement signal/tone tagging in core.ts, return those here too
      signal: (completion as any).signal ?? 'unknown',
      tone_tags: (completion as any).tone_tags ?? [],
      recallUsed: false
    })
  } catch (err) {
    console.error('Error in /api/shrink:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
