import { type NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Dynamic import to avoid build-time execution
  const { logChat } = await import("@/lib/logChat");
  try {
    const { threadId, turn, role, content } = await req.json();

    // Validate required fields
    if (!threadId || turn === undefined || !role || !content) {
      return NextResponse.json(
        { error: "Missing required fields: threadId, turn, role, content" },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== "user" && role !== "assistant") {
      return NextResponse.json(
        { error: "Role must be either 'user' or 'assistant'" },
        { status: 400 }
      );
    }

    // Log the chat message
    const messageId = await logChat({
      threadId,
      turn,
      role,
      content,
    });

    return NextResponse.json({ messageId });
  } catch (error) {
    console.error("Error in /api/chat/log:", error);
    return NextResponse.json(
      { error: "Failed to log chat message" },
      { status: 500 }
    );
  }
}
