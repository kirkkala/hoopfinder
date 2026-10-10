import { expect, test } from "vitest";
import { FeedbackNotesSchema, FeedbackSchema, isBotFeedback } from "./feedback";

test("accepts a message with a reply address and strips extra fields", () => {
  expect(
    FeedbackSchema.parse({
      title: " Bugi kartalla ",
      body: " Zoomaus hyppää. ",
      email: " A@B.fi ",
      notes: "should not stick",
    }),
  ).toEqual({
    title: "Bugi kartalla",
    body: "Zoomaus hyppää.",
    email: "a@b.fi",
    company: "",
  });
});

test("lets the email stay empty and treats a filled honeypot as a bot", () => {
  expect(FeedbackSchema.parse({ title: "Hei", body: "Kiitos", email: "  " })).toMatchObject({
    email: "",
    company: "",
  });
  expect(FeedbackSchema.parse({ title: "Hei", body: "Kiitos" }).email).toBe("");
  expect(isBotFeedback("")).toBe(false);
  expect(isBotFeedback("   ")).toBe(false);
  expect(isBotFeedback("Acme")).toBe(true);
});

test("rejects a missing message, a bad address, and notes that are too long", () => {
  expect(FeedbackSchema.safeParse({ title: "  ", body: "Hei", email: "" }).success).toBe(false);
  expect(FeedbackSchema.safeParse({ title: "Hei", body: "", email: "" }).success).toBe(false);
  expect(FeedbackSchema.safeParse({ title: "Hei", body: "Joo", email: "ei-osoite" }).success).toBe(
    false,
  );
  expect(FeedbackNotesSchema.safeParse({ notes: "x".repeat(4001) }).success).toBe(false);
  expect(FeedbackNotesSchema.parse({ notes: "  Vastasin sähköpostilla.  " }).notes).toBe(
    "Vastasin sähköpostilla.",
  );
});
