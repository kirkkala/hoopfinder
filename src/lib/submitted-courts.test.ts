import { afterEach, beforeEach, expect, test, vi } from "vitest";

const catalog = vi.hoisted(() => ({
  getCourtCatalog: vi.fn(
    async (): Promise<{
      courts: Array<{ lat: number; lon: number }>;
      fetchedAtBySource: Record<string, never>;
    }> => ({
      courts: [],
      fetchedAtBySource: {},
    }),
  ),
}));
const email = vi.hoisted(() => ({
  sendTemplateEmail: vi.fn(),
}));
const db = vi.hoisted(() => ({
  withDb: vi.fn(),
}));

vi.mock("@/lib/catalog", () => catalog);
vi.mock("@/lib/email", () => email);
vi.mock("@/lib/db", () => db);

import { type Court, emptyAmenities } from "./courts";
import {
  applyCourtEdit,
  confirmSubmittedCourt,
  courtAsPublished,
  courtEditChanges,
  courtSubmissionIp,
  createCourtEdit,
  createSubmittedCourt,
  deleteSubmittedCourt,
  getSubmittedCourt,
  listPendingEdits,
  listSubmittedCourts,
  type SubmittedCourtInput,
  SubmittedCourtSchema,
  setSubmittedCourtStatus,
  storedEditChanges,
  updateSubmittedCourt,
} from "./submitted-courts";

const helsinki = { lat: 60.1699, lon: 24.9384 };

function input(overrides: Partial<SubmittedCourtInput> = {}): SubmittedCourtInput {
  return {
    name: "Kallio",
    address: "Helsinginkatu 1",
    email: "visitor@example.com",
    ...helsinki,
    ...overrides,
  } as SubmittedCourtInput;
}

