import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { LoginForm } from '@/components/AuthForms';

export default async function LoginPage() {
  if (await getSession()) redirect('/dashboard');
  return (
    <div className="auth-page">
      <LoginForm />
    </div>
  );
}
