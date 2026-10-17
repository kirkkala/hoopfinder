import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeAll, beforeEach, expect, test, vi } from "vitest";
import { getCopy } from "@/lib/copy";
import { AddCourtView } from "./AddCourtView";

const copy = getCopy();

function field(label: string) {
  return new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
}

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
  render(<AddCourtView fetchedAtBySource={{}} />);
  const leave = screen.getAllByRole("link", { name: copy.addCourtExit });
  expect(leave).toHaveLength(2);
  for (const link of leave) expect(link).toHaveAttribute("href", "/map");
  fireEvent.click(screen.getByRole("button", { name: copy.okBroCta }));
  expect(screen.getByRole("link", { name: copy.addCourtExit })).toHaveAttribute("href", "/map");
  expect(screen.getByRole("button", { name: copy.nearMe.idle })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "place pin" }));
  expect(screen.getByRole("button", { name: copy.addCourtInfoOpen })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: copy.addCourt }));
  expect(screen.queryByRole("button", { name: copy.nearMe.idle })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: copy.addCourtInfoOpen })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: copy.addCourtExit })).not.toBeInTheDocument();
  const dialog = screen.getByRole("dialog", { name: copy.addCourt });
  expect(dialog.parentElement?.style.top).toBe("max(0.75rem, env(safe-area-inset-top))");
}

test("keeps save off the first step and asks for the surface before sending", async () => {
  openForm();

  fireEvent.click(screen.getByRole("button", { name: copy.addCourtContinue }));
  expect(screen.getByRole("alert")).toHaveTextContent(
    copy.addCourtMissing([copy.addCourtName, copy.addCourtAddress, copy.addCourtEmail].join(", ")),
  );
  expect(screen.queryByRole("button", { name: copy.addCourtSubmit })).not.toBeInTheDocument();
  expect(posts()).toHaveLength(0);

  fireEvent.change(screen.getByRole("textbox", { name: field(copy.addCourtName) }), {
    target: { value: "Kallio" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: field(copy.addCourtAddress) }), {
    target: { value: "Testikatu 1" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: field(copy.addCourtEmail) }), {
    target: { value: "a@b.fi" },
  });
  fireEvent.click(screen.getByRole("button", { name: copy.addCourtContinue }));

  expect(screen.queryByRole("button", { name: copy.addCourtContinue })).not.toBeInTheDocument();
  expect(posts()).toHaveLength(0);
  const scroller = document.getElementById("add-court-form")?.parentElement;
  if (!scroller) throw new Error("missing form scroller");
  Object.defineProperty(scroller, "scrollHeight", { configurable: true, value: 1000 });
  Object.defineProperty(scroller, "clientHeight", { configurable: true, value: 300 });
  Object.defineProperty(scroller, "scrollTop", { configurable: true, writable: true, value: 0 });
  fireEvent.scroll(scroller);
  expect(screen.getByText(copy.addCourtDetailsMore)).toBeInTheDocument();
  scroller.scrollTop = 700;
  fireEvent.scroll(scroller);
  expect(screen.getByText(copy.addCourtDetailsReady)).toBeInTheDocument();
  expect(screen.getByText(copy.addCourtBasicsHeading)).toBeInTheDocument();
  expect(screen.getByText(copy.addCourtDetailsHeading)).toBeInTheDocument();
  expect(screen.queryByText(copy.courtFacts)).not.toBeInTheDocument();
  const greetingHeading = screen.getByText(copy.addCourtGreeting);
  const greetingHint = screen.getByText(copy.addCourtGreetingHint);
  const greeting = screen.getByRole("textbox", { name: copy.addCourtGreeting });
  expect(
    greetingHeading.compareDocumentPosition(greetingHint) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  expect(
    greetingHint.compareDocumentPosition(greeting) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  const courtName = screen.getByText("Kallio");
  const back = screen.getByRole("button", { name: copy.addCourtEditBasics });
  expect(back.querySelector("svg")).toBeTruthy();
  expect(back).not.toHaveTextContent(copy.addCourtEditBasics);
  expect(courtName.className).toContain("font-bold");
  expect(screen.getByText("Testikatu 1").className).not.toContain("font-bold");
  expect(screen.getByText("a@b.fi").className).not.toContain("font-bold");
  expect(back.compareDocumentPosition(courtName) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  const surface = screen.getByText(copy.surface);
  expect(back.compareDocumentPosition(surface) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const fieldType = screen.getByText(copy.fieldType);
  expect(
    surface.compareDocumentPosition(fieldType) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();

  expect(surface.className).toContain("font-bold");
  expect(screen.getByText(copy.status).className).toContain("font-bold");
  expect(screen.getByText(copy.adjustableRim).className).toContain("font-bold");
  const asphalt = screen.getByRole("button", { name: copy.surfaces.asphalt });
  const open = screen.getByRole("button", { name: copy.statusOpen });
  const yes = screen.getByRole("button", { name: `${copy.adjustableRim}: ${copy.yes}` });
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
  expect(screen.getByRole("button", { name: copy.fieldTypes.full })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: copy.hoopHeights.official })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: copy.addCourtEditBasics }));
  expect(screen.getByText(copy.addCourtBasicsHeading)).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: field(copy.addCourtName) })).toHaveValue("Kallio");
  expect(screen.queryByRole("button", { name: copy.addCourtSubmit })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: copy.addCourtContinue }));
  fireEvent.click(screen.getByRole("button", { name: copy.addCourtSubmit }));

  await waitFor(() => expect(posts()).toHaveLength(1));
  const body = JSON.parse(String(posts()[0]?.[1]?.body));
  expect(body).toMatchObject({
    name: "Kallio",
    email: "a@b.fi",
    surfaceMaterial: ["asphalt"],
  });
  expect(push).toHaveBeenCalled();
});
