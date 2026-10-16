import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { ViewJump } from "./ViewJump";

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
        Kentät kartalla
      </ViewJump>
      <ViewJump href="/courts" direction="to-list">
        Kentät listana
      </ViewJump>
    </>,
  );

  for (const [name, href] of [
    ["Kentät kartalla", "/map"],
    ["Kentät listana", "/courts"],
  ] as const) {
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
