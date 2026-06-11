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
    // CommonJS build tooling — not application code
    "tools/ise-dev/**",
    "src/core/trading-engine.js",
    // Pending PostgreSQL schema migration; @ts-nocheck is intentional
    "src/features/books/services/book-service.ts",
    "src/features/books/services/logic-battlegrounds.ts",
  ]),
]);

export default eslintConfig;
