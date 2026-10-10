import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, test } from "vitest";
import { AppFooter } from "./AppFooter";
import { FeedbackProvider } from "./FeedbackDialog";

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
  for (const dialog of document.querySelectorAll("dialog")) dialog.remove();
});

test("the footer credit opens feedback instead of GitHub", () => {
  render(
    <FeedbackProvider>
      <AppFooter />
    </FeedbackProvider>,
  );

  expect(screen.queryByRole("link", { name: /github/i })).not.toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Anna palautetta" })[0]);
  expect(screen.getByRole("heading", { name: "Anna palautetta" })).toBeInTheDocument();
});

test("the collapsed map footer still offers feedback", () => {
  render(
    <FeedbackProvider>
      <AppFooter collapsible />
    </FeedbackProvider>,
  );

  expect(screen.getAllByRole("button", { name: "Anna palautetta" }).length).toBeGreaterThan(0);
  expect(screen.queryByRole("link", { name: /github/i })).not.toBeInTheDocument();
});
