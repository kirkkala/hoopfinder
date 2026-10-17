import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import type { CourtIndexEntry, CourtIndexGroup } from "@/lib/court-index";
import { CourtIndexCard, CourtIndexView } from "./CourtIndexView";

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
  usePathname: () => "/koripallokentat",
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
    pageHref: "/koripallokentat/helsinki",
    courts: [
      entry("Kallio", "/koripallokentat/helsinki/l1"),
      entry("Brahe", "/koripallokentat/helsinki/l2"),
    ],
  },
  {
    city: null,
    anchor: "muu",
    pageHref: null,
    courts: [entry("Nimetön", "/koripallokentat/muu/l3")],
  },
];

test("lists each city as a link and leaves the courts for the city page", () => {
  status.pending = false;
  render(<CourtIndexView groups={groups} fetchedAtBySource={{}} />);

  const home = screen.getByRole("link", { name: copy.homepage });
  const map = screen.getByRole("link", { name: copy.courtsOnMap });
  expect(home.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(home).toHaveAttribute("href", "/?info");
  expect(map).toHaveAttribute("href", "/kartta");

  expect(
    screen.getByText(/Palvelussa on 3 ulkokoripallokenttää yhdellä paikkakunnalla/),
  ).toBeInTheDocument();
  expect(screen.getByText(copy.allCourtsLead)).toBeInTheDocument();

  const helsinki = screen.getByRole("link", { name: "Helsinki (2 kenttää)" });
  const other = screen.getByRole("link", { name: `${copy.cityUnknown} (1 kenttä)` });
  expect(helsinki).toHaveAttribute("href", "/koripallokentat/helsinki");
  expect(within(helsinki).getByText("(2 kenttää)")).toHaveClass("text-ink-muted");
  expect(other).toHaveAttribute("href", "/koripallokentat/muu");
  expect(screen.queryByRole("link", { name: /Kallio/ })).not.toBeInTheDocument();
});

test("the city search hides cities that do not match", () => {
  render(<CourtIndexView groups={groups} fetchedAtBySource={{}} />);
  const search = screen.getByRole("searchbox", { name: copy.allCourtsCities });

  fireEvent.change(search, { target: { value: "hel" } });
  expect(screen.getByRole("link", { name: /Helsinki/ })).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: new RegExp(copy.cityUnknown) }),
  ).not.toBeInTheDocument();

  fireEvent.change(search, { target: { value: "zzz" } });
  expect(screen.getByText(copy.citySearchEmpty)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Helsinki/ })).not.toBeInTheDocument();
});

test("a court card shows the pending spinner after its open label", () => {
  status.pending = true;
  render(
    <ul>
      <CourtIndexCard court={entry("Kallio", "/koripallokentat/helsinki/l1")} />
    </ul>,
  );

  const link = screen.getByRole("link", { name: /Kallio/ });
  const label = [...link.querySelectorAll("span")].find((node) =>
    node.textContent?.includes(copy.letsGo),
  );
  const spinner = label?.querySelector(".animate-spin");
  expect(link).toHaveAttribute("href", "/koripallokentat/helsinki/l1");
  expect(link).toHaveAttribute("data-prefetch", "false");
  expect(spinner).not.toBeNull();
  expect(link.querySelectorAll(".animate-spin")).toHaveLength(1);
  if (!label || !spinner) return;
  const text = [...label.childNodes].find((node) => node.textContent === copy.letsGo);
  if (!text) return;
  expect(text.compareDocumentPosition(spinner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
