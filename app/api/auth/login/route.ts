import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createServerClient } from "@/lib/supabaseClient/server";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    // Get the password from environment variables
    // This is a server-side environment variable, NOT a NEXT_PUBLIC_ one
    const sitePassword = process.env.SITE_PASSWORD;

    if (!sitePassword) {
      console.error("SITE_PASSWORD environment variable is not set");
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }

    // Verify the password
    if (password !== sitePassword) {
      return NextResponse.json(
        { message: "Incorrect password" },
        { status: 401 }
      );
    }

    // Generate a new thread ID
    const threadId = uuidv4();

    // Create a Supabase client
    const supabase = createServerClient();

    // Ensure a thread record exists to satisfy profile foreign key constraint
    const { error: threadError } = await supabase.from("threads").insert({
      id: threadId,
    });
    if (threadError) {
      console.error("Error creating thread:", threadError);
      return NextResponse.json(
        { message: "Error creating thread record" },
        { status: 500 }
      );
    }

    // Create a profile entry in Supabase using the server client
    const { error } = await supabase.from("profiles").insert({
      thread_id: threadId,
      onboarding_complete: false,
      // Only include created_at if your schema has it
      // If your Supabase has RLS enabled with created_at being auto-filled, remove this line
    });

    if (error) {
      console.error("Error creating profile:", error);
      return NextResponse.json(
        { message: "Error creating user profile" },
        { status: 500 }
      );
    }

    // Return the thread ID to the client
    return NextResponse.json({ threadId });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
