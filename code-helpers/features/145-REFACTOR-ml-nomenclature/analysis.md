# 145 — Replace the "Jzod" nomenclature by "ML" / "MLS"

> Analysis **and** decision record for renaming every Miroir-owned name that says "Jzod" to the meta-language
> vocabulary: **ML** (meta-language) and **MLS** (meta-language schema). Jzod remains an external project that
> Miroir uses; only names that designate Miroir's own meta-language change.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/145 — *REFACTOR: distinguish the Miroir mlSchema from Jzod Schemas*
- Meta-schema (bootstrap schema, `MlSchema` instance `1e8dab4b-65a3-4686-922e-ce89a2d62aa9`):
  [`1e8dab4b….json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_data/5e81e1b9-38be-487c-b3e5-53796c57fccf/1e8dab4b-65a3-4686-922e-ce89a2d62aa9.json)
- Fundamental schema builder: [`getMiroirFundamentalJzodSchema.ts`](../../../packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts)
- Type generation: [`generate-ts-types.ts`](../../../packages/miroir-core/scripts/generate-ts-types.ts) (calls `@miroir-framework/jzod-ts`)
- MiroirTest function registry: [`FunctionCallTestRegistry.ts`](../../../packages/miroir-core/src/5_tests/FunctionCallTestRegistry.ts)
- Precedent guard script: [`scripts/check_bare_console.py`](../../../scripts/check_bare_console.py) (#237)
- TDD plan: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md)

## Status / sequencing

| Step | Scope | Status |
|---|---|---|
| 1 | Rename Miroir-owned Jzod names to ML / MLS (this analysis) | **this issue** |
| 2 | Isolate every use of the Jzod packages behind a `miroir-core-ml` package (issue #145 TARGET) | later |
| — | Normalise the older `MMLS` spellings (`ifThenElseMMLS`, `mmlsReference`) | later, not scheduled |

## Why

The Miroir meta-language started as Jzod and is still very close to it, but it has diverged: the `tag` extension
(`jzodBaseObject.tag`, with `value.display`, `value.editor`, `value.selectorParams`, `value.ifThenElseMMLS`, …, defined in
the bootstrap schema above) exists only in Miroir. Names like `JzodElement`, `jzodTypeCheck` or
`JzodObjectEditor` present Miroir's language as Jzod, which blurs the boundary issue #145 wants: Jzod is a separate
project that Miroir *uses* to build its own language.

## Decision record (confirmed with user, 2026-09-26)

| # | Decision | Options | Choice |
|---|---|---|---|
| D1 | Scope of this work | (a) names only; (b) names + `miroir-core-ml` package | **(a) Accepted.** The package is step 2. |
| D2 | Prefix scheme | (a) three prefixes `Ml` / `MlSchema` / `Mls`; (b) single `Ml` prefix | **(a) Accepted**, see § Naming rule. (b) rejected: `mlTypeCheck` reads as "type check of ML" not "of a schema", and the repo already has `mlsTypeCheckError`. |
| D3 | Existing `MMLS` names (`ifThenElseMMLS` 171 uses, `mmlsReference` 155 uses) | normalise now / later | **Deferred.** Also persisted in data; keeps this change reviewable. |
| D4 | Files importing `JzodElement` / `JzodObject` / `JzodReference` from `@miroir-framework/jzod-ts` | keep jzod-ts types / switch to Miroir's generated `Ml*` types | **Switch**, except the code-generation scripts that call the jzod-ts API. |
| D5 | Persisted, applicative names (transformer types, transformer params, schema name, MiroirTest names, `module`/`export` keys) | rename / keep | **Rename**, `scripts/nonreg-manifest.json` updated with them. |
| D6 | Stored deployments outside the repo | deprecated aliases / clean break | **Clean break.** Rejected aliases: they double the meta-schema and the generated types. No migration script; the rename table (§ Renamed applicative names) is the migration reference. |
| D7 | User-visible labels ("Jzod Schema" …) | rename / keep | **Rename** to "ML Schema" etc. |
| D8 | Docs and agent instructions | — | Update `docs/`, `AGENTS.md`, `README.md`, `.agents/skills`, `.github/skills`; run `graphify update .`. `code-helpers/features/*` and `docs-OLD/` are history and stay untouched. |
| D9 | Test vehicle for a rename | vitest guard / python guard | **A repository guard** scanning for Jzod names outside an allowlist, whose enforced scope grows slice by slice. Implemented as a python script like `check_bare_console.py` (#237) and wired in the nonreg `unit` tier. Existing suites are the regression net. |
| D10 | Non-regression | — | Per slice: `tsc` of touched packages, miroir-core unit tests, `npm run nonreg:unit`. Slices touching schemas/assets and the final slice: `npm run nonreg:filesystem` (and indexedDb profile). The user runs the Postgres integration tier locally before merge. |
| D11 | Delivery | one PR / stacked PRs | **One draft PR against `aba`, one green commit per slice.** File renames use `git mv` so history stays continuous. |

### Naming rule

| Prefix | Used when the name designates | Examples |
|---|---|---|
| `Ml` / `ml` | a construct of the language (element kinds, their types, their editors) | `JzodElement` → `MlElement`, `jzodObject` → `mlObject`, `JzodObjectEditor` → `MlObjectEditor` |
| `MlSchema` / `mlSchema` | a value of the language used as a schema (the name said "Jzod schema") | `miroirFundamentalJzodSchema` → `miroirFundamentalMlSchema`, `valueJzodSchema` → `valueMlSchema` |
| `Mls` / `mls` | an operation on schemas, where `MlSchema` would be clumsy | `jzodTypeCheck` → `mlsTypeCheck`, `jzodToJzod_Summary` → `mlsToMls_Summary` |

This aligns with names already in the repo: `mlSchema` (1705 uses), `MlSchema` entity `5e81e1b9-…`,
`mlElementTemplate`, `mlsTypeCheckError.ts`, `isMlSchemaSubtype`.

### What stays "Jzod"

- The packages `@miroir-framework/jzod` and `@miroir-framework/jzod-ts`: `package.json` dependencies, imports, and the
  names they export and Miroir calls (`jzodToZodTextAndZodSchema`, `valueToJzod`, `ZodTextAndZodSchema`, `jzodToTsCode`,
  `jzodToZodTextAndTsTypeAliases`, `jzodToZodTextAndZodSchemaForTsGeneration`).
- The jzod-ts types used by the two code-generation scripts that call the jzod-ts API
  (`packages/miroir-core/scripts/generate-ts-types.ts`, `packages/miroir-store-postgres/scripts/postgres-generate-ts-types.ts`).
- Prose naming the Jzod project itself (e.g. "the ML derives from Jzod", sibling-repo notes in `AGENTS.md`).
- History: `code-helpers/features/*`, `docs-OLD/`.

## Goals

1. **Read the language by its own name** — In order to understand which constructs are Miroir's own, as an
   application designer, I can write and read ML schemas whose element kinds are named `mlElement`, `mlObject`, …
   (`{"type": "schemaReference", "definition": {"absolutePath": "…", "relativePath": "mlElement"}}`).
2. **Type-check with ML transformers** — In order to validate values against a schema from a model, as a
   transformer designer, I can use the `mlsTypeCheck` and `ansiColumnsToMlSchema` transformers, with ML-named parameters.
3. **Navigate the code by ML names** — In order to find the meta-language machinery without knowing its history, as a
   framework contributor, I can rely on `Ml*` / `Mls*` names for types, functions, files and UI components, and on
   Jzod appearing only where the external packages are used.
4. **Select tests by ML names** — In order to run the meta-language test suites, as a framework contributor, I can
   pass ML-named suites to `testMiroir --suites` and the nonreg manifest.

### Non-goals

- A `miroir-core-ml` package isolating Jzod (issue #145 TARGET) — follow-up.
- Normalising `MMLS` names (D3) — later.
- Migrating deployments that live outside the repository (D6).
- Renaming inside the sibling `jzod` / `jzod-ts` repositories.

## Current state

Counts on `aba` @ `256e625`, excluding `package-lock.json`, `graphify-out/` (untracked), `code-helpers/`, `docs-OLD/`.

| Measure | Value |
|---|---|
| Occurrences of `jzod` (case-insensitive) | 7 731 |
| Distinct identifiers containing `jzod` | ≈ 510 |
| Files: `.ts` / `.tsx` / `.json` / `.md` / `.sh` / `.yml` / other | 206 / 85 / 94 / 42 / 6 / 1 / 7 |
| Tracked paths containing `jzod` | 55 (21 of them in `packages/miroir-core/src/1_core/jzod/`) |

### 1. Meta-schema definitions (the language itself)

The bootstrap schema `1e8dab4b-…` (`name: "jzodMiroirBootstrapSchema"`, `defaultLabel: "The Jzod Schema for Miroir Jzod
Schemas. Parses itself."`) declares 25 definitions in `definition.context`:

`jzodArray`, `jzodAttributeDateValidations`, `jzodAttributeNumberValidations`, `jzodAttributePlainDateWithValidations`,
`jzodAttributePlainNumberWithValidations`, `jzodAttributePlainStringWithValidations`, `jzodAttributeStringValidations`,
`jzodBaseObject`, `jzodElement`, `jzodEnum`, `jzodEnumAttributeTypes`, `jzodEnumElementTypes`, `jzodFunction`,
`jzodIntersection`, `jzodLazy`, `jzodLiteral`, `jzodMap`, `jzodObject`, `jzodPlainAttribute`, `jzodPromise`, `jzodRecord`,
`jzodReference`, `jzodSet`, `jzodTuple`, `jzodUnion`.

- Every schema in every deployment reaches them through `schemaReference` → `relativePath` (736 `relativePath` values
  contain `jzod`; absolute paths are `fe9b7d99-…` (fundamental, 708) and `1e8dab4b-…` (bootstrap, 77)).
- `generate-ts-types.ts` passes the fundamental schema to jzod-ts `jzodToTsCode`, which derives each TS type name from
  its definition key by capitalising it (`node_modules/@miroir-framework/jzod-ts/dist/index.js`, `jzodToTsCode`:
  `actualTypeName = typeName.replace(/^(.)(.*)$/, … b.toUpperCase() + c)`). Renaming the key `jzodElement` therefore
  renames `JzodElement` in `preprocessor-generated/miroirFundamentalType.ts` and `60e1a1ebb739_jzodElement` in
  `miroirFundamentalJzodSchema.ts`, with no generator change.
- Four files import the *jzod-ts* versions of these types instead of Miroir's generated ones:
  `1_core/jzod/JzodSchemaReferences.ts`, `bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts`,
  `bootstrapJzodSchemas/getMiroirFundamentalJzodSchemaHelpers.ts`, standalone-app `4_view/components/Graph/GraphInterfaces.ts` (D4).

### 2. Applicative names persisted in JSON assets (94 JSON files, 68 in `miroir-test-app_deployment-miroir`)

Programmatic enumeration (all JSON with `jzod`, fields whose string value contains `jzod`):

| JSON field | Values | Uses |
|---|---|---|
| `transformerType` | `jzodTypeCheck` / `ansiColumnsToJzodSchema` | 42 / 4 |
| `transformerName` | `jzodTypeCheck`, `ansiColumnsToJzodSchema`, `ansiColumnsToJzodSchemaFailed` | 42, 2, 1 |
| `inMemoryImplementationFunctionName` | `transformer_jzodTypeCheck`, `handleTransformer_ansiColumnsToJzodSchema` | 1, 1 |
| `module` (functionCallTest) | `miroir-core/1_core/jzod/{jzodTypeCheck, JzodToCopilotKitParameter, jzodObjectFlatten, JzodSchemaReferences, JzodToJzod_CarryOn, jzodUnion_RecursivelyUnfold, JzodToJzod_Summary, JzodToJsonSchema, JzodUnfoldSchemaOnce}`, `miroir-core/1_core/ansiColumnsToJzodSchema` | 169 |
| `export` (functionCallTest) | `jzodToCopilotKitParameter`, `jzodObjectFlatten`, `jzodUnionResolvedTypeForObject/Array`, `jzodTransitiveDependencySet`, `jzodUnion_recursivelyUnfold`, `ansiColumnsToJzodSchema`, `getAttributeTypesFromJzodSchema`, `JzodSchemaReferencesSet/List`, `jzodToJzod_Summary`, `jzodToJsonSchema`, `localizeJzodSchemaReferenceContext` | 125 |
| `component` (component test) | `JzodElementEditor` | 7 |
| `fixtureRef` / `referenceName` | `miroirFundamentalJzodSchema` / `newEntityJzodSchema` | 3 / 3 |
| `miroirTestLabel`, `name`, `defaultLabel`, `description`, `label`, `title` … | suite names such as `jzodTypeCheck_TransformerTestSuite`, `JzodObjectEditor_ComponentTestSuite`; labels "Jzod Schema" | ≈ 280 |

JSON **keys** containing `jzod` other than the 25 definitions: transformer / test parameters `relativeReferenceJzodContext` (54),
`rawJzodSchema` (43), `rawJzodSchemaType` (30), `valueJzodSchema` (11), `miroirFundamentalJzodSchema` (11),
`jzodSchemas`, `actionJzodObjectSchema` (test model snapshots `currentModel.json` / `currentMiroirModel.json`).

**Coupling to note:** functionCallTest `module` / `export` strings are keys of `FunctionCallTestRegistry.ts`
(e.g. `"miroir-core/1_core/jzod/JzodToJsonSchema": { jzodToJsonSchema }`). Moving or renaming a TS module and its
MiroirTest assets must happen in the same slice, or the MiroirTest unit tier breaks. The same holds for
`transformerType` ↔ `TransformersForRuntime.ts` (`transformer_jzodTypeCheck: jzodTypeCheckTransformer`) ↔ the
TransformerDefinition instance in `miroir_data/a557419d-…` (entity `TransformerDefinition`), and for `component` ↔ the
component-test registry in miroir-standalone-app.

### 3. TypeScript code

| Package | Files with `jzod` | Notes |
|---|---|---|
| miroir-core | ≈ 121 | `1_core/jzod/` (21 files), `bootstrapJzodSchemas/`, generated files, `index.ts` exports |
| miroir-standalone-app | ≈ 136 | editors `ValueObjectEditor/Jzod*Editor.tsx`, `JzodElementDisplay.tsx`, `JzodTools.ts`, tests |
| miroir-mcp | 11 | `jzodElementToJsonSchema.ts`, `jzodElementToTS.ts`, `jzodConversionContext.ts` |
| miroir-store-postgres | 9 | TS identifiers only (`jzodToPostgresTypeMap`, `valueJzodSchema`…); no table or column named after Jzod |
| localcache-redux / -zustand / localcache, react, diagram-class, cli, ai, sandbox, homepage, deployments | 1–6 each | |

Largest identifiers: `JzodElement` (849), `jzodElement` (571), `jzodTypeCheck` (382), `valueJzodSchema` (319),
`miroirFundamentalJzodSchema` (306), `JzodObject` (279).

### 4. Docs, agent files, tooling

42 markdown files (`docs/` 28, `.agents/skills` 8, `.github/skills` 2, `AGENTS.md`, `README.md`, …), 6 shell scripts,
`.github/workflows/build-linux-runnables.yml`, `docker/ci/Dockerfile`, the VS Code workspace file,
`miroir-homepage/*.html`, `packages/miroir-core/tsup.config.js`, standalone-app logging config `scope-ui.json`
(logger names such as `4_miroir-standalone-app_JzodElementEditorHooks`, which follow file names).

## Renamed applicative names (migration reference for external deployments)

| Old | New |
|---|---|
| `jzod<X>` definitions (25, § 1) | `ml<X>` (e.g. `jzodElement` → `mlElement`) |
| schema name `jzodMiroirBootstrapSchema` | `mlMiroirBootstrapSchema` |
| transformer `jzodTypeCheck` | `mlsTypeCheck` |
| transformer `ansiColumnsToJzodSchema` | `ansiColumnsToMlSchema` |
| params `relativeReferenceJzodContext`, `rawJzodSchema`, `rawJzodSchemaType`, `valueJzodSchema` | `relativeReferenceMlContext`, `rawMlSchema`, `rawMlSchemaType`, `valueMlSchema` |
| functionCallTest modules `miroir-core/1_core/jzod/*` | `miroir-core/1_core/mls/*` (file names per naming rule) |

The TDD plan keeps the full identifier map it applies; this table lists what a stored deployment can contain.

## Key reuse

| Piece | Location |
|---|---|
| Guard-script pattern + nonreg `unit` tier wiring | `scripts/check_bare_console.py`, `scripts/nonreg-manifest.json` step `unit-check-bare-console` |
| Schema rebuild chain | `npm run build -w miroir-test-app_deployment-miroir` → `npm run devBuild -w miroir-core` |
| Deployment validation | `tests/modelValidation.unit.test.ts` in each deployment package |
| MiroirTest function registry | `packages/miroir-core/src/5_tests/FunctionCallTestRegistry.ts` |
| Runtime transformer table | `packages/miroir-core/src/2_domain/TransformersForRuntime.ts` |

Next: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
