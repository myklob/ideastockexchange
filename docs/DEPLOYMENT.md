# Deployment — Vercel + Postgres

The app runs on **SQLite locally** and **Postgres in production** (SQLite can't be
used on serverless). The code is already deploy-ready:

- `src/lib/prisma.ts` selects the driver adapter by `DATABASE_URL` scheme —
  `better-sqlite3` for `file:` URLs, `@prisma/adapter-pg` for `postgres://` URLs.
- `vercel.json` runs `prisma generate && next build`, and `postinstall` regenerates
  the Prisma client (which is gitignored at `src/generated/prisma`).

The one thing that can't be committed is the Postgres provider line in the schema and
the live database, so finish the steps below with your own Neon/Vercel accounts.

## 1. Create a Postgres database

Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) (both have free
tiers). Copy the connection string, e.g.:

```
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

## 2. Switch the Prisma datasource to Postgres

In `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
}
```

> The existing migrations under `prisma/migrations/` were generated for SQLite. For
> the first Postgres deploy, use `prisma db push` (schema-only sync, no migration
> history) rather than `prisma migrate deploy`. Once on Postgres you can start a clean
> migration history with `prisma migrate dev`.

## 3. Create the schema and seed (against Postgres)

```bash
export DATABASE_URL="postgresql://...:sslmode=require"
npx prisma db push          # create ~64 tables
npm run db:seed             # beliefs, marriage debate topic, product reviews
```

## 4. Connect Vercel

1. Push this branch and open https://vercel.com/new.
2. Import the `myklob/ideastockexchange` GitHub repo.
3. Vercel auto-detects Next.js; `vercel.json` already sets the build command.
4. In **Project → Settings → Environment Variables**, add `DATABASE_URL` with the
   Postgres connection string (Production, and Preview if you want previews to work).
5. Deploy.

## 5. Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/beliefs
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/debate-topics
```

All three should return `200` with seeded content.

## Notes

- Keep local dev on SQLite: leave `.env` as `DATABASE_URL="file:./prisma/dev.db"` and
  the schema provider on `sqlite` for committed local work, flipping to `postgresql`
  only for the production database. (If you'd rather standardize on Postgres for both,
  point local `.env` at a Neon dev branch and set the provider to `postgresql`
  permanently.)
- Never commit a real `DATABASE_URL`; `.env*` is gitignored.
