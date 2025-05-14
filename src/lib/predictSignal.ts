// src/lib/predictSignal.ts

import OpenAI from 'openai';

export type SignalLabel = 'low' | 'medium' | 'high' | 'ambiguous';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const VALID_LABELS: SignalLabel[] = ['low', 'medium', 'high', 'ambiguous'];

async function classifyWithOpenAI(text: string): Promise<SignalLabel> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: [
          'You are a classifier that assigns a single label to user input based on its signal strength.',
          'Possible labels are: low, medium, high, ambiguous.',
          'Respond with exactly one of these labels and nothing else.'
        ].join(' ')
      },
      { role: 'user', content: text }
    ]
  });

  const raw = completion.choices[0].message?.content.trim().toLowerCase() ?? '';
  if (VALID_LABELS.includes(raw as SignalLabel)) {
    return raw as SignalLabel;
  }
  // Fallback if OpenAI returns something unexpected
  return 'ambiguous';
}

export async function predictSignal(input: string): Promise<SignalLabel> {
  return classifyWithOpenAI(input);
}
