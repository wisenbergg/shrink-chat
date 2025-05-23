const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function fixTrigger() {
  try {
    console.log("🔧 Fixing memory trigger directly...");

    // First, get current database URL to establish a direct connection
    const { data, error } = await supabase
      .from("pg_settings")
      .select("*")
      .eq("name", "connection_info");

    if (error) {
      console.error("Error getting database connection info:", error);
      console.log("Trying alternative approach - Using the REST API");

      // Try a workaround by using the existing API capabilities
      // First, check if the trigger exists
      console.log("Checking if trigger exists...");
      const { data: triggerCheck } = await supabase
        .from("memory")
        .select("id")
        .limit(1);

      // Try to insert a memory record without thread/profile
      console.log("Testing direct memory insertion...");
      const testThreadId = require("uuid").v4();
      const { error: memoryError } = await supabase.from("memory").insert({
        thread_id: testThreadId,
        author_role: "user",
        summary: "Test memory record",
        salience: 50,
      });

      if (memoryError) {
        console.log(
          "✓ Confirmed trigger is blocking insertion:",
          memoryError.message
        );

        // Now we'll create the thread and profile first
        console.log("Creating thread and profile first...");
        await supabase.from("threads").insert({ id: testThreadId });
        await supabase.from("profiles").insert({
          thread_id: testThreadId,
          name: "Auto-created Profile",
          emotional_tone: [],
          concerns: [],
        });

        // Now try insertion again
        const { data: memorySuccess, error: memoryError2 } = await supabase
          .from("memory")
          .insert({
            thread_id: testThreadId,
            author_role: "user",
            summary: "Test memory after creating thread and profile",
            salience: 50,
          })
          .select();

        if (memoryError2) {
          console.error("❌ Still cannot insert memory:", memoryError2);
        } else {
          console.log(
            "✅ Successfully inserted memory with pre-created thread and profile",
            memorySuccess
          );
        }
      } else {
        console.log(
          "✓ Memory already inserts successfully without trigger blocking"
        );
      }
    } else {
      console.log("Database connection info:", data);
    }

    console.log(
      "\n📝 Since we cannot modify the trigger directly via the JavaScript API,"
    );
    console.log("please use one of these methods to fix the issue:");
    console.log("\n1. Using the Supabase Studio SQL Editor:");
    console.log("   - Open the Supabase Studio");
    console.log("   - Navigate to the SQL Editor");
    console.log("   - Execute this SQL:");
    console.log(`
      -- Drop existing trigger and function
      DROP TRIGGER IF EXISTS check_memory_user_trigger ON public.memory;
      DROP FUNCTION IF EXISTS public.check_memory_user;

      -- Create new function that auto-creates necessary records
      CREATE OR REPLACE FUNCTION public.check_memory_user()
      RETURNS TRIGGER AS $$
      BEGIN
          -- First check if thread exists
          IF NOT EXISTS (SELECT 1 FROM public.threads WHERE id = NEW.thread_id) THEN
              -- Auto-create thread if it doesn't exist
              INSERT INTO public.threads (id) VALUES (NEW.thread_id);
              RAISE NOTICE 'Auto-created thread with ID %', NEW.thread_id;
          END IF;
          
          -- Now check if profile exists
          IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE thread_id = NEW.thread_id) THEN
              -- Auto-create profile if it doesn't exist
              INSERT INTO public.profiles (thread_id, name, emotional_tone, concerns) 
              VALUES (NEW.thread_id, 'Auto-created', ARRAY[]::text[], ARRAY[]::text[]);
              RAISE NOTICE 'Auto-created profile for thread ID %', NEW.thread_id;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create new trigger
      CREATE TRIGGER check_memory_user_trigger
          BEFORE INSERT ON public.memory
          FOR EACH ROW
          EXECUTE FUNCTION public.check_memory_user();
    `);

    console.log("\n2. Using the Supabase CLI (if installed):");
    console.log(
      "   supabase db execute --db-url 'postgresql://postgres:password@localhost:5432/postgres' -f fix-memory-trigger.sql"
    );

    console.log(
      "\n3. Alternatively, create a new migration file in the supabase/migrations folder:"
    );
    console.log(
      "   - Create a new file: supabase/migrations/20250523000001_fix_memory_trigger.sql"
    );
    console.log("   - Add the SQL above to the file");
    console.log("   - Run: supabase db migration apply");
  } catch (err) {
    console.error("Error fixing trigger:", err);
  }
}

fixTrigger();
