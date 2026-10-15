"use client";

import { AppFooter } from "@/components/brand/AppFooter";
import { AppHeader } from "@/components/brand/AppHeader";
import { useCopy } from "@/components/brand/LocaleProvider";
import type { FetchedAtBySource } from "@/lib/catalog";
import type { CourtIndexGroup } from "@/lib/court-index";

const linkClass =
  "rounded-sm text-gold outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-gold/60";

export function CourtIndexView({
  groups,
  courtCount,
  fetchedAtBySource,
}: {
  groups: CourtIndexGroup[];
  courtCount: number;
  fetchedAtBySource: FetchedAtBySource;
}) {
  const copy = useCopy();

  return (
    <div className="flex min-h-dvh flex-col bg-asphalt">
      <AppHeader courtCount={courtCount} fetchedAtBySource={fetchedAtBySource} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6">
        <h1 className="font-display text-4xl tracking-wide text-white">{copy.allCourts}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">{copy.allCourtsLead}</p>
        <nav className="mt-6" aria-label={copy.allCourtsCities}>
          <ul className="flex flex-wrap gap-x-3 gap-y-2">
            {groups.map((group) => (
              <li key={group.anchor}>
                <a href={`#${group.anchor}`} className={linkClass}>
                  {group.city ?? copy.cityUnknown}
                  <span className="text-ink-muted"> {group.courts.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-8 space-y-8">
          {groups.map((group) => (
            <section key={group.anchor} id={group.anchor} className="scroll-mt-24">
              <h2 className="font-display text-2xl tracking-wide text-gold">
                {group.city ?? copy.cityUnknown}
              </h2>
              <ul className="mt-1">
                {group.courts.map((court) => (
                  <li key={court.href} className="border-b border-white/10">
                    <a
                      href={court.href}
                      className="block rounded-sm py-2.5 text-white outline-none hover:text-gold focus-visible:ring-2 focus-visible:ring-gold/60"
                    >
                      {copy.locale === "en" ? court.name : court.nameFi}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <AppFooter hideCourtIndex />
    </div>
  );
}
