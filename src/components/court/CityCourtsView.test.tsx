import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
        { ...entry("Tapiola", "/koripallokentat/espoo/l1", true, true), neighborhood: "Tapiola" },
        {
          ...entry("Matinkylä", "/koripallokentat/espoo/l2", null, true),
          neighborhood: "Matinkylä",
        },
      ]}
    />,
  );

  expect(
    screen.getByRole("heading", { level: 1, name: "Koripallokentät Espoo" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Yhteensä 2 ulkokoripallokenttää. Niistä 1 on merkitty valaistuksi ja 1 on tilapäisesti kiinni. Avaa kenttä listalta nähdäksesi lisää tietoja sekä sijainnin kartalla.",
    ),
  ).toBeInTheDocument();
  const areas = screen.getByText("Alueita: Matinkylä ja Tapiola.");
  expect(areas).toHaveClass("sr-only");
  expect(areas).toHaveAttribute("aria-hidden", "true");
  expect(screen.getByRole("link", { name: copy.allCourts })).toHaveAttribute(
    "href",
    "/koripallokentat",
  );
  expect(screen.getByRole("link", { name: /Tapiola/ })).toHaveAttribute(
    "href",
    "/koripallokentat/espoo/l1",
  );
  expect(screen.getByRole("link", { name: copy.courtsOnMap })).toHaveAttribute("href", "/kartta");
  expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
});

test("search appears only after 10 courts and filters the list", () => {
  const courts = Array.from({ length: 10 }, (_, index) =>
    entry(`Kenttä ${index + 1}`, `/koripallokentat/espoo/l${index + 1}`, null, null),
  );
  const { rerender } = render(
    <CityCourtsView cityName="Espoo" lit={0} closed={0} fetchedAtBySource={{}} courts={courts} />,
  );
  expect(screen.queryByRole("searchbox", { name: copy.cityCourtSearch })).not.toBeInTheDocument();

  const searchable = [
    {
      ...entry("Järvenpään kenttä", "/koripallokentat/espoo/l20", null, null),
      neighborhood: "Järvenpää",
      address: "Rantatie 1",
    },
    ...courts,
  ];
  rerender(
    <CityCourtsView
      cityName="Espoo"
      lit={0}
      closed={0}
      fetchedAtBySource={{}}
      courts={searchable}
    />,
  );

  const search = screen.getByRole("searchbox", { name: copy.cityCourtSearch });
  fireEvent.change(search, { target: { value: "jarven" } });
  expect(screen.getByRole("link", { name: /Järvenpään kenttä/ })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /Kenttä 1/ })).not.toBeInTheDocument();

  fireEvent.change(search, { target: { value: "puuttuu" } });
  expect(screen.getByText(copy.citySearchEmpty)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: copy.citySearchClear }));
  expect(screen.queryByText(copy.citySearchEmpty)).not.toBeInTheDocument();
  expect(document.querySelector('a[href="/koripallokentat/espoo/l1"]')).toBeTruthy();
  expect(document.querySelector('a[href="/koripallokentat/espoo/l20"]')).toBeTruthy();
});
