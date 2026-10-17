import { expect, test } from "vitest";
import { APP_VERSION } from "@/lib/constants";
import { cityOgHref, defaultOgImage, homeOgHref, siteOpenGraph } from "@/lib/og";

test("the default share card uses the site title and the home image", () => {
  const graph = siteOpenGraph();
  expect(graph?.title).toBe("Kaikki Suomen koripallokentät");
  expect(graph?.images).toEqual([defaultOgImage()]);
  expect(defaultOgImage().url).toBe(homeOgHref());
});

test("a city share image is addressed by the city slug and court count", () => {
  expect(cityOgHref("helsinki", 265)).toBe(
    `/images/og/city/helsinki?v=${encodeURIComponent(APP_VERSION)}&n=265`,
  );
});
