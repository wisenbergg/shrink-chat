import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  // Create a response object that we can modify
  const response = NextResponse.next();

  // Create the Supabase server client using the new SSR package
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          // Set the cookie in the response
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name, options) {
          // Remove the cookie in the response
          response.cookies.delete({
            name,
            ...options,
          });
        },
      },
    }
  );

  // IMPORTANT: Do not add code between createServerClient and supabase.auth.getUser()
  // This could cause issues with session refresh and token management
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If the user is not authenticated and trying to access protected routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/login")
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If the user is authenticated but hasn't completed onboarding
  if (user && !request.nextUrl.pathname.startsWith("/onboarding")) {
    // Check if the user has completed onboarding
    const { data } = await supabase
      .from("onboarding_progress")
      .select("completed")
      .eq("user_id", user.id)
      .single();

    // If onboarding data doesn't exist or is not completed, redirect to onboarding
    if (!data || !data.completed) {
      // Only redirect if not already on an onboarding page and not accessing API routes
      if (
        !request.nextUrl.pathname.startsWith("/onboarding") &&
        !request.nextUrl.pathname.startsWith("/api")
      ) {
        return NextResponse.redirect(
          new URL("/onboarding/welcome", request.url)
        );
      }
    }
  }

  // IMPORTANT: You must return the response object as is
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
