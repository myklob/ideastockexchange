#!/bin/sh
# Runs prisma generate with a no-op schema engine stub so the command works
# in environments where the binary engine cannot be downloaded (e.g. restricted
# network). The schema engine binary is only needed for migrations/introspection,
# not for TypeScript client code generation.
set -e

stub=$(mktemp)
printf '#!/bin/sh\nexit 0\n' > "$stub"
chmod +x "$stub"
PRISMA_SCHEMA_ENGINE_BINARY="$stub" npx --no-install prisma generate
rm -f "$stub"
