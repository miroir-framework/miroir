// Minimal lint rules for the miroir monorepo (#325). Every rule here is an error and the codebase passes it.
// Rules that still have violations are switched off below with their count, so they can be enabled one at a time.
// Existing violations of rules-of-hooks, miroir/layers and the smells that graduated from the smell lens (#340) are
// counted per file in eslint-suppressions.json: a new violation fails, and after a fix `npm run lint` asks for
// `npx eslint packages --prune-suppressions`.
// Run: npm run lint
import js from "@eslint/js";
import { builtinRules } from "eslint/use-at-your-own-risk";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import miroirLayers from "./eslint-rules/miroir-layers.mjs";
import {
  actionResult,
  componentIo,
  globalEnvironment,
  pubSub,
  ROOTS,
  SRC,
  TEST_SESSION_VIEWS,
  TESTS,
  typeEscape,
  VIEW,
} from "./eslint-rules/smells.mjs";

// A smell that graduated from the lens runs under its own name: the same ESLint rule registered as `miroir/<smell-id>`,
// so eslint-suppressions.json counts each smell apart. The miroir-code-quality skill has an entry per smell id.
const restrictedSyntax = builtinRules.get("no-restricted-syntax");
const restrictedGlobals = builtinRules.get("no-restricted-globals");
const miroir = {
  rules: {
    layers: miroirLayers,
    "action-result": restrictedSyntax,
    "type-escape": restrictedSyntax,
    "global-environment": restrictedSyntax,
    "pub-sub": restrictedSyntax,
    "component-io": restrictedGlobals,
  },
};

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
    files: ["packages/*/{src,test,tests}/**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { "react-hooks": reactHooks, miroir },
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: {
      // Too many existing violations for a minimal set; candidates for later issues.
      "@typescript-eslint/no-explicit-any": "off", // 3832
      "@typescript-eslint/no-unused-vars": "off", // 1055
      "@typescript-eslint/no-empty-object-type": "off", // 14, type-level style
      "@typescript-eslint/no-unsafe-function-type": "off", // 5, type-level style
      "no-fallthrough": "off", // 47, each case needs a decision: `break` or `// falls through`
      // Added to js.configs.recommended by eslint 10.
      "no-useless-assignment": "off", // 64
      "preserve-caught-error": "off", // 5
      "no-unassigned-vars": "off", // 1

      // Hooks called conditionally or in callbacks break React's state ordering.
      "react-hooks/rules-of-hooks": "error",

      // Implementation imports flow downwards only between numbered layers (AGENTS.md, "Architecture").
      "miroir/layers": "error",
    },
  },
  {
    // Smells that graduated from the smell lens (#340, analysis D7). The messages of the miroir/<smell-id> rules carry
    // the smell id in brackets; the runner of the smell lens (scripts/code_smells.py) maps the stock rules to theirs.
    files: SRC,
    ignores: TESTS,
    rules: {
      "miroir/action-result": ["error", ...actionResult],
      "miroir/type-escape": ["error", ...typeEscape],
      "react-hooks/set-state-in-effect": "error", // effect-derived-state
      "max-depth": ["error", 4], // deep-nesting
    },
  },
  {
    files: SRC,
    ignores: [...TESTS, ...ROOTS],
    rules: {
      "miroir/global-environment": ["error", ...globalEnvironment],
    },
  },
  {
    files: VIEW,
    ignores: [...TESTS, ...ROOTS],
    rules: {
      "miroir/pub-sub": ["error", ...pubSub],
      "miroir/component-io": ["error", ...componentIo],
    },
  },
  {
    // The components and hooks of the standalone app's 4-tests folder are views, though the folder is a root.
    files: TEST_SESSION_VIEWS,
    ignores: TESTS,
    rules: {
      "miroir/pub-sub": ["error", ...pubSub],
      "miroir/component-io": ["error", ...componentIo],
    },
  },
  {
    files: ["packages/*/{test,tests}/**/*.{ts,tsx}", "packages/*/src/**/*.{test,spec}.{ts,tsx}"],
    rules: {
      // A committed `.only` silently skips every other test in the file.
      "no-restricted-properties": [
        "error",
        ...["describe", "it", "test"].map((object) => ({
          object,
          property: "only",
          message: "Remove .only before committing.",
        })),
      ],
    },
  },
  {
    // @miroir-framework/jzod and jzod-ts are reached only through the adapter of miroir-core (#145): mlJzodAdapter.ts (valueToMl, mlToZod,
    // mlToZodTextAndZodSchema, exported by miroir-core) and mlJzodTsAdapter.ts (mlToTs, Node-only `miroir-core/ml-to-ts`).
    // Every source file of every package is covered, scripts and config files included.
    files: ["packages/**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}"],
    ignores: ["packages/miroir-core/src/1_core/mls/mlJzodAdapter.ts", "packages/miroir-core/src/1_core/mls/mlJzodTsAdapter.ts"],
    languageOptions: { parser: tseslint.parser },
    rules: {
      "no-restricted-imports": [
        "error",
        ...["@miroir-framework/jzod", "@miroir-framework/jzod-ts"].map((name) => ({
          name,
          message: "Use the ML adapter of miroir-core: valueToMl, mlToZod, mlToZodTextAndZodSchema, or mlToTs from miroir-core/ml-to-ts.",
        })),
      ],
    },
  },
  {
    // `declare global { var ... }` requires `var`.
    files: ["packages/*/{src,test,tests}/**/*.d.ts"],
    rules: { "no-var": "off" },
  },
  {
    // Legacy JSON loading through require(); not worth rewriting in a lint change.
    files: ["packages/miroir-core/src/index.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
);
