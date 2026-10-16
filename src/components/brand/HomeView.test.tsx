import { render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, expect, test, vi } from "vitest";
import { FeedbackProvider } from "@/components/brand/FeedbackDialog";
import { LocaleProvider } from "@/components/brand/LocaleProvider";
import { clearVisited } from "@/lib/visit";
import { HomeView } from "./HomeView";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));

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

beforeEach(() => {
  replace.mockClear();
  clearVisited();
});

test("the homepage explains the service, then offers the map, the list, and location", () => {
  render(
    <LocaleProvider>
      <FeedbackProvider>
        <HomeView fetchedAtBySource={{}} />
      </FeedbackProvider>
    </LocaleProvider>,
  );

  const main = screen.getByRole("main");
  const pitch = within(main).getByRole("heading", { name: "Koripallokentät suomessa" });
  const mapLink = within(main).getByRole("link", { name: "Kentät kartalla" });
  const listLink = within(main).getByRole("link", { name: "Kentät listana" });
  expect(pitch.compareDocumentPosition(mapLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(mapLink).toHaveAttribute("href", "/map");
  expect(listLink).toHaveAttribute("href", "/courts");
  expect(
    screen.getByText("Hoop Finderissä on kaikki Suomen ulkokoripallokentät."),
  ).toBeInTheDocument();
  const feedback = within(main).getByRole("button", { name: "Anna palautetta" });
  const source = within(main).getByRole("link", { name: "GitHubista" });
  expect(feedback.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(source).toHaveAttribute("href", "https://github.com/kirkkala/hoopfinder");
  expect(source).toHaveAttribute("target", "_blank");
  expect(source.closest("p")).toHaveTextContent("Toteutuksen lähdekoodi löytyy GitHubista.");
  expect(
    screen.getByText("Salli sijaintisi, niin näet kuinka kaukana kukin kenttä sijaitsee."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Paikanna" })).toBeInTheDocument();
  expect(document.cookie).toContain("hoopfinder-visited=1");
  expect(replace).toHaveBeenCalledWith("/?info");
  for (const link of screen.getAllByRole("link", { name: "Etusivu" })) {
    expect(link).toHaveAttribute("href", "/?info");
  }
});
