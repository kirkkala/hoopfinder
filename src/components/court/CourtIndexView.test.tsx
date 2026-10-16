import { render, screen } from "@testing-library/react";
import { beforeAll, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import type { CourtIndexEntry, CourtIndexGroup } from "@/lib/court-index";
import { CourtIndexView } from "./CourtIndexView";

vi.mock("next/navigation", () => ({
  usePathname: () => "/courts",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));

beforeAll(() => {
  if (!("ResizeObserver" in globalThis)) {
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserver);
  }
});

const copy = getCopy();

function entry(name: string, href: string): CourtIndexEntry {
  return {
    href,
    name,
    nameFi: name,
    status: "active",
    address: null,
    neighborhood: null,
    city: null,
    amenities: { lighting: null, freeUse: null },
  };
}

const groups: CourtIndexGroup[] = [
  {
    city: "Helsinki",
    anchor: "helsinki",
    courts: [entry("Kallio", "/courts/lipas/1"), entry("Brahe", "/courts/lipas/2")],
  },
  { city: null, anchor: "muu", courts: [entry("Nimetön", "/courts/lipas/3")] },
];

test("each city heading shows how many courts it lists", () => {
  render(<CourtIndexView groups={groups} courtCount={3} fetchedAtBySource={{}} />);

  const helsinki = screen.getByRole("heading", { level: 2, name: "Helsinki (2 kenttää)" });
  const other = screen.getByRole("heading", { level: 2, name: `${copy.cityUnknown} (1 kenttä)` });
  expect(helsinki).toHaveTextContent("Helsinki");
  expect(other).toHaveTextContent(copy.cityCourtCount(1));
});
