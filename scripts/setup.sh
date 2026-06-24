#!/bin/sh
# Run instead of bare `npm install` in environments where binaries.prisma.sh
# is blocked (e.g. Claude Code remote containers). The stub prevents
# @prisma/engines postinstall from trying to download the schema engine binary.
set -e
export PRISMA_SCHEMA_ENGINE_BINARY="$(pwd)/scripts/stub-schema-engine.sh"
npm install "$@"
