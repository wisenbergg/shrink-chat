"use server";

import {
  getRelevantMemories as getMemories,
  insertMemoryForThread as insertMemory,
} from "@/lib/sessionMemory";
import { z } from "zod"; // Install zod if not already present

// Schema for insert memory payload
const InsertMemorySchema = z.object({
  threadId: z.string().uuid(),
  author_role: z.enum(["user", "engine"]),
  message_id: z.string().optional(),
  summary: z.string().min(1),
  tags: z.array(z.string()).optional(),
});

// Server action for inserting memory
export async function insertMemoryAction(
  data: z.infer<typeof InsertMemorySchema>
) {
  try {
    // Validate the input
    const validated = InsertMemorySchema.parse(data);

    // We don't pass the embedding from the client and let the server generate it
    const result = await insertMemory({
      threadId: validated.threadId,
      author_role: validated.author_role,
      message_id: validated.message_id,
      summary: validated.summary,
      tags: validated.tags,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("[server-actions] Error inserting memory:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error inserting memory",
    };
  }
}

// Schema for get relevant memories payload
const GetRelevantMemoriesSchema = z.object({
  threadId: z.string().uuid(),
  inputText: z.string().min(1),
  limit: z.number().positive().optional(),
  threshold: z.number().min(0).max(1).optional(),
});

// Server action for retrieving relevant memories
export async function getRelevantMemoriesAction(
  data: z.infer<typeof GetRelevantMemoriesSchema>
) {
  try {
    // Validate the input
    const validated = GetRelevantMemoriesSchema.parse(data);

    const memories = await getMemories({
      threadId: validated.threadId,
      inputText: validated.inputText,
      limit: validated.limit,
      threshold: validated.threshold,
    });

    return { success: true, data: memories };
  } catch (error) {
    console.error("[server-actions] Error retrieving memories:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error retrieving memories",
    };
  }
}
