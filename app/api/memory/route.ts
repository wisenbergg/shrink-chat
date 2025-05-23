import { NextResponse } from "next/server";
import { getUserProfile, updateUserProfile } from "@/lib/sessionMemory";

export async function GET(request: Request) {
  try {
    // Extract threadId from query parameters, not path params
    const url = new URL(request.url);
    const threadId = url.searchParams.get("threadId");

    if (!threadId) {
      return NextResponse.json(
        { error: "Missing threadId parameter" },
        { status: 400 }
      );
    }

    console.log(`Retrieving profile for threadId: ${threadId}`);

    // Get profile for the thread
    const profile = await getUserProfile(threadId);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error in profile API:", error);
    return NextResponse.json(
      { error: "Failed to retrieve profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Extract data from request body
    const data = await request.json();
    const { threadId, ...profileData } = data;

    if (!threadId) {
      return NextResponse.json(
        { error: "Missing threadId parameter" },
        { status: 400 }
      );
    }

    console.log(`Updating profile for threadId: ${threadId}`);

    // Update profile
    await updateUserProfile(threadId, profileData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in profile API:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
