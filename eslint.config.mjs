import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Pure { ignores } object (no other keys) = global ignore in ESLint v9.
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".worktrees/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
]);

export default eslintConfig;
