import { NextResponse } from "next/server";

export async function middleware() {
  // This app uses thread-based authentication, not Supabase Auth
  // We handle onboarding status through the useOnboardingStatus hook
  // and localStorage, so middleware just needs to pass through requests

  const response = NextResponse.next();

  // Skip middleware logic - let the client-side hooks handle auth and onboarding
  // The useOnboardingStatus hook will redirect users appropriately
  return response;
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
