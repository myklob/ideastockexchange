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
    // Legacy directories not part of the Next.js app:
    "_archive/**",
    "server/**",
    "tools/**",
    "generated/**",
    "scripts/**",
    "app/**",
    "client/**",
    "frontend/**",
    "src/core/trading-engine.js",
  ]),
]);

export default eslintConfig;