type Sql = ((strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown>) & {
  json: (value: unknown) => unknown;
};

function fakeSql(steps: Array<(values: unknown[]) => unknown>) {
  const queries: string[] = [];
  const bound: unknown[][] = [];
  let index = 0;
  const sql = Object.assign(
    async (strings: TemplateStringsArray, ...values: unknown[]) => {
      queries.push(strings.join(" "));
      bound.push(values);
      const step = steps[index];
      index += 1;
      return step ? step(values) : [];
    },
    { json: (value: unknown) => value },
  ) as Sql;
  return { sql, queries, bound };
}

const scripts: Array<null | ReturnType<typeof fakeSql>> = [];

beforeEach(() => {
  vi.clearAllMocks();
  scripts.length = 0;
  catalog.getCourtCatalog.mockResolvedValue({ courts: [], fetchedAtBySource: {} });
  email.sendTemplateEmail.mockResolvedValue({ id: "email_1" });
  db.withDb.mockImplementation(async (fn: (sql: Sql) => Promise<unknown>) => {
    const next = scripts.shift();
    if (next === undefined) throw new Error("unexpected database call");
    if (next === null) return null;
    return fn(next.sql);
  });
  vi.stubEnv("ADMIN_EMAILS", "admin@example.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

test("normalizes a submission and rejects values outside the allowed range", () => {
  const parsed = SubmittedCourtSchema.safeParse({
    ...input(),
    email: " Visitor@Example.com ",
    website: "  ",
    constructionYear: 1999,
  });
  expect(parsed.success && parsed.data.email).toBe("visitor@example.com");
  expect(parsed.success && parsed.data.website).toBeNull();

  expect(SubmittedCourtSchema.safeParse(input({ name: "  " })).success).toBe(false);
  expect(SubmittedCourtSchema.safeParse(input({ constructionYear: 1849 })).success).toBe(false);
  expect(SubmittedCourtSchema.safeParse(input({ constructionYear: 2101 })).success).toBe(false);
  expect(SubmittedCourtSchema.safeParse(input({ lengthM: 0 })).success).toBe(false);
  expect(SubmittedCourtSchema.safeParse(input({ lengthM: 201 })).success).toBe(false);
  expect(SubmittedCourtSchema.safeParse(input({ greeting: "x".repeat(1001) })).success).toBe(false);
});

test("reads the visitor address from the first forwarded hop", () => {
  const request = new Request("http://localhost/api/submitted-courts", {
    headers: { "x-forwarded-for": " 203.0.113.5, 10.0.0.1 " },
  });
  expect(courtSubmissionIp(request)).toBe("203.0.113.5");
  expect(courtSubmissionIp(new Request("http://localhost/api/submitted-courts"))).toBe("unknown");
});

test("hides a submitted pin once a catalog court covers that spot", async () => {
  catalog.getCourtCatalog.mockResolvedValue({
    courts: [{ lat: helsinki.lat, lon: helsinki.lon }],
    fetchedAtBySource: {},
  });
  scripts.push(
    fakeSql([
      () => [
        {
          id: 10014,
          name: "Kallio",
          address: "Helsinginkatu 1",
          ...helsinki,
          status: "pending",
          created_at: "2026-01-01T00:00:00.000Z",
          details: {},
        },
      ],
    ]),
  );

  await expect(listSubmittedCourts()).resolves.toEqual([]);
});

test("maps published, confirmed, and unconfirmed rows onto the map list", async () => {
  scripts.push(
    fakeSql([
      () => [
        row({
          id: 10014,
          status: "published",
          details: { status: "out-of-service-temporarily", lighting: "yes" },
        }),
        row({ id: 10015, status: "pending", details: { freeUse: "no" } }),
        row({ id: 10016, status: "unconfirmed" }),
        row({ id: 10017, status: "anything-else" }),
        row({ id: 10018, status: "published", details: { editOf: "1", lighting: "no" } }),
      ],
    ]),
  );

  const courts = await listSubmittedCourts();
  expect(courts.map((court) => [court.id, court.source, court.status])).toEqual([
    ["submitted-10014", "submitted", "out-of-service-temporarily"],
    ["submitted-10015", "pending", "pending"],
    ["submitted-10016", "pending", "pending"],
    ["submitted-10017", "pending", "pending"],
  ]);
  expect(courts[0]?.amenities.lighting).toBe(true);
  expect(courts[1]?.amenities.freeUse).toBe(false);
  expect(courts[1] && "emailConfirmed" in courts[1] && courts[1].emailConfirmed).toBe(true);
  expect(courts[2] && "emailConfirmed" in courts[2] && courts[2].emailConfirmed).toBe(false);
  expect(courts[3] && "emailConfirmed" in courts[3] && courts[3].emailConfirmed).toBe(true);
});

test("refuses a pin outside Finland or on top of a catalog court before writing a row", async () => {
  await expect(
    createSubmittedCourt(input({ lat: 59.3293, lon: 18.0686 }), "https://www.hoopfinder.fi"),
  ).resolves.toEqual({ error: "outside-finland" });

  catalog.getCourtCatalog.mockResolvedValue({
    courts: [helsinki],
    fetchedAtBySource: {},
  });
  await expect(createSubmittedCourt(input(), "https://www.hoopfinder.fi")).resolves.toEqual({
    error: "too-close",
  });
  expect(db.withDb).not.toHaveBeenCalled();
});

test("blocks a second unconfirmed pin on the same spot, and a confirmed pin within 80 m", async () => {
  const sameSpot = fakeSql([() => [row({ ...shift(0.00005), status: "unconfirmed" })]]);
  scripts.push(sameSpot);
  await expect(createSubmittedCourt(input(), "https://www.hoopfinder.fi")).resolves.toEqual({
    error: "too-close",
  });
  expect(sameSpot.queries).toHaveLength(1);

  const nearbyConfirmed = fakeSql([() => [row({ ...shift(0.0004), status: "pending" })]]);
  scripts.push(nearbyConfirmed);
  await expect(createSubmittedCourt(input(), "https://www.hoopfinder.fi")).resolves.toEqual({
    error: "too-close",
  });
});

test("sends the confirmation link, and deletes the row when that mail does not go out", async () => {
  const created = fakeSql([() => [], () => [row({ status: "unconfirmed" })]]);
  const removed = fakeSql([() => []]);
  scripts.push(created, removed);
  email.sendTemplateEmail.mockResolvedValueOnce({ error: "failed" });

  await expect(createSubmittedCourt(input(), "https://www.hoopfinder.fi")).resolves.toEqual({
    error: "email",
  });
  expect(email.sendTemplateEmail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "visitor@example.com",
      template: "hoop-add-confirmation-link",
      variables: expect.objectContaining({
        COURT_ADD_CONFIRMATION_LINK: expect.stringMatching(
          /^https:\/\/www\.hoopfinder\.fi\/add\/confirm\/[\w-]{20,128}$/,
        ),
      }),
    }),
  );
  expect(removed.queries[0]).toContain("DELETE");
});

test("returns the new pin after the confirmation mail is accepted", async () => {
  scripts.push(fakeSql([() => [], () => [row({ status: "unconfirmed" })]]));

  const result = await createSubmittedCourt(input(), "https://www.hoopfinder.fi");
  expect(result).toMatchObject({
    court: { id: "submitted-10014", source: "pending", emailConfirmed: false },
  });
});

test("ignores a confirmation token with the wrong shape", async () => {
  await expect(confirmSubmittedCourt("short", "https://www.hoopfinder.fi")).resolves.toBeNull();
  await expect(
    confirmSubmittedCourt("a".repeat(129), "https://www.hoopfinder.fi"),
  ).resolves.toBeNull();
  expect(db.withDb).not.toHaveBeenCalled();
});

test("confirms a court once, tells the admins, and undoes it when that mail fails", async () => {
  const token = "a".repeat(32);
  scripts.push(
    fakeSql([
      () => [
        { id: 10014, name: "Kallio", email: "visitor@example.com", previous_status: "unconfirmed" },
      ],
    ]),
  );
  const undone = fakeSql([() => []]);
  scripts.push(undone);
  email.sendTemplateEmail.mockResolvedValueOnce({ error: "failed" });

  await expect(confirmSubmittedCourt(token, "https://www.hoopfinder.fi")).resolves.toEqual({
    error: "email",
  });
  expect(email.sendTemplateEmail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: ["admin@example.com"],
      template: "admin-verification-notification",
    }),
  );
  expect(undone.queries[0]).toContain("unconfirmed");
});

