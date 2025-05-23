import { type NextRequest, NextResponse } from "next/server";
import { runShrinkEngine } from "@/lib/core";

export async function POST(req: NextRequest) {
  const { prompt, threadId, memoryContext = "" } = await req.json();

  try {
    // Pass the memory context directly to the engine
    const result = await runShrinkEngine({
      sessionId: threadId,
      threadIds: [threadId],
      prompt,
      memoryContext, // Pass memory context to your engine
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in /api/shrink:", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
