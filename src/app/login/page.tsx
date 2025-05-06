"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const sitePassword = process.env.NEXT_PUBLIC_SITE_PASSWORD || "stillwater";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === sitePassword) {
      localStorage.setItem("authenticated", "true");
      router.push("/");
    } else {
      setError("Incorrect password");
    }
  };

  return (
    <div>
      <div style={{ textAlign: "center", margin: "2rem 0" }}>
        <Image src="/logo.png" alt="Logo" width={120} height={120} />
        </div>
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md">
        <h1 className="text-2xl mb-4 font-bold">Enter Password</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-2 border rounded mb-4"
        />
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded"
        >
          Enter
        </button>
      </form>
    </div>
    </div>
  );
}
