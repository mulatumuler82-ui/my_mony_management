import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

type Sql = NeonQueryFunction<false, false>;

let client: Sql | null = null;
let ready: Promise<void> | null = null;

function getClient(): Sql {
  if (!client) {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (!url) {
      throw new Error('DATABASE_URL is missing. Connect a Neon database to your Vercel project (Storage tab).');
    }
    client = neon(url);
  }
  return client;
}

async function ensureSchema(sql: Sql): Promise<void> {
  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('income','expense')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    category VARCHAR(50) NOT NULL,
    note VARCHAR(255),
    trans_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions (user_id, trans_date)`;
}

/** Returns the SQL client after making sure the tables exist (self-healing). */
export async function db(): Promise<Sql> {
  const sql = getClient();
  if (!ready) {
    ready = ensureSchema(sql).catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
  return sql;
}
