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
tiers). Neon gives you two connection strings for the same database; you need both:

| Variable | Which string | Used by |
|---|---|---|
| `DATABASE_URL` | **Pooled** (host contains `-pooler`) | The app at runtime on Vercel |
| `DATABASE_URL_UNPOOLED` | **Direct** (no `-pooler`) | `prisma db push` and the content seed |

Schema operations do not work through a transaction-mode pooler, and a direct
connection from every serverless instance would exhaust the database's connection
limit, so the split is not optional.

## 2. Create the schema and seed the public content

The committed migrations are SQLite-dialect; the first Postgres deploy uses
`prisma db push` (schema-only sync). Two ways to run it:

**Option A — GitHub Actions (no local setup).** Add `DATABASE_URL_UNPOOLED` as a
repository secret (Settings → Secrets and variables → Actions), then run the
**Bootstrap production database** workflow from the Actions tab and type `bootstrap`
when it asks. It pushes the schema and runs the full seed chain.

**Option B — your shell.**

```bash
export DATABASE_URL="postgresql://...-pooler...?sslmode=require"
export DATABASE_URL_UNPOOLED="postgresql://...?sslmode=require"
node scripts/set-prisma-provider.mjs   # flips schema provider to postgresql
npx prisma generate                    # regenerate the client for Postgres
npm run db:bootstrap                   # = prisma db push + npm run db:seed
```

Afterwards, unset both variables (or point `DATABASE_URL` back at SQLite) and rerun
`node scripts/set-prisma-provider.mjs && npx prisma generate` before committing, so
the schema in git stays on `sqlite`.

`db:bootstrap` creates every table and loads the public content in one go: the
worked-example belief pages (`/beliefs/accept-certified-election-results`,
`/beliefs/comply-with-final-court-rulings`, every template section filled), the
`/topics/protecting-the-constitution` hub, the demo conversation on `/conversations`,
and the engine pass that computes the scores. The chain is idempotent, so re-running
it against an existing database is safe.

## 3. Connect Vercel

1. Push this branch and open https://vercel.com/new.
2. Import the `myklob/ideastockexchange` GitHub repo.
3. Vercel auto-detects Next.js; `vercel.json` already sets the build command.
4. In **Project → Settings → Environment Variables**, add these for **Production and
   Preview** (the build fails with a clear message if `DATABASE_URL` is missing or
   not a Postgres URL on Vercel):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the pooled connection string |
   | `DATABASE_URL_UNPOOLED` | the direct connection string |
   | `CRON_SECRET` | `openssl rand -hex 32` — authenticates the daily settlement cron and the operator-only recompute/destructive routes; without it those routes answer 503 in production |
   | `DEMO_REVIEW_SECRET` | `openssl rand -hex 32` — signs the `/demo` playground's review tokens; without it the playground answers 503 |
   | `NEXT_PUBLIC_APP_URL` | `https://<your-domain>` — used by `robots.txt` and `sitemap.xml` |

   Optional switches (all default to the safe setting when unset): `PUBLIC_WRITES_DISABLED=1`
   pauses every anonymous write route; `DEMO_WRITES_DISABLED=1` pauses only the playground;
   `MARKET_WRITES_ENABLED=1` opens play-money trading (read-only in production otherwise);
   `AI_GENERATION_ENABLED=1` plus `AI_PROVIDER`/`AI_API_KEY`/`AI_MODEL` enables the public
   AI topic generator (paid, off by default); `ORACLE_PRIVATE_KEY_PEM` (`openssl genpkey
   -algorithm ed25519`) enables signed oracle attestations; `DATABASE_POOL_MAX` overrides the
   per-instance pool size (default 2 on Vercel).
5. Deploy.

## 4. Verify

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/beliefs
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/debate-topics
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/beliefs/accept-certified-election-results
curl -s -o /dev/null -w "%{http_code}\n" https://<project>.vercel.app/demo
curl -s https://<project>.vercel.app/api/health
```

`/api/health` reports whether the database is reachable and the worked-example
content is loaded (`"seeded": true`), with counts only, never configuration.

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
