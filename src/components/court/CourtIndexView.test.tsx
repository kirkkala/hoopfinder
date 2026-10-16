import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import type { CourtIndexEntry, CourtIndexGroup } from "@/lib/court-index";
import { CourtIndexView } from "./CourtIndexView";

const status = vi.hoisted(() => ({ pending: false }));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
    prefetch,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
    prefetch?: boolean;
  }) => (
    <a href={href} className={className} data-prefetch={String(prefetch)}>
      {children}
    </a>
  ),
  useLinkStatus: () => status,
}));

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

afterEach(cleanup);

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
  status.pending = false;
  render(<CourtIndexView groups={groups} courtCount={3} fetchedAtBySource={{}} />);

  const helsinki = screen.getByRole("heading", { level: 2, name: "Helsinki (2 kenttää)" });
  const other = screen.getByRole("heading", { level: 2, name: `${copy.cityUnknown} (1 kenttä)` });
  expect(helsinki).toHaveTextContent("Helsinki");
  expect(other).toHaveTextContent(copy.cityCourtCount(1));
});

test("a court card shows the pending spinner after its open label", () => {
  status.pending = true;
  render(<CourtIndexView groups={groups} courtCount={3} fetchedAtBySource={{}} />);

  const link = screen.getByRole("link", { name: /Kallio/ });
  const label = [...link.querySelectorAll("span")].find((node) =>
    node.textContent?.includes(copy.letsGo),
  );
  const spinner = label?.querySelector(".animate-spin");
  expect(link).toHaveAttribute("href", "/courts/lipas/1");
  expect(link).toHaveAttribute("data-prefetch", "false");
  expect(spinner).not.toBeNull();
  expect(link.querySelectorAll(".animate-spin")).toHaveLength(1);
  if (!label || !spinner) return;
  const text = [...label.childNodes].find((node) => node.textContent === copy.letsGo);
  if (!text) return;
  expect(text.compareDocumentPosition(spinner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
