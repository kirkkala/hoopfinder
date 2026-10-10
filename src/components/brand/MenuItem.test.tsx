import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { expect, test, vi } from "vitest";
import { MenuItem, MenuItemList } from "./MenuItem";

const navigation = vi.hoisted(() => ({ pathname: "/" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    onClick,
    className,
    "aria-current": ariaCurrent,
  }: {
    children: ReactNode;
    href: string;
    onClick?: () => void;
    className?: string;
    "aria-current"?: "page";
  }) => (
    <a href={href} onClick={onClick} className={className} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
  useLinkStatus: () => ({ pending: false }),
}));

test("a page link is a regular item until that page is open", () => {
  navigation.pathname = "/";
  const onNavigate = vi.fn();
  const { rerender } = render(
    <MenuItemList onNavigate={onNavigate}>
      <MenuItem href="/add">Add court</MenuItem>
    </MenuItemList>,
  );

  const link = screen.getByRole("link", { name: "Add court" });
  expect(link).not.toHaveAttribute("aria-current");
  expect(link.className).toContain("text-white");
  expect(link.className).not.toContain("text-gold");
  expect(link.className).not.toContain("font-bold");

  navigation.pathname = "/add";
  rerender(
    <MenuItemList onNavigate={onNavigate}>
      <MenuItem href="/add">Add court</MenuItem>
    </MenuItemList>,
  );

  expect(screen.getByRole("link", { name: "Add court" })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: "Add court" }).className).toContain("text-gold");

  fireEvent.click(screen.getByRole("link", { name: "Add court" }));
  expect(onNavigate).toHaveBeenCalledOnce();

  navigation.pathname = "/add/confirm/token";
  rerender(
    <MenuItemList onNavigate={onNavigate}>
      <MenuItem href="/add">Add court</MenuItem>
    </MenuItemList>,
  );
  expect(screen.getByRole("link", { name: "Add court" })).not.toHaveAttribute("aria-current");
});

test("an action item closes the menu and runs its action", () => {
  navigation.pathname = "/admin";
  const onNavigate = vi.fn();
  const onSignOut = vi.fn();
  render(
    <MenuItemList onNavigate={onNavigate}>
      <MenuItem onClick={onSignOut}>Sign out</MenuItem>
    </MenuItemList>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(onNavigate).toHaveBeenCalledOnce();
  expect(onSignOut).toHaveBeenCalledOnce();
});

test("a dialog action leaves the menu open", () => {
  const onNavigate = vi.fn();
  const onOpenInfo = vi.fn();
  render(
    <MenuItemList onNavigate={onNavigate}>
      <MenuItem keepOpen onClick={onOpenInfo} aria-haspopup="dialog" aria-expanded={false}>
        Info
      </MenuItem>
    </MenuItemList>,
  );

  const button = screen.getByRole("button", { name: "Info" });
  expect(button).toHaveAttribute("aria-haspopup", "dialog");
  expect(button).toHaveAttribute("aria-expanded", "false");

  fireEvent.click(button);
  expect(onNavigate).not.toHaveBeenCalled();
  expect(onOpenInfo).toHaveBeenCalledOnce();
});
