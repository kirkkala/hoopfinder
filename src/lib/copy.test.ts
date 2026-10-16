import { expect, test } from "vitest";
import { COURT_PHOTO_MAX_BYTES } from "@/lib/constants";
import { getCopy } from "@/lib/copy";

test("photo size copy follows the upload limit", () => {
  const megabytes = COURT_PHOTO_MAX_BYTES / (1024 * 1024);
  expect(getCopy("fi").photoTooLarge).toBe(`Kuva on liian suuri. Enimmäiskoko on ${megabytes} Mt.`);
  expect(getCopy("en").photoTooLarge).toBe(
    `That photo is too large. Maximum size is ${megabytes} MB.`,
  );
});
