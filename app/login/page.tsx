"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/SessionContext";
import StackedLogoLockup from "../components/StackedLogoLockup";
import { setAuthState } from "@/lib/authUtils";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setThreadId } = useSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Call a server-side API endpoint to verify the password
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const { threadId } = await response.json();

        // Store authentication state using utility
        setAuthState(threadId);
        // Use session context as well
        setThreadId(threadId);
        console.log("Login successful, threadId set:", threadId);

        // Redirect to onboarding with the threadId
        router.replace(`/onboarding/welcome?threadId=${threadId}`);
      } else {
        const data = await response.json();
        setError(data.message || "Authentication failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="logo-position logo-container">
        <StackedLogoLockup />
      </div>
      <Card className="w-full max-w-sm bg-card">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <CardHeader>
            <CardTitle>Enter Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {error && <p className="text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Enter"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
