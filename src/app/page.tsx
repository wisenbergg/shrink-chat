// app/page.tsx
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

  if (!isAuth) return null; // or render a spinner

  return (
    <>
      <div style={{ position: "absolute", top: 0, left: 0, margin: "1rem" }}>
        <Image src="/logo.svg" alt="Logo" width={64} height={64} />
      </div>
      <ShrinkChat />
    </>
  );
}