test("a confirmation link opened after publish leaves the correction published", async () => {
  scripts.push(
    fakeSql([
      () => [
        { id: 10014, name: "Kallio", email: "visitor@example.com", previous_status: "published" },
      ],
    ]),
  );

  await expect(confirmSubmittedCourt("c".repeat(32), "https://www.hoopfinder.fi")).resolves.toBe(
    "submitted-10014",
  );
  expect(email.sendTemplateEmail).not.toHaveBeenCalled();
});

test("does not send another admin mail when the link was already opened", async () => {
  scripts.push(
    fakeSql([
      () => [
        { id: 10014, name: "Kallio", email: "visitor@example.com", previous_status: "pending" },
      ],
    ]),
  );

  await expect(confirmSubmittedCourt("b".repeat(32), "https://www.hoopfinder.fi")).resolves.toBe(
    "submitted-10014",
  );
  expect(email.sendTemplateEmail).not.toHaveBeenCalled();
});

test("rolls a published court back when the visitor mail fails, and skips mail when unpublishing", async () => {
  const published = fakeSql([
    () => [
      {
        ...row({ status: "published" }),
        email: "visitor@example.com",
        previous_status: "pending",
      },
    ],
  ]);
  const restored = fakeSql([() => []]);
  scripts.push(published, restored);
  email.sendTemplateEmail.mockResolvedValueOnce({ error: "unconfigured" });

  await expect(
    setSubmittedCourtStatus("submitted-10014", "published", "https://www.hoopfinder.fi"),
  ).resolves.toEqual({ error: "email" });
  expect(email.sendTemplateEmail).toHaveBeenCalledWith(
    expect.objectContaining({
      template: "hoop-add-confirmed",
      variables: {
        PUBLISHED_COURT_URL: "https://www.hoopfinder.fi/koripallokentat/muu/s10014",
      },
    }),
  );
  expect(restored.bound[0]).toContain("pending");

  scripts.push(
    fakeSql([
      () => [
        {
          ...row({ status: "pending" }),
          email: "visitor@example.com",
          previous_status: "published",
        },
      ],
    ]),
  );
  email.sendTemplateEmail.mockClear();
  const unpublished = await setSubmittedCourtStatus(
    "10014",
    "pending",
    "https://www.hoopfinder.fi",
  );
  expect(unpublished).toMatchObject({ court: { source: "pending" } });
  expect(email.sendTemplateEmail).not.toHaveBeenCalled();
});

