import postgres from "postgres";

type Sql = postgres.Sql;

const SCHEMA_VERSION = 3;

const globalForDb = globalThis as typeof globalThis & {
  __hoopfinderSql?: Sql;
  __hoopfinderSchema?: Promise<void>;
  __hoopfinderSchemaVersion?: number;
};

export function getSql(): Sql | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!globalForDb.__hoopfinderSql) {
    globalForDb.__hoopfinderSql = postgres(url, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
    });
  }
  return globalForDb.__hoopfinderSql;
}

export async function withDb<T>(
  fn: (sql: Sql) => Promise<T>,
): Promise<T | null> {
  const sql = getSql();
  if (!sql) return null;
  if (
    !globalForDb.__hoopfinderSchema ||
    globalForDb.__hoopfinderSchemaVersion !== SCHEMA_VERSION
  ) {
    globalForDb.__hoopfinderSchemaVersion = SCHEMA_VERSION;
    globalForDb.__hoopfinderSchema = ensureSchema(sql).catch((error) => {
      globalForDb.__hoopfinderSchema = undefined;
      globalForDb.__hoopfinderSchemaVersion = undefined;
      throw error;
    });
  }
  await globalForDb.__hoopfinderSchema;
  return fn(sql);
}

async function ensureSchema(sql: Sql) {
  await sql`DROP TABLE IF EXISTS pending_courts`;
  await sql`
    CREATE TABLE IF NOT EXISTS submitted_courts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      email TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lon DOUBLE PRECISION NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}
