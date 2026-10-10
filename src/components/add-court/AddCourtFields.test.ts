import { expect, test } from "vitest";
import { getCopy } from "@/lib/copy";
import { type Court, emptyAmenities } from "@/lib/courts";
import {
  addCourtDetailsDirty,
  addCourtDetailsFromCourt,
  addCourtDetailsPayload,
  addCourtFormPayload,
  EMPTY_ADD_COURT_DETAILS,
  requiredFieldIssues,
} from "./AddCourtFields";

const copy = getCopy("fi");

function court(overrides: Partial<Court> = {}): Court {
  return {
    id: "82547",
    source: "lipas",
    name: "Brahe",
    nameFi: "Brahenkenttä",
    status: "active",
    address: null,
    postalCode: null,
    city: null,
    neighborhood: null,
    lat: 60.17,
    lon: 24.94,
    comment: null,
    website: null,
    constructionYear: null,
    owner: null,
    admin: null,
    amenities: emptyAmenities(),
    ...overrides,
  };
}

test("flags a blank name or address, and an email only when it is not a real address", () => {
  expect(requiredFieldIssues({ name: "  ", address: "Helsinginkatu 1", email: "a@b.fi" })).toEqual({
    name: true,
    address: false,
    email: false,
  });
  expect(requiredFieldIssues({ name: "Kallio", address: " ", email: "not-an-email" }).email).toBe(
    true,
  );
  expect(requiredFieldIssues({ name: "Kallio", address: "Katu 1", email: " A@B.fi " }).email).toBe(
    false,
  );
});

test("asks for the empty fields, and treats a filled but invalid email separately", () => {
  const details = EMPTY_ADD_COURT_DETAILS;
  expect(addCourtFormPayload(copy, { name: " ", address: "", email: "", details })).toBe(
    copy.addCourtMissing([copy.addCourtName, copy.addCourtAddress, copy.addCourtEmail].join(", ")),
  );
  expect(
    addCourtFormPayload(copy, {
      name: "Kallio",
      address: "Katu 1",
      email: "not-an-email",
      details,
    }),
  ).toBe(copy.addCourtInvalid);
});

test("accepts a Finnish decimal comma and rejects a length over 200 m", () => {
  const details = { ...EMPTY_ADD_COURT_DETAILS, lengthM: "12,5", widthM: " ", areaM2: "." };
  const payload = addCourtDetailsPayload(details);
  expect(payload).toMatchObject({ lengthM: 12.5, widthM: null, areaM2: null, website: null });

  expect(addCourtDetailsPayload({ ...EMPTY_ADD_COURT_DETAILS, lengthM: "201" })).toBe("invalid");
  expect(addCourtDetailsPayload({ ...EMPTY_ADD_COURT_DETAILS, lengthM: "0" })).toBe("invalid");
  expect(
    addCourtFormPayload(copy, {
      name: "Kallio",
      address: "Katu 1",
      email: "a@b.fi",
      details: { ...EMPTY_ADD_COURT_DETAILS, areaM2: "20001" },
    }),
  ).toBe(copy.addCourtMeasure);
});

test("sends one surface code and treats an untouched form as clean", () => {
  expect(addCourtDetailsDirty(EMPTY_ADD_COURT_DETAILS)).toBe(false);
  const details = {
    ...EMPTY_ADD_COURT_DETAILS,
    surfaceMaterial: "asphalt" as const,
    website: "  ",
  };
  expect(addCourtDetailsDirty(details)).toBe(true);
  expect(addCourtDetailsPayload(details)).toMatchObject({
    surfaceMaterial: ["asphalt"],
    website: null,
  });
});

test("refills the form from a court and drops codes the form does not offer", () => {
  const details = addCourtDetailsFromCourt(
    court({
      status: "pending",
      reportedStatus: "active",
      owner: "not-a-real-owner",
      amenities: {
        ...emptyAmenities(),
        lighting: true,
        freeUse: false,
        surfaceMaterial: ["tartan"],
        fieldType: "2 hoops",
        lengthM: 28,
      },
    }),
  );

  expect(details.courtStatus).toBe("active");
  expect(details.owner).toBe("");
  expect(details.lighting).toBe("yes");
  expect(details.freeUse).toBe("no");
  expect(details.surfaceMaterial).toBe("");
  expect(details.fieldType).toBe("");
  expect(details.lengthM).toBe("28");

  expect(
    addCourtDetailsFromCourt(
      court({ status: "active", reportedStatus: "out-of-service-temporarily" }),
    ).courtStatus,
  ).toBe("active");
});
