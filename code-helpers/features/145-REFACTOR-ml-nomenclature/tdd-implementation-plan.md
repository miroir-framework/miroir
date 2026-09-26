# Issue #145 — TDD Implementation Plan (step 1: ML / MLS nomenclature)

> A rename has no new runtime behavior, so each slice's RED test is the **ML nomenclature guard**
> (`scripts/check_ml_nomenclature.py`): the slice first extends the guard's enforced rules to its scope, the guard
> fails on the remaining Jzod names (RED), the slice renames them (GREEN). The regression net is the existing
> integration-first suites, run for real (no mocks): MiroirTest unit tier, deployment `modelValidation`,
> miroir-core vitest, and the nonreg tiers on the emulated filesystem / indexedDb servers.
> Tracer bullet (Slice 1): an ML schema referencing `mlElement` validates and generates the `MlElement` TS type.
>
> **Execution model:** the user asked for one commit per slice on the working branch, each commit green.
> Each slice ends with its Validation commands; on success its Realization is appended and Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/145
Working branch: `claude/rename-jzod-to-ml-2ucg0f` → draft PR against `aba`

**Resume note:** plan written; baseline on `aba` @ `256e625` is green (miroir-core `tsc`; vitest 156 files / 2023 tests passed, 1 skipped).

---

## Scope

- Rename the 25 meta-schema definitions `jzod<X>` → `ml<X>` and every reference to them (assets, generated types, TS code).
- Rename Miroir's schema-tool modules, functions and types (`1_core/jzod/` → `1_core/mls/`), with the MiroirTest
  `module` / `export` keys that point at them.
- Rename the applicative transformer names and parameters (`jzodTypeCheck` → `mlsTypeCheck`, …) and the MiroirTest suites.
- Rename remaining identifiers and files in every package, UI components and labels included.
- Update docs and agent files; enforce the guard repo-wide.

