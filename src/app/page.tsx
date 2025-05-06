"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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

  if (!isAuth) return null; // can replace with a loading spinner if you like

  return (
    <>
      <div style={{ textAlign: "center", margin: "2rem 0" }}>
        <Image src="/logo.svg" alt="Logo" width={120} height={120} />
      </div>
      <ShrinkChat />
    </>
  );
}