test("keeps the construction year and surface note across an admin edit", async () => {
  let saved: unknown;
  scripts.push(
    fakeSql([
      () => [
        {
          id: 10014,
          details: {
            constructionYear: 1970,
            surfaceMaterialInfo: "hiekka",
            greeting: "old",
          },
        },
      ],
      (values) => {
        saved = values[3];
        return [{ id: 10014 }];
      },
    ]),
  );

  await expect(
    updateSubmittedCourt("submitted-10014", {
      ...input(),
      constructionYear: 1999,
      surfaceMaterialInfo: "asfaltti",
      greeting: "thanks",
    }),
  ).resolves.toEqual({ ok: true });

  expect(saved).toMatchObject({
    constructionYear: 1970,
    surfaceMaterialInfo: "hiekka",
    greeting: "thanks",
  });
  await expect(updateSubmittedCourt("nope", input())).resolves.toEqual({ error: "not-found" });
  await expect(deleteSubmittedCourt("nope")).resolves.toEqual({ error: "not-found" });
  await expect(getSubmittedCourt("nope")).resolves.toBeNull();
});

test("reports the database as down when the connection is missing", async () => {
  scripts.push(null);
  await expect(createSubmittedCourt(input(), "https://www.hoopfinder.fi")).resolves.toEqual({
    error: "unavailable",
  });
  scripts.push(null);
  await expect(
    setSubmittedCourtStatus("10014", "published", "https://www.hoopfinder.fi"),
  ).resolves.toEqual({
    error: "unavailable",
  });
  scripts.push(null);
  await expect(deleteSubmittedCourt("10014")).resolves.toEqual({ error: "unavailable" });
});

test("a catalog court can only change hoop height, whatever else is sent", () => {
  const court = sampleCourt({ amenities: { ...emptyAmenities(), lighting: true } });
  expect(
    courtEditChanges(court, {
      name: "Something else",
      details: { lighting: "no", website: "https://nope.fi", hoopHeight: "lower" },
    }),
  ).toEqual({ hoopHeight: "lower" });
  expect(courtEditChanges(court, { details: { lighting: "no" } })).toBeNull();
  expect(
    courtEditChanges(sampleCourt({ amenities: { ...emptyAmenities(), hoopHeight: "lower" } }), {
      details: { hoopHeight: "lower" },
    }),
  ).toBeNull();
});

test("a stored hoop-height correction keeps only that fact", () => {
  expect(
    storedEditChanges({
      editOf: "82621",
      hoopHeight: "official",
      publishedAt: "2026-11-06T00:00:00.000Z",
    }),
  ).toEqual({ hoopHeight: "official" });
  expect(storedEditChanges({ editOf: "82621", hoopHeight: "" })).toEqual({ hoopHeight: null });
});

test("a visitor court keeps only the facts that changed, including the name", () => {
  const court = sampleCourt({
    id: "submitted-10014",
    source: "submitted",
    status: "active",
    website: "https://example.fi",
    comment: "Two hoops",
    amenities: { ...emptyAmenities(), lighting: true, freeUse: true },
  });
  const same = {
    courtStatus: "active",
    lighting: "yes",
    freeUse: "yes",
    website: "https://example.fi",
    comment: "Two hoops",
  };

  expect(
    courtEditChanges(court, { name: "Kallio", address: "Testikatu 1", details: same }),
  ).toBeNull();
  expect(
    courtEditChanges(court, {
      name: "Uusi nimi",
      details: { ...same, lighting: "no", website: "", comment: "One hoop" },
    }),
  ).toEqual({
    name: "Uusi nimi",
    lighting: "no",
    website: null,
    comment: "One hoop",
  });
  expect(court.lat).toBe(helsinki.lat);
});

