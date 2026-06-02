import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy directories not part of the active Next.js app:
    "_archive/**",
    "client/**",
    "server/**",
    "frontend/**",
    "backend/**",
    "app/**",
    "components/**",
    "lib/**",
    "generated/**",
    "pipeline/**",
    "scripts/**",
    "tools/**",
  ]),
  // Files retained for future schema migration — Prisma models not yet in active SQLite schema.
  {
    files: [
      "src/features/books/services/book-service.ts",
      "src/features/books/services/logic-battlegrounds.ts",
      "src/core/trading-engine.js",
      "src/app/api/books/**",
      "src/app/books/**",
    ],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
