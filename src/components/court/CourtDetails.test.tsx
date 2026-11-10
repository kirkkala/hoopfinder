import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import { AdminProvider } from "@/components/admin/AdminProvider";
import { getCopy } from "@/lib/copy";
import { COURT_THANKS_KEY, type Court, emptyAmenities } from "@/lib/courts";
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

afterEach(() => {
  sessionStorage.clear();
  cleanup();
});

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

test("a Lipas court cites Jyväskylän yliopisto, Lipas.fi", () => {
  render(<CourtDetails court={court} fetchedAtBySource={{}} sourceFetchedAt={null} photos={[]} />);

  const main = screen.getByRole("heading", { level: 1 }).closest("main");
  expect(main).not.toBeNull();
  if (!main) return;

  expect(within(main).getByRole("link", { name: copy.lipasCredit })).toHaveAttribute(
    "href",
    "https://www.lipas.fi",
  );
});

test("a court page links to this court on the map under the minimap", () => {
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

  expect(within(main).queryByRole("button", { name: copy.nearMe.idle })).not.toBeInTheDocument();
  expect(within(main).queryByText(copy.distanceAway)).not.toBeInTheDocument();

  const map = within(main).getByRole("link", { name: copy.backToMap });
  const location = within(main).getByRole("heading", { name: copy.courtLocation });
  expect(map).toHaveAttribute("href", "/kartta?court=l1");
  expect(location.compareDocumentPosition(map) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test("add photo sits with edit and opens the gallery form", () => {
  render(<CourtDetails court={court} fetchedAtBySource={{}} sourceFetchedAt={null} photos={[]} />);

  const edit = screen.getByRole("button", { name: copy.suggestContribute });
  const [addPhoto, galleryAdd] = screen.getAllByRole("button", { name: copy.addPhoto });
  expect(addPhoto).toBeTruthy();
  expect(galleryAdd).toBeTruthy();
  expect(edit.compareDocumentPosition(addPhoto) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(addPhoto.className).toContain("border-white/15");
  expect(addPhoto.className).not.toContain("bg-gold");

  fireEvent.click(addPhoto);
  expect(screen.getByRole("dialog", { name: copy.addPhoto })).toBeInTheDocument();
});

test("a visitor can open the correction form from the court page", () => {
  render(<CourtDetails court={court} fetchedAtBySource={{}} sourceFetchedAt={null} photos={[]} />);

  fireEvent.click(screen.getByRole("button", { name: copy.suggestContribute }));

  const dialog = screen.getByRole("dialog", { name: copy.suggestContribute });
  expect(within(dialog).getByText(copy.suggestHoopHeightLead)).toBeInTheDocument();
  expect(within(dialog).getByText(copy.lipasEditSource, { exact: false })).toBeInTheDocument();
  expect(within(dialog).getByRole("link", { name: "lipas.fi/liikuntapaikat/1" })).toHaveAttribute(
    "href",
    "https://www.lipas.fi/liikuntapaikat/1",
  );
  expect(screen.getByRole("button", { name: copy.hoopHeights.official })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: copy.statusOpen })).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: field(copy.addCourtEmail) })).toBeInTheDocument();
});

test("a visitor-added court says so in the form", () => {
  render(
    <CourtDetails
      court={{ ...court, id: "submitted-10014", source: "submitted" }}
      fetchedAtBySource={{}}
      sourceFetchedAt={null}
      photos={[]}
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: copy.suggestContribute }));

  const dialog = screen.getByRole("dialog", { name: copy.suggestContribute });
  expect(within(dialog).getByText(copy.suggestEditSubmitted)).toBeInTheDocument();
  expect(within(dialog).queryByText(copy.suggestHoopHeightLead)).not.toBeInTheDocument();
});

test("a confirmation link opened after publish says the change is already live", () => {
  sessionStorage.setItem(COURT_THANKS_KEY, `edit-live:${court.id}`);

  render(<CourtDetails court={court} fetchedAtBySource={{}} sourceFetchedAt={null} photos={[]} />);

  expect(screen.getByText(copy.confirmThanksTitle)).toBeInTheDocument();
  expect(screen.getByText(copy.suggestEditSaved)).toBeInTheDocument();
  expect(screen.queryByText(copy.suggestEditThanksBody)).not.toBeInTheDocument();
});

test("an admin reviews a suggestion on the court and uses the same form", () => {
  render(
    <AdminProvider isAdmin>
      <CourtDetails
        court={court}
        fetchedAtBySource={{}}
        sourceFetchedAt={null}
        photos={[]}
        pendingEdits={[
          {
            id: "20",
            email: "visitor@example.com",
            status: "pending",
            changes: { hoopHeight: "official" },
          },
        ]}
      />
    </AdminProvider>,
  );

  expect(screen.getByText(`${copy.fieldSuggestion}:`)).toBeInTheDocument();
  expect(screen.getByText(copy.hoopHeights.official)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: copy.adminPublish })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: copy.adminEdit })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: copy.suggestContribute }));
  expect(
    screen.queryByRole("textbox", { name: field(copy.addCourtEmail) }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: copy.hoopHeights.official })).toBeInTheDocument();
});

function field(label: string) {
  return new RegExp(label);
}
