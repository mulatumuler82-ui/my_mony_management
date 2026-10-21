import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Open /api/health to see what is missing. Delete this file once everything works.
export async function GET() {
  const checks: Record<string, string | boolean> = {
    DATABASE_URL_set: Boolean(process.env.DATABASE_URL ?? process.env.POSTGRES_URL),
    AUTH_SECRET_set_and_long_enough: Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16),
    database: 'not tested',
  };
  try {
    const sql = await db();
    await sql`SELECT 1`;
    checks.database = 'ok (tables ready)';
  } catch (e) {
    checks.database = 'error: ' + (e instanceof Error ? e.message : String(e));
  }
  return NextResponse.json(checks);
}
