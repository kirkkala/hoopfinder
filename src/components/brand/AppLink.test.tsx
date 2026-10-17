import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import { AppLink, AppLinkPending } from "./AppLink";

const copy = getCopy();

const status = vi.hoisted(() => ({ pending: true }));

afterEach(() => {
  cleanup();
});

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
  useLinkStatus: () => status,
}));

test("the pending spinner stays on the label's row, after the text", () => {
  status.pending = true;
  render(<AppLink href="/?info">{copy.homepage}</AppLink>);

  const link = screen.getByRole("link", { name: copy.homepage });
  const spinner = link.querySelector("svg");
  expect(spinner).toHaveClass("inline-block", "animate-spin");
  expect(link.lastElementChild).toBe(spinner);
});

test("a reserved spinner keeps its width while the link is idle", () => {
  status.pending = false;
  render(
    <AppLink href="/?info" reservePending>
      {copy.homepage}
    </AppLink>,
  );

  const spinner = screen.getByRole("link", { name: copy.homepage }).querySelector("svg");
  expect(spinner).toHaveClass("invisible", "inline-block", "size-3.5");
  expect(spinner).not.toHaveClass("animate-spin");
});

test("a spinner placed inside the link is the only one", () => {
  status.pending = true;
  render(
    <AppLink href="/courts/lipas/1" trailingPending={false}>
      <span>
        {copy.letsGo}
        <AppLinkPending />
      </span>
    </AppLink>,
  );

  const link = screen.getByRole("link", { name: copy.letsGo });
  const spinners = link.querySelectorAll(".animate-spin");
  expect(spinners).toHaveLength(1);
  expect(spinners[0]?.parentElement?.tagName).toBe("SPAN");
  expect(link.lastElementChild).toBe(spinners[0]?.parentElement);
});
