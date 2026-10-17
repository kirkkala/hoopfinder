import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { LocaleProvider } from "@/components/brand/LocaleProvider";
import { CourtMiniPopup } from "@/components/court/CourtMiniPopup";
import { getCopy } from "@/lib/copy";
import type { ExplorerCourt } from "@/lib/courts";

const copy = getCopy();

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: false }),
}));

const kallio: ExplorerCourt = {
  id: "82547",
  source: "lipas",
  name: "Kallio",
  nameFi: "Kallio",
  status: "active",
  address: "Helsinginkatu 25",
  city: "Helsinki",
  neighborhood: "Kallio",
  lat: 60.18,
  lon: 24.95,
  amenities: { lighting: true, freeUse: true },
};

afterEach(() => {
  cleanup();
});

function renderPopup(court: ExplorerCourt, current: boolean) {
  const onClose = vi.fn();
  render(
    <LocaleProvider>
      <CourtMiniPopup court={court} current={current} onClose={onClose} />
    </LocaleProvider>,
  );
  return onClose;
}

test("the current court links back to the main map", () => {
  renderPopup(kallio, true);

  expect(screen.getByText("Kallio")).toBeInTheDocument();
  expect(screen.getByText("Helsinginkatu 25, Kallio, Helsinki")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: copy.backToMap })).toHaveAttribute(
    "href",
    "/map?court=lipas-82547",
  );
  expect(screen.queryByRole("link", { name: copy.letsGo })).not.toBeInTheDocument();
});

test("another court opens that court's page", () => {
  renderPopup(kallio, false);

  expect(screen.getByRole("link", { name: copy.letsGo })).toHaveAttribute(
    "href",
    "/courts/lipas/82547",
  );
  expect(screen.queryByRole("link", { name: copy.backToMap })).not.toBeInTheDocument();
});

test("a court still waiting for email has no page link", () => {
  renderPopup(
    {
      ...kallio,
      id: "submitted-9",
      source: "pending",
      emailConfirmed: false,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    false,
  );

  expect(screen.getByText(copy.statusAwaitingEmail)).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: copy.letsGo })).not.toBeInTheDocument();
});

test("close dismisses the card", () => {
  const onClose = renderPopup(kallio, false);
  fireEvent.click(screen.getByRole("button", { name: copy.close }));
  expect(onClose).toHaveBeenCalledOnce();
});
