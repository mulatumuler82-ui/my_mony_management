'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { createSession, destroySession, requireSession } from '@/lib/session';
import { money } from '@/lib/utils';

export type AuthState = { error?: string; values?: { username?: string; email?: string; login?: string } };
export type FormState = { error?: string; success?: string; at?: number };

// ---------- Auth ----------
export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const username = String(formData.get('username') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm_password') ?? '');
  const values = { username, email };

  const errors: string[] = [];
  if (!/^[A-Za-z0-9_]{3,30}$/.test(username)) errors.push('Username must be 3-30 characters (letters, numbers, underscore).');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) errors.push('Please enter a valid email address.');
  if (password.length < 8) errors.push('Password must be at least 8 characters.');
  if (password !== confirm) errors.push('Passwords do not match.');
  if (errors.length) return { error: errors.join(' '), values };

  const sql = await db();
  const existing = await sql`SELECT 1 FROM users WHERE lower(username) = lower(${username}) OR email = ${email} LIMIT 1`;
  if (existing.length > 0) return { error: 'Username or email is already registered.', values };

  const hash = await bcrypt.hash(password, 10);
  let userId: number;
  try {
    const rows = await sql`INSERT INTO users (username, email, password_hash) VALUES (${username}, ${email}, ${hash}) RETURNING id`;
    userId = Number(rows[0].id);
  } catch {
    return { error: 'Could not create the account. Please try again.', values };
  }

  await createSession(userId, username);
  redirect('/dashboard');
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const login = String(formData.get('login') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!login || !password) return { error: 'Enter your username/email and password.', values: { login } };

  const sql = await db();
  const rows = await sql`
    SELECT id, username, password_hash FROM users
    WHERE lower(username) = lower(${login}) OR email = ${login.toLowerCase()} LIMIT 1`;
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, String(user.password_hash)))) {
    return { error: 'Incorrect username/email or password.', values: { login } };
  }

  await createSession(Number(user.id), String(user.username));
  redirect('/dashboard');
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect('/login');
}

// ---------- Transactions ----------
export async function addTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();

  const type = String(formData.get('type') ?? '');
  const amount = Number(formData.get('amount'));
  const category = String(formData.get('category') ?? '').trim();
  const note = String(formData.get('note') ?? '').trim();
  const date = String(formData.get('trans_date') ?? '');

  if (type !== 'income' && type !== 'expense') return { error: 'Choose income or expense.' };
  if (!Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999) return { error: 'Enter a valid amount greater than 0.' };
  if (!category || category.length > 50) return { error: 'Choose a category.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { error: 'Invalid date.' };
  if (note.length > 255) return { error: 'Note is too long (max 255 characters).' };

  const amt = Math.round(amount * 100) / 100;
  const sql = await db();
  try {
    await sql`
      INSERT INTO transactions (user_id, type, amount, category, note, trans_date)
      VALUES (${session.userId}, ${type}, ${amt}, ${category}, ${note || null}, ${date})`;
  } catch {
    return { error: 'Could not save. Please try again.' };
  }

  revalidatePath('/dashboard');
  return { success: `${type === 'income' ? 'Income' : 'Expense'} of ${money(amt)} added.`, at: Date.now() };
}

export async function deleteTransaction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = Number(formData.get('id'));
  if (!Number.isInteger(id)) return;

  const sql = await db();
  await sql`DELETE FROM transactions WHERE id = ${id} AND user_id = ${session.userId}`;
  revalidatePath('/dashboard');
}
