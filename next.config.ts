import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Database drivers and Prisma adapters stay external to the server bundle
  // so the SQLite native addon is only loaded on the SQLite code path.
  serverExternalPackages: [
    "@prisma/adapter-better-sqlite3",
    "@prisma/adapter-pg",
    "better-sqlite3",
    "pg",
  ],
};

export default nextConfig;
