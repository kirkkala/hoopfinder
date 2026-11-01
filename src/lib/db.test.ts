import { afterEach, beforeEach, expect, test, vi } from "vitest";

const queries: string[] = [];

const postgres = vi.hoisted(() =>
  vi.fn(() => {
    const sql = (strings: TemplateStringsArray) => {
      const text = strings.join(" ").replace(/\s+/g, " ").trim();
      queries.push(text);
      if (text.includes("to_regclass")) return Promise.resolve([{ ready: "feedback_limits" }]);
      return Promise.resolve([]);
    };
    return sql;
  }),
);

vi.mock("postgres", () => ({ default: postgres }));

import { withDb } from "./db";

const globalForDb = globalThis as typeof globalThis & {
  __hoopfinderSql?: unknown;
  __hoopfinderSchema?: unknown;
  __hoopfinderSchemaVersion?: unknown;
  __hoopfinderDbDown?: unknown;
};

const originalDatabaseUrl = process.env.DATABASE_URL;

beforeEach(() => {
  queries.length = 0;
  postgres.mockClear();
  delete globalForDb.__hoopfinderSql;
  delete globalForDb.__hoopfinderSchema;
  delete globalForDb.__hoopfinderSchemaVersion;
  delete globalForDb.__hoopfinderDbDown;
  process.env.DATABASE_URL = "postgres://localhost/hoopfinder";
});

afterEach(() => {
  delete globalForDb.__hoopfinderSql;
  delete globalForDb.__hoopfinderSchema;
  delete globalForDb.__hoopfinderSchemaVersion;
  delete globalForDb.__hoopfinderDbDown;
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
});

test("leaves an existing database unchanged", async () => {
  await expect(withDb(async () => "ok")).resolves.toBe("ok");

  expect(queries).toEqual(["SELECT to_regclass('public.feedback_limits') AS ready"]);
});
