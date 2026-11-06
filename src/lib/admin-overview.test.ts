import { expect, test } from "vitest";
import { adminOverview } from "./admin-overview";

test("counts feedback, photos, visitor courts, and each edit state", () => {
  expect(
    adminOverview({
      feedback: [{ id: "1" }, { id: "2" }],
      photos: [{ photoCount: 2 }, { photoCount: 1 }],
      courts: [
        { editOf: null, status: "published" },
        { editOf: null, status: "unconfirmed" },
        { editOf: "l1", status: "unconfirmed" },
        { editOf: "l1", status: "pending" },
        { editOf: "l2", status: "published" },
      ],
    }),
  ).toEqual({
    feedback: 2,
    photos: 3,
    photoCourts: 2,
    courts: 2,
    edits: { unconfirmed: 1, pending: 1, published: 1 },
  });
});

test("leaves a missing source uncounted", () => {
  expect(adminOverview({ feedback: null, photos: null, courts: null })).toEqual({
    feedback: null,
    photos: null,
    photoCourts: null,
    courts: null,
    edits: null,
  });
});
