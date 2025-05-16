import { NextResponse } from 'next/server';
import { healthCheck } from '@/lib/core';

export function GET() {
  return NextResponse.json(healthCheck());
}
