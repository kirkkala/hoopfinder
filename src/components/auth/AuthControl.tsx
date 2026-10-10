"use client";

import { signOut, useSession } from "next-auth/react";
import { useCopy } from "@/components/brand/LocaleProvider";
import { MenuItem } from "@/components/brand/MenuItem";

export function AuthControl() {
  const copy = useCopy();
  const { data: session, status } = useSession();
  if (status === "loading") return null;

  const user = session?.user;

  if (user) {
    return (
      <MenuItem
        note={
          user.email ? <p className="px-4 pt-3.5 text-sm text-ink-muted">{user.email}</p> : null
        }
        onClick={() => {
          void signOut({ callbackUrl: "/" });
        }}
      >
        {copy.signOut}
      </MenuItem>
    );
  }

  return <MenuItem href="/login">{copy.signIn}</MenuItem>;
}
