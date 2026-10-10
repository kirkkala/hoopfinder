import { expect, test } from "vitest";
import { isInFinland } from "./finland";

test("accepts mainland Finland and Åland, and rejects the southeast leak and Sweden", () => {
  expect(isInFinland(60.1699, 24.9384)).toBe(true);
  expect(isInFinland(61.4978, 23.761)).toBe(true);
  expect(isInFinland(60.097, 19.935)).toBe(true);

  expect(isInFinland(60.4, 29.2)).toBe(false);
  expect(isInFinland(59.3293, 18.0686)).toBe(false);
});
