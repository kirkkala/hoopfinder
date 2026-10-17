import { cleanup, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import { type Court, emptyAmenities } from "@/lib/courts";
import { CourtDetails } from "./CourtDetails";

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
  usePathname: () => "/koripallokentat/helsinki/l1",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function MiniMap() {
      return null;
    },
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

const court: Court = {
  id: "1",
  source: "lipas",
  name: "Kallio",
  nameFi: "Kallio",
  status: "active",
  address: "Testikatu 1",
  postalCode: "00500",
  city: "Helsinki",
  neighborhood: null,
  lat: 60.18,
  lon: 24.94,
  comment: null,
  website: null,
  constructionYear: null,
  owner: null,
  admin: null,
  amenities: emptyAmenities(),
};

test("a court page links to this court on the map above the title and under the minimap", () => {
  render(
    <CourtDetails
      court={court}
      fetchedAtBySource={{}}
      sourceFetchedAt={null}
      photos={[]}
      cityName="Helsinki"
      cityPageHref="/koripallokentat/helsinki"
    />,
  );

  const main = screen.getByRole("heading", { level: 1 }).closest("main");
  expect(main).not.toBeNull();
  if (!main) return;

  expect(within(main).queryByRole("link", { name: copy.homepage })).not.toBeInTheDocument();
  expect(within(main).queryByRole("link", { name: copy.courtsOnMap })).not.toBeInTheDocument();

  const maps = within(main).getAllByRole("link", { name: copy.backToMap });
  const heading = within(main).getByRole("heading", { level: 1 });
  const location = within(main).getByRole("heading", { name: copy.courtLocation });
  expect(maps).toHaveLength(2);
  for (const link of maps) expect(link).toHaveAttribute("href", "/kartta?court=l1");
  expect(maps[0].compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(
    location.compareDocumentPosition(maps[1]) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
});
