"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { COURT_THANKS_KEY } from "@/lib/courts";

export function ThanksRedirect({ href, courtId }: { href: string; courtId: string }) {
  const router = useRouter();

  useEffect(() => {
    sessionStorage.setItem(COURT_THANKS_KEY, courtId);
    router.replace(href);
  }, [courtId, href, router]);

  return null;
}
