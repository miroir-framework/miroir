// Minimal lint rules for the miroir monorepo (#325). Every rule here is an error and the codebase passes it.
// Rules that still have violations are switched off below with their count, so they can be enabled one at a time.
// Run: npm run lint
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/release/**",
      "**/tmp/**",
      "**/preprocessor-generated/**",
    ],
  },
  {
    files: ["packages/*/src/**/*.{ts,tsx}", "packages/*/tests/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    // Registered so existing `eslint-disable react-hooks/...` comments resolve.
    plugins: { "react-hooks": reactHooks },
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: {
      // Too many existing violations for a minimal set; candidates for later issues.
      "@typescript-eslint/no-explicit-any": "off", // 3832
      "@typescript-eslint/no-unused-vars": "off", // 1055
      "@typescript-eslint/no-empty-object-type": "off", // 14, type-level style
      "@typescript-eslint/no-unsafe-function-type": "off", // 5, type-level style
      "no-fallthrough": "off", // 47, each case needs a decision: `break` or `// falls through`
    },
  },
  {
    // `declare global { var ... }` requires `var`.
    files: ["packages/*/{src,tests}/**/*.d.ts"],
    rules: { "no-var": "off" },
  },
  {
    // Legacy JSON loading through require(); not worth rewriting in a lint change.
    files: ["packages/miroir-core/src/index.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
);
