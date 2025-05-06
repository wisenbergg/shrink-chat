"use client";

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

  if (!isAuth) return null; // can replace with a loading spinner if you like

  return <ShrinkChat />;
}
