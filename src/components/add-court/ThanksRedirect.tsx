"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { COURT_THANKS_KEY } from "@/lib/courts";

export function ThanksRedirect({
  href,
  courtId,
  edit = false,
  live = false,
}: {
  href: string;
  courtId: string;
  edit?: boolean;
  /** The admin already published this correction. */
  live?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    const flag = edit ? `${live ? "edit-live" : "edit"}:${courtId}` : courtId;
    sessionStorage.setItem(COURT_THANKS_KEY, flag);
    router.replace(href);
  }, [courtId, edit, href, live, router]);

  return null;
}
