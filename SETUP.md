# Setup Guide — Idea Stock Exchange

Idea Stock Exchange is a **Next.js 16 (App Router) + React 19 + Prisma 7** application.
Local development uses SQLite via the `better-sqlite3` driver adapter; production uses
Postgres (see "Deploying" below). Everything runs from a single `npm` project at the
repo root — there is no separate backend/frontend to start.

> The old Python (`backend/`) + standalone React (`frontend/`, `client/`) + Express
> (`server/`) stack has been retired and moved to `_archive/`. Ignore any older
> instructions that reference `uvicorn`, `pip`, or a separate frontend dev server.

## Prerequisites

- **Node.js 20+** (22 recommended) and npm
- No database server needed for local dev — SQLite is file-based

Check your version:

```bash
node --version   # should be >= 20
```

## Quick start

From the repo root:

```bash
# 1. Install dependencies (also generates the Prisma client via postinstall-free flow below)
npm install

# 2. Point the app at the local SQLite database
cp .env.example .env          # DATABASE_URL defaults to file:./prisma/dev.db

# 3. Generate the Prisma client (custom output: src/generated/prisma)
npm run db:generate

# 4. Create the SQLite schema (~64 tables)
npx prisma db push

# 5. Seed beliefs, the marriage debate topic, and product reviews
npm run db:seed

# 6. Start the dev server
npm run dev
```

Open **http://localhost:3000**. The key pages once seeded:

- `/` — homepage
- `/beliefs` — belief index (the crown-jewel pages)
- `/beliefs/universal-basic-income-should-be-implemented` — a fully seeded belief page
- `/debate-topics` and `/debate-topics/marriage`
- `/product-reviews`

## Useful scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port 3000 |
| `npm run build` | Production build (run before claiming a task done) |
| `npm start` | Serve the production build |
| `npm run db:generate` | Regenerate the Prisma client into `src/generated/prisma` |
| `npm run db:push` | Sync the schema to the database without a migration |
| `npm run db:seed` | Seed beliefs, debate topics, and product reviews |
| `npm run db:reset` | Drop, re-migrate, and re-seed (destructive) |
| `npm run lint` | ESLint over the repo |
| `npm test` | Vitest unit tests |

## Database notes

- The **canonical local database path is `file:./prisma/dev.db`**. This value must
  match in three places — `.env` (copied from `.env.example`), `prisma.config.ts`,
  and `src/lib/prisma.ts` — and it now does. Do not reintroduce a root-level
  `./dev.db`; it creates a second, empty database and pages render blank.
- The generated Prisma client lives at `src/generated/prisma` (custom `output` in
  `prisma/schema.prisma`), imported through the `@/generated/prisma/client` alias.
  If you see `@/generated/prisma/client` import errors, run `npm run db:generate`.
- All code goes through the shared client in `src/lib/prisma.ts`, which wires up the
  `better-sqlite3` adapter for SQLite and the `pg` adapter for a Postgres
  `DATABASE_URL`. Seed scripts import this same client.

## Deploying (Vercel + Postgres)

SQLite does not work on serverless, so production uses Postgres (Neon/Supabase/etc.):

1. Create a Postgres database and copy its connection string.
2. In the Prisma datasource (`prisma/schema.prisma`), set the provider to
   `postgresql` for the production database, and set `DATABASE_URL` to the Postgres
   URL in your host's environment variables (do **not** commit it).
3. Run `npx prisma migrate deploy` (or `db push`) and `npm run db:seed` against the
   production database.
4. On Vercel: import the GitHub repo, set `DATABASE_URL` in Project → Settings →
   Environment Variables, and deploy.

See `docs/` (DEPLOYMENT.md) for the full step-by-step.

## Troubleshooting

- **Blank `/beliefs` or `/debate-topics`** — the database wasn't seeded or the app is
  reading the wrong file. Confirm `.env` has `DATABASE_URL="file:./prisma/dev.db"`,
  then re-run `npx prisma db push && npm run db:seed`.
- **`@/generated/prisma/client` cannot be found** — run `npm run db:generate`.
- **Type errors in routes you didn't touch** — the repo has some pre-existing
  implicit-any errors in legacy routes; only your edited files need to be clean.
