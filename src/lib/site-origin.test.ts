import { expect, test } from "vitest";
import { SITE_URL } from "@/lib/constants";
import { siteOrigin } from "./site-origin";

function headers(values: Record<string, string>) {
  return { get: (name: string) => values[name] ?? null };
}

test("builds the public origin from the forwarded host, and falls back to production", () => {
  expect(
    siteOrigin(
      headers({ "x-forwarded-host": "www.hoopfinder.fi, internal", "x-forwarded-proto": "https" }),
    ),
  ).toBe("https://www.hoopfinder.fi");
  expect(siteOrigin(headers({ host: "localhost:3000" }))).toBe("http://localhost:3000");
  expect(siteOrigin(headers({ host: "127.0.0.1:3000" }))).toBe("http://127.0.0.1:3000");
  expect(siteOrigin(headers({ host: "preview.example" }))).toBe("https://preview.example");
  expect(siteOrigin(headers({}))).toBe(SITE_URL);
});
