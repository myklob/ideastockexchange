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
    "app/**",
    "client/**",
    "frontend/**",
    "server/**",
    "tools/**",
    "generated/**",
  ]),
]);

export default eslintConfig;