This plan does **not** create the `miroir-core-ml` package (#145 step 2), normalise `MMLS` names (deferred), or
migrate deployments stored outside the repository (clean break, see analysis D6).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Guard + inventory lock | ⬜ | guard script GREEN with empty scope; nonreg `unit` step registered |
| 1 | ML definitions: `mlElement` & co (tracer) | ⬜ | guard rule D; `modelValidation` all deployments; `devBuild`; `tsc` all packages |
| 2 | Schema-tool modules `1_core/mls/` | ⬜ | guard scope `1_core/`; MiroirTest functionCallTest suites (unit) |
| 3 | Transformers `mlsTypeCheck`, `ansiColumnsToMlSchema` | ⬜ | guard scope transformer assets; `miroirCoreTransformers` unit + integ (filesystem) |
| 4 | Remaining miroir-core and non-UI packages | ⬜ | guard scope `packages/` minus standalone-app; `tsc` per package; nonreg unit |
| 5 | Standalone-app UI (editors, labels, component tests) | ⬜ | guard scope `packages/`; component-test nonreg steps |
| 6 | Docs, agent files, repo-wide guard, final nonreg | ⬜ | guard repo-wide; `nonreg:filesystem` + indexedDb; AC checklist |

---

## Locked implementation defaults

Copied from the analysis decision record (D1–D11); binding for this plan.

| Decision | Choice |
|---|---|
| Scope | Names only; `miroir-core-ml` package later |
| Prefixes | `Ml` language constructs · `MlSchema` "Jzod schema" values · `Mls` operations on schemas |
| `MMLS` names | untouched |
| jzod-ts types in Miroir code | replaced by Miroir's generated `Ml*` types, except `packages/miroir-core/scripts/generate-ts-types.ts` and `packages/miroir-store-postgres/scripts/postgres-generate-ts-types.ts` |
| Persisted names | renamed (clean break, no aliases, no migration script) |
| Labels / docs | renamed; `code-helpers/features/*`, `docs-OLD/` untouched |
| File renames | `git mv` only (history continuity) |
| Delivery | one draft PR against `aba`, one green commit per slice |

### Guard allowlist (never reported)

| Allowed | Why |
|---|---|
| `@miroir-framework/jzod`, `@miroir-framework/jzod-ts` (imports, deps, paths) | external packages |
| `jzodToZodTextAndZodSchema`, `valueToJzod`, `ZodTextAndZodSchema`, `jzodToTsCode`, `jzodToZodTextAndTsTypeAliases`, `jzodToZodTextAndZodSchemaForTsGeneration` | names exported by the external packages |
| the two code-generation scripts above | they drive the jzod-ts API with its own types |
| the word `Jzod` as a project name, and `jzod` / `jzod-ts` as repo names | prose about the external project |
| `package-lock.json`, `code-helpers/`, `docs-OLD/`, `graphify-out/`, `node_modules/`, `dist/` | lockfile, history, generated |
| `scripts/check_ml_nomenclature.py` itself | holds the patterns |

---

## Allocated keys

| Artefact | Value |
|---|---|
| Guard script | `scripts/check_ml_nomenclature.py` |
| Nonreg step | `unit-check-ml-nomenclature` (tier `unit`, requires `none`) |

No new model element or MiroirTest suite uuid: renamed assets keep their uuids.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Guard | `python3 scripts/check_ml_nomenclature.py` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir -w miroir-test-app_deployment-admin && npm run devBuild -w miroir-core` |
| Package builds used by tests | `npm run build -w miroir-store-bundled -w miroir-store-postgres -w miroir-test-app_deployment-library` (+ packages touched) |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` for every touched package |
| miroir-core vitest | `npm run test -w miroir-core -- ''` |
| MiroirTest unit tier | `npm run testMiroir -w miroir-core -- --mode unit` |
| Deployment validation | `npm run testByFile -w miroir-test-app_deployment-<app> -- tests/modelValidation.unit.test.ts` (miroir, admin, library, designer) |
| Nonreg unit | `npm run nonreg:unit` |
| Nonreg integration (no Postgres here) | `npm run nonreg:filesystem`, then `python scripts/run-nonreg.py --tier default --run-all --profile emulatedServer-indexedDb` |
| Postgres tier | run once locally by the user before merge: `npm run nonreg:default` |

"Slice gate" below = guard + `tsc` of touched packages + miroir-core vitest + `npm run nonreg:unit`.

---

## Slice 0 — Guard and inventory lock

**Status:** ⬜ pending

### Goal

A contributor can run one command that reports every Jzod name outside the allowlist, and fails for the scopes
already migrated.

### 0.1 RED → GREEN

**Test:** `python3 scripts/check_ml_nomenclature.py --self-test` (vitest not used: the guard scans the repository,
like `check_bare_console.py`, and is not reachable through the ML).

Behavior asserted:
- tokens matching `[A-Za-z0-9_]*jzod[A-Za-z0-9_]*` (case-insensitive) in tracked files are collected with file:line;
- allowlisted tokens / files (table above) are never reported;
- a rule = (path prefixes, token regex); a hit inside an enforced rule exits 1 and prints `file:line token`;
- with `ENFORCED_RULES = []` it exits 0 and prints the inventory summary (per top-level dir counts);
- `--self-test` checks the matcher on inline samples (allowlisted import line, prose "Jzod", `JzodElement` hit).

### 0.2 GREEN

Write the script; register `unit-check-ml-nomenclature` in `scripts/nonreg-manifest.json` (tier `unit`, after
`unit-check-bare-console`). Record the inventory numbers in this plan's Realization (they must match analysis § Current state).

### Refactor checkpoint

Keep the script flat (one file, pure functions), mirroring `check_bare_console.py`.

### Validation

```bash
python3 scripts/check_ml_nomenclature.py --self-test && python3 scripts/check_ml_nomenclature.py
python scripts/run-nonreg.py --tier unit --only unit-check-ml-nomenclature   # or the runner's equivalent filter
```

### Realization

---

## Slice 1 — ML definitions `mlElement` & co (tracer bullet)

**Status:** ⬜ pending

### Goal

An application designer writes `{"type":"schemaReference","definition":{"absolutePath":"fe9b7d99-…","relativePath":"mlElement"}}`
and it resolves; the generated TS types are `MlElement`, `MlObject`, …; the old names no longer exist.

**Layers cut:** meta-schema JSON → fundamental schema builder → generated `miroirFundamentalType.ts` /
`miroirFundamentalJzodSchema.ts` → every package's TS using those types → all deployment and test JSON assets.

### 1.1 RED

Enable rule **D** (repo-wide, all paths but the allowlist): tokens `jzod<X>` / `Jzod<X>` / `60e1a1ebb739_jzod<X>` for the
25 definitions `<X>` of analysis § 1, and `jzodMiroirBootstrapSchema`. Guard fails (≈ 3 000 hits).

### 1.2 GREEN

1. Bootstrap schema `1e8dab4b-…`: rename the 25 context keys; `name` → `mlMiroirBootstrapSchema`;
   `defaultLabel` → "The ML Schema for Miroir ML Schemas. Parses itself."
2. Rewrite every `relativePath` and every other occurrence of those tokens in JSON assets (all deployment packages,
   `packages/*/tests/**`, `miroir-core/src/assets/**`), by exact-token substitution (script, word boundaries, reviewed diff).
3. Same exact-token substitution in TS/TSX, including local variables named `jzodElement` (`→ mlElement`) — they name ML elements.
4. D4: the four files importing these types from `@miroir-framework/jzod-ts` import Miroir's generated `Ml*` types instead.
5. Schema rebuild; regenerated `preprocessor-generated/*` committed.

### Refactor checkpoint

Check the generated diff is a pure rename (`git diff --stat` on `preprocessor-generated/`, spot-check no structural change).

### Validation

```bash
python3 scripts/check_ml_nomenclature.py
npm run build -w miroir-test-app_deployment-miroir -w miroir-test-app_deployment-admin && npm run devBuild -w miroir-core
npm run build -w miroir-store-bundled -w miroir-store-postgres -w miroir-test-app_deployment-library
for p in miroir-core miroir-localcache-redux miroir-localcache-zustand miroir-store-filesystem miroir-store-indexedDb miroir-store-postgres miroir-store-mongodb miroir-store-bundled miroir-react miroir-mcp miroir-cli miroir-ai miroir-diagram-class miroir-standalone-app; do npx tsc --noEmit --skipLibCheck -p packages/$p/tsconfig.json || echo "TSC FAIL $p"; done
for a in miroir admin library; do npm run testByFile -w miroir-test-app_deployment-$a -- tests/modelValidation.unit.test.ts; done
npm run testByFile -w miroir-test-app_deployment-designer -- modelValidation
npm run test -w miroir-core -- ''
npm run nonreg:unit
```

### Realization

---

## Slice 2 — Schema-tool modules `1_core/mls/`

**Status:** ⬜ pending

### Goal

A contributor finds the schema machinery under `miroir-core/src/1_core/mls/` with `Mls*` / `Ml*` names, and a
MiroirTest functionCallTest targets `miroir-core/1_core/mls/<module>` / `<export>`.

**Layers cut:** TS modules (`git mv`) → `index.ts` exports → `FunctionCallTestRegistry.ts` keys → MiroirTest assets
(`module`, `export`, suite names/labels) → consumers in all packages.

### 2.1 RED

Enable rule **M**: paths `packages/miroir-core/src/1_core/`, `packages/miroir-core/src/5_tests/FunctionCallTestRegistry.ts`,
and the `module` / `export` values of MiroirTest assets; any Jzod token. Guard fails.

### 2.2 GREEN

`git mv packages/miroir-core/src/1_core/jzod packages/miroir-core/src/1_core/mls`, then per file (git mv) and per export,
following the naming rule, e.g. `jzodTypeCheck.ts` → `mlsTypeCheck.ts` (`jzodTypeCheck` → `mlsTypeCheck`,
`JzodTypeCheckResult`-style types → `Mls…`), `JzodToJzod_Summary.ts` → `MlsToMls_Summary.ts`, `JzodToJsonSchema.ts` → `MlsToJsonSchema.ts`,
`JzodSchemaReferences.ts` → `MlSchemaReferences.ts`, `jzodObjectFlatten.ts` → `mlObjectFlatten.ts`,
`jzodUnion_RecursivelyUnfold.ts` → `mlUnion_RecursivelyUnfold.ts`, `JzodUnfoldSchemaOnce.ts` → `MlsUnfoldSchemaOnce.ts`,
`jzodResolveSchemaReferenceInContext.ts` → `mlsResolveSchemaReferenceInContext.ts`, `getDefaultValueForJzodSchema.ts` →
`getDefaultValueForMlSchema.ts`, `getAttributeTypesFromJzodSchema.ts` → `getAttributeTypesFromMlSchema.ts`,
`1_core/postgres/ansiColumnsToJzodSchema.ts` → `ansiColumnsToMlSchema.ts`; interfaces `jzodTypeCheckInterface.ts`,
`jzodUnion_RecursivelyUnfoldInterface.ts` likewise. Registry keys and MiroirTest `module`/`export` strings updated in
the same commit. The full old → new identifier table is appended to the Realization.

Transformer-facing names (`transformer_jzodTypeCheck`, transformerType strings) stay for Slice 3.

### Refactor checkpoint

Remove dead re-exports revealed by the move; no behavior change.

### Validation

Slice gate, plus:

```bash
npm run testMiroir -w miroir-core -- --mode unit
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
```

### Realization

---

## Slice 3 — Transformers `mlsTypeCheck` and `ansiColumnsToMlSchema`

**Status:** ⬜ pending

### Goal

A transformer designer writes `{"transformerType": "mlsTypeCheck", …}` with ML-named parameters and it runs in memory
and through the emulated server; `jzodTypeCheck` is no longer a transformer.

**Layers cut:** TransformerDefinition instances (`miroir_data/a557419d-…`) → `Transformers.ts` / `TransformersForRuntime.ts`
→ generated transformer types (schema rebuild) → MiroirTest transformer suites and their names → `scripts/nonreg-manifest.json`.

### 3.1 RED

Enable rule **T**: `miroir_data/a557419d-…` (TransformerDefinition), `2_domain/Transformers*.ts`, and JSON fields
`transformerType`, `transformerName`, `inMemoryImplementationFunctionName`, plus parameter keys
`relativeReferenceJzodContext`, `rawJzodSchema`, `rawJzodSchemaType`, `valueJzodSchema`. Guard fails.

### 3.2 GREEN

`jzodTypeCheck` → `mlsTypeCheck`, `ansiColumnsToJzodSchema` → `ansiColumnsToMlSchema`, `spreadSheetToJzodSchema` →
`spreadSheetToMlSchema`, `transformer_jzodTypeCheck` → `transformer_mlsTypeCheck`,
`handleTransformer_ansiColumnsToJzodSchema` → `handleTransformer_ansiColumnsToMlSchema`; parameters per analysis
§ Renamed applicative names; MiroirTest suite names (`jzodTypeCheck_TransformerTestSuite` → `mlsTypeCheck_TransformerTestSuite`, …).
Schema rebuild. Nonreg manifest references updated if any suite name it cites changed.

### Refactor checkpoint

None expected beyond the rename.

### Validation

Slice gate, plus:

```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testMiroir -w miroir-core -- --mode unit
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites miroirCoreTransformers --mode integration
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
```

### Realization

---

## Slice 4 — Remaining miroir-core and non-UI packages

**Status:** ⬜ pending

### Goal

No Jzod name remains in any package except miroir-standalone-app and the allowlist.

**Layers cut:** miroir-core (`bootstrapJzodSchemas/` → `bootstrapMlSchemas/` by `git mv`, `JzodSchemaDefinition.ts` →
`MlSchemaDefinition.ts`, `miroirFundamentalJzodSchema*` → `miroirFundamentalMlSchema*` incl. the generated file name and
the generator script's output path, remaining locals), `index.ts` exports, and miroir-mcp (`jzodElementToJsonSchema.ts`
→ `mlElementToJsonSchema.ts`, `jzodElementToTS.ts` → `mlElementToTS.ts`, `jzodConversionContext.ts` →
`mlConversionContext.ts`), miroir-store-postgres, localcache*, react, diagram-class, cli, ai, sandbox, homepage,
deployment packages, `tsup.config.js`, test JSON (`fixtureRef`, `referenceName`, snapshot keys).

### 4.1 RED

Enable rule **P**: `packages/` except `packages/miroir-standalone-app/`. Guard fails.

### 4.2 GREEN

Rename by the naming rule, `git mv` for files, tests renamed with their subjects (e.g. `jzodToJzod_Summary.unit.test.ts`
→ `mlsToMls_Summary.unit.test.ts`; the issue-scoped `288-uuid-v4-jzodTypeCheck` test directory keeps its issue prefix but
takes the new name).

### Validation

Slice gate over every touched package, plus deployment `modelValidation` (4 packages), `npm run test -w miroir-mcp`
(or its vitest script) and `npm run build` of touched library packages.

### Realization

---

## Slice 5 — Standalone-app UI

**Status:** ⬜ pending

### Goal

The value editors are `MlElementEditor`, `MlObjectEditor`, `MlArrayEditor`, `MlAnyEditor`, `MlUnionEditor`,
`MlEnumEditor`, `MlLiteralEditor`, `MlSimpleTypeEditor`, …; component MiroirTests target `MlElementEditor`; the UI says
"ML Schema".

**Layers cut:** components (`git mv`) → hooks (`useMlElementEditorHooks`) → component-test registry key → MiroirTest
component suites (`component`, suite names) → labels in reports (`miroir_data/3f2baa83-…`) → logger names in
`config/logging/scope-ui.json` → tests and test tools.

### 5.1 RED

Enable rule **P** on all of `packages/`. Guard fails.

### 5.2 GREEN

Rename; `JzodTools.ts` → `MlTools.ts`; `baseline-component-cases.txt` (#292) updated with the new component names.

### Validation

Slice gate, plus:

```bash
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
python scripts/run-nonreg.py --tier default --only appstack-miroir-component-tests   # runner's filter syntax
npm run testByFile -w miroir-standalone-app -- JzodElementEditor   # renamed: MlElementEditor
npm run build -w miroir-standalone-app
```

### Realization

---

## Slice 6 — Docs, agent files, repo-wide guard, final non-regression

**Status:** ⬜ pending

### Goal

The whole repository (minus allowlist) uses ML / MLS names, and the guard enforces it from now on.

### 6.1 RED

Enable rule **R**: repository root. Guard fails on docs, skills, scripts, workflow, Dockerfile, workspace file, homepage.

### 6.2 GREEN

Update `docs/`, `AGENTS.md`, `README.md`, `.agents/skills`, `.github/skills`, shell scripts, workflow, Dockerfile, VS Code
workspace, homepage HTML; keep prose that names the Jzod project. Run `graphify update .`. Add the renamed-names
table (analysis § Renamed applicative names) to `docs/reference/` for anyone migrating a deployment. Replace the
per-slice rules by rule R only.

### Tracer narrative

Manual: in the standalone app, open an Entity's `mlSchema` in the editor → attributes show `MlObjectEditor`; a
`schemaReference` to `mlElement` resolves. Automated equivalent: Slice 1 `modelValidation` + component tests of Slice 5.

### AC checklist (issue #145, step 1)

| Criterion | Proof |
|---|---|
| Miroir's meta-language is named ML / MLS in schemas, code and UI | guard rule R GREEN |
| Jzod referred to only as the external project | guard allowlist review |
| No regression | `nonreg:unit`, `nonreg:filesystem`, indexedDb profile GREEN; Postgres tier run by the user |

### Validation

```bash
python3 scripts/check_ml_nomenclature.py
npm run nonreg:unit
npm run nonreg:filesystem
python scripts/run-nonreg.py --tier default --run-all --profile emulatedServer-indexedDb
```

### Realization
