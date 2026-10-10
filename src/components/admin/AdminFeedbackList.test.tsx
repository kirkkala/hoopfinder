import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { AdminFeedback } from "@/lib/feedback";
import { AdminFeedbackList } from "./AdminFeedbackList";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const item: AdminFeedback = {
  id: "4",
  title: "Bugi kartalla",
  body: "Zoomaus hyppää.",
  email: "visitor@example.com",
  notes: "",
  createdAt: "2026-10-10T12:00:00.000Z",
};

test("says when there is no feedback and when the database is down", () => {
  const { rerender } = render(<AdminFeedbackList items={[]} />);
  expect(screen.getByText("Ei vielä palautetta.")).toBeInTheDocument();

  rerender(<AdminFeedbackList items={null} />);
  expect(screen.getByText("Hallintapaneeli ei ole juuri nyt käytössä.")).toBeInTheDocument();
});

test("keeps each opened message open", () => {
  const second: AdminFeedback = {
    ...item,
    id: "5",
    title: "Toive",
    body: "Lisää kenttiä.",
    email: null,
  };
  render(<AdminFeedbackList items={[item, second]} />);

  expect(screen.queryByText(item.body)).not.toBeInTheDocument();
  expect(screen.queryByText(second.body)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Bugi kartalla/ }));
  expect(screen.getByText(item.body)).toBeInTheDocument();
  expect(screen.queryByText(second.body)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Toive/ }));
  expect(screen.getByText(item.body)).toBeInTheDocument();
  expect(screen.getByText(second.body)).toBeInTheDocument();
  expect(screen.getByText("Lähettäjä: Anonyymi")).toBeInTheDocument();
});

test("saves notes from an open message", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminFeedbackList items={[item]} />);

  expect(screen.queryByRole("link", { name: "visitor@example.com" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Bugi kartalla/ }));

  expect(screen.getByRole("link", { name: "visitor@example.com" })).toHaveAttribute(
    "href",
    "mailto:visitor@example.com",
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Muistiinpanot" }), {
    target: { value: "Vastasin sähköpostilla." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Tallenna muistiinpanot" }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/feedback/4", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: "Vastasin sähköpostilla." }),
    });
  });
  expect(refresh).toHaveBeenCalled();
  expect(screen.getByText("Tallennettu")).toBeInTheDocument();
});
