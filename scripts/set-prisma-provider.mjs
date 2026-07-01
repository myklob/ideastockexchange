// Keeps prisma/schema.prisma's datasource provider in sync with DATABASE_URL.
// The committed provider is "sqlite" (local dev). On hosts where DATABASE_URL
// is a Postgres URL (Vercel + Neon/Supabase), this rewrites it to "postgresql"
// before `prisma generate` so the client compiles the right SQL dialect.
// Run automatically from `postinstall` and the Vercel build command.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const schemaPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "prisma",
  "schema.prisma"
);

const url = process.env.DATABASE_URL ?? "";
const wanted = /^postgres(ql)?:\/\//.test(url) ? "postgresql" : "sqlite";

const schema = readFileSync(schemaPath, "utf8");
const providerRe = /(datasource\s+db\s*\{[^}]*?provider\s*=\s*")(sqlite|postgresql)(")/;
const match = schema.match(providerRe);

if (!match) {
  console.error("set-prisma-provider: could not find datasource provider in schema.prisma");
  process.exit(1);
}

if (match[2] === wanted) {
  console.log(`set-prisma-provider: provider already "${wanted}", no change`);
} else {
  writeFileSync(schemaPath, schema.replace(providerRe, `$1${wanted}$3`));
  console.log(`set-prisma-provider: provider "${match[2]}" -> "${wanted}"`);
}
