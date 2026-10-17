import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import { ViewJump, ViewJumps } from "./ViewJump";

const copy = getCopy();

afterEach(cleanup);

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
  useLinkStatus: () => ({ pending: true }),
}));

test("the map and list buttons show the spinner after the label", () => {
  render(
    <>
      <ViewJump href="/map" direction="to-map">
        {copy.courtsOnMap}
      </ViewJump>
      <ViewJump href="/courts" direction="to-list">
        {copy.courtsAsList}
      </ViewJump>
    </>,
  );

  for (const [name, href] of [
    [copy.courtsOnMap, "/map"],
    [copy.courtsAsList, "/courts"],
  ]) {
    const link = screen.getByRole("link", { name });
    const label = [...link.childNodes].find((node) => node.textContent === name);
    const spinner = link.querySelector(".animate-spin");
    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("data-prefetch", "false");
    expect(link).toHaveClass("inline-flex", "items-center");
    expect(spinner).not.toBeNull();
    if (!label || !spinner) return;
    expect(label.compareDocumentPosition(spinner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }
});

test("the map and the list put the info page before the other view", () => {
  const { rerender } = render(<ViewJumps also="to-list" />);

  const home = screen.getByRole("link", { name: copy.homepage });
  const list = screen.getByRole("link", { name: copy.courtsAsList });
  expect(home.compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(home).toHaveAttribute("href", "/?info");
  expect(list).toHaveAttribute("href", "/koripallokentat");

  rerender(<ViewJumps also="to-map" />);
  const map = screen.getByRole("link", { name: copy.courtsOnMap });
  expect(
    screen.getByRole("link", { name: copy.homepage }).compareDocumentPosition(map) &
      Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(map).toHaveAttribute("href", "/kartta");
});
