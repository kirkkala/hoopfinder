import { expect, test } from "vitest";
import { formatFetchedAt } from "./time";

test("shows a fetch time in Helsinki, with or without the clock", () => {
  const iso = "2026-01-15T22:30:00.000Z";
  expect(formatFetchedAt(iso)).toBe("16.1.2026 klo 00.30");
  expect(formatFetchedAt(iso, true)).toBe("16.1.2026");
});
