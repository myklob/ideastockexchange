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
    // Not part of the Next.js app:
    "_archive/**",
    "tools/**",
    "client/**",
    "frontend/**",
    "server/**",
    ".claude/**",
  ]),
  {
    files: [
      "src/features/books/services/book-service.ts",
      "src/features/books/services/logic-battlegrounds.ts",
    ],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
]);

export default eslintConfig;
