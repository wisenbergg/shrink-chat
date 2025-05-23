import { type NextRequest, NextResponse } from "next/server";
import {
  getMemoryForSession,
  deleteMemoryForThread,
  insertMemoryForThread,
} from "@/lib/sessionMemory";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    // In Next.js 15, params must be awaited
    const { threadId } = await params;

    if (!threadId) {
      return NextResponse.json(
        { error: "Missing threadId parameter" },
        { status: 400 }
      );
    }

    console.log(`Retrieving all memories for threadId: ${threadId}`);

    // Get memories for the thread
    const memories = await getMemoryForSession(threadId);

    console.log(`Retrieved ${memories.length} memories`);
    return NextResponse.json({ memory: memories });
  } catch (error) {
    console.error("Error in memory API:", error);
    return NextResponse.json(
      { error: "Failed to retrieve memories" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;
    const { content, authorRole, summary, tags } = await req.json();

    // Validate required fields
    if (!threadId || !content || !authorRole) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(
      `Storing memory for threadId: ${threadId}, role: ${authorRole}`
    );

    // Store memory with embedding
    const memoryData = await insertMemoryForThread({
      threadId: threadId,
      author_role: authorRole,
      summary: summary || content,
      tags,
    });

    if (!memoryData) {
      console.error("Failed to insert memory, no data returned");
      return NextResponse.json(
        { error: "Failed to store memory" },
        { status: 500 }
      );
    }

    console.log("Memory stored successfully:", memoryData.id);
    return NextResponse.json({ success: true, memoryId: memoryData.id });
  } catch (error) {
    console.error("Error in memory API:", error);
    return NextResponse.json(
      { error: "Failed to store memory" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params;

    if (!threadId) {
      return NextResponse.json(
        { error: "Missing threadId parameter" },
        { status: 400 }
      );
    }

    console.log(`Deleting all memories for threadId: ${threadId}`);

    // Delete memories for the thread
    await deleteMemoryForThread(threadId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in memory API:", error);
    return NextResponse.json(
      { error: "Failed to delete memories" },
      { status: 500 }
    );
  }
}
