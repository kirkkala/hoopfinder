import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import type { Court } from "@/lib/courts";
import type { AdminSubmittedCourt } from "@/lib/submitted-courts";
import { AdminEditsView, EditSuggestionList } from "./AdminCourtsView";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useLinkStatus: () => ({ pending: false }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const copy = getCopy();

afterEach(cleanup);

test("an unconfirmed suggestion stays visible before the email link is opened", () => {
  render(
    <EditSuggestionList
      items={[
        {
          id: "21",
          href: "/courts/lipas/82621",
          name: "Aarnivalkean koulun koripallokenttä",
          email: "visitor@example.com",
          status: "unconfirmed",
          changes: { hoopHeight: "official" },
        },
      ]}
    />,
  );

  expect(screen.getByText(copy.adminStatusUnconfirmed)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Aarnivalkean koulun koripallokenttä" })).toHaveAttribute(
    "href",
    "/courts/lipas/82621",
  );
  expect(screen.getByText(`${copy.hoopHeight}:`)).toBeInTheDocument();
  expect(screen.getByText(copy.hoopHeights.official)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "visitor@example.com" })).toBeInTheDocument();
  expect(screen.getByText(copy.adminEditUnconfirmed)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: copy.adminPublish })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: copy.adminEditDelete })).toBeInTheDocument();
});

test("filters suggestions by the same statuses as visitor courts", () => {
  render(
    <AdminEditsView
      courts={[
        suggestion({ id: "1", name: "Avoin", status: "unconfirmed" }),
        suggestion({ id: "2", name: "Julkaistu kenttä", status: "published" }),
      ]}
    />,
  );

  expect(screen.getByRole("button", { name: copy.adminFilterAll })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("link", { name: "Avoin" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Julkaistu kenttä" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: copy.adminStatusPublished }));

  expect(screen.queryByRole("link", { name: "Avoin" })).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Julkaistu kenttä" })).toBeInTheDocument();
  expect(screen.getByText(copy.adminEditCount(1))).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: copy.adminUnpublish })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: copy.adminEditDelete })).toBeInTheDocument();
});

function suggestion(overrides: Partial<AdminSubmittedCourt>): AdminSubmittedCourt {
  return {
    id: "1",
    name: "Kenttä",
    address: "Katu 1",
    email: "visitor@example.com",
    lat: 60.1,
    lon: 24.9,
    status: "pending",
    createdAt: "2026-01-01T00:00:00.000Z",
    greeting: null,
    editOf: "82621",
    changes: { hoopHeight: "official" },
    court: {} as Court,
    ...overrides,
  };
}
