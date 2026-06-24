#!/bin/sh
# Stub for Prisma schema engine — prevents download from binaries.prisma.sh
# Only needed for `prisma generate` (migrations still require the real binary)
echo "stub-schema-engine: called with args: $*" >&2
exit 1
