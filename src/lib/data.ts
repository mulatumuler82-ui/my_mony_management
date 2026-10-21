import { db } from './db';
import { addDays, weekdayShort } from './utils';

export type Summary = { income: number; expense: number; balance: number };
export type Tx = { id: number; type: 'income' | 'expense'; amount: number; category: string; note: string | null; trans_date: string };

export async function getSummary(userId: number, from: string, to: string): Promise<Summary> {
  const sql = await db();
  const rows = await sql`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)::float8 AS income,
      COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0)::float8 AS expense
    FROM transactions
    WHERE user_id = ${userId} AND trans_date BETWEEN ${from} AND ${to}`;
  const income = Number(rows[0].income);
  const expense = Number(rows[0].expense);
  return { income, expense, balance: income - expense };
}

export async function getTransactions(userId: number, from: string, to: string): Promise<Tx[]> {
  const sql = await db();
  const rows = await sql`
    SELECT id, type, amount::float8 AS amount, category, note,
           to_char(trans_date, 'YYYY-MM-DD') AS trans_date
    FROM transactions
    WHERE user_id = ${userId} AND trans_date BETWEEN ${from} AND ${to}
    ORDER BY transactions.trans_date DESC, id DESC
    LIMIT 300`;
  return rows as unknown as Tx[];
}

export async function getCategoryTotals(userId: number, from: string, to: string): Promise<{ category: string; total: number }[]> {
  const sql = await db();
  const rows = await sql`
    SELECT category, SUM(amount)::float8 AS total
    FROM transactions
    WHERE user_id = ${userId} AND type = 'expense' AND trans_date BETWEEN ${from} AND ${to}
    GROUP BY category ORDER BY total DESC`;
  return rows as unknown as { category: string; total: number }[];
}

export async function getLast7Days(userId: number, today: string): Promise<{ label: string; total: number }[]> {
  const sql = await db();
  const start = addDays(today, -6);
  const rows = await sql`
    SELECT to_char(trans_date, 'YYYY-MM-DD') AS d, SUM(amount)::float8 AS total
    FROM transactions
    WHERE user_id = ${userId} AND type = 'expense' AND trans_date BETWEEN ${start} AND ${today}
    GROUP BY trans_date`;
  const map = new Map<string, number>();
  for (const r of rows) map.set(String(r.d), Number(r.total));
  const out: { label: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i);
    out.push({ label: weekdayShort(d), total: map.get(d) ?? 0 });
  }
  return out;
}
