# 💰 Expense Tracker (Next.js + Neon Postgres)

Track daily income and expenses, with day / week / month / year summaries,
category breakdown and a 7-day spending chart. Built with:

- **Next.js** (App Router, Server Actions) + **TypeScript**
- **Neon Postgres** (connected through the Vercel Marketplace)
- **jose** (signed session cookies) + **bcryptjs** (password hashing)

Tables are created automatically on the first request, so there is no SQL to import.

## Deploy on Vercel
1. Push this project to GitHub (replace the old PHP files).
2. On vercel.com: **Add New → Project → import your repo**. Don't deploy yet if it asks for env vars.
3. In the project: **Storage → Marketplace → Neon (Serverless Postgres) → connect to this project.**
   Vercel adds `DATABASE_URL` for you.
4. **Settings → Environment Variables:** add `AUTH_SECRET` = a long random string
   (generate one with `openssl rand -base64 32`).
5. **Deploy** (or Redeploy). Open the URL, register, and start tracking.

## Run locally
```bash
npm install
cp .env.example .env.local      # fill in DATABASE_URL and AUTH_SECRET
npm run dev                     # http://localhost:3000
```
Tip: after linking the project with the Vercel CLI, `vercel env pull .env.local` fetches the real values.

## Structure
| Path | Purpose |
|------|---------|
| `src/app/actions.ts` | Server actions: register, login, logout, add / delete record |
| `src/app/dashboard/page.tsx` | Summaries, chart, categories, records |
| `src/app/login`, `register` | Auth pages |
| `src/components/` | Client components (forms, delete button) |
| `src/lib/db.ts` | Neon client + auto-creates tables |
| `src/lib/session.ts` | Signed cookie sessions |
| `src/lib/data.ts` | Read queries |
| `src/lib/utils.ts` | Date ranges (Africa/Addis_Ababa), money formatting |
