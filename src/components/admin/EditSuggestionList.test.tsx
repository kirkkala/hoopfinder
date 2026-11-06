import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import { EditSuggestionList } from "./AdminCourtsView";

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
  expect(screen.getByRole("button", { name: copy.adminDelete })).toBeInTheDocument();
});
