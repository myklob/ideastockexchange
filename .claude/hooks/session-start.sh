#!/bin/bash
set -euo pipefail

# Only run in remote Claude Code environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install npm dependencies without triggering the postinstall (prisma generate),
# because Prisma's node-fetch doesn't work with the remote env's TLS proxy.
if [ ! -d node_modules ]; then
  echo "Installing npm dependencies..."
  npm install --ignore-scripts
fi

# Prisma generate needs the schema-engine binary, but Prisma downloads it via
# node-fetch which fails in this environment. Download it manually via curl instead.
ENGINES_VERSION=$(node -e "console.log(require('./node_modules/@prisma/engines-version/package.json').version)" 2>/dev/null || echo "")
if [ -z "$ENGINES_VERSION" ]; then
  echo "Warning: could not read Prisma engines version"
else
  # Extract the commit hash (format: x.y.z-N.<hash>)
  COMMIT_HASH=$(echo "$ENGINES_VERSION" | grep -oP '(?<=\.)[a-f0-9]{40}$' || echo "")
  ENGINE_PATH="node_modules/@prisma/engines/schema-engine-debian-openssl-3.0.x"

  if [ -n "$COMMIT_HASH" ] && [ ! -f "$ENGINE_PATH" ]; then
    echo "Downloading Prisma schema-engine binary (commit $COMMIT_HASH)..."
    ENGINE_URL="https://binaries.prisma.sh/all_commits/${COMMIT_HASH}/debian-openssl-3.0.x/schema-engine.gz"
    curl -fsSL "$ENGINE_URL" | gunzip > "$ENGINE_PATH"
    chmod +x "$ENGINE_PATH"
    echo "Schema engine downloaded."
  fi
fi

# Generate the Prisma client
if [ ! -d src/generated/prisma ]; then
  echo "Generating Prisma client..."
  npx prisma generate
fi

echo "Session setup complete."
