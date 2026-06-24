#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

echo "==> Installing npm dependencies (--ignore-scripts avoids Prisma binary download failure via proxy)"
npm install --ignore-scripts

echo "==> Rebuilding native addons (better-sqlite3)"
npm rebuild better-sqlite3

echo "==> Ensuring Prisma schema engine binary is present"
ENGINES_DIR="$CLAUDE_PROJECT_DIR/node_modules/@prisma/engines"
ENGINES_VERSION=$(node -e "console.log(require('$CLAUDE_PROJECT_DIR/node_modules/@prisma/engines-version').enginesVersion)")
# Detect the platform string Prisma needs (e.g. debian-openssl-3.0.x)
PLATFORM=$(node -e "
const { getBinaryTargetForCurrentPlatform } = require('$CLAUDE_PROJECT_DIR/node_modules/@prisma/get-platform');
getBinaryTargetForCurrentPlatform().then(p => console.log(p));
")
SCHEMA_ENGINE_PATH="$ENGINES_DIR/schema-engine-$PLATFORM"

if [ ! -f "$SCHEMA_ENGINE_PATH" ]; then
  echo "  Downloading schema-engine for $PLATFORM (engine $ENGINES_VERSION)..."
  BINARY_URL="https://binaries.prisma.sh/all_commits/${ENGINES_VERSION}/${PLATFORM}/schema-engine.gz"
  curl -fsSL "$BINARY_URL" | gunzip > "$SCHEMA_ENGINE_PATH"
  chmod +x "$SCHEMA_ENGINE_PATH"
  echo "  Schema engine downloaded."
else
  echo "  Schema engine already present."
fi

echo "==> Generating Prisma client"
npx prisma generate

echo "==> Setting up SQLite database"
DB_PATH="$CLAUDE_PROJECT_DIR/prisma/dev.db"

# db push is idempotent: creates tables if missing, no-ops if schema matches
npx prisma db push

# Seed only if the Belief table is empty (avoids duplicate data on re-runs)
BELIEF_COUNT=$(node -e "
const Database = require('$CLAUDE_PROJECT_DIR/node_modules/better-sqlite3');
try {
  const db = new Database('$DB_PATH');
  const row = db.prepare('SELECT COUNT(*) as c FROM Belief').get();
  console.log(row ? row.c : 0);
  db.close();
} catch (e) { console.log(0); }
" 2>/dev/null || echo "0")

if [ "$BELIEF_COUNT" -eq 0 ]; then
  echo "  Seeding database..."
  npm run db:seed
else
  echo "  Database already seeded ($BELIEF_COUNT beliefs found)."
fi

echo "==> Session setup complete"
