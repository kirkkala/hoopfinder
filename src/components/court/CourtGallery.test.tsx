import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { AdminProvider } from "@/components/admin/AdminProvider";
import { LocaleProvider } from "@/components/brand/LocaleProvider";
import { getCopy } from "@/lib/copy";
import { CourtGallery } from "./CourtGallery";

const copy = getCopy();

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("shows the chosen photo before the email field", () => {
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:preview");
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

  render(
    <LocaleProvider>
      <AdminProvider isAdmin={false}>
        <CourtGallery courtId="1" courtName="Kallio" photos={[]} />
      </AdminProvider>
    </LocaleProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: copy.addPhoto }));
  expect(screen.queryByRole("img", { name: copy.photoAlt("Kallio") })).toBeNull();

  const input = document.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) throw new Error("missing file input");
  const file = new File([new Uint8Array([1])], "court.jpg", { type: "image/jpeg" });
  fireEvent.change(input, { target: { files: [file] } });

  const preview = screen.getByRole("img", { name: copy.photoAlt("Kallio") });
  expect(preview).toHaveAttribute("src", "blob:preview");
  expect(screen.getByText("court.jpg")).toBeTruthy();
  const email = document.querySelector('input[type="email"]');
  if (!(email instanceof HTMLInputElement)) throw new Error("missing email field");
  expect(preview.compareDocumentPosition(email)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});
