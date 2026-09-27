// Minimal lint rules for the miroir monorepo (#325). Every rule here is an error and the codebase passes it.
// Rules that still have violations are switched off below with their count, so they can be enabled one at a time.
// Run: npm run lint
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import miroirLayers from "./eslint-rules/miroir-layers.mjs";

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
    plugins: { "react-hooks": reactHooks, miroir: { rules: { layers: miroirLayers } } },
    linterOptions: { reportUnusedDisableDirectives: "off" },
    rules: {
      // Too many existing violations for a minimal set; candidates for later issues.
      "@typescript-eslint/no-explicit-any": "off", // 3832
      "@typescript-eslint/no-unused-vars": "off", // 1055
      "@typescript-eslint/no-empty-object-type": "off", // 14, type-level style
      "@typescript-eslint/no-unsafe-function-type": "off", // 5, type-level style
      "no-fallthrough": "off", // 47, each case needs a decision: `break` or `// falls through`

      // Hooks called conditionally or in callbacks break React's state ordering.
      "react-hooks/rules-of-hooks": "error",

      // Implementation imports flow downwards only between numbered layers (AGENTS.md, "Architecture").
      "miroir/layers": "error",
    },
  },
  {
    files: ["packages/*/tests/**/*.{ts,tsx}", "packages/*/src/**/*.{test,spec}.{ts,tsx}"],
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
    // `declare global { var ... }` requires `var`.
    files: ["packages/*/{src,tests}/**/*.d.ts"],
    rules: { "no-var": "off" },
  },
  {
    // Legacy JSON loading through require(); not worth rewriting in a lint change.
    files: ["packages/miroir-core/src/index.ts"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Known rules-of-hooks violations (72 in 14 files, #325). Remove a file once it is fixed; never add one.
    files: [
      "packages/miroir-localcache-zustand/src/react/hooks.ts",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/ReduxHooks.ts",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/EndpointActionCaller.tsx",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/JsonObjectEditFormDialog.tsx",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportHooks.ts",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/TypedValueObjectEditor.tsx",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/FormComponents.tsx",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor.tsx",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/BlobEditorField.tsx",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlElementEditor.tsx",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlElementEditorReactCodeMirror.tsx",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/MlObjectEditor.tsx",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ModelDiagramPage.tsx",
      "packages/miroir-standalone-app/src/miroir-fwk/4_view/tools/renderPerformanceMeasure.tsx",
    ],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  {
    // Known upward imports (26 in 16 files, #325). Remove a file once it is fixed; never add one.
    files: [
      "packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchema.ts",
      "packages/miroir-core/src/0_interfaces/1_core/bootstrapMlSchemas/getMiroirFundamentalMlSchemaHelpers.ts",
      "packages/miroir-core/src/1_core/Deployment.ts",
      "packages/miroir-core/src/1_core/Menu.ts",
      "packages/miroir-core/src/1_core/localCache/partialMutationGuard.ts",
      "packages/miroir-core/src/1_core/localCache/reportQueryLoadSegment.ts",
      "packages/miroir-core/src/1_core/mls/getDefaultValueForMlSchema.ts",
      "packages/miroir-core/src/1_core/mls/mlsResolveSchemaReferenceInContext.ts",
      "packages/miroir-core/src/1_core/mls/mlsTypeCheck.ts",
      "packages/miroir-core/src/1_core/mls/resolveConditionalSchema.ts",
      "packages/miroir-core/src/2_domain/ResolveCompositeActionTemplate.ts",
      "packages/miroir-core/src/2_domain/TransformerInterfaceInference.ts",
      "packages/miroir-core/src/3_controllers/DomainController.ts",
      "packages/miroir-core/src/3_controllers/MiroirEventService.ts",
      "packages/miroir-store-postgres/src/1_core/SqlGenerator.ts",
      "packages/miroir-store-postgres/src/1_core/SqlQueryBuilder.ts",
    ],
    rules: { "miroir/layers": "off" },
  },
);
