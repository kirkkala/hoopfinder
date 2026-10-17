import { afterEach, expect, test } from "vitest";
import { clearObsoleteStorage, clearVisited, homeEntryTarget, markVisited } from "@/lib/visit";

afterEach(() => {
  localStorage.clear();
  clearVisited();
});

test("clears the old intro flag and leaves other storage alone", () => {
  localStorage.setItem("hoopfinder-intro-seen", "1");
  localStorage.setItem("hoopfinder-locale", "en");
  localStorage.setItem("hoopfinder-map-view", '{"lat":60}');

  clearObsoleteStorage();

  expect(localStorage.getItem("hoopfinder-intro-seen")).toBeNull();
  expect(localStorage.getItem("hoopfinder-locale")).toBe("en");
  expect(localStorage.getItem("hoopfinder-map-view")).toBe('{"lat":60}');
});

test("remembers a visit in a cookie", () => {
  expect(document.cookie).not.toContain("hoopfinder-visited=1");
  markVisited();
  expect(document.cookie).toContain("hoopfinder-visited=1");
});

test("sends a returning visitor to the map and keeps an explicit about visit", () => {
  expect(
    homeEntryTarget({ visited: false, showHome: false, court: null, thanks: false }),
  ).toBeNull();
  expect(homeEntryTarget({ visited: true, showHome: true, court: null, thanks: false })).toBeNull();
  expect(homeEntryTarget({ visited: true, showHome: false, court: null, thanks: false })).toEqual({
    href: "/map",
    permanent: false,
  });
});

test("sends old map links to the map", () => {
  expect(
    homeEntryTarget({
      visited: false,
      showHome: false,
      court: "submitted-10014",
      thanks: true,
    }),
  ).toEqual({
    href: "/map?court=submitted-10014&thanks=1",
    permanent: true,
  });
  expect(homeEntryTarget({ visited: true, showHome: true, court: null, thanks: true })).toEqual({
    href: "/map?thanks=1",
    permanent: true,
  });
});
