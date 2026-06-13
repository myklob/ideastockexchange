# Deployment — Vercel + Postgres

The app runs on **SQLite locally** and **Postgres in production** (SQLite can't be
used on serverless). The code is already deploy-ready:

- `src/lib/prisma.ts` selects the driver adapter by `DATABASE_URL` scheme —
  `better-sqlite3` for `file:` URLs, `@prisma/adapter-pg` for `postgres://` URLs.
- `scripts/set-prisma-provider.mjs` runs before every `prisma generate` / `db push`
  and aligns the schema's datasource `provider` with `DATABASE_URL` — `postgresql`
  for a `postgres://` URL, `sqlite` otherwise. Prisma's `provider` must be a static
  literal and the generated client is provider-specific, so this is what lets a
  Postgres deploy produce a Postgres-flavored client without hand-editing the schema.
- `vercel.json` and `postinstall` both run that script + `prisma generate`, so a
  Vercel build with a Postgres `DATABASE_URL` is generated correctly with no manual
  step. The client is gitignored at `src/generated/prisma`.

The only things that can't be committed are the live database and the `DATABASE_URL`
secret, so finish the steps below with your own Neon/Vercel accounts.

## 1. Create a Postgres database

Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) (both have free
tiers). Copy the connection string, e.g.:

```
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

## 2. Point the tooling at Postgres

No schema edit is needed — just export the Postgres URL. `set-prisma-provider.mjs`
(invoked by `db:generate` / `db:push` / `postinstall` / the Vercel build) flips the
datasource provider to `postgresql` whenever `DATABASE_URL` is a `postgres://` URL,
and back to `sqlite` otherwise. The committed schema stays on `sqlite` for local dev;
don't commit a build-time rewrite.

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
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

- Keep local dev on SQLite: leave `.env` as `DATABASE_URL="file:./prisma/dev.db"`. The
  committed schema provider stays `sqlite`; `set-prisma-provider.mjs` flips it to
  `postgresql` automatically at build time when `DATABASE_URL` is a Postgres URL, so
  there's nothing to switch by hand. (To standardize on Postgres for both, just point
  local `.env` at a Neon dev branch — the same script handles the provider.)
- The build-time schema rewrite happens in the ephemeral Vercel checkout; never commit
  a schema left on `provider = "postgresql"`.
- Never commit a real `DATABASE_URL`; `.env*` is gitignored.
