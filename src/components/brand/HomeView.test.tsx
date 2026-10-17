import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, expect, test, vi } from "vitest";
import { FeedbackProvider } from "@/components/brand/FeedbackDialog";
import { LocaleProvider } from "@/components/brand/LocaleProvider";
import { getCopy } from "@/lib/copy";
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

const copy = getCopy();

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
  const pitch = within(main).getByRole("heading", { name: copy.introTitle });
  const mapLink = within(main).getByRole("link", { name: copy.courtsOnMap });
  const listLink = within(main).getByRole("link", { name: copy.courtsAsList });
  expect(pitch.compareDocumentPosition(mapLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(mapLink).toHaveAttribute("href", "/map");
  expect(listLink).toHaveAttribute("href", "/courts");
  expect(mapLink.parentElement).toHaveClass("grid-cols-2", "sm:flex-nowrap");
  expect(mapLink).toHaveClass("w-full", "py-2.5", "min-[26rem]:text-base");
  expect(listLink).toHaveClass("w-full", "py-2.5", "min-[26rem]:text-base");
  expect(screen.getByText(copy.servicePitch)).toBeInTheDocument();
  const feedback = within(main).getByRole("button", { name: copy.giveFeedback });
  const source = within(main).getByRole("link", { name: copy.introOpenSourceLink });
  expect(feedback.compareDocumentPosition(source) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(source).toHaveAttribute("href", "https://github.com/kirkkala/hoopfinder");
  expect(source).toHaveAttribute("target", "_blank");
  expect(source.closest("p")).toHaveTextContent(
    `${copy.introOpenSource} ${copy.introOpenSourceLink}.`,
  );
  expect(screen.getByText(copy.introLocationBenefit)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: copy.nearMe.idle })).toBeInTheDocument();
  expect(document.cookie).toContain("hoopfinder-visited=1");
  expect(replace).toHaveBeenCalledWith("/?info");
  expect(screen.queryByRole("link", { name: copy.homepage })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: copy.menu }));
  const menuLinks = within(screen.getByRole("navigation", { name: copy.menu })).getAllByRole(
    "link",
  );
  expect(menuLinks[0]).toHaveAccessibleName(copy.homepage);
  expect(menuLinks[0]).toHaveAttribute("href", "/?info");
});
