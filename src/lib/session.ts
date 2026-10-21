import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE = 'session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type Session = { userId: number; username: string };

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error('AUTH_SECRET is missing. Add a long random string in Vercel → Settings → Environment Variables.');
  }
  return new TextEncoder().encode(s);
}

export async function createSession(userId: number, username: string): Promise<void> {
  const token = await new SignJWT({ uid: userId, name: username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const key = secretKey();
  try {
    const { payload } = await jwtVerify(token, key);
    return { userId: Number(payload.uid), username: String(payload.name) };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect('/login');
  return s;
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
