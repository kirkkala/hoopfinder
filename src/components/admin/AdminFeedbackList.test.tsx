import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import type { AdminFeedback } from "@/lib/feedback";
import { AdminFeedbackList } from "./AdminFeedbackList";

const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

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

test("saves notes from the dropdown", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  render(<AdminFeedbackList items={[item]} />);

  expect(screen.getByRole("link", { name: "visitor@example.com" })).toHaveAttribute(
    "href",
    "mailto:visitor@example.com",
  );
  expect(screen.queryByRole("textbox", { name: "Muistiinpanot" })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Muistiinpanot" }));
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
  expect(screen.getByRole("button", { name: /Tallennettu/ })).toBeInTheDocument();
  vi.unstubAllGlobals();
});
