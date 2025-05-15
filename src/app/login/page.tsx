// File: src/app/login/page.tsx
"use client";

import Image from "next/image";
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

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const sitePassword =
    process.env.NEXT_PUBLIC_SITE_PASSWORD || "stillwater";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === sitePassword) {
      localStorage.setItem("authenticated", "true");
      router.replace("/");
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="absolute top-4 left-4">
        <Image src="/logo.svg" alt="Logo" width={64} height={64} />
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
            />
            {error && <p className="text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Enter
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
