// Runner script for fixThreadIdIssues
// This can be executed directly with tsx or ts-node

import { fixThreadIdIssues } from "./fixThreadIds";

// Run the fix function
async function main() {
  console.log("Starting thread ID fix utility...");

  try {
    const result = await fixThreadIdIssues();

    console.log("\n✅ Fix completed successfully!");
    console.log("Results:");
    console.log(`  🧵 Threads created: ${result.threadsCreated}`);
    console.log(`  👤 Profiles created: ${result.profilesCreated}`);
    console.log(`  🔧 Errors fixed: ${result.errorsFixed}`);
    console.log(`  ❌ Errors encountered: ${result.errors}`);

    if (result.errors > 0) {
      console.log("\n⚠️ Some errors were encountered during the fix process.");
      console.log("   Check the logs above for more details.");
    }

    if (
      result.threadsCreated === 0 &&
      result.profilesCreated === 0 &&
      result.errorsFixed === 0
    ) {
      console.log("\n🎉 No issues found! Your database is already consistent.");
    }
  } catch (error) {
    console.error("\n❌ Error running thread ID fix:", error);
    process.exit(1);
  }
}

// Execute the main function
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });
