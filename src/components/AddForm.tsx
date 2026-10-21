'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { addTransaction, type FormState } from '@/app/actions';

const EXPENSE_CATS = ['Food', 'Transport', 'Books & School', 'Clothes', 'Health', 'Entertainment', 'Airtime & Internet', 'Other'];
const INCOME_CATS = ['Allowance', 'Family Support', 'Salary', 'Gift', 'Other'];

export default function AddForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(addTransaction, {});
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const amountRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);

  // Clear amount + note after a successful save.
  useEffect(() => {
    if (state.success) {
      if (amountRef.current) amountRef.current.value = '';
      if (noteRef.current) noteRef.current.value = '';
    }
  }, [state]);

  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;

  return (
    <form action={action}>
      {state.error && <div className="alert error">{state.error}</div>}
      {state.success && <div className="alert success">{state.success}</div>}

      <div className="toggle">
        <label>
          <input type="radio" name="type" value="expense" checked={type === 'expense'} onChange={() => setType('expense')} /> Expense
        </label>
        <label>
          <input type="radio" name="type" value="income" checked={type === 'income'} onChange={() => setType('income')} /> Income
        </label>
      </div>

      <label htmlFor="amount">Amount (ETB)</label>
      <input ref={amountRef} type="number" id="amount" name="amount" step="0.01" min="0.01" required />

      <label htmlFor="category">Category</label>
      <select id="category" name="category" key={type} required>
        {cats.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <label htmlFor="trans_date">Date</label>
      <input type="date" id="trans_date" name="trans_date" defaultValue={today} required />

      <label htmlFor="note">Note (optional)</label>
      <input ref={noteRef} type="text" id="note" name="note" maxLength={255} placeholder="e.g. lunch at cafeteria" />

      <button type="submit" className="btn primary block" disabled={pending} style={{ width: '100%' }}>
        {pending ? 'Saving…' : 'Save'}
      </button>
    </form>
  );
}
