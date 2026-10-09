import postgres from "postgres";

type Sql = postgres.Sql;

const SCHEMA_VERSION = 16;

const globalForDb = globalThis as typeof globalThis & {
  __hoopfinderSql?: Sql;
  __hoopfinderSchema?: Promise<void>;
  __hoopfinderSchemaVersion?: number;
  __hoopfinderDbDown?: boolean;
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

/** True after this process tried the database and could not use it. */
export function isDatabaseUnavailable(): boolean {
  return globalForDb.__hoopfinderDbDown === true;
}

export async function withDb<T>(fn: (sql: Sql) => Promise<T>): Promise<T | null> {
  const sql = getSql();
  if (!sql) {
    globalForDb.__hoopfinderDbDown = true;
    return null;
  }
  try {
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
    const result = await fn(sql);
    globalForDb.__hoopfinderDbDown = false;
    return result;
  } catch (error) {
    console.error(error);
    globalForDb.__hoopfinderDbDown = true;
    return null;
  }
}

async function ensureSchema(sql: Sql) {
  await sql`CREATE SEQUENCE IF NOT EXISTS submitted_court_id_seq START WITH 10000`;
  await sql`
    CREATE TABLE IF NOT EXISTS submitted_courts (
      id INTEGER PRIMARY KEY DEFAULT nextval('submitted_court_id_seq'),
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      email TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lon DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'unconfirmed',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      confirmation_token TEXT
    )
  `;
  await sql`ALTER TABLE submitted_courts DROP COLUMN IF EXISTS confirmed_at`;
  await sql`ALTER TABLE submitted_courts DROP COLUMN IF EXISTS confirmation_token_hash`;
  await sql`ALTER TABLE submitted_courts ADD COLUMN IF NOT EXISTS confirmation_token TEXT`;
  await sql`ALTER TABLE submitted_courts ALTER COLUMN status SET DEFAULT 'unconfirmed'`;
  await sql`
    ALTER TABLE submitted_courts
    ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb
  `;
  await sql`DROP INDEX IF EXISTS submitted_courts_confirmation_token_hash_idx`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS submitted_courts_confirmation_token_idx
    ON submitted_courts (confirmation_token)
    WHERE confirmation_token IS NOT NULL
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS court_submission_limits (
      ip TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS court_submission_limits_ip_created_idx
    ON court_submission_limits (ip, created_at)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS court_photos (
      id TEXT PRIMARY KEY,
      court_id TEXT NOT NULL,
      content_type TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS court_photos_court_id_idx
    ON court_photos (court_id)
  `;
  // Same lowercase address as submitted_courts.email, repeated on the photo row
  // so a later account can match courts and photos by that address.
  await sql`ALTER TABLE court_photos ADD COLUMN IF NOT EXISTS email TEXT`;
  await sql`ALTER TABLE court_photos ADD COLUMN IF NOT EXISTS description TEXT`;
  await sql`
    CREATE INDEX IF NOT EXISTS court_photos_email_idx
    ON court_photos (email)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS submitted_courts_email_idx
    ON submitted_courts (email)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS court_photo_limits (
      ip TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS court_photo_limits_ip_created_idx
    ON court_photo_limits (ip, created_at)
  `;
}
