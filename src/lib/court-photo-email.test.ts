import { beforeEach, expect, test } from "vitest";
import { readPhotoEmail, rememberPhotoEmail } from "./court-photo-email";

beforeEach(() => {
  localStorage.clear();
});

test("keeps the email from a saved photo and ignores a broken value", () => {
  expect(readPhotoEmail()).toBe("");

  rememberPhotoEmail("  Player@Example.com ");
  expect(readPhotoEmail()).toBe("Player@Example.com");

  localStorage.setItem("hoopfinder-photo-email", "not-an-email");
  expect(readPhotoEmail()).toBe("");

  localStorage.clear();
  rememberPhotoEmail("nope");
  expect(localStorage.getItem("hoopfinder-photo-email")).toBeNull();
});
