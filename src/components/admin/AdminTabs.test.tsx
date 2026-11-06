import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import { AdminTabs } from "./AdminShell";

const pathname = vi.hoisted(() => ({ current: "/admin/courts" }));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
    "aria-current": current,
  }: {
    children: ReactNode;
    href: string;
    className?: string;
    "aria-current"?: "page";
  }) => (
    <a href={href} className={className} aria-current={current}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: false }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
}));

const copy = getCopy();

afterEach(cleanup);

test("marks the open section and links to the others", () => {
  render(<AdminTabs />);

  expect(screen.getByRole("link", { name: copy.adminTabCourts })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(screen.getByRole("link", { name: copy.adminTabHome })).toHaveAttribute("href", "/admin");
  expect(screen.getByRole("link", { name: copy.adminTabFeedback })).toHaveAttribute(
    "href",
    "/admin/feedback",
  );
  expect(screen.getByRole("link", { name: copy.adminTabPhotos })).toHaveAttribute(
    "href",
    "/admin/photos",
  );
  expect(screen.getByRole("link", { name: copy.adminTabEdits })).toHaveAttribute(
    "href",
    "/admin/edits",
  );
  expect(screen.getByRole("link", { name: copy.adminTabHome })).not.toHaveAttribute("aria-current");
});
