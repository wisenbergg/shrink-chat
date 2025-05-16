/* File: src/app/api/onboarding/route.ts */
import { NextRequest, NextResponse } from 'next/server'
import { updateUserProfile, markOnboardingComplete } from '@/lib/sessionMemory'

export async function POST(request: NextRequest) {
  const {
    threadId,
    name,
    emotionalTone = [],
    concerns = [],
    completeOnboarding = false
  } = (await request.json()) as {
    threadId: string
    name?: string
    emotionalTone?: string[]
    concerns?: string[]
    completeOnboarding?: boolean
  }

  if (!threadId) {
    return NextResponse.json(
      { message: 'Missing threadId' },
      { status: 400 }
    )
  }

  try {
    await updateUserProfile(threadId, {
      name: name?.trim(),
      emotionalTone,
      concerns
    })

    if (completeOnboarding) {
      await markOnboardingComplete(threadId)
    }

    return NextResponse.json({ message: 'Profile updated' })
  } catch (error) {
    console.error('Onboarding error:', error)
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}