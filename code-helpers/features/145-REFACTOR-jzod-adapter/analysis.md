# #145 step 2: one Jzod adapter in miroir-core

Issue: https://github.com/miroir-framework/miroir/issues/145 (ACs revised 2026-09-28). Step 1 (ML nomenclature, AC 1) is
`code-helpers/features/145-REFACTOR-ml-nomenclature/`.

## Goal

- AC 2: one adapter module in miroir-core wraps the Jzod functions Miroir uses, with Miroir-typed signatures over
  `MlElement`. The casts to and from Jzod's types live only there.
- AC 3: no other file imports `@miroir-framework/jzod` or `@miroir-framework/jzod-ts`; `no-restricted-imports` in
  `eslint.config.mjs` enforces it. Packages other than miroir-core drop their direct jzod dependencies. The miroir-core
  type generator goes through the adapter.

Out of scope: a `miroir-core-ml` package; moving the meta-schema JSON.

## Current state (on `_integration` 7fd0c14)

| Jzod function | Call sites |
|---|---|
| `valueToJzod` | `miroir-core/src/1_core/mls/mlsTypeCheck.ts` (6), 5 standalone-app view files (`MlArrayEditor.tsx`, `MlElementEditorHooks.ts`, `listDisplayByTransformer.ts`, `TransformerEditor.tsx`, `TransformerEventsPanel.tsx`), each followed by `as MlElement` |
| `jzodToZodTextAndZodSchema` | `miroir-mcp/src/tools/mcpHandlersForEndpoint.ts`, `miroir-cli/src/commands/commandsFromEndpoint.ts` (both `resolvedMlSchema as any`), `miroir-core/scripts/generate-ts-types.ts` |
| `jzodToZod` | `miroir-core/tests/1_core/zodParseError.test.ts` |
| `jzodToTsCode`, `jzodToZodTextAndZodSchemaForTsGeneration` (jzod-ts) | `miroir-core/scripts/generate-ts-types.ts`, `miroir-store-postgres/scripts/postgres-generate-ts-types.ts` (`jzodToTsCode` only) |

Declared jzod dependencies: miroir-core (jzod, dev jzod-ts), miroir-standalone-app (jzod, dev jzod-ts unused),
miroir-mcp, miroir-cli, miroir-sandbox (jzod, unused), miroir-store-postgres (jzod-ts).

## Design

**D1. Two files, one adapter.** jzod-ts depends on `zod-to-ts` and `typescript`, which must stay out of the browser
bundle of miroir-core's main entry. So the adapter is split by entry point, both files in `src/1_core/mls/`:

- `mlJzodAdapter.ts`, exported from `miroir-core`: `valueToMl`, `mlToZod`, `mlToZodTextAndZodSchema`, and the Miroir
  types `MlZodTextAndZodSchema`, `MlZodTextAndZodSchemaRecord`, `MlToZodOptions`.
- `mlJzodTsAdapter.ts`, exported from the Node-only subpath `miroir-core/ml-to-ts` (like `miroir-core/model-validation-fs`):
  `mlToTs`, `mlToZodTextAndZodSchemaForTsGeneration`. jzod-ts moves from devDependencies to dependencies of miroir-core,
  since the subpath is public.

The signatures take and return `MlElement`; `MlZodTextAndZodSchema` restates Jzod's `ZodTextAndZodSchema` shape so no
caller names a Jzod type.

**D2. Lint rule.** A separate `eslint.config.mjs` block with only `no-restricted-imports` for both packages, over
every TS and JS file under `packages/` (scripts and config files included, so the generators are covered), ignoring
the two adapter files. A `node --test` case in `eslint-rules/` checks the block, run by `npm run lint`.

**D3. ML nomenclature guard.** The adapter file names contain "Jzod"; `scripts/check_ml_nomenclature.py` allows Jzod
names in the adapter files, the one place they are legitimate, and drops the generator scripts from its jzod-ts
allowlist once they no longer use jzod-ts names.

**D4. Generator output unchanged.** `npm run devBuild -w miroir-core` must regenerate `preprocessor-generated/`
byte-for-byte, and `npm run generate-ts-types -w miroir-store-postgres` likewise.

## Risks

- `miroir-core/ml-to-ts` resolves to `dist/`, so the store-postgres generator needs a built miroir-core (it already
  imports `miroir-core`).
- Lockfile: removing workspace dependencies changes `package-lock.json`; `scripts/check_dependency_policy.py` must
  still pass.
