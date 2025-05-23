import { supabase } from "./sessionMemory";

/**
 * Utility for fixing thread ID issues in the database
 * This can be run via a script or imported in components that need to fix thread ID issues
 */

/**
 * Creates missing profiles for all existing threads
 */
export async function createMissingProfiles(): Promise<{
  created: number;
  errors: number;
}> {
  try {
    console.log("Starting to create missing profiles for threads...");

    // 1. Get all threads
    const { data: threads, error: threadsError } = await supabase
      .from("threads")
      .select("id");

    if (threadsError) {
      console.error("Error fetching threads:", threadsError);
      return { created: 0, errors: 1 };
    }

    if (!threads || threads.length === 0) {
      console.log("No threads found");
      return { created: 0, errors: 0 };
    }

    console.log(
      `Found ${threads.length} threads, checking for missing profiles...`
    );

    // 2. For each thread, check if a profile exists
    let created = 0;
    let errors = 0;

    for (const thread of threads) {
      // Check if profile already exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("thread_id", thread.id)
        .single();

      // If no profile, create one
      if (!profile) {
        console.log(`Creating profile for thread ${thread.id}`);
        const { error: insertError } = await supabase.from("profiles").insert({
          thread_id: thread.id,
          name: "Anonymous",
          emotional_tone: [],
          concerns: [],
        });

        if (insertError) {
          console.error(
            `Error creating profile for thread ${thread.id}:`,
            insertError
          );
          errors++;
        } else {
          created++;
        }
      }
    }

    console.log(`Created ${created} profiles, encountered ${errors} errors`);
    return { created, errors };
  } catch (error) {
    console.error("Error in createMissingProfiles:", error);
    return { created: 0, errors: 1 };
  }
}

/**
 * Checks for inconsistencies between threads and profiles tables
 */
export async function findInconsistentThreadIds(): Promise<string[]> {
  try {
    // Find thread_ids in memories that don't have corresponding profiles
    const { data, error } = await supabase
      .from("memory")
      .select("thread_id")
      .not("thread_id", "in", supabase.from("profiles").select("thread_id"))
      .limit(100);

    if (error) {
      console.error("Error finding inconsistent thread IDs:", error);
      return [];
    }

    // Return unique thread_ids
    const uniqueThreadIds = [...new Set(data?.map((item) => item.thread_id))];
    return uniqueThreadIds;
  } catch (error) {
    console.error("Error in findInconsistentThreadIds:", error);
    return [];
  }
}

/**
 * Fix threadId issues in the database
 * - Creates missing threads
 * - Creates missing profiles
 * - Fixes memory entries with missing profile/thread associations
 */
export async function fixThreadIdIssues(): Promise<{
  threadsCreated: number;
  profilesCreated: number;
  errorsFixed: number;
  errors: number;
}> {
  try {
    console.log("Starting thread ID issue repair...");
    let errorsFixed = 0;

    // 1. Find memory records with missing thread entries
    const { data: memoryThreads, error: memoryError } = await supabase
      .from("memory")
      .select("thread_id")
      .limit(1000); // reasonable limit

    if (memoryError) {
      console.error("Error fetching memory threads:", memoryError);
      return {
        threadsCreated: 0,
        profilesCreated: 0,
        errorsFixed: 0,
        errors: 1,
      };
    }

    // 2. Make sure all these threads exist in threads table
    let threadsCreated = 0;
    let threadErrors = 0;

    const uniqueThreadIds = [
      ...new Set(memoryThreads?.map((item) => item.thread_id)),
    ];
    console.log(
      `Found ${uniqueThreadIds.length} unique thread IDs in memory table`
    );

    for (const threadId of uniqueThreadIds) {
      // Skip invalid UUIDs
      if (!threadId || !isValidUUID(threadId)) {
        console.warn(`Skipping invalid UUID: ${threadId}`);
        continue;
      }

      // Check if thread already exists
      const { data: thread } = await supabase
        .from("threads")
        .select("id")
        .eq("id", threadId)
        .single();

      // If no thread, create one
      if (!thread) {
        console.log(`Creating thread record for ${threadId}`);
        const { error: insertError } = await supabase
          .from("threads")
          .insert({ id: threadId });

        if (insertError) {
          console.error(`Error creating thread ${threadId}:`, insertError);
          threadErrors++;
        } else {
          threadsCreated++;
          errorsFixed++;
        }
      }
    }

    // 3. Create missing profiles for all threads
    const { created: profilesCreated, errors: profileErrors } =
      await createMissingProfiles();

    // 4. Fix or delete orphaned memory entries (with no associated profile)
    const orphanedThreads = await findInconsistentThreadIds();
    for (const threadId of orphanedThreads) {
      // Create thread and profile for orphaned memory
      if (isValidUUID(threadId)) {
        await supabase
          .from("threads")
          .upsert({ id: threadId }, { onConflict: "id" });
        await supabase.from("profiles").upsert(
          {
            thread_id: threadId,
            name: "Anonymous",
            emotional_tone: [],
            concerns: [],
          },
          { onConflict: "thread_id" }
        );
        errorsFixed++;
      }
    }

    return {
      threadsCreated,
      profilesCreated,
      errorsFixed,
      errors: threadErrors + profileErrors,
    };
  } catch (error) {
    console.error("Error in fixThreadIdIssues:", error);
    return { threadsCreated: 0, profilesCreated: 0, errorsFixed: 0, errors: 1 };
  }
}

// Utility function to validate UUIDs
function isValidUUID(uuid: string): boolean {
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}
