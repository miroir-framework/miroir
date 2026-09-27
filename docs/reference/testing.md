# Testing Reference

This page is the authoritative reference for how tests are structured, run, and extended in the Miroir framework.

---

## Overview

Miroir has these test layers:

| Layer | Location | Launcher | Store / runtime |
|-------|----------|----------|-----------------|
| **Unit (MiroirTest)** | `miroir-core` | `testMiroir` | In-memory, no persistence |
| **Unit (PLATFORM)** | package `tests/` | `testByFile` + optional `RUN_TEST` | TypeScript files that are not entity-backed |
| **MiroirTest integration** | `miroir-standalone-app` | `testMiroir` (`MIROIR_TEST_*`) | `IntegrationTestSession` — direct PersistenceStoreController / domainController |
| **App-stack integration** | `miroir-standalone-app` | `testByFile` (`VITE_MIROIR_*`) | `setupMiroirTest` — emulated or real HTTPS server |

**MiroirTest** suites (transformer, function-call, query, runner) are defined as deployment JSON entities and share runners in `miroir-core`. **App-stack** tests are hand-written Vitest files that exercise `DomainController`, persistence stores, extractors, and React views against a full client/server stack configured via JSON files under `tests/miroirConfig.test-*.json`.

### Parameter surface (argv preferred)

**Trajectory:** CLI **arguments are the main way to pass parameters**. Environment variables remain supported for CI and legacy scripts, but new work should prefer argv (`--suites`, `--tags`, `--mode`, `--filter`, `--profile`, `--storage`). Where both are present, **argv wins** for suite selection, tags, mode, filter, and storage. Explicit `VITE_MIROIR_*` / `MIROIR_TEST_*` values still override defaults supplied by `--profile`.

| Concern | Preferred argv | Env fallback (legacy / CI) |
|---------|----------------|----------------------------|
| Suites | `--suites` / `-s` | `MIROIR_TEST_SUITES` |
| Tags | `--tags` | `MIROIR_TEST_TAGS` |
| Mode | `--mode` / `-m` | `MIROIR_TEST_MODE` |
| Filter | `--filter` / `-f` | `MIROIR_TEST_FILTER` |
| Config preset | `--profile` / `-p` | `VITE_MIROIR_TEST_CONFIG_FILENAME` + related |
| Real-server store backend | `--storage` / `-S` (`sql` \| `filesystem` \| `indexedDb` \| `mongodb`) | `MIROIR_TEST_STORAGE` (set by `testByFile` when `--storage` is used) |

### Repo-wide non-regression (`npm run nonreg`)

There is **no** single Vitest/`lerna run test` command that covers the whole matrix. Use:

```bash
npm run nonreg                         # --tier default --run-all
npm run nonreg:unit                    # tier unit only
npm run nonreg:fail-fast               # tier default, stop on first failure
npm run nonreg -- --tier full --run-all
```

| Tier | Contents |
|------|----------|
| `unit` | MiroirTest unit suites via `testMiroir -w miroir-core -- --mode unit` + `RunAllMiroirTestsButton`, `MiroirTestListDisplay`, `MiroirTestDisplay` + LocalCache memory measure (pure `localCacheMemoryMeasure` / attributed + static redux/zustand images) |
| `default` | `unit` + deployment `modelValidation` for **miroir**, **admin**, **library** (right after miroir-core unit) + MiroirTest integ (`tr.core`, `runner.lendDocument`, `runner.returnDocument`, `action.domainController.*`) + curated app-stack (PersistenceStoreController, extractors, UI launcher/list/display proofs, MlElementEditor component tests through `miroir-component-tests`) |
| `full` | `default` + deployment `modelValidation` for **postgres** |

Modes: `--run-all` (continue after failures; default) or `--fail-fast`.

Each run writes a **timestamped snapshot** under `test-results/nonreg/<UTC-stamp>/`:

| File | Role |
|------|------|
| `summary.json` | Machine-readable step results (for `--compare` / `--compare-only`) |
| `summary.md` | Human table |
| `logs/<step-id>.log` | Full stdout+stderr per step |

```bash
# Run + diff vs previous snapshot (`latest` is resolved BEFORE this run rewrites it)
npm run nonreg -- --compare latest
npm run nonreg -- --compare test-results/nonreg/20260717T234407Z

# Diff two existing snapshots only (no re-run) — PATH = stamp dir or summary.json
npm run nonreg -- --compare \
  test-results/nonreg/20260718T010600Z \
  test-results/nonreg/20260717T234407Z
```

Step list: [`scripts/nonreg-manifest.json`](../../scripts/nonreg-manifest.json). Runner: [`scripts/run-nonreg.py`](../../scripts/run-nonreg.py). Default integ profile: `emulatedServer-sql` (override with `--profile`).

#### Timing profile and shared runner (#318)

Both are opt-in; without the flags a run behaves as before.

- `--timings` runs vitest with a timing runner (`scripts/vitest/timingRunner.mjs`, enabled by `MIROIR_TEST_TIMING=1` in each package config). The snapshot gets `timings.json` (per step and file: collect, setup, `beforeAll` / `beforeEach` / `afterEach` / `afterAll`, test bodies, named phases such as `session.init`) and `summary.md` gets slowest-first tables. Vitest's own test durations include the `beforeEach` / `afterEach` hooks; this profile separates them.
- `--runner shared` runs the steps that carry a `shared` descriptor in the manifest together, one vitest launch per `group`, which saves about 9 s of launch overhead per step. A `files` group adds `--no-isolate` and the files of its steps to the group's `argv`; a `suites` group passes the MiroirTest suite keys to `testMiroir ... --shared` (entry `miroir-runner-tests-shared.integ.test.ts`: one session per suite). Results are split back per step. A step that fails or has no result in the group re-runs alone in legacy mode: `summary.json` records `mode: "shared→legacy"`, and `shared_state_leak_suspected` when it then passes. So does every member when the launch fails while none of its tests failed (`shared_status: "launch-failed"`). A group runs where its first member is listed, so its later members run earlier than in a legacy run; with `--fail-fast` they still report their real result. With `--timings`, a shared file's collect and setup times are charged to its first member only. `--runner legacy` (the default) ignores the descriptors.

```bash
python scripts/run-nonreg.py --tier default --profile emulatedServer-filesystem --timings
python scripts/run-nonreg.py --tier default --profile emulatedServer-filesystem --runner shared
```

A step joins a group by adding, next to its `argv`:

```json
"shared": { "group": "standalone-app-profile", "argv": ["npm", "run", "testByFile", "-w", "miroir-standalone-app", "--", "--profile", "{profile}", "--no-bail"], "files": ["PersistenceStoreController.integ"] }
```

All steps of a group share the same `argv`. Leave out steps whose tests measure the heap or rely on a fresh module graph or environment variables.

**Testbed reset policy:** a MiroirTest suite may declare `"testbedReset": "perSuite"` when none of its tests modify the testbed. CLI integ runs (`testMiroir --mode integ`) then reset the testbed once per suite instead of before every test; absent means `"perTest"`. Runs from the **Miroir Tests** page ignore it and always reset per test. `tr.core` (formerly `miroirCoreTransformers`) uses it (30 s → 9 s on filesystem). Read-only PLATFORM files reset in `beforeAll` instead (`ExtractorPersistenceStoreRunner.integ`, `ExtractorTemplatePersistenceStoreRunner.integ`).

### Deployment `modelValidation`

Each deployment package ships a Vitest file `tests/modelValidation.unit.test.ts` that type-checks model and data JSON instances against their entity schemas via `runModelValidationSuite` (`miroir-core`).

| Package | Tier | How groups are built | Assets |
|---------|------|----------------------|--------|
| `miroir-test-app_deployment-miroir` | `default` | `modelValidationSuite(defaultMiroirMetaModel, …)` | In-package MetaModel exports |
| `miroir-test-app_deployment-admin` | `default` | `buildModelValidationGroupsFromFilesystem` (`miroir-core/model-validation-fs`) | `assets/admin_model` + `assets/admin_data` |
| `miroir-test-app_deployment-library` | `default` | same filesystem helper | `assets/library_model` + `assets/library_data` |
| `miroir-test-app_deployment-postgres` | `full` | same filesystem helper | `assets/postgres_model` (+ `postgres_data` when present) |

```bash
# One package
npm run testByFile -w miroir-test-app_deployment-admin -- tests/modelValidation.unit.test.ts

# Miroir + admin + library (default nonreg)
npm run nonreg

# Also postgres modelValidation
npm run nonreg -- --tier full --run-all
```

Vite configs for packages that use the filesystem helper must alias `miroir-core/model-validation-fs` to `miroir-core/src/5_tests/ModelValidationToolsFilesystem.ts` (the plain `miroir-core` → `src/index.ts` alias does not cover that subpath).

---

## Test format: MiroirTest

Tests are **deployment JSON entities**, not `.test.ts` files. Each file in

```
packages/miroir-test-app_deployment-miroir/assets/miroir_data/
  a311f363-e238-4203-bdfc-29e8c160c26b/   ← entityMiroirTest UUID
    <uuid>.json                            ← one MiroirTestDefinition per suite
```

is a `MiroirTestDefinition` whose `definition` field is a `MiroirTestSuite` tree. Leaf node types:

| `miroirTestType` | Purpose |
|-----------------|---------|
| `transformerTest` | Build/runtime transformer assertion |
| `functionCallTest` | Direct TypeScript function call with expected result |
| `queryTest` | Query/extractor runner with fixture |
| `runnerTest` | Composite action runner test |
| `reactComponentTest` | Renders the component of its parent `reactComponentTestSuite` with the suite's `componentProps` shallow-merged under its own `componentProps`, then runs its declarative `steps`. Accepted only in a `reactComponentTestSuite` (#294). The step interpreter lives in the standalone app, not in miroir-core (#286, #292, see [MlElementEditor component tests](#mlelementeditor-component-tests)) |
| `miroirTestSuite` | Nested grouping (recurses) |
| `reactComponentTestSuite` | Grouping of `reactComponentTest` leaves only. `component` names the rendered component in the app's component registry; optional `componentProps` are the default props of its leaves (#292) |

Field naming: `miroirTestType`, `miroirTestLabel`, `miroirTests`. Legacy `unitTest*` / `transformerTest*` fields are frozen.

### Names and descriptions

A MiroirTest `name` is its suite key (`--suites`, `--filter` root keys, the Miroir Tests page, nonreg step ids). It reads `<kind>.<subject>[.<variant>]`: segments separated by `.`, each in camelCase, only letters, digits, `.`, `_`, `-`. The kind is the first segment and follows from the leaf types:

| Kind | Tests | Examples |
|---|---|---|
| `fn` | a TypeScript function (`functionCallTest`) | `fn.mlsToJsonSchema`, `fn.mlSchemaReferences.set` |
| `query` | queries and extractors (`queryTest`) | `query.library.instances`, `query.virtualAttributes` |
| `tr` | transformers (`transformerTest`) | `tr.core`, `tr.mlsTypeCheck` |
| `action` | actions on a DomainController or an action scenario (`actionTest`) | `action.domainController.dataCrud.compositePk`, `action.scenario.evolutionTrace` |
| `runner` | a Runner (`runnerTest`) | `runner.lendDocument`, `runner.mcp.getInstances` |
| `ui` | React components (`reactComponentTest`) | `ui.mlElementEditor.array` |

When leaf types mix, the first kind in the order `ui`, `runner`, `action`, `query`, `fn`, `tr` wins. The name says what is tested, never the issue it came from (that is `issue`) nor how it runs (that is the mode tag). The root `definition.miroirTestLabel` equals the name; inner labels are free. The deployment export of an instance is `miroirTest_` followed by the name with `.` replaced by `_` (`miroirTest_tr_core`).

`description` is one sentence ending with a period: what is exercised, against what. No issue numbers, uuids, history (migrated, phase, slice) or setup notes: setup notes go in this document ([Integration suite notes](#notable-catalog-suites)).

Guard: `packages/miroir-core/tests/5-tests/miroirTestNaming.unit.test.ts` checks characters, kind prefix, root label and descriptions on every instance.

### Tags

Every MiroirTest instance carries `tags` (#312), next to `name` and `description`: one mode tag, then one to three tags saying what the test exercises, main area first. They select tests (`--tags`, the tag chips of the Miroir Tests page) and sort them (the Tags column of the Miroir Tests grid).

**Mode tags** (#316) say how the suite runs and are derived from its leaves (`miroirTestSuiteModeTags`): `ui` for a suite with `reactComponentTest` leaves, `unit` for a suite that runs in the unit launcher, `integ` for a suite that needs an integration session (runner, action, or transformer leaves with `integrationTestExpectedValue`). `tr.core` carries both `unit` and `integ`. The guard in `miroirTestTags.unit.test.ts` fails when an instance's mode tags differ from the derived ones, so a new test only needs the right leaves and the matching tag. `--tags ui --mode unit` on `miroir-core` runs every component suite.

The allowed values are the `enum` inside the `tags` array schema of the MiroirTest Entity (`miroir_model/16dbfe28-…/a311f363-….json`), in this order:

| Tag | What the test exercises |
|-----|------------------------|
| `transformer` | Transformer definitions and their runtime |
| `ml-schema` | ML schema tooling: references, unions, unfolding, conversions, type checks |
| `ml-union` | ML unions: branch selection, choices, resolved types |
| `ml-reference` | ML schema references: resolution, contexts, dependency sets |
| `ml-conversion` | Conversions between ML schemas and other formats |
| `query` | Queries, extractors, query templates |
| `editor` | MlElementEditor React components |
| `performance` | Render-performance measurements |
| `runner` | Runners |
| `domain-controller` | DomainController actions |
| `model` | Model changes: Entity creation and removal, model CRUD, model updates |
| `data` | Instance (data) CRUD |
| `primary-key` | Non-UUID and composite primary keys |
| `versioning` | Application versions, freeze, evolution trace |
| `mcp` | MCP tools |
| `external-service` | External services (OpenAPI sync) |
| `report` | Reports |
| `menu` | Menus |
| `ai` | AI assistant integration |
| `tools` | Generic helpers |
| `unit` | Mode: runs in the unit launcher |
| `integ` | Mode: needs an integration session |
| `ui` | Mode: React component suite |

The tags of each existing test: [`code-helpers/features/312-FEATURE-miroir-test-classification/tag-assignment.md`](../../code-helpers/features/312-FEATURE-miroir-test-classification/tag-assignment.md).

- **Adding a tag:** add the value to the enum in the Entity row **and** in its EntityVersion (`miroir_modelVersion/54b9c72f-…/51c647fe-….json`), then `npm run build -w miroir-test-app_deployment-miroir` and `npm run devBuild -w miroir-core` (the generated `MiroirTestDefinition.tags` is a union of the values). The CLI and the instance editor read the values from the Entity.
- **Guard:** `packages/miroir-core/tests/5-tests/miroirTestTags.unit.test.ts` fails on an instance without tags or with a tag the Entity does not allow. Model validation does not check enum values yet (#313).

### Issue

A MiroirTest instance may carry an optional `issue`: the number, as a string, of the GitHub issue the test was written for (for example `"303"`). It is informative only: nothing selects or runs tests by it. Tests migrated from the former TransformerTest and UnitTest entities carry `"196"`, the migration issue, since their original issue is not recorded. It is left out when no issue can be identified.

---

## Discovery, selection, and execution

Three concerns. They are not the same list.

| Concern | Answers | Source |
|---------|---------|--------|
| **Discovery** | Which MiroirTest suites exist | **CLI:** folder catalog — `discoverApplicationMiroirTestSourceFolders` / `loadApplicationMiroirTestCatalog` over `packages/miroir-test-app_deployment-*/assets/*/<MiroirTest uuid>`. **UI:** selected application's LocalCache (`useSelectedApplicationMiroirTests`). Same conceptual catalog, two loaders. |
| **Selection** | Which of those run | `--suites` / `MIROIR_TEST_SUITES` / UI = instance `name` (optional `uuid` on `--suites`). `--tags` / `MIROIR_TEST_TAGS` / UI tag chips keep the suites carrying **any** of the [tags](#tags), intersected with `--suites` when both are given. `--filter` / UI checkboxes pick **leaves** (catalog-root key = `name`; nested keys and values = `miroirTestLabel`). See [Filtering MiroirTest cases](#filtering-miroirtest-cases). |
| **Execution** | How a selected suite or leaf runs | Leaf kinds infer session (`transformer` / `runner` / `action`) and unit vs integ. Playfield lives on the suite or a `TestConfiguration`; Runner JSON is a sibling folder. `FunctionCallTestRegistry` is a capability whitelist, not a suite catalog. |

`scripts/nonreg-manifest.json` is a **curated** step list (unit catalog sweep, selected integ suites, app-stack files). It is not generated from the catalog and is not a discovery source.

Name-list snapshots (`MIROIR_TEST_SUITE_REGISTRY_NAMES`, `MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES`, `UI_INTEGRATION_RUNNER_SUITE_REGISTRY_LEGACY`) are reference-only.

### MiroirTest vs PLATFORM

| Kind | How it exists | How you run it |
|------|----------------|----------------|
| **MiroirTest** | Deployment JSON entity | `testMiroir` / UI catalog. Suite key = instance `name`. |
| **PLATFORM** | TypeScript under `tests/` with **no** MiroirTest entity | `testByFile` + optional `RUN_TEST` |

PLATFORM files are the vitest tests that have **no MiroirTest equivalent**: CLI/schema apparatus (`parseMiroirTestCliConfig.unit.test.ts`, `miroirTest.schema.unit.test.ts`), LocalCache memory measure, store-layer integ (`PersistenceStoreController.integ`), view RTL (`ReportPage.integ.test.tsx`, `gridPagination.*`), and similar. `RUN_TEST` applies only to those files. The MlElementEditor component tests are MiroirTests since #286, with one instance per editor since #292 (`ui.mlElementEditor.enum`, `ui.mlElementEditor.array`, `ui.mlElementEditor.literal`, `ui.mlElementEditor.object`, `ui.mlElementEditor.simpleType`, `ui.mlElementEditor.union`, `ui.mlElementEditor.any`; `reactComponentTest` leaves), see [MlElementEditor component tests](#mlelementeditor-component-tests).

### Notable catalog suites

**`query.virtualAttributes`** — issue #82: lazy instance-local Entity attributes (`tag.value.virtualAttribute`). MiroirTest `functionCallTest` + `queryTest` (evaluate / strip / project / filter / orderBy / same-query runtimeTransformers). Sequelize skip + SQL compile: `packages/miroir-store-postgres/test/virtualAttributes.unit.test.ts`. List/details display: `packages/miroir-standalone-app/tests/4_view/virtualAttributes.integ.test.tsx`.

**`fn.transformer.resultSchema`** — issue #88: `functionCallTest` leaves call `resolveTransformerResultSchema` (pure schema inference, no transformer runtime). Reference: [transformer-result-schema.md](./transformer-result-schema.md). Nonreg step: `unit-transformerResultSchema`.

**`fn.transformer.interfaceCheck`** (issue #249) uses these Entity uuids: Menu `dde4c883-ae6d-47c3-b6df-26bc6e3c1842`, User `ca794e28-b2dc-45b3-8137-00151557eea8`, EntityVersion `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd`.

**Integration suite notes.** Setup facts that used to live in these suites' descriptions:

| Suite | Notes |
|---|---|
| `action.domainController.*` | Owned by the Miroir meta-application; Library is only the run target / testbed. Lifecycle: session `testBedModelAndInstances`, no suite hooks. Testbeds: Publisher + Country (`modelCrud`, `freezeApplicationVersion`), Publisher only (`modelCrud.nonUuidPk`, whose leaf creates TestEntityCodeNumber), empty Library (`modelUndoRedo`), TestEntityCompositePK with `idAttribute` `[region, code]`, TestEntityCodeNumber with `idAttribute` `code`, Publisher + TestEntityNoParentUuid (`dataCrud.noParentUuid`, instances omit `parentUuid`) |
| `action.domainController.freezeApplicationVersion` | Rejection of a duplicate `versionName` stays covered by a unit test: an `actionTest` cannot expect an Action failure |
| `action.domainController.modelUndoRedo` | React UI and `currentTransaction` checks remain in the deprecated `DomainController.React.Model.undo-redo.test.tsx` |
| `action.scenario.externalServiceSync` | Proves the landing only, no HTTP; runs on filesystem and postgres |
| `runner.createEntity`, `runner.dropEntity` | Ephemeral run target (no `suite.runTarget`); `initialModel` from the `emptyApplicationModel` parameter bank; do not seed the remapped library model onto the run target playfield |
| `runner.freezeApplicationVersion` | Owned by the Miroir meta-application; `appForTest` (Publisher + Country) is the run target / testbed |

`tr.core` is a **mixed** suite: many leaves are unit-safe; leaves with `integrationTestExpectedValue` need an integ session (runtime SQL / store). Other catalog suites are unit-safe unless they declare integ expectations.

**External services (#267):** MiroirTest suite keys `tr.syncExternalServiceSchema` (unit, `miroir-core` — `transformerTest` for `syncExternalServiceSchema`) and `action.scenario.externalServiceSync` (integration, `miroir-standalone-app` — lands synced operations + entity). End-to-end HTTP against a fake Spotify server is **PLATFORM** vitest (`externalServiceQuery`, `externalServiceGuards`, `externalServiceDispatch`, `externalServiceReport`, `spotifyApp` under `tests/3_controllers/` and `tests/4_view/`); nonreg step `externalServices-spotify`. Opt-in live Spotify: `tests/external-services/spotifyLive.integ.test.ts` (`LIVE_SPOTIFY_CLIENT_ID` + `LIVE_SPOTIFY_CLIENT_SECRET` + `LIVE_SPOTIFY_REFRESH_TOKEN` obtained once via `packages/miroir-test-app_deployment-spotify/scripts/get_spotify_refresh_token.py` and registered via the in-process `registerSecrets` **test hatch** as `spotifyRefreshToken`; those `LIVE_SPOTIFY_*` vars are **not** D6 import aliases and are not a production launch channel; OAuth2 refresh-token grant at accounts.spotify.com; not in nonreg).

**Persistent named secrets (#270):** PLATFORM vitest under `tests/**/issues/270-persistent-named-secrets/` (`secrets.270`, `secretsService.270`, `secretsHttp.270` unit/guard, `secretsRedact.270`, `secretsHydrate.270`, `secretsImport.270`, `secretsOauthCache.270`). Nonreg steps `unit-270-persistent-secrets` (core + MCP) and `appstack-270-persistent-secrets` (standalone-app hydrate + import, pinned to `emulatedServer-filesystem`). Production launch uses wrapping key `MIROIR_SECRETS_MASTER_KEY` / `--secrets-master-key` ([how to generate it](./authentication.md#generate-the-wrapping-key)); tests use the dummy `test-secrets-master`. `--secret` / `MIROIR_SECRET_*` / AI key env vars are bootstrap import only.

---

## Running unit tests

Unit tests run entirely in-memory. No Postgres, no filesystem seeding.

### LocalCache memory measure

Pure sizing and static LocalCache image checks (included in `npm run nonreg:unit`):

```bash
# Pure identity-aware formula (miroir-core) — Library Book/Author fixtures
npm run testByFile -w miroir-core -- tests/2_domain/localCacheMemoryMeasure.unit.test.ts

# Attributed per-Entity + top-10 (present.current only; loading ignored)
npm run testByFile -w miroir-core -- tests/2_domain/localCacheMemoryAttributed.unit.test.ts

# UI gate + docked summary (Phase 7)
npm run testByFile -w miroir-standalone-app -- tests/4_view/localCacheMonitorGate.unit.test.ts
npm run testByFile -w miroir-standalone-app -- tests/4_view/LocalCacheMonitorSummary.unit.test.tsx
npm run testByFile -w miroir-standalone-app -- tests/4_view/localCacheMonitorIndicators.unit.test.ts
npm run testByFile -w miroir-standalone-app -- tests/4_view/localCacheMonitorSession.unit.test.ts
npm run testByFile -w miroir-standalone-app -- tests/4_view/localCacheMonitorFootprint.acceptance.unit.test.tsx

# Static store image — Library book1–book6; shared golden presentSnapshotBytes on redux + zustand
npm run vitest -w miroir-localcache-redux -- tests/LocalCache.memoryMeasure.static.unit.test.ts
npm run vitest -w miroir-localcache-zustand -- tests/LocalCache.memoryMeasure.static.unit.test.ts
```

Nonreg step ids: `unit-localCacheMemoryMeasure`, `unit-localCacheMemoryAttributed`, `unit-localCacheMonitorGate`, `unit-localCacheMonitorSummary`, `unit-localCacheMonitorIndicators`, `unit-localCacheMonitorSession`, `unit-localCacheMonitorFootprint`, `unit-localCache-memoryMeasure-static-redux`, `unit-localCache-memoryMeasure-static-zustand`, `unit-localCache-monitor-redux`, `unit-localCache-monitor-zustand`.

### Via `testMiroir` (preferred)

```bash
# Preferred — argv
npm run testMiroir -w miroir-core -- --suites fn.mustache.extractDoubleBracePatterns --mode unit

# Every unit suite carrying one of the tags (see Tags)
npm run testMiroir -w miroir-core -- --tags ml-union,ml-reference --mode unit

# Filter to specific test labels (suite miroirTestLabel → leaf labels)
npm run testMiroir -w miroir-core -- --suites fn.mustache.extractDoubleBracePatterns --mode unit \
  --filter '{"fn.mustache.extractDoubleBracePatterns":["should extract patterns with double braces"]}'

# Legacy — env vars (still supported; argv wins when both are set)
MIROIR_TEST_SUITES=fn.mustache.extractDoubleBracePatterns MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core
MIROIR_TEST_SUITES=fn.tools.alterObjectAtPath,fn.entityPrimaryKey MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core
MIROIR_TEST_MODE=unit npm run testMiroir -w miroir-core
```

See [Filtering MiroirTest cases](#filtering-miroirtest-cases) for the full model and runner examples.

### Environment variables (legacy / CI fallback)

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_SUITES` | Comma-separated suite keys, or `*` for all | `*` (all) |
| `MIROIR_TEST_TAGS` | Comma-separated [tags](#tags): keep the suites carrying any of them. An unknown tag, or a selection left empty, is an error | (none) |
| `MIROIR_TEST_MODE` | `unit` or `integration` (`integ` accepted) | `unit` |
| `MIROIR_TEST_FILTER` | JSON filter — see [Filtering MiroirTest cases](#filtering-miroirtest-cases) | (none) |
| `MIROIR_SCHEMA_MODE` | `frozen` (implicit `'auto'` → static schema) or `runtime` (198 carry-on) | `runtime` (unset); `testMiroir` defaults to `frozen` |

### Schema resolution mode (`MIROIR_SCHEMA_MODE`)

Meta-model unit tests should not pay carry-on cost on every fixture load. Set **`MIROIR_SCHEMA_MODE=frozen`** so `getMiroirFundamentalSchemaForDeployment` and implicit `'auto'` resolution return the static build artifact only.

| Value | Effect |
|-------|--------|
| `frozen` | `'auto'` → static; explicit `resolveFundamentalSchemaForDeployment(..., 'extended')` still works |
| `runtime` | Legacy 198 behaviour (Library app endpoints trigger carry-on under `'auto'`) |

**Defaults:** unset env → `runtime`. `npm run testMiroir -w miroir-core` sets `frozen` unless you override.

**Opt-in extended tests** (Library `lendDocument`, app-action validation) must either:

- set `MIROIR_SCHEMA_MODE=runtime` in the describe `beforeAll`, or
- call `resolveFundamentalSchemaForDeployment(..., 'extended')` explicitly (preferred in deployment test files).

```bash
# Frozen gate (meta-model tests)
MIROIR_SCHEMA_MODE=frozen npm run testByFile -w miroir-core -- tests/1_core/modelEnvironment.unit.test.ts

# Extended app-action suite (library deployment)
npm test -w miroir-test-app_deployment-library -- "App-action validation"
```

### Via `testByFile`

`testByFile` is the PLATFORM / vitest-host launcher. To run MiroirTest suites, prefer `testMiroir` (it already points vitest at `miroir-core-tests.unit.test.ts` with catalog selection). Direct host invocation:

```bash
npm run testByFile -w miroir-core -- miroir-core-tests.unit.test
```

This runs the catalog host file, inheriting `MIROIR_TEST_SUITES` from the environment. It is not a way to select a suite by filename.

---

## Running MiroirTest integration tests (`testMiroir`)

MiroirTest integration runs against a real persistence store. Use a profile and CLI arguments for normal runs; the test application schema and admin deployment can also be configured independently through `MIROIR_TEST_*` environment variables when needed.

### Vitest entry

`packages/miroir-standalone-app/tests/miroir-core-tests.integ.test.ts`

This file:
1. Parses env/argv (accepting `--mode integ` as alias for `integration`).
2. Calls `assertMiroirCoreIntegTestLaunchReady` — validates config and prints shell-style usage on any error.
3. Builds a session via `MiroirTestIntegrationOrchestrator` (`createStandaloneAppIntegrationOrchestrator` → kind `"transformer"` → `IntegrationTestSession`).
4. Calls `testSession.initSession()` to bootstrap the store.
5. Calls `runMiroirCoreTestsFromCLI` to run the requested suites.

`scripts/test-miroir-runner.ts` routes to this entry when all requested suite keys are in the miroir-core registry (e.g. `tr.core`).

### Via `testMiroir` (preferred)

Use **`--profile`** so one preset sets both `VITE_MIROIR_*` (app-stack / runner) and `MIROIR_TEST_*` (transformer integ). Explicit env vars still override profile defaults.

| Kind | Suite key (`--suites`) | Session | Typical profile |
|------|------------------------|---------|-----------------|
| **Transformer** | `tr.core` | `IntegrationTestSession` (synthetic `testApplication`) | `emulatedServer-sql` |
| **Runner** | `runner.lendDocument`, `runner.returnDocument`, `runner.createEntity`, `runner.dropEntity`, `runner.freezeApplicationVersion` | `RunnerTestSession` (library / Miroir entity runners) | `emulatedServer-sql` (freeze runner also green on `emulatedServer-filesystem`) |
| **Action** | `action.domainController.dataCrud`, `action.domainController.modelCrud`, `action.domainController.dataCrud.compositePk`, `action.domainController.{modelCrud,dataCrud}.nonUuidPk`, `action.domainController.dataCrud.noParentUuid`, `action.domainController.modelUndoRedo`, `action.domainController.freezeApplicationVersion` (all Miroir `miroir_data`) | `RunnerTestSession` + `libraryPlayfieldSeed` (`actionTest` leaves); Library is `runTarget`/testbed | `emulatedServer-sql` (also green on `emulatedServer-filesystem` for freeze) |


```bash
# Transformer integ
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites tr.core --mode integ

# Runner integ
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites runner.returnDocument --mode integ

# By tag: the integration-capable suites carrying the tag. Core (transformer) suites and
# runner / action suites run in different vitest entries, so a tag selection that spans
# both is refused: narrow the tags or add --suites.
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-filesystem --tags domain-controller --mode integ

# Action Data CRUD integ — Miroir-owned suite; Library is runTarget only
# (preferred over DomainController.integ.Data.CRUD.test.tsx)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites action.domainController.dataCrud --mode integ

# Action Model CRUD integ — Miroir-owned suite; Library is runTarget only
# (preferred over DomainController.integ.Model.CRUD.test.tsx)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites action.domainController.modelCrud --mode integ

# Action composite-PK Data CRUD integ — Miroir-owned; Library is runTarget only
# (preferred over DomainController.integ.compositePK.CRUD.test.tsx)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites action.domainController.dataCrud.compositePk --mode integ

# Action non-UUID PK Model/Data CRUD integ — Miroir-owned; Library is runTarget only
# (preferred over DomainController.integ.nonUuidPK.CRUD.test.tsx)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites action.domainController.modelCrud.nonUuidPk --mode integ
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites action.domainController.dataCrud.nonUuidPk --mode integ

# Action no-parentUuid CRUD integ — single Miroir-owned suite (Model+Data); Library is runTarget only
# (preferred over DomainController.integ.noParentUuid.CRUD.test.tsx)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites action.domainController.dataCrud.noParentUuid --mode integ

# Action Model undo/redo integ — Miroir-owned; Library is runTarget only
# (preferred over DomainController.React.Model.undo-redo.test.tsx for domain actions)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites action.domainController.modelUndoRedo --mode integ
```

Catalog-root filter keys use instance **`name`** (see [Filtering](#filtering-miroirtest-cases)):

```bash
# One runner leaf — catalog-root key is runner.returnDocument
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites runner.returnDocument --mode integ \
  --filter '{"runner.returnDocument":["Return Book Test Composite Action"]}'

# One transformer leaf — nested labels under tr.core
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites tr.core --mode integ \
  --filter '{"tr.core":{"runtimeTransformerTests":{"plus":["plus with empty args fails"]}}}'
```

Legacy explicit-env form (still supported):

```bash
MIROIR_TEST_SUITES=tr.core MIROIR_TEST_MODE=integration \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app

npm run testMiroir -w miroir-standalone-app -- --suites tr.core --mode integration
```

See [Integration test profiles](#integration-test-profiles) for the full catalog and CI matrix.

### Integration test profiles

Registry: `packages/miroir-standalone-app/tests/helpers/integrationTestProfiles.ts`  
Applied by `scripts/test-miroir-runner.ts` and `scripts/test-by-file.ts` via `applyIntegrationTestProfile` **before** Vitest spawn.

**Resolution order** (highest wins):

1. **CLI argv** — `--suites` / `--mode` / `--filter` / `--storage` (and `--profile` for presets)
2. Explicit `VITE_MIROIR_*` / `MIROIR_TEST_*` in the environment (legacy / CI; still overrides profile-derived defaults)
3. `--profile` / `-p` applied defaults (when env unset)
4. Built-in defaults inside `IntegrationTestSession` (local dev only; CI should use argv or a profile)

| Profile key | Environment or config JSON | Typical use |
|-------------|-------------|-------------|
| `emulatedServer-sql` | `environments/test-sql.json` | Local default — admin filesystem, miroir + library Postgres (schemas `test_sql_*`; password from `MIROIR_POSTGRES_PASSWORD`) |
| `emulatedServer-filesystem` | `environments/test-filesystem.json` | All store sections on filesystem (no Postgres) |
| `emulatedServer-indexedDb` | `environments/test-indexedDb.json` | Miroir + library IndexedDB |
| `emulatedServer-mongodb` | `environments/test-mongodb.json` | Miroir + library MongoDB (databases `test_mongodb_*`) |
| `realServer-sql` | `miroirConfig.test-realServer-sql.json` | Client REST → live `miroir-server` (Postgres on server) |
| `realServer-filesystem` | `miroirConfig.test-realServer-filesystem.json` | Client REST → live server (filesystem on server) |
| `realServer-indexedDb` | `miroirConfig.test-realServer-indexedDb.json` | Client REST → live server (IndexedDB on server) |
| `realServer-mongodb` | `miroirConfig.test-realServer-mongodb.json` | Client REST → live server (MongoDB on server) |

Transformer session defaults (`MIROIR_TEST_APP_STORE_TYPE`, `MIROIR_TEST_POSTGRES_HOST`, …) are **derived from the profile JSON** (`deriveTestSessionDefaultsFromMiroirConfig`).

#### CI matrix example

One matrix column can drive both transformer and runner integ with the same profile — no duplicate `MIROIR_TEST_POSTGRES_HOST` beside connection strings in JSON:

```yaml
# .github/workflows/integration-tests.yml (illustrative)
jobs:
  integration:
    strategy:
      matrix:
        profile:
          - emulatedServer-sql              # local-style smoke on CI runner with host Postgres
          - ci-emulatedServer-host-sql      # connection strings → host.docker.internal
          - ci-emulatedServer-dockerized-sql # connection strings → docker network IP
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run devBuild -w miroir-core
      - name: Transformer MiroirTest integ
        run: |
          npm run testMiroir -w miroir-standalone-app -- \
            --profile ${{ matrix.profile }} \
            --suites tr.core --mode integ
      - name: Runner MiroirTest integ
        run: |
          npm run testMiroir -w miroir-standalone-app -- \
            --profile ${{ matrix.profile }} \
            --suites runner.returnDocument --mode integ
```

Pick the profile that matches how Postgres is reachable in that job (host vs Docker). Paths inside JSON are repo-root relative (`PWD` at monorepo root when `npm run testMiroir` runs from the workspace).

### Store backend env vars

All vars have defaults; only set what differs from the defaults.

#### Test application store

| Variable | Values | Default |
|----------|--------|---------|
| `MIROIR_TEST_APP_STORE_TYPE` | `sql` \| `filesystem` \| `indexedDb` \| `mongodb` | `sql` |

**When `sql`:** the test application uses the test environment's Postgres connection (`connections.postgres`, password from `MIROIR_POSTGRES_PASSWORD`).

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_POSTGRES_HOST` | Replaces the host of that connection | the environment's (`localhost`) |

**When `filesystem`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_APP_FILESYSTEM_ROOT` | Writable directory for the test application | `.miroir/<environment>/testApplication` |

**When `indexedDb`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_APP_INDEXEDDB_NAME` | IndexedDB name prefix | `.miroir/<environment>/testApplication/indexedDb` |

**When `mongodb`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_MONGODB_CONNECTION_STRING` | Connection string (**required**) | — |
| `MIROIR_TEST_APP_MONGODB_DATABASE` | Database name | `testApplication` |

#### Admin store

The admin store hosts `miroirAdmin` deployment metadata (entities, reports, menus). It is fully independent of the test application store.

| Variable | Values | Default |
|----------|--------|---------|
| `MIROIR_TEST_ADMIN_STORE_TYPE` | `filesystem` \| `sql` \| `indexedDb` \| `mongodb` \| `bundled` | `filesystem` |

**When `filesystem` (default):** the Admin copy of the test environment (`MIROIR_ENV`, set by `--profile`; `test-sql` without a profile), in `.miroir/<environment>/admin`, seeded from `miroir-test-app_deployment-admin` once per test file.

**When `sql`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_POSTGRES_HOST` | Postgres host | `localhost` |
| `MIROIR_TEST_ADMIN_SQL_SCHEMA` | Schema name | `miroirAdmin` |

**When `indexedDb`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_ADMIN_INDEXEDDB_NAME` | IndexedDB name prefix | `miroirAdmin` |

**When `mongodb`:**

| Variable | Purpose | Default |
|----------|---------|---------|
| `MIROIR_TEST_MONGODB_CONNECTION_STRING` | Connection string (**required**) | — |
| `MIROIR_TEST_ADMIN_MONGODB_DATABASE` | Database name | `miroirAdmin` |

**When `bundled`:**  
The admin deployment data must be passed programmatically via `IntegrationTestSession.bundledDeploymentData` (not settable via env alone). The `miroir-sandbox` package demonstrates this pattern with `demoBundledData`.

### sql admin note

When the test application store is `sql`, the admin section of the test store uses the **same schema as the test application** (e.g. `testApplication`), not `miroirAdmin`. The real `miroirAdmin` schema stays on the filesystem-backed `deployment_Admin`. This keeps the Postgres test space isolated.

### Complete examples

```bash
# Default (sql test app, filesystem admin)
MIROIR_TEST_SUITES=tr.core MIROIR_TEST_MODE=integ \
  MIROIR_TEST_POSTGRES_HOST=localhost \
  npm run testMiroir -w miroir-standalone-app

# Filesystem app + filesystem admin (no Postgres)
MIROIR_TEST_SUITES=tr.core MIROIR_TEST_MODE=integ \
  MIROIR_TEST_APP_STORE_TYPE=filesystem \
  MIROIR_TEST_APP_FILESYSTEM_ROOT=/tmp/miroir-test \
  npm run testMiroir -w miroir-standalone-app

# MongoDB app + filesystem admin
MIROIR_TEST_SUITES=tr.core MIROIR_TEST_MODE=integ \
  MIROIR_TEST_APP_STORE_TYPE=mongodb \
  MIROIR_TEST_MONGODB_CONNECTION_STRING=mongodb://localhost:27017 \
  npm run testMiroir -w miroir-standalone-app
```

### Runner MiroirTest integration (`miroir-runner-tests.integ.test.ts`)

Runner-type `MiroirTest` leaves (`runnerTest`) exercise composite actions end-to-end. The Vitest entry uses `MiroirTestIntegrationOrchestrator` with kind `"runner"` → `RunnerTestSession` → `runAppStackIntegrationBootstrap`. The same `VITE_MIROIR_*` config files as app-stack tests are required.

```bash
MIROIR_ENV=test-sql \
VITE_MIROIR_LOG_CONFIG_FILENAME=catch-all \
MIROIR_TEST_MODE=integ \
npm run testByFile -w miroir-standalone-app -- miroir-runner-tests.integ.test
```

Alternatively, `testMiroir` routes to this entry when the requested suite keys are **not** all in the miroir-core registry. With `--profile`, manual `VITE_MIROIR_*` is not required.

```bash
# All runner.returnDocument leaves — profile sets VITE_MIROIR_* + MIROIR_TEST_*
npm run testMiroir -w miroir-standalone-app -- \
  --suites runner.returnDocument --mode integ --profile emulatedServer-sql

# Return leaf only — preferred form (suite miroirTestLabel → leaf miroirTestLabel)
npm run testMiroir -w miroir-standalone-app -- \
  --suites runner.returnDocument --mode integ --profile emulatedServer-sql \
  --filter '{"runner.returnDocument":["Return Book Test Composite Action"]}'

# Same run — shorthand when the suite has a single level of leaves (leaf key only; value ignored)
npm run testMiroir -w miroir-standalone-app -- \
  --suites runner.returnDocument --mode integ --profile emulatedServer-sql \
  --filter '{"Return Book Test Composite Action":["*"]}'
```

Legacy form (manual `VITE_MIROIR_*` without `--profile`):

```bash
MIROIR_ENV=test-sql \
VITE_MIROIR_LOG_CONFIG_FILENAME=catch-all-detailed \
npm run testMiroir -w miroir-standalone-app -- --suites runner.returnDocument --mode integ
```

Filter rules and common mistakes: [Filtering MiroirTest cases](#filtering-miroirtest-cases).

---

## Running app-stack integration tests (`testByFile`)

These are the original standalone-app integration tests: one Vitest file per concern, with test cases defined inline in TypeScript (composite-action trees or direct `it()` blocks). They configure the full Miroir client/server stack via JSON files and are launched with `npm run testByFile`.

### Configuration

Both variables are **mandatory** — `loadTestConfigFiles` throws if either is missing — unless you pass **`--profile`** or **`--storage`** on `testByFile` (same catalog as `testMiroir`):

```bash
# Preferred — argv profile
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql PersistenceStoreController.integ

# Real-server UI launcher — argv storage (→ realServer-<storage>)
npm run testByFile -w miroir-standalone-app -- \
  --storage sql uiIntegrationTestLauncher.realServer.integ
```

`testByFile` stops at the first failing case (`--bail=1`); add `--no-bail` or `--bail=<n>` to change that. Other arguments are passed to vitest unchanged, so `-t "a pattern with spaces"` works.

| Variable | Purpose |
|----------|---------|
| `VITE_MIROIR_TEST_CONFIG_FILENAME` | Path to a `miroirConfig.test-*.json` file (must have `.json` extension) |
| `VITE_MIROIR_LOG_CONFIG_FILENAME` | Log preset **name** (`catch-all`, `scope-query`, …) or path to a config JSON. Defaults to `catch-all` when unset |
| `MIROIR_TEST_STORAGE` | Set by `testByFile` when `--storage` / `--profile realServer-*` is used (Vitest child reads this after flags are stripped) |

`npm run testByFile` sets `VITE_TEST_MODE=true` automatically. Explicit `VITE_MIROIR_*` still override `--profile` defaults (legacy); prefer argv going forward.

For **real-server** configs (`miroirConfig.test-realServer-*.json`), the dev server must be running at `https://localhost:3080` and Node must trust the mkcert CA:

```bash
export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
```

See [HTTPS setup for developers](../guides/https-setup-developer.md).

### Config file catalogue

Emulated-server tests run on the test environments `environments/test-{sql,filesystem,indexedDb,mongodb}.json` (state in `.miroir/<environment>/`, see `docs/reference/data-architecture-deployments.md`). The realServer configs live in `packages/miroir-standalone-app/tests/`.

| Config file | Mode | Backends exercised |
|-------------|------|-------------------|
| `miroirConfig.test-realServer-sql.json` | Real HTTPS server | Postgres via running `miroir-server` |
| `miroirConfig.test-realServer-filesystem.json` | Real HTTPS server | Filesystem via running server |
| `miroirConfig.test-realServer-indexedDb.json` | Real HTTPS server | IndexedDB via running server |
| `miroirConfig.test-realServer-mongodb.json` | Real HTTPS server | MongoDB via running server |

Before first run, check `filesystemDeploymentRootDirectory` inside the chosen config — it must point at your local `packages/` directory (paths in the checked-in files are developer-specific).

### Logger config options

Miroir has a small set of **consolidated, named log presets** that work identically in **tests** and **dev/runtime**. They live in `packages/miroir-standalone-app/config/logging/` and are the single source of truth (the old `specificLoggersConfig_*.json` files were removed).

| Preset | defaultLevel | Specific loggers | Use when |
|--------|--------------|------------------|----------|
| `catch-all` | WARN | — | **Default.** Everyday dev + `nonreg`. Only WARN/ERROR plus tracker run/span hop lines. Start here. |
| `catch-all-detailed` | INFO | noisiest loggers capped at WARN | `catch-all` is too quiet to see flow, but you don't want a flood |
| `scope-query` | WARN | DC + LocalCache + query selectors = DEBUG | Trace a query/extractor end-to-end (includes DomainController hop detail) |
| `scope-query-local` | WARN | LocalCache + query selectors only = DEBUG | Narrow second pass after `catch-all`: query payload detail on the leaf without DC dumps |
| `scope-persistence` | WARN | store backends + query runners = DEBUG | Error involves a specific store (filesystem/indexedDb/postgres/mongodb) or SQL |
| `scope-transformers` | WARN | transformer runtime/utils = DEBUG | Transformer resolution / application errors |
| `scope-ui` | WARN | UI / view-layer loggers = DEBUG | React rendering, hooks, report display, editors |
| `full-debug` | DEBUG | everything | Last resort, a single focused test/action only — output is very large |

**How to choose:** start at `catch-all`. If you can't tell what's happening, go to `catch-all-detailed`. When the failure points at a layer, switch to the matching `scope-*` config. Use `full-debug` only for one focused test. Hop enter/exit lines (`#runId.span># → …` / `← …`) come from the activity tracker (`console.log`), not these logger levels — so they appear in every preset; `grep $RUNID` isolates a leaf.

**Selecting a preset:**
- **Tests:** `VITE_MIROIR_LOG_CONFIG_FILENAME=scope-query` (a bare name), or a full path to a config JSON. Unset → `catch-all`.
- **Dev/runtime (web app):** `VITE_MIROIR_LOG_CONFIG=scope-query` (or `VITE_MIROIR_LOG_CONFIG_FILENAME`) in the Vite env; unset → `catch-all`.

**Recommended troubleshooting workflow:** (1) run with `catch-all`, copy `runId`, `grep $RUNID`; (2) re-run the same leaf with the relevant `scope-*` config for payload detail (e.g. `scope-query-local` for a query leaf, `scope-query` if you also need DomainController hops). Set `MIROIR_TEST_VERBOSE_TRACKING=1` for tracker `🧪` console noise; `MIROIR_TEST_VERBOSE=1` for full env dump from the test launcher.

**Bare `console.*` allowlist (#237):** Most runtime diagnostics use `LoggerInterface` (regulable via presets above). Intentional bare `console.*` remains only for: (1) **run/span hop lines** in `MiroirActivityTracker` (`formatRunBanner`, `formatSpanBoundaryLine`); (2) **operator CLI** in `miroir-cli`, `miroir-mcp`, `miroir-server` (usage text, startup banners); (3) **PreStartLogger** sink before `startRegisteredLoggers`; (4) optional debug utilities (`FoldedStateTreeDebug.ts`, `chunkLoadTrace.ts`, icon extraction demos) and test-only helpers. Everything else should use module `log.*` at the appropriate level.

**CI guard:** from repo root, `npm run check:console` (also the first step in `nonreg` unit tier). Violations must be migrated to `log.*` or added explicitly to `scripts/check_bare_console.py` with justification.

**ML nomenclature guard (#145):** `npm run check:ml` (second step of the `nonreg` unit tier) fails when a Jzod name remains where Miroir's meta-language must be named ML / MLS (`Ml` constructs, `MlSchema` schemas, `Mls` schema operations). Jzod stays only for the external `@miroir-framework/jzod` / `jzod-ts` packages, their exports, and prose about the project; see the allowlist in `scripts/check_ml_nomenclature.py`. The check covers the whole repository; the old → new names are listed in [ml-nomenclature.md](ml-nomenclature.md). `--inventory` lists the remaining names per area, `--self-test` checks the matcher.

Workflow reference (Path A vs B, grep recipes): [runQuery-emulated-server.md](../guides/architecture/workflows/runQuery-emulated-server.md).

**Pilot leaf (default quiet logging)** (from repo root):

```bash
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql \
  --suites action.domainController.dataCrud \
  --mode integ \
  --filter '{"action.domainController.dataCrud":["Refresh all Instances"]}'
```

Copy the six-character `runId` from `RUN … START` or `#??????.sN.#`, then `grep $RUNID` on the log file. For query payload detail on the same leaf, re-run with `VITE_MIROIR_LOG_CONFIG_FILENAME=scope-query-local` (narrow) or `scope-query` (adds DomainController hops).

### Launch pattern

Vitest matches files by substring. Run from the **repository root** so relative config paths resolve correctly:

```bash
MIROIR_ENV=test-sql \
VITE_MIROIR_LOG_CONFIG_FILENAME=catch-all-detailed \
npm run testByFile -w miroir-standalone-app -- PersistenceStoreController.integ
```

The final argument is a Vitest file-name filter (not a suite key). Examples:

| Filter | Matches |
|--------|---------|
| `PersistenceStoreController.integ` | PersistenceStoreController low-level store tests |
| `ExtractorPersistenceStoreRunner.integ` | Extractor runner against live store |
| `ExtractorTemplatePersistenceStoreRunner.integ` | Extractor template runner |
| `uiIntegrationTestLauncher.integ` | Node proof of the UI launcher (runner + transformer leaves, emulated SQL) |
| `uiIntegrationTestLauncher.realServer.integ` | Node proof of the UI launcher against live `miroir-server` (`--storage` / `--profile realServer-*`) |
| `ReportPage.integ` | Report view React smoke tests |
| `BlobEditorField.integ` | Blob editor component tests (no store required) |

### Test catalogue

#### UI launcher Node proofs (`tests/helpers/`)

These exercise the same in-process launcher used by the browser UI (`runUiIntegrationTestSuite`).

| File | What it proves | Launch |
|------|----------------|--------|
| [`uiIntegrationTestLauncher.integ.test.ts`](../../../packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.integ.test.ts) | **Runner** leaf (Return Book) + **transformer** leaf (`plus with empty args fails`) on emulated SQL | `npm run testByFile -w miroir-standalone-app -- --profile emulatedServer-sql uiIntegrationTestLauncher.integ` |
| [`uiIntegrationTestLauncher.realServer.integ.test.ts`](../../../packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.realServer.integ.test.ts) | **Runner** leaf against live `miroir-server` (`--storage` / `--profile realServer-*`), ephemeral runTarget | see below |

For the real-server runner proof, `--storage` selects `realServer-<storage>`:

```bash
# sql | filesystem | indexedDb | mongodb
npm run testByFile -w miroir-standalone-app -- \
  --storage sql uiIntegrationTestLauncher.realServer.integ

npm run testByFile -w miroir-standalone-app -- \
  --storage filesystem uiIntegrationTestLauncher.realServer.integ

# Equivalent profile form
npm run testByFile -w miroir-standalone-app -- \
  --profile realServer-indexedDb uiIntegrationTestLauncher.realServer.integ
```

**Prerequisites (real-server):** `miroir-server` at `https://localhost:3080` with the matching store backend reachable; `NODE_EXTRA_CA_CERTS` for mkcert (see [HTTPS setup](../guides/https-setup-developer.md)). Skips when the server is unreachable.

#### DomainController (`tests/3_controllers/`)

Legacy `DomainController.integ.*.CRUD.test.tsx` files were removed in #228. CRUD coverage is the MiroirTest `actionTest` suites (`integ-action.domainController.*` in nonreg).

| Suite | Focus |
|-------|-------|
| `action.domainController.dataCrud` | Data-section CRUD |
| `action.domainController.modelCrud` | Model-section CRUD |
| `action.domainController.dataCrud.compositePk` | Composite-PK Data CRUD |
| `action.domainController.modelCrud.nonUuidPk` / `action.domainController.dataCrud.nonUuidPk` | Non-UUID PK Model+Data CRUD |
| `action.domainController.dataCrud.noParentUuid` | Entities without `parentUuid` |

```bash
# Data CRUD — MiroirTest action suite
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites action.domainController.dataCrud --mode integ

# Filesystem (same suites; change --profile)
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-filesystem --suites action.domainController.dataCrud --mode integ
```

#### Storage layer (`tests/4_storage/`)

Tests persistence below the domain layer, including the persistence controller and extractor runners.

| File | Setup | Focus |
|------|-------|-------|
| `PersistenceStoreController.integ.test.tsx` | `AppStackIntegrationTestSession` | PersistenceStoreController open/create/read/write, model actions; projected `getInstances` (keys ⊆ allow-list ∪ identity) |
| `ExtractorPersistenceStoreRunner.integ.test.tsx` | `AppStackIntegrationTestSession` | `ExtractorPersistenceStoreRunner` end-to-end |
| `ExtractorTemplatePersistenceStoreRunner.integ.test.tsx` | `AppStackIntegrationTestSession` | Extractor templates against live store |

```bash
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql PersistenceStoreController.integ

# Filesystem profile — preferred for attribute-projection smoke (filter-after-read)
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-filesystem PersistenceStoreController.integ

npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-indexedDb ExtractorPersistenceStoreRunner.integ
```

##### Attribute projection

Partial-fetch contract and controller projection: `code-helpers/features/214-FEATURE-large-entity-instance-partial-fetch/`.

| Layer | What to run | Notes |
|-------|-------------|--------|
| Unit | `packages/miroir-core/tests/1_core/instanceProjection*.unit.test.ts`, `…/PersistenceStoreController.projection.unit.test.ts` | Pure projection + Zod accept `attributes`; mocked store section OK |
| Integ | `PersistenceStoreController.integ` case *get Miroir Entities with attribute projection* | Real store via controller; assert projected keys only |

**Schema-first:** do **not** hand-edit `preprocessor-generated/miroirFundamentalType.ts` for `attributes`. Edit deployment assets (Query ED `359f1f9b-…`, Endpoints `a93598b3-…` / `ed520de4-…`), then:

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run devBuild -w miroir-core
```

Identity under projection uses `resolveProjectionIdentityFields` → `getEntityPrimaryKeyAttributes` (UUID default; pass the Entity for non-UUID / composite PK).

#### View / React (`tests/4_view/`)

| File | Store / config | Focus |
|------|----------------|-------|
| `miroir-component-tests.unit.test.tsx` | In-memory `LocalCache`; no `--profile` | ML editor components, run from the 9 component MiroirTest instances: 7 per-editor instances (`ui.mlElementEditor.enum`, …), the test pattern and the on-demand render-performance suite (#286, #292, #303) |
| `MiroirTestDisplayIntegrationLaunch.integ.test.tsx` | Node emulated SQL via mocked launcher environment | `MiroirTestDisplay` launches integration and shows the result inspector |
| `MiroirTestListIntegrationLaunch.integ.test.tsx` | Node emulated SQL via mocked launcher environment | List **Run All Integration Tests** batch for `tr.core` (filtered leaf) |
| `MlElementEditorReactCodeMirror.test.tsx` | — | CodeMirror sub-editor (currently commented out) |
| `ReportPage.integ.test.tsx` | Uses shared React test tools | Report rendering smoke tests |
| `gridPagination.unit.test.tsx` | In-memory `LocalCache`; real Library deployment assets | Client pagination primitives, viewport height (D2-c), prop contracts |
| `gridPagination.integ.test.tsx` | In-memory `LocalCache`; real provider stack | ag-grid native pager + Glide Miroir pager on `EntityInstanceGrid` / `ValueObjectGrid` / `ReportSectionListDisplay` |
| `BlobEditorField.integ.test.tsx` | No | Blob field editor component |
| `MlObjectEditor.BlobIntegration.integ.test.tsx` | No | MlObjectEditor blob integration |
| `Runner_*.integ.test.tsx` | Yes (`VITE_MIROIR_*`) | Legacy runner tests — migrating to `miroir-runner-tests.integ.test.ts` |

##### MlElementEditor component tests

The MlElementEditor component tests are MiroirTests (#286) written as declarative JSON (#292). Each case is a `reactComponentTest` leaf that holds the props of the rendered component and a list of `steps`. The standalone app's component test runner renders the component and interprets the steps. No case has TypeScript code of its own.

There is one MiroirTest instance per editor, plus the test pattern and the render-performance suite (#303), in `miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-e238-4203-bdfc-29e8c160c26b/`:

| Instance `name` | uuid | Cases |
|---|---|---|
| `ui.mlElementEditor.enum` | `761d4ed2-1a5c-4901-a9d9-897dbec0b27f` | 3 |
| `ui.mlElementEditor.array` | `1b71d68b-7dc9-468c-a251-4fa7889f20f4` | 12 |
| `ui.mlElementEditor.literal` | `3995a071-b8ae-48d3-a488-6d1fc828b725` | 3 |
| `ui.mlElementEditor.object` | `da353085-c62b-4aa6-bd54-8813d303dfe5` | 14 |
| `ui.mlElementEditor.simpleType` | `590693b6-2125-43fc-89d7-1330ae8318db` | 12 |
| `ui.mlElementEditor.union` | `de517cd6-31a8-46d2-ac09-3a5162b630a7` | 9 |
| `ui.mlElementEditor.any` | `ec601bcc-a27d-450d-9c37-bdd6a12a1575` | 15 |
| `ui.mlElementEditor.allTypesPattern` | `26ef2886-2cd8-4f91-b846-1525b24d5f41` | 4 (see [Test pattern](#test-pattern)) |
| `ui.mlElementEditor.renderPerformance` | `2da30877-d248-44bd-9786-5c091b1bc8fc` | 15, on demand (see [Render measurements](#render-measurements-measurerendering)) |

Each instance is exported as `miroirTest_<name>` by `miroir-test-app_deployment-miroir` (`index.ts`, `index.d.ts`) and listed in `defaultMiroirMetaModel.tests` (`src/Model.ts`). The JSON files are edited by hand.

**Instance format**

The root of `definition` is a `miroirTestSuite` whose label is the instance name. Its only child is a `reactComponentTestSuite` labelled with the editor name. The leaves are its `miroirTests`:

```json
{
  "miroirTestType": "reactComponentTestSuite",
  "miroirTestLabel": "MlEnumEditor",
  "component": "MlElementEditor",
  "componentProps": {
    "label": "Test Label", "name": "testField", "listKey": "ROOT.testField",
    "rootLessListKey": "testField", "rootLessListKeyArray": ["testField"],
    "rawMlSchema": { "type": "enum", "definition": ["value1", "value2", "value3"] },
    "initialFormState": "value2"
  },
  "miroirTests": [
    {
      "miroirTestType": "reactComponentTest",
      "miroirTestLabel": "MlEnumEditor: renders select with correct value",
      "steps": [
        { "step": "expectRenderedValues", "label": "initial", "expectedValue": { "testField": "value2" } }
      ]
    }
  ]
}
```

| Node | Attribute | Meaning |
|---|---|---|
| `reactComponentTestSuite` | `component` | Name of the rendered component in the app's component registry (`componentTests/componentRegistry.ts`). The registry has one entry, `MlElementEditor` |
| | `componentProps` (optional) | Default props of the leaves |
| | `skip` (optional) | Skips every leaf of the suite |
| | `runOnDemand` (optional) | `true`: the suite runs only when asked for. The vitest entry skips it unless `MIROIR_COMPONENT_PERF=1`; Miroir Tests "Run All Unit Tests" records its leaves as skipped; the unit Run button of the instance runs it. Unlike `skip`, the suite still runs when launched on its own (#303) |
| `reactComponentTest` | `steps` | The steps, run in order |
| | `componentProps` (optional) | Props of this case, shallow-merged over the suite's `componentProps`: a leaf key replaces the suite key. A merge cannot remove a key, so a suite whose cases differ on the presence of a prop leaves it out of its defaults (the Literal suite has no `label`) |
| | `skip` (optional) | Skips the case |

In `componentProps`, the tagged value `{"$bigint": "<digits>"}` is replaced by `BigInt(<digits>)` before rendering, at any depth. JSON has no bigint. Example: `"initialFormState": {"$bigint": "12345678901234567890"}`.

Leaf labels are `<editor>: <case>`. `componentMiroirTests.consistency` checks that every instance passes `mlsTypeCheck` against the MiroirTest Entity and EntityVersion `mlSchema`, that no leaf label is used twice, that every leaf label starts with `<child label>: `, and that every leaf has `steps`.

A `reactComponentTest` leaf is accepted only in the `miroirTests` of a `reactComponentTestSuite`. Placed directly under a `miroirTestSuite`, it is a schema error: `modelValidation` rejects the instance (#294). An instance that was not validated still gets a runtime check: such a leaf is recorded as `error` ("reactComponentTest must be a leaf of a reactComponentTestSuite") and the runner is not called.

**How a case runs**

The runner (`componentTests/runReactComponentTest.tsx`) builds one wrapper per `reactComponentTestSuite` node: the providers and an in-memory `LocalCache`, shared by the cases of the suite and destroyed after its last case. For each case it unmounts the previous case, mounts the component with the merged props in a fresh container, waits until no progressive-rendering placeholder is left, and runs the steps with `runComponentTestSteps` (`componentTests/runComponentTestSteps.ts`). The steps drive the DOM with `@testing-library/dom` and `@testing-library/user-event`, without React `act`, so the same code runs under vitest and in a production build of the app. No external store is needed.

The runner returns an `error` result, without running the steps, when the leaf has no suite context, has no `steps`, or when `component` is not in the component registry.

**Waiting rule**

After every action step, the interpreter runs the action outside React `act`, then waits until no progressive-rendering placeholder is left in the case container, then waits 300 ms more. The action steps are `click`, `change`, `blur`, `submit`, `type`, `clear`, `keyboard`, `openSelect`, `filterSelect`, `selectOption`, `toggleUnionTypeSelector`, `clickArrayButton`, `clickObjectButton`, and `renameRecordEntry`. The widget steps also wait for their own postcondition before that, as given in the step table.

`expectElement` and `expectRenderedValues` do not wait: they check once. With `timeout` (ms), they retry until the check passes or the timeout ends, and report the last failure. `waitForAttribute` is the only step that waits for a condition without acting. Use a timeout or `waitForAttribute` only when a result appears later than the post-action wait, for example after a change of union type.

**Targets**

Steps that act on or check one element take a `target`. A target has exactly one locator:

| Locator | Elements |
|---|---|
| `byRole` (with optional `name`) | Testing Library `queryAllByRole(byRole, {name})`. `name` is accepted only with `byRole` |
| `byTestId` | `queryAllByTestId` |
| `byText` | `queryAllByText` |
| `byDisplayValue` | `queryAllByDisplayValue` |
| `byLabelText` | `queryAllByLabelText` |
| `widget` (with `field` and the attributes below) | An element of a ML editor, addressed by field |
| `ref` | The element saved earlier in the case with `saveAs: "<name>"` |

`name`, `byText`, `byDisplayValue`, and `byLabelText` take a text match: a string, a number, or `{"regex": "<pattern>", "flags": "<flags>"}` (`flags` optional). Queries run inside the sandbox element, which holds the case container and the portal element, so option lists rendered in a portal are found.

Refinements filter the matches: `fieldName` keeps the elements whose `name` is `TESTSECTION.<fieldName>`, `fieldNamePrefix` those whose `name` starts with `TESTSECTION.<fieldNamePrefix>`, and `id` those whose `id` is equal. Without a refinement and without `index`, exactly one element must match. Otherwise the element at `index` (default 0) of the filtered matches is used. `expectElement` with `present: false`, `count`, or `values` uses every filtered match.

Widget targets. `field` is the field's `rootLessListKey` (for example `testField` or `testField.a`); the JSON never contains the `TESTSECTION.` prefix of the form field names. Below, `F(x)` is `TESTSECTION.<x>`.

| Target | Element |
|---|---|
| `{"widget": "combobox", "field": f}` | `input[role="combobox"][name="F(f)"]` |
| `{"widget": "combobox", "field": f, "select": "unionType"}`, `{"widget": "unionTypeInput", "field": f}` | The union type selector input, `[data-testid="union-type-input-F(f)"]` |
| `{"widget": "selectState", "field": f, "select"?: "value" \| "unionType"}` | The state tracker of the select, `[data-testid="themed-select-state-F(f)"]`, or `themed-select-state-union-type-F(f)` for `unionType`. It carries `data-test-is-open`, `data-test-filter-text`, `data-test-filtered-options-count`, and `data-test-selected-value` |
| `{"widget": "unionTypeStar", "field": f}` | The star that shows or hides the union type selector, `[data-testid="union-type-star-F(f)"]` |
| `{"widget": "recordEntryName", "field": f, "entry": e}` | The name textbox of a record entry, `F(f.e)-NAME` |
| `{"widget": "arrayButton", "field": f, "action": "up" \| "down", "index": i}` | The `i`-th element with role `F(f).button.up` / `.down` |
| `{"widget": "arrayButton", "field": f, "action": "add"}` | The button named `f.add` (no `TESTSECTION.` prefix) |
| `{"widget": "arrayButton", "field": f, "action": "duplicate" \| "delete", "index": i}` | The button named `F(f.i)-duplicateArrayItem` / `F(f.i)-removeArrayItem`; here `index` is the item, not a pick among matches |
| `{"widget": "objectButton", "field": f, "action": "addOptionalAttribute", "attribute": a}` | The button named `F(f).addObjectOptionalAttribute.a` |
| `{"widget": "objectButton", "field": f, "action": "addRecordEntry"}` | The button named `F(f).addRecordAttribute` |
| `{"widget": "objectButton", "field": f, "action": "remove" \| "duplicate", "attribute": a}` | The button named `F(f.a)-removeOptionalAttributeOrRecordEntry` / `F(f.a)-duplicateRecordEntry` |

**Steps**

Every step has a `step` kind and an optional `label` (required for `expectRenderedValues`), used in the error message.

| Kind | Attributes | Effect | Example |
|---|---|---|---|
| `click` | `target`, `saveAs?` | Fires a click | `{"step": "click", "target": {"ref": "checkbox"}}` |
| `change` | `target`, `value` (string, number, or boolean), `saveAs?` | Fires `change` with `target.value = value` | `{"step": "change", "target": {"byRole": "textbox", "fieldName": "testField"}, "value": "new text"}` |
| `blur` | `target` | Fires `focusout` and `blur` | `{"step": "blur", "target": {"ref": "nameInput"}}` |
| `submit` | `target` | Fires `submit` | `{"step": "submit", "target": {"byRole": "form"}}` |
| `type` | `target`, `text` | `userEvent.type` | `{"step": "type", "target": {"widget": "combobox", "field": "testField"}, "text": "value3"}` |
| `clear` | `target` | `userEvent.clear` | `{"step": "clear", "target": {"widget": "combobox", "field": "testField"}}` |
| `keyboard` | `keys` | `userEvent.keyboard` on the focused element | `{"step": "keyboard", "keys": "{Enter}"}` |
| `waitForAttribute` | `target`, `attribute`, `value`, `timeout?` (default 1000 ms) | Waits until the attribute of the target equals `value` | `{"step": "waitForAttribute", "target": {"widget": "selectState", "field": "testField"}, "attribute": "data-test-selected-value", "value": "value3"}` |
| `openSelect` | `field`, `select?` | Clicks the combobox, then waits until its state tracker has `data-test-is-open="true"` (1000 ms) | `{"step": "openSelect", "field": "testField"}` |
| `filterSelect` | `field`, `text`, `select?` | Clears the combobox and types `text`, then waits until `data-test-filter-text` equals `text` (1000 ms) | `{"step": "filterSelect", "field": "testField", "text": "value3"}` |
| `selectOption` | `field`, `option`, `select?` | Opens the select if it is closed, clears it, types `option`, waits until one option is left (1000 ms), presses Enter, then waits until the select is closed and `data-test-selected-value` equals `option` (2000 ms) | `{"step": "selectOption", "field": "testField", "select": "unionType", "option": "string"}` |
| `toggleUnionTypeSelector` | `field` | Clicks the union type star, then waits until the union type selector input has appeared or disappeared (1000 ms) | `{"step": "toggleUnionTypeSelector", "field": "testField"}` |
| `clickArrayButton` | `field`, `action` (`up`, `down`, `add`, `duplicate`, `delete`), `index?` | Clicks the `arrayButton` widget | `{"step": "clickArrayButton", "field": "testField", "action": "up", "index": 1}` |
| `clickObjectButton` | `field`, `action` (`addOptionalAttribute`, `addRecordEntry`, `remove`, `duplicate`), `attribute?` | Clicks the `objectButton` widget | `{"step": "clickObjectButton", "field": "testField", "action": "remove", "attribute": "firstRecord"}` |
| `renameRecordEntry` | `field`, `entry`, `newName` | Changes the `recordEntryName` input to `newName`, then blurs it | `{"step": "renameRecordEntry", "field": "testField", "entry": "firstRecord", "newName": "renamedRecord"}` |
| `expectRenderedValues` | `label`, `expectedValue`, `field?`, `path?`, `ignorePaths?`, `filter?`, `detectOptions?`, `timeout?` | Compares the form values read from the DOM with `expectedValue` (below) | `{"step": "expectRenderedValues", "label": "after add button click", "field": "testField", "expectedValue": ["value1", "value2", "value3", ""]}` |
| `expectElement` | `target` and the checks below, `timeout?`, `saveAs?` | Checks the element or elements of `target` | `{"step": "expectElement", "label": "initial", "target": {"widget": "combobox", "field": "testField"}, "value": "value2"}` |
| `measureRendering` | `iterations` (positive integer), `mode` (`remount`, `update`, `both`), `updateProps?` | Renders the case again `iterations` times per mode and records per-component render times ([Render measurements](#render-measurements-measurerendering)). Never fails on a duration | `{"step": "measureRendering", "iterations": 3, "mode": "both", "updateProps": {"initialFormState": "value3"}}` |

`expectElement` checks, all optional and combinable:

| Check | Passes when |
|---|---|
| `present` | `true` (default): the target resolves to one element in the document (not checked when the step has only `count` or `values`). `false`: no element matches, and the other checks are ignored |
| `count` | The number of matches equals `count` |
| `values` | The `value` of every match, in DOM order, equals `values` |
| `value` | `toHaveValue(value)` |
| `checked` | `toBeChecked()`, or `.not.toBeChecked()` for `false` |
| `containsHtml` | `toContainHTML(containsHtml)` |
| `attribute` | `{"name": n, "value": v}`: the attribute `n` equals `v` |
| `parentContains` | The parent element of the target contains the element of this second target |

`saveAs` on `click`, `change`, or `expectElement` names the resolved element; a later `{"ref": "<name>"}` target uses it. An element designated by `ref` is not checked for presence, since a re-render may have detached it (for example the name input of a renamed record entry).

**`expectRenderedValues`**

The step reads the values of the form elements rendered in the case container and the portal element, with `extractValuesFromRenderedElements`:

1. The extractor reads the fields under `F(field)` when `field` is given, under `TESTSECTION` otherwise, and strips that prefix from the keys. `label` is passed to it as the name of the step, and `filter` and `detectOptions` as they are. An open combobox reads as its committed value (`data-test-selected-value` of its state tracker), not as the text typed in it. Inputs whose name is outside that prefix are not read. Values with no form field of their own are read from markers the editors render (#305, `ValueObjectEditor/renderedValueMarkers.ts`): an empty array / object / record editor root strictly under the prefix carries `data-ml-empty-container` (`array` or `object`) and `data-ml-name`, and reads as `[]` / `{}`; the file `any` editor renders a hidden input with its value, JSON-parsed when flagged `data-ml-json`; the read-only literal input carries its form name.
2. The non-empty array-valued entries of the result (the extractor's option lists) are dropped, and `formValuesToJSON` turns the dotted keys into nested values. Numeric segments become array indexes, so an array field read with `field` gives an array.
3. With `path` (an array of keys and indexes), only the value at `path` is compared.
4. With `ignorePaths` (an array of dot paths, e.g. `"aNestedObject.level1.items.1.tags"`), each path is removed from a copy of the value and from `expectedValue` before the comparison; a numeric segment on an array removes the item. It is for branches the extractor cannot read: each ignored branch should get an `expectElement` check in the same leaf (#303). The test pattern needs none since #305.
5. When the value is an object and option lists are rendered, the key `$options` is added: `{"<field>": ["<option text>", …]}`, built from the `[role="option"]` elements whose `aria-label` is `<form field name>-option-<value>`, the field name without its `TESTSECTION.` prefix, the texts in DOM order.
6. The value is logged, then compared with `expectedValue` by `toEqual`. Keys whose value is `undefined` are ignored.

```json
{ "step": "expectRenderedValues", "label": "after click", "detectOptions": true,
  "expectedValue": { "testField": "value2", "$options": { "testField": ["value1", "value2", "value3"] } } }
```

**Errors**

A failing step fails its case with the message `step <n> (<kind>): <message>`, or `step <n> (<kind> "<label>"): <message>` when the step has a label. `n` counts from 1. Examples:

```text
step 3 (expectRenderedValues "after click"): [rendered values] Expected {"testField":"value2"} to equal {"testField":"value3"}. First difference at path: ["testField"]
step 2 (click): no element matches target {"widget":"arrayButton","field":"testField","action":"add"}
step 1 (expectElement "initial"): 2 elements match target {"byRole":"textbox"}, expected 1
```

For `expectRenderedValues`, the runner result also carries `expected` and `actual`. The app records the message as the result of the leaf; the vitest entry throws it, which fails the vitest test.

**Run the vitest entry**

```bash
# The 72 default cases plus 2 entry checks (74 passed); the 15 on-demand cases are listed as skipped.
# No --profile: the in-memory LocalCache reads no store.
npm run testByFile -w miroir-standalone-app -- miroir-component-tests

# One editor, or the test pattern
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlObjectEditor"
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlTestPattern"

# The render-performance suite (runOnDemand), with its measurement tables in the log
MIROIR_COMPONENT_PERF=1 VITE_MIROIR_LOG_CONFIG_FILENAME=catch-all-detailed \
  npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "MlEditorRenderPerformance"
```

`testByFile` (`scripts/test-by-file.ts`) passes `--bail=1` to vitest by default: after the first failing case, the later cases are reported as not run, not as passed. To see every failure at once, add `--no-bail` (or `--bail=0`); any other `--bail=<n>` replaces the default. Arguments reach vitest exactly as given, so a `-t` pattern may contain spaces (`-t "field at 1"`).

The entry `tests/4_view/miroir-component-tests.unit.test.tsx` loads every instance of the MiroirTest data folder that has a `reactComponentTest` leaf and runs each through the MiroirTest walk. A `reactComponentTestSuite` with `runOnDemand` is registered as `describe.skip("<suite> (runOnDemand: set MIROIR_COMPONENT_PERF=1 to run)")` with one skipped test per leaf, unless `MIROIR_COMPONENT_PERF=1`. The vitest names are `<editor> > <editor>: <case>`, so `-t` takes an editor name or part of a case label. The miroir-core generic entry (`testMiroir -w miroir-core`) also loads these instances. It registers no component test runner, so the tracker records their leaves as skipped.

**Add or change a case**

1. Edit the instance JSON of the editor: add or change a leaf in its `reactComponentTestSuite`, with the label `<editor>: <case>`.
2. When a case of a per-editor instance is added, removed, or renamed, update the reduced case list `tests/4_view/issues/292-declarative-react-component-tests/baseline-component-cases.txt` (checked by `componentTestInstances.292.phase1`). For any new leaf, update `EXPECTED_LEAF_COUNT` in the vitest entry (today 87: it counts every leaf of the folder, on-demand ones included), and `EXPECTED_ON_DEMAND_LEAF_COUNT` (today 15) for a leaf under a `runOnDemand` suite.
3. Rebuild the deployment package and check the instances:

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- modelValidation.unit.test.ts
npm run testByFile -w miroir-standalone-app -- componentMiroirTests.consistency
npm run testByFile -w miroir-standalone-app -- miroir-component-tests -t "<editor>"
```

A new instance also needs its export and declaration in `miroir-test-app_deployment-miroir` (`index.ts`, `index.d.ts`), its entry in `defaultMiroirMetaModel.tests` (`src/Model.ts`), and the instance counts of the vitest entry (`EXPECTED_INSTANCE_COUNT`, today 9) and `componentMiroirTests.consistency` (9), plus its name and uuid in `laterComponentInstances` of `componentTestInstances.292.phase1`. A component other than `MlElementEditor` needs an entry in `componentTests/componentRegistry.ts`. A new step kind needs a schema change (the `reactComponentTestStep` union in the MiroirTest Entity and EntityVersion, then `npm run devBuild -w miroir-core`) and a handler in `runComponentTestSteps.ts`.

To check that a new case asserts something, change one value of its `expectedValue` or `expectElement` check, run it, and see it fail with the message above.

**Run the cases in the app**

Open one of the component instances in the Miroir Tests report and click the unit Run button. The app loads the component test chunk on first use and renders each case in a sandbox panel, with its own providers and `LocalCache`. The application's own `LocalCache` is not changed. The sandbox keeps the last case on screen until you click Close. Close is disabled while the run is going on. One component test run at a time: when another test display is running component tests, its Run is refused with the message "A component test run is already in progress in another test display: wait for it to finish, then run again." "Run All Unit Tests" in the MiroirTest list has an "Include component tests" checkbox, checked by default. When it is unchecked, the component leaves are recorded as skipped. "Run All Unit Tests" never runs a `runOnDemand` suite: its leaves are recorded as skipped with "runOnDemand suite: not run by Run all (suite "<label>"); launch the suite on its own to run it". A JSON file added to the data folder appears in the app after a page reload.

##### Test pattern

`ui.mlElementEditor.allTypesPattern` renders one object holding every editor type (22 attributes: string, number, bigint, boolean, date, uuid, present and absent optionals, literal, enum, array, empty array, tuple, record, empty record, simple, mixed and discriminated unions, any, any with `display.any.format: "file"`, a recursive `schemaReference`, a 3-level nested object with an array of objects). No foreign key and no reference to another application's data. Its 4 leaves:

| Leaf | Checks |
|---|---|
| `MlTestPattern: every editor type displays its value` | One `expectRenderedValues` on `testField` over the whole value |
| `MlTestPattern: a deep leaf and the enum can be edited` | `change` on `aNestedObject.level1.level2.leaf`, `selectOption` on `anEnum` |
| `MlTestPattern: the simple union switches from number to string` | union type selector, then `aSimpleUnion` is `""` |
| `MlTestPattern: array items, record entries and optional attributes can be added, removed and renamed` | `clickArrayButton` add / delete, `renameRecordEntry`, `clickObjectButton addOptionalAttribute` |

Every interaction leaf ends with the display leaf's whole-value comparison (expected value with the edits), so an edit that changes another editor's value fails. A leaf takes about 1.5 to 3.5 s in happy-dom.

Every branch is compared, the literal, the empty containers, the recursive `schemaReference` and the file `any` field included (#305; until then they were under `ignorePaths`, see [#303 analysis §3.3](../../code-helpers/features/303-FEATURE-test-pattern-and-render-performance/analysis.md)).

Values that are compared as displayed: `aBigint` as a string, `aDate` as `YYYY-MM-DD`.

##### Render measurements (`measureRendering`)

With the `measureRendering` step, a leaf measures how long each MlElementEditor component takes to render.

- **Tracking.** Every MlElementEditor component reports its renders to the render insight registry (`useTrackedRender`, the registry behind the app's performance display). The runner turns tracking on (`initialShowPerformanceDisplay` on `MiroirContextReactProvider`) only for a suite containing a `measureRendering` step; other suites render the same DOM as without it.
- **Component ids.** `MlElementEditor`, `MlElementStringEditor`, `MlEnumEditor`, `MlLiteralEditor`, `MlAnyEditor`, `MlArrayEditor`, `MlTupleEditor`, `MlObjectEditor`, `MlRecordEditor`, `MlUnionEditor`. Number, bigint, boolean, date and uuid are rendered inline by `MlElementEditor`, so they report as `MlElementEditor`. There is no union component: the `MlElementEditor` whose declared schema is a union reports as `MlUnionEditor`. `MlAnyEditor` renders only for an `any` schema with `tag.value.display.any.format` (an `any` holding an object renders through the object / array editors). In the test component, a `MlObjectEditor` row also comes from the `TESTSECTION` wrapper.
- **Modes.** `remount` unmounts the case and mounts it again in the same container. `update` renders the case again with `updateProps` shallow-merged over the leaf props, then with the leaf props, alternately (N=2 ends on the leaf props). `both` runs `remount` first, then `update`; they are reported separately. After each render the step waits for progressive rendering to finish.
- **Iterations.** `iterations` renders per mode; the Miroir Tests iterations field replaces it for one run (below).
- **Result.** Per mode and component: `count`, `minMs`, `medianMs`, `maxMs`, `totalMs`. A sample is the component's summed render time over one iteration (every instance and re-render of it); `count` is the number of iterations in which the component rendered, not a number of renders. The `(total)` row sums every component per iteration. The rows go in `assertionMeasurements` of the leaf's `TestAssertionResult` and are logged at `info` by the logger `runReactComponentTest` as a table (component, mode, count, min, median, max). The default log preset (`catch-all`, WARN) hides them: use `VITE_MIROIR_LOG_CONFIG_FILENAME=catch-all-detailed` (or `VITE_MIROIR_LOG_CONFIG`) to see them.
- **Not a pass / fail.** The step fails only when `iterations` is not a positive integer, a re-render throws, rendering adds an error fallback ("Something went wrong in …") that was not there before the step, or a mode gets no sample. A duration never fails it. The numbers are for comparison between runs on the same machine: happy-dom timings are not browser timings (run the suite in the app for browser numbers), and tracking itself costs about +5 % on a mount (measured on the test pattern). Measurements are not stored across runs.

Example (the pattern leaf, N=3, happy-dom, ms):

```text
component               | mode    | count | min    | median | max
MlElementEditor       | remount | 3     | 276.92 | 287.58 | 324.93
MlArrayEditor         | remount | 3     | 34.52  | 38.59  | 39.20
MlAnyEditor           | remount | 3     | 9.72   | 10.35  | 10.66
(total)                 | remount | 3     | 365.00 | 381.71 | 434.71
(total)                 | update  | 3     | 31.04  | 38.39  | 40.38
```

`ui.mlElementEditor.renderPerformance` has `runOnDemand: true` and 15 leaves `MlEditorRenderPerformance: <type>`: one per single type (string, number, bigint, boolean, date, uuid, enum, literal, array, tuple, record, object, union, any with `display.any.format: "file"`) and a copy of the test pattern props (`rawMlSchema` and `initialFormState` of `ui.mlElementEditor.allTypesPattern`: change both instances together), each with `{measureRendering, iterations: 3, mode: "both", updateProps: <another value>}`. It takes about 8 s of test time in vitest (0.2 to 0.5 s per single editor, 3.4 s for the pattern), which is why it is not in the default run nor in `npm run nonreg`.

**In the app.** For an instance containing a `measureRendering` step, Miroir Tests shows an "Iterations" field (`Render iterations`) next to the unit Run button. Empty: the `iterations` of each step. A number: it replaces them for that run (a value that is not a positive integer fails the step). After the run, one table per leaf (`Render measurements: <leaf>`: Component, Mode, Count, Min / Median / Max ms) appears under the results grid, and in the window opened from the leaf's Result cell.

##### `MiroirTestDisplayIntegrationLaunch.integ.test.tsx` — UI integration launch

RTL coverage for the **Run Integration Tests** button and its success inspector. It runs the `Return Book Test Composite Action` leaf in `runner.returnDocument`.

```bash
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql MiroirTestDisplayIntegrationLaunch.integ
```

The browser profile remains **`emulatedServer-indexedDb`**; this Vitest test uses a mocked Node SQL launcher environment.

##### `MiroirTestListIntegrationLaunch.integ.test.tsx` — list integ batch

RTL coverage for list **Run All Integration Tests**. It runs one filtered `tr.core` leaf (`plus with empty args fails`) and asserts transformer `sessionKind` + inspector success.

```bash
npm run testByFile -w miroir-standalone-app -- \
  --profile emulatedServer-sql MiroirTestListIntegrationLaunch
```

Same pattern as the details proof: UI prefs stay on IndexedDB; the Node env mock loads SQL.

---

## Advanced implementation notes

This section is for people extending test infrastructure. It is not required to run the test suites above.

### Integration test sessions and bootstrap

App-stack integration paths use **`runAppStackIntegrationBootstrap`** (`tests/helpers/appStackIntegrationBootstrap.ts`) with an explicit phase list. Phase names are defined in `miroir-core` (`IntegrationTestBootstrap.ts`).

| Phase | Effect |
|-------|--------|
| `wireEmulatedStack` | `setupMiroirTest` — client `domainController`, optional emulated server |
| `deployMiroir` | Create Miroir meta-application deployment (`ensureMiroirPlatform`) |
| `deployLibrary` | Create library application deployment (`ensureLibraryPlayfield`) |
| `resetMiroirModel` | `resetAndInitApplicationDeployment` for Miroir only |

### Session matrix

| Session class | Kind | Playfield | Typical bootstrap phases | Entry points |
|---------------|------|-----------|--------------------------|--------------|
| `IntegrationTestSession` | `transformer` | `testApplication` | (local PersistenceStoreController — no HTTP phases) | `miroir-core-tests.integ.test.ts` |
| `AppStackIntegrationTestSession` | `appStackPersistenceStoreController` | `libraryDeployment` | wire + deployMiroir + deployLibrary | `4_storage/*.integ.test.tsx` |
| `DomainControllerIntegrationTestSession` | `domainController` | profile-dependent (see below) | profile-dependent | `testMiroir --suites action.domainController.*` |
| `RunnerTestSession` | `runner` | `libraryDeployment` | wire + deployMiroir | `miroir-runner-tests.integ` (`testMiroir`) |

`describeSession(kind)` (or `describeIntegrationTestSession(kind, profile)` for
`domainController`) returns `{ kind, bootstrapPhases, playfield, defaultHostMode, embeddedCapable }`.
The UI test launcher uses this metadata for the integration-test inspector (bootstrap
phases, playfield, `embeddedCapable`) and to decide whether embedded host attachment is offered.
Default UI integ runs use `hostMode: "isolated"` (data-isolated in-process bootstrap).

**DomainController profiles** (`getBootstrapPhasesForDomainControllerProfile` / `getPlayfieldForDomainControllerProfile`):

| Profile | Phases | Playfield | Used by |
|---------|--------|-----------|---------|
| `miroirPlatform` | wire + deployMiroir + resetMiroirModel | `none` | CRUD suites (`beforeEach` resets miroir model; library lifecycle in test JSON) |
| `miroirAndLibrary` | wire + deployMiroir + deployLibrary | `libraryDeployment` | `DomainController.React.Model.undo-redo` |

Model.CRUD may pass `skipResetMiroirModelInInit: true` so reset runs only in `beforeEach`.

### Host modes

| `IntegrationTestHostMode` | When | Bootstrap behaviour |
|---------------------------|------|---------------------|
| **`isolated`** | CLI / Vitest (default) | Full `wireEmulatedStack` + phased deploy via `ensureMiroirPlatform` / `ensureLibraryPlayfield` |
| **`embedded`** | Live UI host (advanced) | Inject `hostExecutionEnvironment`; skip `setupMiroirTest` and destructive deploy when `requireExisting` |

The Miroir Tests report runs data-isolated integration sessions with `hostMode: "isolated"`, an ephemeral run target, and a dedicated activity tracker.

#### UI integration — store backends

| Transport | Profile example | Where it runs | Notes |
|-----------|-----------------|---------------|-------|
| **Browser emulated IndexedDB** | `emulatedServer-indexedDb` | In-browser launcher (default) | Only emulated backend with native PersistenceStoreController in the browser. Bundled config is **`miroirConfig.browser-emulatedServer-indexedDb.json`** (all sections IndexedDB + placeholder `filesystemDeploymentRootDirectory` for `setupMiroirTest`). The `test-indexedDb` environment of the Vitest runs still uses a filesystem admin and is **CLI-only**. **No HTTPS to `miroir-server`** for this profile — network noise may be Vite loading modules. |
| **CLI emulated** | `emulatedServer-sql`, `-filesystem`, `-mongodb` | `testMiroir` / `testByFile` (Node) | Postgres/filesystem/Mongo drivers register in Vitest `beforeAll` |
| **Real server** | `realServer-sql`, `-indexedDb`, `-filesystem`, `-mongodb` | Browser client → `https://localhost:3080` (also Node proof via `uiIntegrationTestLauncher.realServer.integ`) | Requires running `miroir-server`. Select backend with `--storage` or `--profile realServer-*`. |

Bundling `emulatedServer-sql` JSON into the UI does **not** enable SQL integration in the browser. In webApp, **transformer** integ uses IndexedDB + bundled admin, or **`realServer-sql`** (REST to `miroir-server`); **runner** integ uses IndexedDB emulated or any `realServer-*` profile. `MiroirTestDisplayIntegrationLaunch.integ.test.tsx` verifies the details **Run Integration Tests** button (runner Return Book); `MiroirTestListIntegrationLaunch.integ.test.tsx` verifies list **Run All Integration Tests** (transformer leaf). The companion launcher test [`uiIntegrationTestLauncher.integ.test.ts`](../../packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.integ.test.ts) covers both runner and transformer leaves in Node without RTL; [`uiIntegrationTestLauncher.realServer.transformer.integ.test.ts`](../../packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.realServer.transformer.integ.test.ts) proves transformer against live `miroir-server` (skips if down).

Embedded mode attaches to a running host without re-deploying meta-model stores.

| Session kind | `embeddedCapable` | Notes |
|--------------|-------------------|-------|
| `transformer` | `false` | Local PersistenceStoreController / synthetic `testApplication` — always isolated |
| `appStackPersistenceStoreController`, `domainController`, `runner` | `true` | App-stack sessions accept embedded host injection |

### Platform playfield helpers

`miroir-core` (`MiroirPlatformPlayfield.ts`) exports idempotent helpers for the **Miroir**
meta-application deployment:

| Helper | Role |
|--------|------|
| `ensureMiroirPlatform` | Called from `deployMiroir` bootstrap phase — create miroir deployment if absent or assert it exists |

`MiroirPlatformEnsureMode`: `"createIfAbsent"` (CLI default) | `"requireExisting"` | `"skip"`.

Orchestrator context (`IntegrationTestOrchestratorContext.platformEnsureMode`) forwards to session
bootstrap. Use `requireExisting` with `hostMode: "embedded"` when the UI host already deployed Miroir.

### Library playfield helpers

`miroir-core` exports idempotent helpers for the real **library** deployment UUIDs
(`deployment_Library_DO_NO_USE` / `selfApplicationLibrary`):

| Helper | Role |
|--------|------|
| `ensureLibraryPlayfield` | Called from `deployLibrary` bootstrap phase — create library deployment if absent (`createIfAbsent`) or assert it exists (`requireExisting`) |
| `resetIntegTestbed` | Per-test reset + optional seed — used in `4_storage` `beforeEach`, runner `beforeEachTest`, undo-redo |

`LibraryPlayfieldEnsureMode`: `"createIfAbsent"` (CLI default) | `"requireExisting"` | `"skip"`.

Orchestrator context (`IntegrationTestOrchestratorContext.playfieldMode`) forwards to session
bootstrap as `libraryPlayfieldEnsureMode`. Use `requireExisting` with embedded host mode when the
host already deployed the library.

Shared seed constants for standalone-app tests:
`packages/miroir-standalone-app/tests/helpers/libraryPlayfieldSeeds.ts`
(`libraryTestbedInitParams`, `testbedEntitiesAndInstances`, `libraryEntitiesAndInstancesWithoutBook3`).

Transformer integ intentionally keeps the synthetic `testApplication` playfield — it does **not**
share library deployment UUIDs with app-stack tests.

### `MiroirTestIntegrationOrchestrator`

Port in `miroir-core` (`MiroirTestIntegrationOrchestrator.ts`). Standalone-app registers concrete
session classes via `createStandaloneAppIntegrationOrchestrator()`:

```typescript
import { createStandaloneAppIntegrationOrchestrator } from "./helpers/StandaloneAppIntegrationOrchestrator.js";

const orchestrator = createStandaloneAppIntegrationOrchestrator();

// CLI / isolated (default)
const session = orchestrator.createSession("runner", {
  miroirConfig,
  miroirActivityTracker,
  miroirEventService,
  hostMode: "isolated",
  platformEnsureMode: "createIfAbsent",
  playfieldMode: "createIfAbsent",
});

// Embedded live UI host
const embeddedSession = orchestrator.createSession("appStackPersistenceStoreController", {
  miroirConfig,
  hostMode: "embedded",
  platformEnsureMode: "requireExisting",
  playfieldMode: "requireExisting",
  hostExecutionEnvironment: hostEnv, // domainController + PersistenceStoreController manager from live app
  skipBootstrapPhases: ["wireEmulatedStack", "deployMiroir"], // optional explicit filter
  hostApplicationDeploymentMap: hostEnv.applicationDeploymentMap,
}, appStackSessionOptions);

await session.initSession();
```

`describeSession(kind)` returns `{ kind, bootstrapPhases, playfield, defaultHostMode, embeddedCapable }` from
`describeIntegrationTestSession`. For `domainController`, pass the profile to
`describeIntegrationTestSession(kind, profile)` directly.

**Orchestrator context fields:**

| Field | Purpose |
|-------|---------|
| `hostMode` | `"isolated"` (default) or `"embedded"` |
| `hostExecutionEnvironment` | Injected `domainController` + `persistenceStoreControllerManager` for embedded runs |
| `platformEnsureMode` | `ensureMiroirPlatform` mode for `deployMiroir` phase |
| `playfieldMode` | `ensureLibraryPlayfield` mode for `deployLibrary` phase |
| `skipBootstrapPhases` | Explicit phase filter (e.g. skip `deployMiroir` when host is live) |
| `hostApplicationDeploymentMap` | Override session deployment map from live UI |

### Deprecated setup helpers

`setupMiroirTestAndCreateMiroirDeployment` and `setupMiroirTestAndDeployMiroirApp` remain as thin
wrappers (used by characterization unit tests) but are **deprecated** — prefer session classes above.
`setupMiroirTest` is still the public primitive for wiring client/server stack inside the bootstrap.

---

### Architecture: comparing integration paths

#### MiroirTest path (`testMiroir` → `miroir-core-tests.integ.test.ts`)

```
npm run testMiroir -w miroir-standalone-app
  scripts/test-miroir-runner.ts  [routes when suite keys ⊆ miroir-core registry]
    vitest → miroir-core-tests.integ.test.ts
      assertMiroirCoreIntegTestLaunchReady(MIROIR_TEST_*)
      createStandaloneAppIntegrationOrchestrator().createSession("transformer", …)
        IntegrationTestSession.initSession()
        register store startups from MIROIR_TEST_APP/ADMIN_STORE_TYPE
        setupMiroirDomainController (local PersistenceStoreController, no HTTP)
        seed library entities via domainController actions
      runMiroirCoreTestsFromCLI
        loadMiroirCoreTestSuite(key)  ← deployment JSON
        runMiroirTests._runMiroirTestSuite
          transformerTest / functionCallTest / queryTest leaves
```

**Characteristics:** env-var configuration; no emulated HTTP server; tests defined as `MiroirTest` JSON entities; `IntegrationTestSession` owns store lifecycle; pre-flight validation with usage output.

#### App-stack path (`testByFile` → `DomainController.integ.*.test.tsx`)

```
npm run testByFile -w miroir-standalone-app -- DomainController.integ.Data
  vitest → DomainController.integ.Data.CRUD.test.tsx  [top-level module setup]
    loadTestConfigFiles(VITE_MIROIR_TEST_CONFIG_FILENAME, VITE_MIROIR_LOG_CONFIG_FILENAME)
    miroirAppStartup + store section startups
    beforeAll:
      DomainControllerIntegrationTestSession.initSession()
        runAppStackIntegrationBootstrap(phases from miroirPlatform profile)
        setupMiroirTest → client domainController + RestClientStub (wire phase)
        deployMiroir + resetMiroirModel phases
    beforeEach:
      resetAndInitApplicationDeployment (library deployment) — unchanged per suite
    describe/it:
      runTestOrTestSuite(testActions, domainController, …)
        composite-action tree executed step-by-step via domainController
```

**Characteristics:** JSON config files (`miroirConfig.test-*.json`); full client/server stack with optional `RestClientStub` emulated HTTPS; tests defined inline as `TestCompositeActionParams` records; per-file `beforeAll`/`afterAll`; no `MIROIR_TEST_*` validation layer.

#### Side-by-side comparison

| | MiroirTest (`testMiroir`) | App-stack (`testByFile`) |
|--|--------------------------|--------------------------|
| **Vitest entry** | Single file per family (`miroir-core-tests.integ.test.ts`) | One file per test suite |
| **Configuration** | `MIROIR_TEST_*` env vars | `VITE_MIROIR_TEST_CONFIG_FILENAME` + `VITE_MIROIR_LOG_CONFIG_FILENAME` |
| **Test definition** | `MiroirTest` deployment JSON | Inline TypeScript (`testActions`, `it()`) |
| **Bootstrap** | `IntegrationTestSession` via orchestrator | `DomainControllerIntegrationTestSession` / `AppStackIntegrationTestSession` / `RunnerTestSession` |
| **HTTP layer** | None (direct PersistenceStoreController) | `RestClientStub` when `emulateServer: true` |
| **Store layout** | Independent app + admin backends via env | Per-deployment `deploymentStorageConfig` in JSON |
| **Reset between cases** | `testSession.beforeEach()` | Per-file `beforeEach` or composite-action `beforeEach` |
| **Pre-flight checks** | `assertMiroirCoreIntegTestLaunchReady` | `loadTestConfigFiles` throws on missing env |
| **Typical use** | Transformer/query regression at scale | DomainController, PersistenceStoreController, extractor, view integration |

Both paths ultimately drive actions through `domainController`, but the MiroirTest path bypasses the HTTP/RestClient layer and reads test cases from deployment assets, while the app-stack path exercises the same code paths the standalone UI uses (including emulated server routing).

#### Unit tests (miroir-core)

```
npm run testMiroir -w miroir-core
  scripts/test-miroir-core.ts
    vitest → miroir-core-tests.unit.test.ts
      runMiroirCoreTestsFromCLI (no testSession)
        loadMiroirCoreTestSuiteFromFolders → runMiroirTests (in-memory)
```

---

### Key source files

#### miroir-core

| File | Role |
|------|------|
| `src/5_tests/miroirCoreTestSuiteRegistry.ts` | Deprecated name-list snapshot → deployment export |
| `src/5_tests/parseMiroirTestCliConfig.ts` | CLI/env parsing (`MIROIR_TEST_*`) |
| `src/5_tests/runMiroirCoreTestsFromCLI.ts` | Main entry called by both vitest entries |
| `src/5_tests/MiroirTestTools.ts` | Unified runner dispatching by test type |
| `src/5_tests/MiroirTransformerTestTools.ts` | Transformer/function-call execution and SQL path |
| `src/5_tests/IntegrationTestBootstrap.ts` | Bootstrap phase descriptors + `IntegrationTestPlayfield` + host mode metadata |
| `src/5_tests/LibraryPlayfield.ts` | `ensureLibraryPlayfield`, `resetIntegTestbed`, `LibraryPlayfieldEnsureMode` |
| `src/5_tests/MiroirPlatformPlayfield.ts` | `ensureMiroirPlatform`, `MiroirPlatformEnsureMode` |
| `src/5_tests/MiroirTestIntegrationOrchestrator.ts` | Orchestrator port + host/playfield context |
| `tests/miroir-core-tests.unit.test.ts` | Vitest unit entry |
| `scripts/test-miroir-core.ts` | `testMiroir` launcher for unit tests |

#### miroir-standalone-app

| File | Role |
|------|------|
| `tests/miroir-core-tests.integ.test.ts` | MiroirTest integration entry (`testMiroir`) |
| `tests/miroir-runner-tests.integ.test.ts` | Runner / Action MiroirTest integration entry (`runner.lendDocument`, `runner.returnDocument` from library; `action.domainController.*` from Miroir `miroir_data`) |
| `tests/helpers/IntegrationTestSession.ts` | Transformer + app-stack PersistenceStoreController sessions |
| `tests/helpers/DomainControllerIntegrationTestSession.ts` | DomainController CRUD / undo-redo bootstrap |
| `tests/helpers/appStackIntegrationBootstrap.ts` | Shared `runAppStackIntegrationBootstrap` |
| `tests/helpers/StandaloneAppIntegrationOrchestrator.ts` | Orchestrator implementation (all session kinds) |
| `tests/helpers/libraryPlayfieldSeeds.ts` | Shared library seed data for playfield resets |
| `tests/helpers/RunnerTestSession.ts` | Runner MiroirTest + legacy runner integ bootstrap |
| `tests/helpers/miroirCoreIntegTestLaunch.ts` | Pre-flight validation + usage output |
| `tests/helpers/runMiroirRunnerTestsFromCLI.ts` | Runner test CLI orchestration |
| `tests/utils/fileTools.ts` | `loadTestConfigFiles` for app-stack tests |
| `src/miroir-fwk/4-tests/setupMiroirTest.ts` | `setupMiroirTest` (public); deprecated `setupMiroirTestAnd*` wrappers |
| `src/miroir-fwk/4-tests/runTestOrTestSuite.ts` | Composite-action test tree runner |
| `tests/miroirConfig.test-*.json` | App-stack store/backend presets |
| `scripts/test-miroir-runner.ts` | `testMiroir` launcher — routes core vs runner integ |

#### App-stack integration test files

| Path | Role |
|------|------|
| `tests/3_controllers/DomainController.integ.*.test.tsx` | DomainController CRUD suites |
| `tests/4_storage/PersistenceStoreController.integ.test.tsx` | PersistenceStoreController integration |
| `tests/4_storage/ExtractorPersistenceStoreRunner.integ.test.tsx` | Extractor runner |
| `tests/4_storage/ExtractorTemplatePersistenceStoreRunner.integ.test.tsx` | Extractor template runner |
| `tests/4_view/ReportPage.integ.test.tsx` | Report view React tests |
| `tests/4_view/BlobEditorField.integ.test.tsx` | Blob editor component tests |

#### miroir-test-app_deployment-miroir

| Path | Role |
|------|------|
| `assets/miroir_data/a311f363-…/<uuid>.json` | MiroirTest suite instances |
| `index.ts` | Named exports (`miroirTest_<key>`) |

---

### `IntegrationTestSession`: programmatic API

```typescript
import {
  IntegrationTestSession,
  buildTestApplicationStoreUnitConfiguration,
  buildAdminStoreUnitConfiguration,
  resolveTestSessionForIntegOptionsFromEnv,
} from "tests/helpers/IntegrationTestSession.js";

// From env (standard usage)
const session = new IntegrationTestSession(resolveTestSessionForIntegOptionsFromEnv(process.env));

// Explicit sql app + filesystem admin
const session = new IntegrationTestSession({
  testApplicationStore: {
    emulatedServerType: "sql",
    postgresHostName: "localhost",
  },
  adminStore: {
    emulatedServerType: "filesystem",
    adminAssetsRootDirectory: resolveDefaultAdminAssetsRoot(),
    filesystemDeploymentRootDirectory: resolveDefaultFilesystemDeploymentRoot(),
  },
});

const executionEnvironment = await session.initSession();
// ...
await session.teardown();
```

#### `IntegrationTestSession` lifecycle

| Method | Called by | Effect |
|--------|-----------|--------|
| `initSession()` | vitest entry, once per file | Create store schemas, open PersistenceStoreController, seed library |
| `beforeEach()` | vitest `beforeEach` hook | Re-run `resetModel → initModel → createEntity → createInstance` |
| `teardown()` | vitest `afterAll` hook | Delete test schemas, close store |

#### Deprecated aliases

`IntegrationTestSessionForPostgres` is kept as thin wrappers over `IntegrationTestSession` for backward compatibility and will be removed in a future release.

---

### Adding a new suite

#### Unit suite (`testMiroir --mode unit`)

1. Create a `MiroirTestDefinition` JSON in the owning application's MiroirTest folder:
   - Miroir app: `packages/miroir-test-app_deployment-miroir/assets/miroir_data/a311f363-…/<uuid>.json`
   - Other apps: that app's **model** section `…/<app>_model/a311f363-…/<uuid>.json`
2. Set `name` to the CLI / UI suite key (e.g. `myNewSuite`), and `tags` to one to three values of the [tag vocabulary](#tags), main area first. Set `issue` to the GitHub issue number the test is written for, when there is one ([Issue](#issue)).
3. CLI discovery scans `packages/miroir-test-app_deployment-*/assets/*/<MiroirTest uuid>` (`discoverApplicationMiroirTestSourceFolders`). Test runners load the suite with `loadMiroirCoreTestSuiteFromFolders` / `loadMiroirTestSuiteFromCatalog`. Runner `runnerRef` lookup uses sibling Runner folders (`loadApplicationRunnerUuidIndexFromFolders`).
4. Optional: export `miroirTest_myNewSuite` from the deployment package `index.ts` if other TypeScript wants a named import. Rebuild that package.
5. Validate schema: `VITE_TEST_MODE=true npx vitest run tests/4_services/miroirTest.schema.unit.test.ts -w miroir-core`.
6. Run: `npm run testMiroir -w miroir-core -- --suites myNewSuite --mode unit`.

TypeScript files that have **no** MiroirTest entity are PLATFORM — launch those with `testByFile` (optional `RUN_TEST`). See [MiroirTest vs PLATFORM](#miroirtest-vs-platform).

#### Integration suite (UI / CLI `testMiroir --mode integ`)

Playfield **model + instances** belong on the suite or a `TestConfiguration`, not in TypeScript.

1. On the `MiroirTestSuite` `definition`, set either:
   - inline `testbedModel` + `testbedEntitiesAndInstances` (a `metaModelPartial` slice, not a full app dump), **or**
   - `testConfiguration`: uuid of a `TestConfiguration` instance.
   Do not set both. Do **not** paste Entity arrays into TypeScript.
2. `TestConfiguration` instances follow Query / `MiroirTest`: Miroir app → **data** (`miroir_data/675ccd46-…/`); any other app → that app’s **model** section. Payload is `name` / `description` + `testbedModel` + `testbedEntitiesAndInstances` only.
3. Session kind (`runner` / `action` / `transformer`) is inferred from the suite leaves. UI launchability comes from the **currently selected application's** MiroirTest instances, not from `UI_INTEGRATION_RUNNER_SUITE_REGISTRY`.
4. Put the JSON in that application's MiroirTest entity folder (`…/assets/<app>_data|model/a311f363-…/`) so CLI discovery can find it. Runner tests need the Runner JSON in the sibling `e54d7dc1-…` folder.
5. Run: `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites myNewSuite --mode integ`.

---

## Filtering MiroirTest cases

`--filter` / `MIROIR_TEST_FILTER` selects **which leaves run** inside the suite(s) already chosen by `--suites`. Non-selected leaves are registered in Vitest as **skipped**.

### Three names (easy to confuse)

| Name | Example | Used in |
|------|---------|---------|
| **Suite key** (`name`) | `runner.returnDocument`, `action.domainController.dataCrud`, `tr.core` | `--suites`, `MIROIR_TEST_SUITES`, UI |
| **Suite `miroirTestLabel`** | `runner.returnDocument`, `tr.core`, nested `plus` | display; **nested** `--filter` keys only |
| **Leaf `miroirTestLabel`** | `Return Book Test Composite Action`, `plus with empty args fails` | `--filter` **values**, UI leaf checkboxes |

`--suites` and catalog-root `--filter` keys are instance `name`. Nested `--filter` keys stay `miroirTestLabel` (inline suites have no `name`). For **transformer** suites such as `tr.core` the name and root label usually match; nest intermediate suite labels in the filter JSON.

Find labels in the MiroirTest JSON under `definition.miroirTestLabel` (suite) and each leaf’s `miroirTestLabel`.

### JSON shapes (equivalent after normalization)

**Recommended — shorthand** (suite key (`name`) → leaf labels):

```json
{ "runner.returnDocument": ["Return Book Test Composite Action"] }
```

**Canonical** (explicit `testList`):

```json
{ "testList": { "runner.returnDocument": ["Return Book Test Composite Action"] } }
```

**Single flat suite — leaf key only** (when every filter key matches a leaf label in that suite; array values are ignored):

```json
{ "Return Book Test Composite Action": ["*"] }
```

**Run all leaves in the selected suite(s)** — omit `--filter` entirely.

**Run only listed leaves across a flat suite** (no nested suite key):

```json
{ "testList": ["Return Book Test Composite Action", "Lend Book Test Composite Action"] }
```

### Use cases

#### 1. One runner integ leaf (library return)

```bash
npm run testMiroir -w miroir-standalone-app -- \
  --suites runner.returnDocument --mode integ --profile emulatedServer-sql \
  --filter '{"runner.returnDocument":["Return Book Test Composite Action"]}'
```

#### 2. One leaf per library runner suite

The library runner suites are single-leaf: `runner.lendDocument` (label `runner.lendDocument`)
and `runner.returnDocument` (label `runner.returnDocument`). To run both, list both suites
(no filter needed since each suite has exactly one leaf):

```bash
npm run testMiroir -w miroir-standalone-app -- \
  --suites runner.lendDocument,runner.returnDocument --mode integ --profile emulatedServer-sql
```

#### 3. One transformer integ leaf inside a large suite

```bash
npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites tr.core --mode integ \
  --filter '{"tr.core":{"runtimeTransformerTests":{"plus":["plus with empty args fails"]}}}'
```

Nest objects for intermediate suite labels; use a string array for the leaf list at the innermost level. Labels come from that suite’s JSON (`miroirTestLabel`).

#### 4. One unit-test leaf (functionCallTest)

```bash
npm run testMiroir -w miroir-core -- --suites fn.mustache.extractDoubleBracePatterns --mode unit \
  --filter '{"fn.mustache.extractDoubleBracePatterns":["should extract patterns with double braces"]}'
```

#### 5. Legacy environment-variable form

```bash
MIROIR_TEST_FILTER='{"runner.returnDocument":["Return Book Test Composite Action"]}' \
  npm run testMiroir -w miroir-standalone-app -- \
  --profile emulatedServer-sql --suites runner.returnDocument --mode integ
```

### Common mistakes

| What you typed | What happens |
|----------------|--------------|
| `'{"Return Book Test Composite Action": "*"}'` (no `testList`, leaf as top-level key) | **Works** after fix — treated as leaf-key shorthand when the label exists in the suite |
| `'{"runner.returnDocument":["Return Book Test Composite Action"]}'` | **Error** — catalog-root key must be the suite key (`name`), not `miroirTestLabel` |
| `'{"testList":{"Return Book Test Composite Action":["*"]}}'` with wrong nesting | **Error** — use `runner.returnDocument` as the key unless using leaf-key shorthand |
| Wildcard `"*"` as a leaf name | **Not supported** — list explicit leaf labels or omit `--filter` |

When a catalog-root filter key or leaf label is unknown, the run **throws** and lists the instance `name`, suite label, and available leaves.

After changing filter logic in `miroir-core`, rebuild before running standalone-app tests:

```bash
npm run devBuild -w miroir-core
```

---

## Launch validation

When the integration entry is invoked with inconsistent or missing configuration, `assertMiroirCoreIntegTestLaunchReady` prints a full shell-style usage message (including `--profile emulatedServer-sql`) and a profile tip before failing:

```
Usage: MIROIR_TEST_SUITES=<suite>[,<suite>...] MIROIR_TEST_MODE=integ npm run testMiroir -w miroir-standalone-app
   or: npm run testMiroir -w miroir-standalone-app -- --suites <suite> --mode integ
   or: npm run testMiroir -w miroir-standalone-app -- --profile <profile> --suites <suite> --mode integ
...
Configuration error(s):
  - MIROIR_TEST_MODE must be integ or integration for miroir-core-tests.integ.test (got "unit")

Tip: run via testMiroir with --profile emulatedServer-sql to set VITE_MIROIR_* and MIROIR_TEST_* from one preset ...
```

Checks performed:

- `MIROIR_TEST_MODE` is `integ` or `integration`
- All suite keys exist in the registry
- `--mode unit` on argv is inconsistent with the integration entry
- Store type env vars are valid values
- **CI:** when sql store backends are used, `MIROIR_TEST_POSTGRES_HOST` or profile config (`VITE_MIROIR_TEST_CONFIG_FILENAME`) must be set
- MongoDB connection string present when any store uses mongodb
- `bundledDeploymentData` supplied when admin store is `bundled`
- Admin asset subdirectories (`admin/`, `admin_model/`, `admin_data/`) exist on disk when admin is filesystem
- Parent of app filesystem root exists when app store is filesystem
- Filter shape is validated at runtime when suites execute (see [Filtering MiroirTest cases](#filtering-miroirtest-cases))

---

## Running tests in the UI

1. Start the app: `npm run dev -w miroir-standalone-app`.
2. Navigate to **Miroir Tests** in the menu.
3. Use the **list** report for batch runs, or open a suite’s **details** for a single-suite cockpit. The badge on details shows `unit` / `integration` / `mixed`.
4. To work on a subset, click tag chips above the Run All buttons (each shows its test count): the list and both Run All buttons keep the tests carrying any selected tag; click again to deselect. The **Miroir Tests** grid below has a **Tags** column to sort and filter on.

### List vs details × unit vs integration

| Surface | Unit | Integration |
|---------|------|-------------|
| **List** (`MiroirTestListDisplay`) | **Run All Unit Tests** — in-memory unit leaves for every suite in the list | **Run All Integration Tests** — shown only when ≥1 UI-launchable integ suite is in the list; runs launchable suites **sequentially** under one mutex. Shares profile / run-target prefs with details. |
| **Details** (`MiroirTestDisplay`) | **Run unit tests** when the suite has unit-capable leaves | **Run Integration Tests** when the suite has integ-capable leaves (runner = integ-only; mixed transformer = both buttons) |

List **Run All Unit Tests** never launches integration sessions. List/details integ need a **browser-launchable** profile — in webApp that is **`emulatedServer-indexedDb`** (default) or a **`realServer-*`** profile with `miroir-server` up. Emulated SQL/filesystem/Mongo profiles stay Electron/CLI-only.

### Manual checklist (webApp)

1. Miroir deployment → Miroir Tests **list** → **Run All Unit Tests** completes; label is unambiguous (not “Run All Miroir Tests”).
2. Same list → profile `emulatedServer-indexedDb` → **Run All Integration Tests** runs launchable suites only (expect `tr.core` and/or `runner.returnDocument` when present in the fetched list).
3. Details `tr.core` → both unit and integ buttons; run unit then integ.
4. Details `runner.returnDocument` → integ only (no unit button).
5. Details unit-only suite (e.g. `fn.entityPrimaryKey`) → unit only.

### Runner vs transformer from the UI

Both use the same **Run Integration Tests** affordance (details button, or list **Run All Integration Tests** batch). The launcher picks the session kind from the suite’s leaves:

| Suite (instance name) | Session | What to select | Browser profile |
|-----------------------|---------|----------------|-----------------|
| `runner.returnDocument` (label `runner.returnDocument`) | `RunnerTestSession` | Ephemeral or pinned run target | `emulatedServer-indexedDb` (default) or `realServer-*` |
| `tr.core` | `IntegrationTestSession` / `RealServerTransformerTestSession` | Ephemeral or pinned `testApplication` identity | `emulatedServer-indexedDb` or `realServer-sql` (server up) |

**Runner**

1. Open **runner.returnDocument** / `runner.returnDocument` (or use list **Run All Integration Tests** when the suite is in the list).
2. Choose profile (`emulatedServer-indexedDb` or a `realServer-*` profile with `miroir-server` up).
3. Choose **Ephemeral run** (fresh UUIDs) or **Pinned suite targets**.
4. Click **Run Integration Tests** — inspector should show `sessionKind: runner`.

**Transformer**

1. Open **tr.core** (or use the list batch).
2. Choose profile **`emulatedServer-indexedDb`** or **`realServer-sql`** (requires `miroir-server` at `https://localhost:3080`).
3. Choose ephemeral or pinned identity.
4. Click **Run Integration Tests** — inspector should show `sessionKind: transformer`.

Mixed suites (e.g. `tr.core`) show separate unit and integration actions when both leaf kinds are present.

Browser-supported profiles:

| Profile | Store location | Runner | Transformer |
|---------|----------------|--------|-------------|
| `emulatedServer-indexedDb` | Browser IndexedDB | ✅ | ✅ |
| `realServer-sql` | Postgres behind `miroir-server` | ✅ | ✅ (REST; server must be up) |
| `realServer-filesystem` | Filesystem behind `miroir-server` | ✅ | — |
| `realServer-indexedDb` | IndexedDB behind `miroir-server` | ✅ | — |
| `realServer-mongodb` | MongoDB behind `miroir-server` | ✅ | — |

Real-server profiles require a reachable `miroir-server` and the selected backend on that server. The browser is REST-only for these profiles.

---

## Rebuilding after schema or deployment changes

```bash
# After changing MiroirTest JSON assets
npm run build -w miroir-test-app_deployment-miroir

# After changing Query / Endpoint / EntityVersion ML schemas in deployment-miroir
# (e.g. `attributes` on extractors or RestPersistenceAction_read)
npm run build -w miroir-test-app_deployment-miroir
npm run devBuild -w miroir-core   # regenerates preprocessor-generated types + package build

# After changing miroir-core entity definitions or generated types only
npm run devBuild -w miroir-core

# After changing miroir-react source
npm run build -w miroir-react
```

Hand-editing `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/*` is not durable — the next `devBuild` overwrites it from the deployment's ML schemas.

---

## See also

- [Contributing: testing guidelines](../contributing/testing.md) — commands for contributors
- [Developer guide: testing](../guides/developer/testing.md) — context and concepts
