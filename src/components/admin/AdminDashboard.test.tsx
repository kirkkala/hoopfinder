import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import { AdminDashboard } from "./AdminDashboard";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useLinkStatus: () => ({ pending: false }),
}));

const copy = getCopy();

afterEach(cleanup);

test("links each count to the page where that work is done", () => {
  render(
    <AdminDashboard
      overview={{
        feedback: 2,
        photos: 5,
        photoCourts: 3,
        courts: 4,
        edits: { unconfirmed: 1, pending: 2, published: 6 },
      }}
    />,
  );

  expect(screen.getByRole("link", { name: new RegExp(copy.adminFeedbackTitle) })).toHaveAttribute(
    "href",
    "/admin/feedback",
  );
  expect(screen.getByRole("link", { name: new RegExp(copy.adminPhotosTitle) })).toHaveAttribute(
    "href",
    "/admin/photos",
  );
  expect(screen.getByRole("link", { name: new RegExp(copy.adminCourtsTitle) })).toHaveAttribute(
    "href",
    "/admin/courts",
  );
  expect(screen.getByRole("link", { name: new RegExp(copy.adminEditSuggestions) })).toHaveAttribute(
    "href",
    "/admin/edits",
  );
  expect(screen.getByText(copy.adminFeedbackCount(2))).toBeInTheDocument();
  expect(
    screen.getByText(`${copy.adminPhotoCount(5)}, ${copy.adminCourtCount(3)}`),
  ).toBeInTheDocument();
  expect(screen.getByText(copy.adminCourtCount(4))).toBeInTheDocument();
  expect(
    screen.getByText(
      `${copy.adminStatusUnconfirmed} 1, ${copy.adminStatusConfirmed} 2, ${copy.adminStatusPublished} 6`,
    ),
  ).toBeInTheDocument();
});
