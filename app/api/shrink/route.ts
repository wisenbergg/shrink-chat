import { type NextRequest, NextResponse } from "next/server";
import { runShrinkEngine } from "@/lib/core";

export async function POST(req: NextRequest) {
  const {
    prompt,
    threadId,
    memoryContext = "",
    enhancedContext,
  } = await req.json();

  // Debug logging for time context
  if (enhancedContext?.userTime) {
    console.log(
      `[Time Context] User time: ${enhancedContext.userTime}, Time of day: ${enhancedContext.timeOfDay}, Timezone: ${enhancedContext.userTimezone}`
    );
  }

  try {
    // Pass the memory context and enhanced context directly to the engine
    const result = await runShrinkEngine({
      sessionId: threadId,
      threadIds: [threadId],
      prompt,
      memoryContext, // Pass memory context to your engine
      enhancedContext, // Pass enhanced context including time information
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in /api/shrink:", err);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
