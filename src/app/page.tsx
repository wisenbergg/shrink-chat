"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ShrinkChat from "../components/ShrinkChat";

export default function Page() {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("authenticated");
    if (!auth) {
      router.push("/login");
    } else {
      setIsAuth(true);
    }
  }, [router]);

  if (!isAuth) return null;

  return (
    <div className="flex flex-col h-screen relative">
      <div className="absolute top-4 left-4">
        <Image src="/logo.svg" alt="Logo" width={64} height={64} />
      </div>
      <div className="flex-1 flex overflow-hidden">
        <ShrinkChat />
      </div>
    </div>
  );
}
