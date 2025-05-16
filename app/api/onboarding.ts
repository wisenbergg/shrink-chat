// File: src/app/api/onboarding.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { updateUserProfile, markOnboardingComplete } from '@/lib/sessionMemory';

interface OnboardingRequest {
  threadId: string;
  name?: string;
  emotionalTone?: string[];
  concerns?: string[];
  completeOnboarding?: boolean;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const {
    threadId,
    name,
    emotionalTone = [],
    concerns = [],
    completeOnboarding = false,
  }: OnboardingRequest = req.body;

  if (!threadId) {
    return res.status(400).json({ message: 'Missing threadId' });
  }

  try {
    await updateUserProfile(threadId, {
      name: name?.trim(),
      emotionalTone,
      concerns,
    });

    if (completeOnboarding) {
      markOnboardingComplete(threadId);
    }

    return res.status(200).json({ message: 'Profile updated' });
  } catch (error) {
    console.error('Onboarding error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
