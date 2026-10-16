import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, test } from "vitest";
import { LocaleProvider } from "@/components/brand/LocaleProvider";
import { clearVisited, markVisited } from "@/lib/visit";
import { FirstVisitNote } from "./FirstVisitNote";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  cleanup();
  clearVisited();
  for (const dialog of document.querySelectorAll("dialog")) dialog.remove();
});

test("a first visit on a court page explains the service and links onward", () => {
  render(
    <LocaleProvider>
      <FirstVisitNote />
    </LocaleProvider>,
  );

  expect(
    screen.getByRole("heading", { name: "Hoop Finderissä on kaikki Suomen ulkokoripallokentät." }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Kentät kartalla" })).toHaveAttribute("href", "/map");
  expect(screen.getByRole("link", { name: "Kentät listana" })).toHaveAttribute("href", "/courts");
  expect(document.cookie).toContain("hoopfinder-visited=1");
});

test("the note stays closed after the visitor has seen it", () => {
  markVisited();
  render(
    <LocaleProvider>
      <FirstVisitNote />
    </LocaleProvider>,
  );

  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("closing the note leaves the court page", () => {
  render(
    <LocaleProvider>
      <FirstVisitNote />
    </LocaleProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Sulje" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
