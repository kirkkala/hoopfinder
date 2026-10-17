import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import type { CourtIndexEntry } from "@/lib/court-index";
import { CityCourtsView } from "./CityCourtsView";

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
  useLinkStatus: () => ({ pending: false }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/koripallokentat/espoo",
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

function entry(
  name: string,
  href: string,
  lighting: boolean | null,
  freeUse: boolean | null,
): CourtIndexEntry {
  return {
    href,
    name,
    nameFi: name,
    status: "active",
    address: "Testikatu 1",
    neighborhood: null,
    city: "Espoo",
    amenities: { lighting, freeUse },
  };
}

test("a city page names the city and counts its own courts", () => {
  render(
    <CityCourtsView
      cityName="Espoo"
      lit={1}
      closed={1}
      fetchedAtBySource={{}}
      courts={[
        entry("Tapiola", "/koripallokentat/espoo/l1", true, true),
        entry("Matinkylä", "/koripallokentat/espoo/l2", null, true),
      ]}
    />,
  );

  expect(
    screen.getByRole("heading", { level: 1, name: "Koripallokentät Espoo" }),
  ).toBeInTheDocument();
  expect(screen.getByText("2 kenttää, 1 valaistu, 1 tilapäisesti kiinni")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: copy.allCourts })).toHaveAttribute(
    "href",
    "/koripallokentat",
  );
  expect(screen.getByRole("link", { name: /Tapiola/ })).toHaveAttribute(
    "href",
    "/koripallokentat/espoo/l1",
  );
  expect(screen.getByRole("link", { name: copy.courtsOnMap })).toHaveAttribute("href", "/kartta");
});
