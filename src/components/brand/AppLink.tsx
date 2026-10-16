"use client";

import { LoaderCircle } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

type AppLinkProps = ComponentProps<typeof Link> & {
  /** Keep the spinner's width while idle so the link does not grow. */
  reservePending?: boolean;
  /** The caller places `AppLinkPending` inside the link instead of after the children. */
  trailingPending?: boolean;
};

/** In-app link that shows a spinner while its navigation is pending. */
export function AppLink({
  children,
  reservePending,
  trailingPending = true,
  ...props
}: AppLinkProps) {
  return (
    <Link {...props}>
      {children}
      {trailingPending ? <AppLinkPending reserve={reservePending} /> : null}
    </Link>
  );
}

/** Pending spinner for an `AppLink`. Render it inside the link when it should follow a label. */
export function AppLinkPending({ reserve }: { reserve?: boolean }) {
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
