"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCopy } from "@/components/brand/LocaleProvider";

const menuClass =
  "flex w-full items-center px-4 py-3.5 text-left text-base font-medium text-white outline-none hover:bg-white/5 focus-visible:bg-white/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60";

export function AuthControl({ onAction }: { onAction?: () => void }) {
  const copy = useCopy();
  const { data: session, status } = useSession();
  if (status === "loading") return null;

  const user = session?.user;

  if (user) {
    return (
      <li>
        {user.email ? (
          <p className="px-4 pt-3.5 text-sm text-ink-muted">{user.email}</p>
        ) : null}
        <button
          type="button"
          className={menuClass}
          onClick={() => {
            onAction?.();
            void signOut({ callbackUrl: "/" });
          }}
        >
          {copy.signOut}
        </button>
      </li>
    );
  }

  return (
    <li>
      <Link href="/login" className={menuClass} onClick={onAction}>
        {copy.signIn}
      </Link>
    </li>
  );
}
