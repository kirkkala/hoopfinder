import { expect, test } from "vitest";
import { getCopy } from "@/lib/copy";
import { editChangeLines } from "./court-edit-summary";

const copy = getCopy();

test("names a hoop height suggestion in the admin's language", () => {
  expect(editChangeLines({ hoopHeight: "official" }, copy)).toEqual([
    { key: "hoopHeight", label: copy.hoopHeight, value: copy.hoopHeights.official },
  ]);
  expect(editChangeLines({ hoopHeight: null }, copy)).toEqual([
    { key: "hoopHeight", label: copy.hoopHeight, value: copy.adminEditRemoved },
  ]);
});

test("lists a renamed visitor court before its other changes", () => {
  expect(editChangeLines({ name: "Puiston kenttä", lighting: "no", website: null }, copy)).toEqual([
    { key: "name", label: copy.addCourtName, value: "Puiston kenttä" },
    { key: "lighting", label: copy.lights, value: copy.no },
    { key: "website", label: copy.website, value: copy.adminEditRemoved },
  ]);
});
