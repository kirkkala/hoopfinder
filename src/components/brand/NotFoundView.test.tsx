import { render, screen } from "@testing-library/react";
import { beforeAll, expect, test, vi } from "vitest";
import { FeedbackProvider } from "@/components/brand/FeedbackDialog";
import { LocaleProvider } from "@/components/brand/LocaleProvider";
import { getCopy } from "@/lib/copy";
import { NotFoundView } from "./NotFoundView";

const copy = getCopy();

vi.mock("next/navigation", () => ({
  usePathname: () => "/missing",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));

beforeAll(() => {
  if (!("ResizeObserver" in globalThis)) {
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserver);
  }
});

test("the missing page sends the visitor to the homepage", () => {
  render(
    <LocaleProvider>
      <FeedbackProvider>
        <NotFoundView fetchedAtBySource={{}} />
      </FeedbackProvider>
    </LocaleProvider>,
  );

  expect(screen.getByRole("link", { name: copy.toHomepage })).toHaveAttribute("href", "/?info");
});
