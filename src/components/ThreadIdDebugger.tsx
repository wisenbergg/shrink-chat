"use client";

import { useSession } from "@/context/SessionContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/sessionMemory";

/**
 * A component that shows detailed information about the current thread ID,
 * including its presence in various storage mechanisms and database tables.
 */
export function ThreadIdDebugger() {
  const { threadId } = useSession();
  const [storageInfo, setStorageInfo] = useState<Record<string, string | null>>(
    {}
  );
  const [dbInfo, setDbInfo] = useState<{
    threadExists: boolean;
    profileExists: boolean;
    memoryCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Get thread ID from various storage mechanisms
  useEffect(() => {
    if (typeof window === "undefined") return;

    const localStorage = window.localStorage.getItem("threadId");
    const sessionStorage = window.sessionStorage.getItem("threadId");

    // Get cookie
    const getCookie = (name: string) => {
      const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
      return match ? match[2] : null;
    };
    const cookie = getCookie("sw_uid");

    setStorageInfo({
      localStorage,
      sessionStorage,
      cookie,
    });
  }, [refreshKey]);

  // Check database for thread existence
  useEffect(() => {
    if (!threadId) {
      setLoading(false);
      return;
    }

    async function checkDatabase() {
      setLoading(true);
      try {
        // Check threads table
        const { data: thread } = await supabase
          .from("threads")
          .select("id")
          .eq("id", threadId)
          .single();

        // Check profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("thread_id", threadId)
          .single();

        // Count memory entries
        const { count } = await supabase
          .from("memory")
          .select("id", { count: "exact", head: true })
          .eq("thread_id", threadId);

        setDbInfo({
          threadExists: !!thread,
          profileExists: !!profile,
          memoryCount: count || 0,
        });
      } catch (error) {
        console.error("Error checking database:", error);
      } finally {
        setLoading(false);
      }
    }

    checkDatabase();
  }, [threadId, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (!threadId) {
    return (
      <div className="p-4 border rounded-md bg-yellow-50">
        <p className="text-yellow-700">
          No thread ID found in current session.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Thread ID Debugger</h3>
        <Button size="sm" onClick={handleRefresh} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="font-medium mb-1">Current Thread ID:</p>
          <code className="block p-2 bg-gray-100 rounded">{threadId}</code>
        </div>

        <div>
          <p className="font-medium mb-1">Storage Status:</p>
          <ul className="list-disc pl-5">
            <li>
              LocalStorage:{" "}
              {storageInfo.localStorage === threadId
                ? "✅ Matching"
                : "❌ Not matching"}
            </li>
            <li>
              SessionStorage:{" "}
              {storageInfo.sessionStorage === threadId
                ? "✅ Matching"
                : "❌ Not matching"}
            </li>
            <li>
              Cookie (sw_uid):{" "}
              {storageInfo.cookie === threadId
                ? "✅ Matching"
                : "❌ Not matching"}
            </li>
          </ul>
        </div>

        {dbInfo && (
          <div>
            <p className="font-medium mb-1">Database Status:</p>
            <ul className="list-disc pl-5">
              <li>
                Thread record:{" "}
                {dbInfo.threadExists ? "✅ Exists" : "❌ Missing"}
              </li>
              <li>
                Profile record:{" "}
                {dbInfo.profileExists ? "✅ Exists" : "❌ Missing"}
              </li>
              <li>Memory entries: {dbInfo.memoryCount}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