test("a published correction changes only the facts it names", () => {
  const court = sampleCourt({
    comment: "Two hoops",
    website: "https://example.fi",
    amenities: { ...emptyAmenities(), lighting: true },
  });

  const shown = applyCourtEdit(court, {
    editOf: "1",
    lighting: "no",
    website: null,
    hoopHeight: "lower",
    name: "Uusi nimi",
  });
  expect(shown.amenities.lighting).toBe(false);
  expect(shown.amenities.hoopHeight).toBe("lower");
  expect(shown.website).toBeNull();
  expect(shown.comment).toBe("Two hoops");
  expect(shown.name).toBe("Uusi nimi");
  expect(shown.lat).toBe(court.lat);
  expect(shown.status).toBe("active");
});

test("later published corrections win, and a submission underneath stays", async () => {
  const court = sampleCourt();
  scripts.push(
    fakeSql([
      () => [
        row({ status: "published", details: { comment: "From a submission", lighting: "yes" } }),
      ],
    ]),
  );
  scripts.push(
    fakeSql([
      () => [
        row({
          id: 3,
          created_at: "2026-01-01T00:00:00.000Z",
          details: { editOf: "1", lighting: "yes", publishedAt: "2026-02-01T00:00:00.000Z" },
        }),
        row({
          id: 4,
          created_at: "2026-01-02T00:00:00.000Z",
          details: { editOf: "1", lighting: "no", publishedAt: "2026-03-01T00:00:00.000Z" },
        }),
      ],
    ]),
  );

  const shown = await courtAsPublished(court);
  expect(shown.comment).toBe("From a submission");
  expect(shown.amenities.lighting).toBe(false);
});

test("sends the edit link and replaces an unconfirmed suggestion from the same email", async () => {
  const court = sampleCourt();
  const replaced = fakeSql([
    () => [{ id: 9, confirmation_token: "old-token", details: { editOf: "1", lighting: "yes" } }],
    (values) => {
      expect(values).toContainEqual(expect.objectContaining({ editOf: "1", freeUse: "no" }));
      return [{ id: 9 }];
    },
  ]);
  scripts.push(replaced);

  await expect(
    createCourtEdit(court, "visitor@example.com", { freeUse: "no" }, "https://www.hoopfinder.fi"),
  ).resolves.toEqual({ ok: true });
  expect(email.sendTemplateEmail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: "visitor@example.com",
      template: "hoop-edit-confirmation-link",
      variables: expect.objectContaining({
        COURT_NAME: "Kallio",
        COURT_EDIT_CONFIRMATION_LINK: expect.stringMatching(
          /^https:\/\/www\.hoopfinder\.fi\/edit\/confirm\/[\w-]{20,128}$/,
        ),
      }),
    }),
  );
  expect(replaced.queries[1]).toContain("UPDATE");
});

test("drops a new suggestion when the edit mail does not go out, and restores a replaced one", async () => {
  const court = sampleCourt();
  scripts.push(fakeSql([() => [], () => [{ id: 10 }]]));
  const removed = fakeSql([() => []]);
  scripts.push(removed);
  email.sendTemplateEmail.mockResolvedValueOnce({ error: "failed" });

  await expect(
    createCourtEdit(court, "visitor@example.com", { lighting: "yes" }, "https://www.hoopfinder.fi"),
  ).resolves.toEqual({ error: "email" });
  expect(removed.queries[0]).toContain("DELETE");

  const previous = { editOf: "1", lighting: "yes" };
  scripts.push(
    fakeSql([
      () => [{ id: 9, confirmation_token: "old-token", details: previous }],
      () => [{ id: 9 }],
    ]),
  );
  const restored = fakeSql([() => []]);
  scripts.push(restored);
  email.sendTemplateEmail.mockResolvedValueOnce({ error: "failed" });

  await expect(
    createCourtEdit(court, "visitor@example.com", { lighting: "no" }, "https://www.hoopfinder.fi"),
  ).resolves.toEqual({ error: "email" });
  expect(restored.queries[0]).toContain("UPDATE");
  expect(restored.bound[0]).toContain("old-token");
  expect(restored.bound[0]).toContain(previous);
});

