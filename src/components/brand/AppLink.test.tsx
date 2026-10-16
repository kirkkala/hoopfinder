import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { AppLink } from "./AppLink";

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
  render(<AppLink href="/?info">Etusivu</AppLink>);

  const link = screen.getByRole("link", { name: "Etusivu" });
  const spinner = link.querySelector("svg");
  expect(spinner).toHaveClass("inline-block", "animate-spin");
  expect(link.lastElementChild).toBe(spinner);
});

test("a reserved spinner keeps its width while the link is idle", () => {
  status.pending = false;
  render(
    <AppLink href="/?info" reservePending>
      Etusivu
    </AppLink>,
  );

  const spinner = screen.getByRole("link", { name: "Etusivu" }).querySelector("svg");
  expect(spinner).toHaveClass("invisible", "inline-block", "size-3.5");
  expect(spinner).not.toHaveClass("animate-spin");
});
