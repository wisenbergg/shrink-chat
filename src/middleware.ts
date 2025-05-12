// src/middleware.ts

import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next.js assets + favicon + API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/')
  ) {
    return NextResponse.next();
  }

  // …your existing logic…

  // Default to next if nothing else applies
  return NextResponse.next();
}

export function toneDriftFilter(response: string): boolean {
  const flagged = [
    'i’m sorry you’re feeling that way',
    'i understand that must be hard',
    'it’s understandable to feel that way',
    'you’re not alone in this',
    'that’s totally valid',
    'many people feel this way'
  ];
  const lower = response.toLowerCase();
  return !flagged.some(f => lower.includes(f));
}
