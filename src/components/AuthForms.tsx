'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction, registerAction, type AuthState } from '@/app/actions';

const initial: AuthState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);
  return (
    <div className="auth-card">
      <h2>💰 Expense Tracker</h2>
      <p className="muted center">Log in to manage your money</p>
      {state.error && <div className="alert error">{state.error}</div>}
      <form action={action}>
        <label htmlFor="login">Username or Email</label>
        <input type="text" id="login" name="login" defaultValue={state.values?.login} required autoFocus />
        <label htmlFor="password">Password</label>
        <input type="password" id="password" name="password" required />
        <button type="submit" className="btn primary block" disabled={pending} style={{ width: '100%' }}>
          {pending ? 'Logging in…' : 'Log In'}
        </button>
      </form>
      <p className="center muted small">
        No account? <Link href="/register">Register</Link>
      </p>
    </div>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initial);
  return (
    <div className="auth-card">
      <h2>Create Account</h2>
      {state.error && <div className="alert error">{state.error}</div>}
      <form action={action}>
        <label htmlFor="username">Username</label>
        <input type="text" id="username" name="username" defaultValue={state.values?.username} required />
        <label htmlFor="email">Email</label>
        <input type="email" id="email" name="email" defaultValue={state.values?.email} required />
        <label htmlFor="password">Password</label>
        <input type="password" id="password" name="password" minLength={8} required />
        <label htmlFor="confirm_password">Confirm Password</label>
        <input type="password" id="confirm_password" name="confirm_password" minLength={8} required />
        <button type="submit" className="btn primary block" disabled={pending} style={{ width: '100%' }}>
          {pending ? 'Creating…' : 'Register'}
        </button>
      </form>
      <p className="center muted small">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
