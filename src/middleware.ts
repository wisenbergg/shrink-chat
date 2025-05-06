import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const password = process.env.NEXT_PUBLIC_SITE_PASSWORD;
  const cookie = request.cookies.get('site_password')?.value;

  // Allow access if cookie matches password
  if (cookie === password) {
    return NextResponse.next();
  }

  // Allow access to the login page itself
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
