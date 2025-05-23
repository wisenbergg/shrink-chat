import { ThreadIdFixer } from "@/components/ThreadIdFixer";
import { ThreadIdDebugger } from "@/components/ThreadIdDebugger";

export const metadata = {
  title: "Thread ID Debug | whenIwas",
  description: "Admin tools for diagnosing and fixing thread ID issues",
};

export default function ThreadDebugPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Thread ID Diagnostics</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-2">
            Current Thread ID Status
          </h2>
          <p className="text-gray-600 mb-4">
            This section shows the current thread ID in use and its status
            across storage mechanisms and database tables.
          </p>
          <ThreadIdDebugger />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-2">Fix Thread ID Issues</h2>
          <p className="text-gray-600 mb-4">
            If you&apos;re seeing &quot;No associated user found&quot; errors,
            this likely means there are inconsistencies between the memory,
            threads, and profiles tables. The tool below will scan the database
            and fix these issues.
          </p>
          <ThreadIdFixer />
        </section>

        <section className="border-t pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-2">Common Issues</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Missing thread records:</strong> Memory entries may
              reference thread IDs that don&apos;t exist in the threads table.
            </li>
            <li>
              <strong>Missing profile records:</strong> Thread IDs may exist
              without corresponding profiles.
            </li>
            <li>
              <strong>Foreign key constraints:</strong> The database enforces
              relationships between these tables.
            </li>
          </ul>
        </section>

        <section className="border-t pt-6 mt-6">
          <h2 className="text-xl font-semibold mb-2">Database Structure</h2>
          <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto">
            {`threads
  |- id (UUID, primary key)
  |- created_at
  |- updated_at

profiles
  |- id (UUID, primary key)
  |- thread_id (UUID, foreign key to threads.id)
  |- user_id (optional)
  |- name
  |- emotional_tone
  |- concerns
  |- onboarding_completed
  |- created_at
  |- updated_at

memory
  |- id (UUID, primary key)
  |- thread_id (UUID, foreign key to threads.id)
  |- author_role
  |- message_id
  |- summary
  |- embedding
  |- salience
  |- tags
  |- created_at
  |- last_accessed
`}
          </pre>
        </section>
      </div>
    </div>
  );
}
