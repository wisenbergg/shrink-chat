import { type NextRequest, NextResponse } from "next/server";
import { getRelevantMemories } from "@/lib/sessionMemory";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { threadId, query, text, threshold = 0.7, limit = 5 } = body;

    // Support both 'query' and 'text' parameters for flexibility
    const searchText = query || text;

    // Validate required parameters
    if (!threadId || !searchText) {
      console.error("Missing required parameters: threadId and query/text");
      return NextResponse.json(
        { error: "Missing required parameters: threadId and query/text" },
        { status: 400 }
      );
    }

    console.log(
      `[POST] Retrieving memories for threadId: ${threadId}, query: ${searchText.substring(
        0,
        50
      )}...`
    );

    // Get relevant memories
    const memories = await getRelevantMemories({
      threadId,
      inputText: searchText,
      threshold,
      limit,
    });

    console.log(`Retrieved ${memories.length} memories`);
    return NextResponse.json({ memories });
  } catch (error) {
    console.error("Error in memory API:", error);
    return NextResponse.json(
      { error: "Failed to retrieve memories" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const threadId = searchParams.get("threadId");
    const query = searchParams.get("query");
    const threshold = Number.parseFloat(searchParams.get("threshold") || "0.7");
    const limit = Number.parseInt(searchParams.get("limit") || "5");

    // Validate required parameters
    if (!threadId || !query) {
      console.error("Missing required parameters: threadId and query");
      return NextResponse.json(
        { error: "Missing required parameters: threadId and query" },
        { status: 400 }
      );
    }

    console.log(
      `[GET] Retrieving memories for threadId: ${threadId}, query: ${query.substring(
        0,
        50
      )}...`
    );

    // Get relevant memories
    const memories = await getRelevantMemories({
      threadId,
      inputText: query,
      threshold,
      limit,
    });

    console.log(`Retrieved ${memories.length} memories`);
    return NextResponse.json({ memories });
  } catch (error) {
    console.error("Error in memory API:", error);
    return NextResponse.json(
      { error: "Failed to retrieve memories" },
      { status: 500 }
    );
  }
}