test("an admin correction is stored as published without a confirmation email", async () => {
  const court = sampleCourt();
  scripts.push(fakeSql([() => [{ id: 21 }]]));
  scripts.push(
    fakeSql([
      () => [
        {
          ...row({ status: "published", details: { editOf: "1", hoopHeight: "official" } }),
          email: "admin@example.com",
          previous_status: "pending",
        },
      ],
      () => [],
    ]),
  );

  await expect(
    createCourtEdit(
      court,
      "admin@example.com",
      { hoopHeight: "official" },
      "https://www.hoopfinder.fi",
      { publish: true },
    ),
  ).resolves.toEqual({ ok: true });
  expect(email.sendTemplateEmail).not.toHaveBeenCalled();
});

test("publishing a correction skips the new-court mail and stamps the publish time", async () => {
  const published = fakeSql([
    () => [
      {
        ...row({ status: "published", details: { editOf: "1", lighting: "no" } }),
        email: "visitor@example.com",
        previous_status: "pending",
      },
    ],
    () => [],
  ]);
  scripts.push(published);

  await expect(
    setSubmittedCourtStatus("9", "published", "https://www.hoopfinder.fi"),
  ).resolves.toMatchObject({ court: { id: "submitted-10014" } });
  expect(email.sendTemplateEmail).not.toHaveBeenCalled();
  expect(published.bound[1]?.[0]).toEqual(
    expect.objectContaining({ publishedAt: expect.any(String) }),
  );
  expect(published.queries).toHaveLength(2);
});

test("publishing a visitor-court correction writes the name onto that court and leaves the pin", async () => {
  const published = fakeSql([
    () => [
      {
        ...row({
          status: "published",
          details: { editOf: "submitted-10014", name: "Uusi nimi", lighting: "no" },
        }),
        email: "visitor@example.com",
        previous_status: "pending",
      },
    ],
    () => [],
    (values) => {
      expect(values).toContain("Uusi nimi");
      expect(values).toContainEqual({ lighting: "no" });
      return [];
    },
  ]);
  scripts.push(published);

  await expect(
    setSubmittedCourtStatus("9", "published", "https://www.hoopfinder.fi"),
  ).resolves.toMatchObject({ court: { id: "submitted-10014" } });
  expect(published.queries[2]).toContain("UPDATE");
  expect(published.queries[2]).not.toContain("lat");
});

test("an unconfirmed correction is listed for the admin to publish", async () => {
  const listed = fakeSql([
    () => [
      {
        id: 21,
        email: "visitor@example.com",
        status: "unconfirmed",
        details: { hoopHeight: "official", editOf: "l82621" },
      },
    ],
  ]);
  scripts.push(listed);

  await expect(listPendingEdits("l82621")).resolves.toEqual([
    {
      id: "21",
      email: "visitor@example.com",
      status: "unconfirmed",
      changes: { hoopHeight: "official" },
    },
  ]);
  expect(listed.queries[0]).toContain("unconfirmed");
});

function sampleCourt(overrides: Partial<Court> = {}): Court {
  return {
    id: "1",
    source: "lipas",
    name: "Kallio",
    nameFi: "Kallio",
    status: "active",
    address: "Testikatu 1",
    postalCode: null,
    city: "Helsinki",
    neighborhood: null,
    lat: helsinki.lat,
    lon: helsinki.lon,
    comment: null,
    website: null,
    constructionYear: null,
    owner: null,
    admin: null,
    amenities: emptyAmenities(),
    ...overrides,
  };
}

function shift(latDelta: number) {
  return { lat: helsinki.lat + latDelta, lon: helsinki.lon };
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 10014,
    name: "Kallio",
    address: "Helsinginkatu 1",
    ...helsinki,
    status: "pending",
    created_at: "2026-01-02T00:00:00.000Z",
    details: {},
    ...overrides,
  };
}
