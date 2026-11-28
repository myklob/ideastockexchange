import "dotenv/config";
import { defineConfig } from "prisma/config";

// The Prisma CLI (db push, migrate) needs a DIRECT Postgres connection;
// PgBouncer-style poolers reject schema operations. The app runtime
// (src/lib/prisma.ts) keeps using DATABASE_URL, which on Neon should be the
// pooled "-pooler" string. Set DATABASE_URL_UNPOOLED to the direct string
// wherever the CLI runs (local shell, the bootstrap workflow, Vercel).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url:
      process.env["DATABASE_URL_UNPOOLED"] ||
      process.env["DATABASE_URL"] ||
      "file:./prisma/dev.db",
  },
});
