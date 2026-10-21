import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { RegisterForm } from '@/components/AuthForms';

export default async function RegisterPage() {
  if (await getSession()) redirect('/dashboard');
  return (
    <div className="auth-page">
      <RegisterForm />
    </div>
  );
}
