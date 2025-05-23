"use client";

import { useState, useEffect } from "react";
import { useSessionDebug } from "@/hooks/useSessionDebug";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/context/SessionContext";

/**
 * A component for visualizing and debugging session state issues.
 * This can be temporarily added to any page to diagnose ThreadId problems.
 */
export function SessionDebugger() {
  const { sessionData, logSessionState, syncAllStorage } = useSessionDebug();
  const { clearThreadId } = useSession();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Log session state on mount
    if (sessionData) {
      logSessionState();
    }
  }, [sessionData, logSessionState]);

  const handleSync = () => {
    syncAllStorage();
  };

  const handleReset = () => {
    clearThreadId();
    window.location.reload();
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={() => setIsVisible(true)}>
          Debug Session
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex justify-between">
            <span>Session Debugger</span>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          {!sessionData ? (
            <div>Loading session data...</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1">
                <div className="font-semibold">Context:</div>
                <div className="truncate">
                  {sessionData.contextThreadId || "—"}
                </div>

                <div className="font-semibold">localStorage:</div>
                <div className="truncate">
                  {sessionData.localStorageThreadId || "—"}
                </div>

                <div className="font-semibold">sessionStorage:</div>
                <div className="truncate">
                  {sessionData.sessionStorageThreadId || "—"}
                </div>

                <div className="font-semibold">Cookie:</div>
                <div className="truncate">
                  {sessionData.cookieThreadId || "—"}
                </div>

                <div className="font-semibold">URL:</div>
                <div className="truncate">{sessionData.urlThreadId || "—"}</div>

                <div className="font-semibold">Consistent:</div>
                <div>
                  {sessionData.consistent ? (
                    <span className="text-green-600">Yes</span>
                  ) : (
                    <span className="text-red-600">No</span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={handleSync}
                >
                  Sync Storage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={handleReset}
                >
                  Reset Session
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
