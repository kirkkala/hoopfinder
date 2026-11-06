"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { AppLink } from "@/components/brand/AppLink";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { FetchedAtBySource } from "@/lib/catalog";

export function AdminShell({
  fetchedAtBySource,
  children,
}: {
  fetchedAtBySource: FetchedAtBySource;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <AppHeader fetchedAtBySource={fetchedAtBySource} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <AdminTabs />
        {children}
      </main>
      <AppFooter />
    </div>
  );
}

export function AdminTabs() {
  const copy = useCopy();
  const pathname = usePathname();
  const tabs = [
    { href: "/admin", label: copy.adminTabHome },
    { href: "/admin/feedback", label: copy.adminTabFeedback },
    { href: "/admin/photos", label: copy.adminTabPhotos },
    { href: "/admin/courts", label: copy.adminTabCourts },
    { href: "/admin/edits", label: copy.adminTabEdits },
  ];

  return (
    <nav aria-label={copy.adminTitle} className="-mx-4 mb-6 overflow-x-auto sm:-mx-6">
      <ul className="flex min-w-full border-b border-white/15">
        {tabs.map((tab) => {
          const current = pathname === tab.href;
          return (
            <li key={tab.href} className="flex-1">
              <AppLink
                href={tab.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-11 items-center justify-center border-b-2 px-1 text-center text-sm font-bold tracking-tight whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/60 ${
                  current
                    ? "border-gold text-white"
                    : "border-transparent text-ink/70 hover:text-white"
                }`}
              >
                {tab.label}
              </AppLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
