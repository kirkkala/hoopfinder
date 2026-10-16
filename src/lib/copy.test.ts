import { expect, test } from "vitest";
import { COURT_PHOTO_MAX_BYTES } from "@/lib/constants";
import { DEFAULT_LOCALE, getCopy, isLocale, LOCALES } from "@/lib/copy";

function messageShape(value: unknown, path = "copy"): unknown {
  if (typeof value === "string") {
    if (value.trim() === "") throw new Error(`${path} is empty`);
    return "string";
  }
  if (typeof value === "function") return "function";
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, messageShape(child, `${path}.${key}`)]),
    );
  }
  throw new Error(`${path} is ${typeof value}`);
}

test("Finnish is the default locale, and English is separate", () => {
  expect(LOCALES).toEqual(["fi", "en"]);
  expect(DEFAULT_LOCALE).toBe("fi");
  expect(getCopy().locale).toBe("fi");
  expect(getCopy("en").locale).toBe("en");
  expect(isLocale("fi")).toBe(true);
  expect(isLocale("en")).toBe(true);
  expect(isLocale("sv")).toBe(false);
  expect(isLocale(null)).toBe(false);
  expect(getCopy("fi").appName).not.toBe(getCopy("en").appName);
});

test("both locales resolve the same messages", () => {
  expect(messageShape(getCopy("fi"))).toEqual(messageShape(getCopy("en")));
});

test("interpolated copy includes the value it is given", () => {
  const megabytes = String(COURT_PHOTO_MAX_BYTES / (1024 * 1024));
  for (const locale of LOCALES) {
    const copy = getCopy(locale);
    expect(copy.photoTooLarge).toContain(megabytes);
    expect(copy.padCount(4)).toContain("4");
    expect(copy.addCourtMissing("nimi")).toContain("nimi");
    expect(copy.listedCourtCount(12)).toContain("12");
  }
});
