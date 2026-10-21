import Link from 'next/link';
import { requireSession } from '@/lib/session';
import { logout, deleteTransaction } from '@/app/actions';
import { getSummary, getTransactions, getCategoryTotals, getLast7Days } from '@/lib/data';
import { PERIODS, type Period, getRanges, todayStr, money, num } from '@/lib/utils';
import AddForm from '@/components/AddForm';
import DeleteButton from '@/components/DeleteButton';

const TAB_LABELS: Record<Period, string> = { day: 'Day', week: 'Week', month: 'Month', year: 'Year', all: 'All' };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const session = await requireSession();
  const sp = await searchParams;
  const period: Period = (PERIODS as readonly string[]).includes(sp.period ?? '') ? (sp.period as Period) : 'month';

  const today = todayStr();
  const ranges = getRanges(today);
  const sel = ranges[period];

  const [sums, rows, cats, last7] = await Promise.all([
    Promise.all(PERIODS.map((p) => getSummary(session.userId, ranges[p].from, ranges[p].to))),
    getTransactions(session.userId, sel.from, sel.to),
    getCategoryTotals(session.userId, sel.from, sel.to),
    getLast7Days(session.userId, today),
  ]);
  const summary = Object.fromEntries(PERIODS.map((p, i) => [p, sums[i]])) as Record<Period, (typeof sums)[number]>;
  const current = summary[period];
  const catTotal = cats.reduce((a, c) => a + c.total, 0);
  const max7 = Math.max(1, ...last7.map((d) => d.total));

  return (
    <>
      <header className="topbar">
        <div className="brand">💰 Expense Tracker</div>
        <div className="user">
          Hi, <strong>{session.username}</strong>
          <form action={logout}>
            <button className="btn small" type="submit">Logout</button>
          </form>
        </div>
      </header>

      <main className="container">
        {/* Overview cards */}
        <section className="grid four">
          {(['day', 'week', 'month', 'year'] as const).map((k) => (
            <Link key={k} href={`/dashboard?period=${k}`} className={`card stat ${period === k ? 'active' : ''}`}>
              <div className="muted small">{ranges[k].label}</div>
              <div className={`big ${summary[k].balance >= 0 ? 'pos' : 'neg'}`}>{money(summary[k].balance)}</div>
              <div className="small">
                <span className="pos">+{num(summary[k].income)}</span> / <span className="neg">-{num(summary[k].expense)}</span>
              </div>
            </Link>
          ))}
        </section>

        <section className="grid two">
          <div className="card">
            <h3>Add Record</h3>
            <AddForm today={today} />
          </div>

          <div className="card">
            <h3>Spending – Last 7 Days</h3>
            <div className="bars">
              {last7.map((b, i) => (
                <div className="bar-col" key={i} title={money(b.total)}>
                  <div className="bar" style={{ height: `${Math.round((b.total / max7) * 100)}%` }} />
                  <div className="small muted">{b.label}</div>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: 22 }}>Expenses by Category – {sel.label}</h3>
            {cats.length === 0 ? (
              <p className="muted">No expenses in this period.</p>
            ) : (
              cats.map((c) => {
                const pct = catTotal > 0 ? (c.total / catTotal) * 100 : 0;
                return (
                  <div className="cat-row" key={c.category}>
                    <div className="cat-head">
                      <span>{c.category}</span>
                      <span>{money(c.total)} ({Math.round(pct)}%)</span>
                    </div>
                    <div className="meter"><div style={{ width: `${Math.round(pct)}%` }} /></div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="card">
          <div className="row-between">
            <h3>{sel.label} – Records</h3>
            <div className="tabs">
              {PERIODS.map((k) => (
                <Link key={k} href={`/dashboard?period=${k}`} className={period === k ? 'on' : ''}>{TAB_LABELS[k]}</Link>
              ))}
            </div>
          </div>

          <div className="grid three small-gap">
            <div className="mini"><span className="muted small">Income</span><div className="pos">{money(current.income)}</div></div>
            <div className="mini"><span className="muted small">Expense</span><div className="neg">{money(current.expense)}</div></div>
            <div className="mini"><span className="muted small">Balance</span><div className={current.balance >= 0 ? 'pos' : 'neg'}>{money(current.balance)}</div></div>
          </div>

          {rows.length === 0 ? (
            <p className="muted">No records yet for this period.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Type</th><th>Category</th><th>Note</th><th className="right">Amount</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{r.trans_date}</td>
                      <td><span className={`badge ${r.type}`}>{r.type}</span></td>
                      <td>{r.category}</td>
                      <td>{r.note}</td>
                      <td className={`right ${r.type === 'income' ? 'pos' : 'neg'}`}>
                        {r.type === 'income' ? '+' : '-'}{num(r.amount)}
                      </td>
                      <td className="right">
                        <form action={deleteTransaction}>
                          <input type="hidden" name="id" value={r.id} />
                          <DeleteButton />
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
