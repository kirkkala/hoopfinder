import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import { FeedbackProvider } from "./FeedbackDialog";
import { IntroDialog } from "./IntroDialog";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
  if (!("ResizeObserver" in globalThis)) {
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserver);
  }
});

afterEach(() => {
  cleanup();
  for (const dialog of document.querySelectorAll("dialog")) dialog.remove();
});

test("the intro dialog opens feedback and closes itself", () => {
  const onClose = vi.fn();
  render(
    <FeedbackProvider>
      <IntroDialog open showFeedback onClose={onClose} courtCount={12} />
    </FeedbackProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Anna palautetta" }));
  expect(onClose).toHaveBeenCalledOnce();
  expect(screen.getByRole("heading", { name: "Anna palautetta" })).toBeInTheDocument();
});

test("the first intro visit does not offer feedback", () => {
  render(
    <FeedbackProvider>
      <IntroDialog open onClose={vi.fn()} courtCount={12} />
    </FeedbackProvider>,
  );

  expect(screen.queryByRole("button", { name: "Anna palautetta" })).not.toBeInTheDocument();
});
