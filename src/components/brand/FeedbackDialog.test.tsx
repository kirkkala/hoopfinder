import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import { FeedbackDialog } from "./FeedbackDialog";

const copy = getCopy();

function field(label: string) {
  return new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
}

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
  vi.unstubAllGlobals();
});

test("asks for a title and a message before sending", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  render(<FeedbackDialog open onClose={vi.fn()} />);

  fireEvent.click(screen.getByRole("button", { name: copy.feedbackSend }));
  expect(await screen.findByRole("alert")).toHaveTextContent(copy.feedbackInvalid);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "Buy Me a Coffee" })).toHaveAttribute(
    "href",
    "https://www.buymeacoffee.com/kirkkala",
  );
  expect(screen.getByText(copy.supportDeveloper)).toBeInTheDocument();
});

test("stores a message and shows thanks", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  const onClose = vi.fn();
  render(<FeedbackDialog open onClose={onClose} />);

  fireEvent.change(screen.getByRole("textbox", { name: field(copy.feedbackFieldTitle) }), {
    target: { value: "Bugi kartalla" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: field(copy.feedbackFieldMessage) }), {
    target: { value: "Zoomaus hyppää." },
  });
  fireEvent.change(screen.getByRole("textbox", { name: field(copy.feedbackFieldEmail) }), {
    target: { value: "Visitor@Example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: copy.feedbackSend }));

  expect(await screen.findByText(copy.feedbackThanks)).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledWith("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Bugi kartalla",
      body: "Zoomaus hyppää.",
      email: "visitor@example.com",
      company: "",
    }),
  });

  const closeButtons = screen.getAllByRole("button", { name: copy.close });
  fireEvent.click(closeButtons[closeButtons.length - 1]);
  expect(onClose).toHaveBeenCalledOnce();
});

test("explains the hourly limit", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: "rate-limited" }), { status: 429 })),
  );
  render(<FeedbackDialog open onClose={vi.fn()} />);
  fireEvent.change(screen.getByRole("textbox", { name: field(copy.feedbackFieldTitle) }), {
    target: { value: "Bugi" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: field(copy.feedbackFieldMessage) }), {
    target: { value: "Kartta" },
  });
  fireEvent.click(screen.getByRole("button", { name: copy.feedbackSend }));
  expect(await screen.findByRole("alert")).toHaveTextContent(copy.feedbackRateLimited);
});
