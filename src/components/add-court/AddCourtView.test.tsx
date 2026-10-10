import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, beforeEach, expect, test, vi } from "vitest";
import { AddCourtView } from "./AddCourtView";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/add",
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockMap({
      onPlace,
      confirm,
    }: {
      onPlace: (coords: { lat: number; lon: number }) => void;
      confirm?: ReactNode;
    }) {
      return (
        <div>
          <button type="button" onClick={() => onPlace({ lat: 60.17, lon: 24.94 })}>
            place pin
          </button>
          {confirm}
        </div>
      );
    },
}));

beforeAll(() => {
  if (!window.matchMedia) {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }),
    });
  }
  if (!("ResizeObserver" in globalThis)) {
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserver);
  }
  Element.prototype.scrollTo = () => {};
});

beforeEach(() => {
  push.mockClear();
  localStorage.setItem("hoopfinder-intro-seen", "1");
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/api/places/reverse")) {
        return Response.json({ address: "Testikatu 1, Helsinki" });
      }
      if (init?.method === "POST") {
        return Response.json({ court: { id: "new", source: "submitted" } });
      }
      return Response.json({ courts: [] });
    }),
  );
});

function posts() {
  const fetchMock = vi.mocked(fetch);
  return fetchMock.mock.calls.filter((call) => call[1]?.method === "POST");
}

function openForm() {
  render(<AddCourtView courtCount={1} fetchedAtBySource={{}} />);
  fireEvent.click(screen.getByRole("button", { name: "Tämä selvä!" }));
  fireEvent.click(screen.getByRole("button", { name: "place pin" }));
  fireEvent.click(screen.getByRole("button", { name: "Lisää kenttä" }));
}

test("keeps save off the first step and asks for the surface before sending", async () => {
  openForm();

  fireEvent.click(screen.getByRole("button", { name: "Jatka kentän tietoihin" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Täytä vielä");
  expect(screen.queryByRole("button", { name: "Tallenna" })).not.toBeInTheDocument();
  expect(posts()).toHaveLength(0);

  fireEvent.change(screen.getByRole("textbox", { name: /Kentän nimi/ }), {
    target: { value: "Kallio" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /^Osoite/ }), {
    target: { value: "Testikatu 1" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /Sähköpostiosoitteesi/ }), {
    target: { value: "a@b.fi" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Jatka kentän tietoihin" }));

  expect(screen.queryByRole("button", { name: "Jatka kentän tietoihin" })).not.toBeInTheDocument();
  expect(posts()).toHaveLength(0);
  const scroller = document.getElementById("add-court-form")?.parentElement;
  if (!scroller) throw new Error("missing form scroller");
  Object.defineProperty(scroller, "scrollHeight", { configurable: true, value: 1000 });
  Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 300 });
  Object.defineProperty(scroller, "scrollTop", { configurable: true, writable: true, value: 0 });
  fireEvent.scroll(scroller);
  expect(screen.getByText("Vieritä alas, lomakkeella on lisää täytettävää.")).toBeInTheDocument();
  scroller.scrollTop = 700;
  fireEvent.scroll(scroller);
  expect(screen.getByText("Hienoa! Tallenna, jahka olet tyytyväinen.")).toBeInTheDocument();
  expect(screen.getByText("Perustiedot")).toBeInTheDocument();
  expect(screen.getByText("Lisätiedot kentästä")).toBeInTheDocument();
  expect(screen.queryByText("Kentän tiedot")).not.toBeInTheDocument();
  const greetingHeading = screen.getByText("Terveiset kehittäjälle");
  const greetingHint = screen.getByText(/Palaute tai terveiset/);
  const greeting = screen.getByRole("textbox", { name: "Terveiset kehittäjälle" });
  expect(
    greetingHeading.compareDocumentPosition(greetingHint) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    greetingHint.compareDocumentPosition(greeting) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  const courtName = screen.getByText("Kallio");
  const back = screen.getByRole("button", { name: "Muokkaa" });
  expect(back.querySelector("svg")).toBeTruthy();
  expect(back).not.toHaveTextContent("Muokkaa");
  expect(courtName.className).toContain("font-bold");
  expect(screen.getByText("Testikatu 1").className).not.toContain("font-bold");
  expect(screen.getByText("a@b.fi").className).not.toContain("font-bold");
  expect(back.compareDocumentPosition(courtName) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  const surface = screen.getByText("Pinta");
  expect(back.compareDocumentPosition(surface) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const fieldType = screen.getByText("Kenttätyyppi");
  expect(
    surface.compareDocumentPosition(fieldType) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();

  expect(screen.getByText("Pinta").className).toContain("font-bold");
  expect(screen.getByText("Tila").className).toContain("font-bold");
  expect(screen.getByText("Säädettävä kori").className).toContain("font-bold");
  const asphalt = screen.getByRole("button", { name: "Asfaltti" });
  const open = screen.getByRole("button", { name: "Avoinna" });
  const yes = screen.getByRole("button", { name: "Säädettävä kori: Kyllä" });
  for (const button of [asphalt, open, yes]) {
    expect(button.className).toContain("text-xs");
    expect(button.className).toContain("border-white/15");
  }
  expect(asphalt).toHaveAttribute("aria-pressed", "false");
  fireEvent.click(asphalt);
  expect(asphalt).toHaveAttribute("aria-pressed", "true");
  expect(asphalt.className).toContain("bg-gold");
  fireEvent.click(open);
  expect(open).toHaveAttribute("aria-pressed", "true");
  expect(open.className).toContain("bg-gold");
  expect(screen.getByRole("button", { name: /Normaali koripallo/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "305 cm" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Muokkaa" }));
  expect(screen.getByText("Perustiedot")).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /Kentän nimi/ })).toHaveValue("Kallio");
  expect(screen.queryByRole("button", { name: "Tallenna" })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Jatka kentän tietoihin" }));
  fireEvent.click(screen.getByRole("button", { name: "Tallenna" }));

  await waitFor(() => expect(posts()).toHaveLength(1));
  const body = JSON.parse(String(posts()[0]?.[1]?.body));
  expect(body).toMatchObject({
    name: "Kallio",
    email: "a@b.fi",
    surfaceMaterial: ["asphalt"],
  });
  expect(push).toHaveBeenCalled();
});
