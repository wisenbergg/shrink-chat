import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabaseClient/server";

// Simple test script to debug the login API issue
export async function GET() {
  try {
    console.log("=== Login API Debug Test ===");

    // Check environment variables
    console.log("SITE_PASSWORD exists:", !!process.env.SITE_PASSWORD);
    console.log("SUPABASE_URL exists:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log(
      "SUPABASE_SERVICE_ROLE_KEY exists:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (!process.env.SITE_PASSWORD) {
      console.error("❌ SITE_PASSWORD not found in environment");
      return NextResponse.json(
        { error: "SITE_PASSWORD not configured" },
        { status: 500 }
      );
    }

    // Test Supabase connection
    const supabase = createServerClient();
    console.log("✅ Supabase client created");

    // Test a simple query to verify connection
    const { error: testError } = await supabase
      .from("threads")
      .select("count")
      .limit(1);

    if (testError) {
      console.error("❌ Supabase connection test failed:", testError);
      return NextResponse.json(
        { error: "Database connection failed", details: testError },
        { status: 500 }
      );
    }

    console.log("✅ Supabase connection test passed");

    // Test thread creation
    const testThreadId = "00000000-0000-0000-0000-000000000999";

    const { error: threadError } = await supabase
      .from("threads")
      .upsert({ id: testThreadId })
      .select();

    if (threadError) {
      console.error("❌ Thread creation test failed:", threadError);
      return NextResponse.json(
        { error: "Thread creation failed", details: threadError },
        { status: 500 }
      );
    }

    console.log("✅ Thread creation test passed");

    // Test profile creation
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        thread_id: testThreadId,
        onboarding_completed: false,
      })
      .select();

    if (profileError) {
      console.error("❌ Profile creation test failed:", profileError);
      return NextResponse.json(
        { error: "Profile creation failed", details: profileError },
        { status: 500 }
      );
    }

    console.log("✅ Profile creation test passed");

    // Clean up test data
    await supabase.from("profiles").delete().eq("thread_id", testThreadId);
    await supabase.from("threads").delete().eq("id", testThreadId);

    console.log("✅ All tests passed - login API should work");
    return NextResponse.json({
      message: "All tests passed",
      checks: {
        environment: "✅",
        supabaseConnection: "✅",
        threadCreation: "✅",
        profileCreation: "✅",
      },
    });
  } catch (error) {
    console.error("❌ Unexpected error in debug test:", error);
    return NextResponse.json(
      {
        error: "Unexpected error",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
