# Deployment — Vercel + Postgres

The app runs on **SQLite locally** and **Postgres in production** (SQLite can't be
used on serverless). The code is already deploy-ready:

- `src/lib/prisma.ts` selects the driver adapter by `DATABASE_URL` scheme —
  `better-sqlite3` for `file:` URLs, `@prisma/adapter-pg` for `postgres://` URLs.
- `scripts/set-prisma-provider.mjs` rewrites the schema's datasource provider to
  match `DATABASE_URL` (`postgresql` for Postgres URLs, `sqlite` otherwise). It runs
  automatically from `postinstall` and the Vercel build command, so the committed
  provider stays `sqlite` and Vercel builds against Postgres with no manual edit.
- `vercel.json` runs the provider sync, `prisma generate`, then `next build`; the
  generated client is gitignored at `src/generated/prisma`.

Only the live database can't be committed, so finish the steps below with your own
Neon/Vercel accounts.

## 1. Create a Postgres database

Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) (both have free
tiers). Copy the connection string, e.g.:

```
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

## 2. Create the schema and seed (against Postgres)

> The migrations under `prisma/migrations/` were generated for SQLite and won't run
> on Postgres. For the first Postgres deploy, use `prisma db push` (schema-only sync,
> no migration history) rather than `prisma migrate deploy`. Once on Postgres you can
> start a clean migration history with `prisma migrate dev`.

```bash
export DATABASE_URL="postgresql://...:sslmode=require"
node scripts/set-prisma-provider.mjs   # flips schema provider to postgresql
npx prisma generate                    # regenerate the client for Postgres
npm run db:bootstrap                   # = prisma db push + npm run db:seed
```

`db:bootstrap` creates every table and loads the public content in one go: the
worked-example belief pages (`/beliefs/accept-certified-election-results`,
`/beliefs/comply-with-final-court-rulings`, every template section filled), the
`/topics/protecting-the-constitution` hub, the demo conversation on `/conversations`,
and the engine pass that computes the scores. The chain is idempotent, so re-running
it against an existing database is safe.

Afterwards, unset `DATABASE_URL` (or point it back at SQLite) and rerun
`node scripts/set-prisma-provider.mjs && npx prisma generate` before committing, so
the schema in git stays on `sqlite`.

## 3. Connect Vercel

1. Push this branch and open https://vercel.com/new.
2. Import the `myklob/ideastockexchange` GitHub repo.
3. Vercel auto-detects Next.js; `vercel.json` already sets the build command.
4. In **Project → Settings → Environment Variables**, add `DATABASE_URL` with the
   Postgres connection string (Production, and Preview if you want previews to work).
5. Deploy.

## 4. Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/beliefs
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/debate-topics
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/beliefs/accept-certified-election-results
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/demo
```

All should return `200` with seeded content. `/demo` is the public playground: anyone
can resolve a chat statement to its belief page and import a short thread for review
without an API key. Its writes run under the `system:demo-playground` agent (visible at
`/audit?agent=system:demo-playground`), capped per minute per client and at 200 imports
per day. The per-minute limiter is per server instance, so on serverless the daily cap
is the durable backstop. Set `DEMO_WRITES_DISABLED=1` in the host's environment to pause
demo writes without redeploying; reads (lookup, outline) stay open.

## Notes

- Keep local dev on SQLite: leave `.env` as `DATABASE_URL="file:./prisma/dev.db"`.
  The provider-sync script keeps the schema on `sqlite` locally and `postgresql` on
  Vercel automatically. (If you'd rather standardize on Postgres for both, point
  local `.env` at a Neon dev branch — the script will keep the provider on
  `postgresql`, so just commit that.)
- Never commit a real `DATABASE_URL`; `.env*` is gitignored.
