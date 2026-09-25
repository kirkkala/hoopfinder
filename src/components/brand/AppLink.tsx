"use client";

import Link, { useLinkStatus } from "next/link";
import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";

/** In-app link that shows a spinner while its navigation is pending. */
export function AppLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <LinkPendingMark />
    </Link>
  );
}

function LinkPendingMark() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <LoaderCircle className="size-3.5 shrink-0 animate-spin" aria-hidden />;
}
