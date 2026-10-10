import { beforeEach, expect, test } from "vitest";
import { readOrigin, writeOrigin } from "./origin";

beforeEach(() => {
  sessionStorage.clear();
});

test("stores a location for the tab and ignores a broken or incomplete value", () => {
  expect(readOrigin()).toBeNull();

  writeOrigin({ lat: 60.17, lon: 24.94 });
  expect(readOrigin()).toEqual({ lat: 60.17, lon: 24.94 });

  sessionStorage.setItem("hoopfinder-origin", "{");
  expect(readOrigin()).toBeNull();

  sessionStorage.setItem("hoopfinder-origin", JSON.stringify({ lat: "north", lon: 24 }));
  expect(readOrigin()).toBeNull();
});
