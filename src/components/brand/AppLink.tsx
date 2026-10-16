"use client";

import { LoaderCircle } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

type AppLinkProps = ComponentProps<typeof Link> & {
  /** Keep the spinner's width while idle so the link does not grow. */
  reservePending?: boolean;
};

/** In-app link that shows a spinner while its navigation is pending. */
export function AppLink({ children, reservePending, ...props }: AppLinkProps) {
  return (
    <Link {...props}>
      {children}
      <LinkPendingMark reserve={reservePending} />
    </Link>
  );
}

function LinkPendingMark({ reserve }: { reserve?: boolean }) {
  const { pending } = useLinkStatus();
  if (!pending && !reserve) return null;
  return (
    <LoaderCircle
      className={`ms-1.5 inline-block size-3.5 shrink-0 align-middle ${
        pending ? "animate-spin" : "invisible"
      }`}
      aria-hidden
    />
  );
}
