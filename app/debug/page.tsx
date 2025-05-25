"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

function DebugPage() {
  const [authInfo, setAuthInfo] = useState<{
    isAuthenticated: boolean;
    threadId: string | null;
  }>({
    isAuthenticated: false,
    threadId: null,
  });
  const router = useRouter();

  useEffect(() => {
    // Update auth info on mount
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("authenticated");
      const threadId = localStorage.getItem("threadId");
      setAuthInfo({
        isAuthenticated: auth === "true",
        threadId: threadId,
      });
    }
  }, []);

  const handleClearAuth = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authenticated");
      localStorage.removeItem("threadId");
      setAuthInfo({ isAuthenticated: false, threadId: null });
      alert(
        "Authentication state cleared! Refresh the page to be redirected to login."
      );
    }
  };

  const handleGoToLogin = () => {
    router.push("/login");
  };

  const handleGoToHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Debug Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Current Auth State:</h3>
            <p>
              Authenticated: {authInfo.isAuthenticated ? "✅ Yes" : "❌ No"}
            </p>
            <p>Thread ID: {authInfo.threadId || "None"}</p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleClearAuth}
              variant="destructive"
              className="w-full"
            >
              Clear Authentication
            </Button>
            <Button
              onClick={handleGoToLogin}
              variant="outline"
              className="w-full"
            >
              Go to Login
            </Button>
            <Button
              onClick={handleGoToHome}
              variant="default"
              className="w-full"
            >
              Go to Home
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Use this page to test authentication flows:</p>
            <ul className="list-disc list-inside mt-1">
              <li>Clear auth to force login page</li>
              <li>View current authentication state</li>
              <li>Navigate between pages</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DebugPage;
