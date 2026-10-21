export const TZ = 'Africa/Addis_Ababa';
export const CURRENCY = 'ETB';

export const PERIODS = ['day', 'week', 'month', 'year', 'all'] as const;
export type Period = (typeof PERIODS)[number];

export function money(n: number): string {
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${CURRENCY}`;
}

export function num(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---- Date helpers (all dates are 'YYYY-MM-DD' strings in the Addis Ababa time zone) ----
export function todayStr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
}

function parse(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(s: string, n: number): string {
  const d = parse(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekdayShort(s: string): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'UTC' }).format(parse(s));
}

export function getRanges(today: string): Record<Period, { from: string; to: string; label: string }> {
  const [y, m] = today.split('-').map(Number);
  const offset = (parse(today).getUTCDay() + 6) % 7; // Monday = 0
  const monday = addDays(today, -offset);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, '0');
  return {
    day: { from: today, to: today, label: 'Today' },
    week: { from: monday, to: addDays(monday, 6), label: 'This Week' },
    month: { from: `${y}-${mm}-01`, to: `${y}-${mm}-${String(lastDay).padStart(2, '0')}`, label: 'This Month' },
    year: { from: `${y}-01-01`, to: `${y}-12-31`, label: 'This Year' },
    all: { from: '1970-01-01', to: '2999-12-31', label: 'All Time' },
  };
}
