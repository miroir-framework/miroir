# Issue #252 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Tests exercise the real DomainController / local cache / emulated-server store profiles through
> `MiroirTest` suite JSON, `TestConfiguration` instances, and the existing UI/CLI orchestrator.
> No mocks. Tracer: one unique DC suite (`domain_controller_model_undo_redo`) runs integ with
> playfield model + instances read from the suite, not from `testBedModelAndInstances`.
>
> **Execution model:** human-in-the-loop. No slice contains a commit step — commits happen
> only when the user explicitly asks. Each slice ends with its Validation commands; on
> success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/252
Parent: [`../197-FEATURE- run integration tests in the UI/plan.md`](../197-FEATURE-%20run%20integration%20tests%20in%20the%20UI/plan.md)
Working branch: `dev-copilot`

**Resume note:** Slice 3 ✅ — Library document `TestConfiguration`; lend/return by uuid. Next is Slice 4 (Miroir Publisher+Country config; three suites by uuid).

---

## Scope

In scope:

- Optional `testbedModel`, `testbedEntitiesAndInstances`, and `testConfiguration` uuid on root `MiroirTestSuite` (XOR uuid vs inline; never init params).
- Entity `TestConfiguration` (model + instances only) with list/details reports; instances in Miroir **data** and other-app **model**.
- Two shared `TestConfiguration` instances (Library document seed, Miroir Publisher+Country) plus unique DC / freeze slices inlined on their suites (synthetics travel with the suite; freeze uses inline appForTest playfield per D12).
- UI/CLI launcher reads model + instances from the suite (or referenced config); registry keeps `{ kind, suiteDefinition, testbedInitApplicationParameters }`.
- Menu items: `ApplicationModelScopeTemplate` (9th report link) and `MiroirMenu` (next to “Miroir Tests”).
- Docs for adding a new integ suite.

This plan does **not** retire suite-*key* registries or drop registry `kind` (#228), migrate remaining vitest twins (#204), put `InitApplicationParameters` on the suite or on `TestConfiguration`, infer `kind` from leaves, change lend/return leaf `initialModel`, or add a rich TestConfiguration author.

**Issue body:** GitHub #252 aligned with this plan and [`analysis.md`](./analysis.md) (2026-08-31 review).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize registry, schema, menus, section routing | ✅ | inventory unit tests GREEN (current state) |
| 1 | Tracer: suite-owned seed for `domain_controller_model_undo_redo` | ✅ | resolver + launcher unit + that suite integ GREEN |
| 2 | Entity `TestConfiguration` + reports + menus | ✅ | `getApplicationSection` + modelValidation + #240 menu suite |
| 3 | Library document `TestConfiguration`; lend/return by uuid | ✅ | lend + return integ GREEN |
| 4 | Miroir Publisher+Country config; three suites by uuid | ⬜ | model_crud + freeze + evolutionTraceWP1 integ GREEN |
| 5 | Remaining unique DC slices inlined on suite JSON | ⬜ | those five DC suites integ GREEN |
| 6 | Freeze suite inline appForTest playfield | ⬜ | `runner_freeze_application_version` integ GREEN |
| 7 | Drop registry fallback; final `{ kind, suiteDefinition, testbedInitApplicationParameters }` | ⬜ | launcher unit + create/drop integ GREEN |
| 8 | Nonreg, docs, cleanup, AC | ⬜ | nonreg step + tracer narrative |

---

## Locked implementation defaults

Copied from [`analysis.md`](./analysis.md) (confirmed 2026-08-31). Deviations go into the slice’s Realization.

| Decision | Choice |
|---|---|
| D0. Suite may carry | `testbedModel` + `testbedEntitiesAndInstances` **XOR** `testConfiguration` uuid. Never init params. |
| D1. `testbedModel` | Inline `metaModelPartial` playfield slice. **Do not** dump `defaultLibraryAppModel`. Synthetics travel with suite or config. |
| D2 / Q1. `TestConfiguration` payload | `name` / `description` + `testbedModel` + `testbedEntitiesAndInstances` only. |
| D3. How the suite chooses a seed | Uuid XOR inline. No merge / overlay. |
| D4. Init params | `UI_INTEGRATION_RUNNER_SUITE_REGISTRY` only. |
| D5. Registry leftover | `{ kind, suiteDefinition, testbedInitApplicationParameters }`. Drop `testBedModelAndInstances`. |
| D6. Where suite fields live | Root `MiroirTestSuite` (`definition`), next to `runTarget`. |
| D7. Instance section | Same as Query / `MiroirTest`: Miroir → **data**; other apps → **model**. `getApplicationSection`. Independent of `runTarget`. |
| D8. Registry `kind` | Stays (`runnerTest` \| `domainControllerTest` \| `actionTest`). |
| D9. Menu | Model-scope template **and** Miroir menu. |
| D10. Schema bootstrap order | Entity `TestConfiguration` (`675ccd46-…`) **before** `testConfiguration` FK on `MiroirTestSuite`. Slice 1 adds `testbedModel` + `testbedEntitiesAndInstances` only; FK uuid field + `foreignKeyParams` land in Slice 2. |
| D11. `skipReset` vs uuid/inline | `resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite` → `null` **first**; uuid/inline ignored when skipReset is true. |
| D12. Freeze suite seed | `runner_freeze_application_version` playfield **inline** on Miroir suite JSON; no cross-app `TestConfiguration` uuid. |

`runTarget` remains sandbox identity (ephemeral vs pinned). It does not choose TestConfiguration ownership.

`suiteDefinition` in the registry is already the inner `MiroirTestSuite` (`MiroirTest.definition`). New fields are read as `suiteDefinition.testbedModel`, not `suiteDefinition.definition.*`.

---

## Allocated UUIDs / keys

| Artefact | Value |
|---|---|
| Entity `TestConfiguration` | `675ccd46-7dd3-400b-a2bd-1319c39e11da` |
| EntityVersion of `TestConfiguration` | `d85749be-caf7-4595-9375-5ab6abf2061b` |
| Report `TestConfigurationList` | `08cd379a-9ec8-4e1b-ac99-8a77a6905d72` |
| Report `TestConfigurationDetails` | `21a693e4-127b-4c84-a7eb-d145eaf4d0d2` |
| Instance `testConfiguration_libraryDocumentSeed` (Library **model**) | `d669558c-7cda-4037-81bf-0b9a71fbcb94` |
| Instance `testConfiguration_libraryPublisherAndCountry` (Miroir **data**) | `431e0903-80ff-45be-aec7-12fe272dcef0` |
| Instance `testConfiguration_appForTestPublisherAndCountry` (appForTest **model**) | `343d4d68-b7db-4c19-a7e1-9b58e8428d52` — **reserved, not used in #252** (D12 inline freeze seed) |
| Nonreg unit step | `unit-resolveSuitePlayfieldSeed` |

Existing constants reused (do not reallocate):

| Role | uuid |
|---|---|
| Entity `MiroirTest` | `a311f363-e238-4203-bdfc-29e8c160c26b` |
| EntityVersion of `MiroirTest` | `51c647fe-07ec-411c-89cc-02689dc66d6a` |
| Entity (metaclass) | `16dbfe28-e1d7-4f20-9ba4-c1a9873202ad` |
| EntityVersion (metaclass) | `54b9c72f-d4f3-4db9-9e0e-0dc840b530bd` |
| Entity present-model EntityVersion (`parentDefinitionVersionUuid`) | `381ab1be-337f-4198-b1d3-f686867fc1dd` |
| Entity `Report` (current; reports live under this parent) | `3f2baa83-3ef7-45ce-82ea-6a43f7a8c916` |
| SelfApplication Miroir | `360fcf1f-f0d4-4f8a-9262-07886e70fa15` |
| SelfApplication Library | `5af03c98-fe5e-490b-b08f-e1230971c57f` |
| Menu `MiroirMenu` | `eaac459c-6c2b-475c-8ae4-c6c3032dae00` |
| Menu `ApplicationModelScopeTemplate` | `a4ed0b44-57c2-45ee-a33c-c7c09bde969d` |
| Report `MiroirTestList` | `58dc6706-0473-468c-90ee-61b54b157140` |
| Synthetic `TestEntityCompositePK` | `44691d2c-d7c1-48e0-8363-71c51195e104` |
| Synthetic `TestEntityCodeNumber` | `4bbf4d19-7ac5-4fff-88ee-63ee49c7802f` |
| Synthetic `TestEntityNoParentUuid` | `803b81ad-fda4-4206-8860-cc86f37c7a6e` |

Menu labels (locked):

| Menu | New item `label` | `section` | Placement |
|------|------------------|-----------|-----------|
| `ApplicationModelScopeTemplate` | `Test Configurations` | `model` (`menuItemScope: "model"`) | After “Tests”, before the divider |
| `MiroirMenu` | `Miroir Test Configurations` | `data` | After “Miroir Tests” |

Both items `reportUuid` = `08cd379a-9ec8-4e1b-ac99-8a77a6905d72`.

---

## Public interface under test (new)

```typescript
// packages/miroir-core/src/5_tests/resolveSuitePlayfieldSeed.ts

export type SuitePlayfieldSeed = {
  testbedModel: MetaModelPartial;
  testbedEntitiesAndInstances: ApplicationEntitiesAndInstances;
};

export type TestConfigurationPlayfield = {
  uuid: string;
  testbedModel: MetaModelPartial;
  testbedEntitiesAndInstances: ApplicationEntitiesAndInstances;
};

/**
 * Resolve playfield model + instances from a MiroirTestSuite.
 * - skipRunTargetPlayfieldReset (all runnerTest leaves agree) → null (wins over uuid/inline)
 * - testConfiguration uuid XOR inline testbedModel + testbedEntitiesAndInstances
 * - both uuid and inline → throw
 * - uuid set → load via getTestConfiguration; missing → throw
 * - neither uuid nor inline (and not skipReset) → null (caller may fall back during migration; Slice 7 launcher throws)
 */
export function resolveSuitePlayfieldSeed(
  suite: MiroirTestSuite,
  getTestConfiguration?: (uuid: string) => TestConfigurationPlayfield | undefined,
): SuitePlayfieldSeed | null;
```

Vitest exception (not reachable as a MiroirTest transformer/query/action): this is a **host helper** used by the UI launcher and CLI session factory. Tests import **real** suite / config JSON assets, not fixture copies of those payloads.

Session still consumes `RunnerLibraryPlayfieldSeed` (model + instances + init). The launcher **composes** that triple: seed from `resolveSuitePlayfieldSeed` (or transitional registry fallback), init from the registry entry.

`TEST_CONFIGURATION_INSTANCE_INDEX` (Slice 3+) is a **static host map** (bundled deployment exports). Sufficient for #252; a follow-up may resolve configs via LocalCache + `getApplicationSection` so new instances need no index edit.

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Slice 0–1 helper / inventory (vitest) | `RUN_TEST=resolveSuitePlayfieldSeed.252 npm run testByFile -w miroir-core -- resolveSuitePlayfieldSeed.252` |
| Launcher / registry unit | `npm run testByFile -w miroir-standalone-app -- uiIntegrationTestLauncher.unit` |
| Schema rebuild | `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core` |
| Library / appForTest rebuild (when those assets change) | `npm run build -w miroir-test-app_deployment-library` / `-w miroir-test-app_deployment-appForTest` |
| Miroir / Library / appForTest modelValidation | `npm run testByFile -w miroir-test-app_deployment-<pkg> -- tests/modelValidation.unit.test.ts` |
| One runner/action integ suite | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites <key> --mode integ` |
| #240 menu helper | `npm run testByFile -w miroir-standalone-app -- applicationModelScopeMenu` |
| Type check | `npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json` and `-p packages/miroir-standalone-app/tsconfig.json` |

---

## Slice 0 — Characterize current contracts

**Status:** ✅ DONE

### Goal

Lock today’s registry shape, `MiroirTestSuite` field set, menu block, and `getApplicationSection` for `MiroirTest`, so later slices produce a reviewable diff. Transitional — deleted in Slice 8 (`docs/contributing/testing.md`, #238).

### 0.1 RED → GREEN — inventory locks

**Test:** `packages/miroir-core/tests/5_tests/issues/252-self-contained-testbed/selfContainedTestbed.252.phase0.unit.test.ts`

Vitest justified: characterizes TypeScript registry + deployment JSON on disk, not an ML behavior.

Behavior asserted:

- `UI_INTEGRATION_RUNNER_SUITE_REGISTRY` has **14** keys; each has `kind` and `testBedModelAndInstances`; non-null entries have `testbedModel`, `testbedEntitiesAndInstances`, `testbedInitApplicationParameters`; create/drop are `null`.
- Generated `MiroirTestSuite` (imported suite JSON `definition`) has none of `testbedModel`, `testbedEntitiesAndInstances`, `testConfiguration` on any of the 14 integ suites.
- No Entity JSON under `miroir_model/16dbfe28-…/` named `TestConfiguration`.
- `ApplicationModelScopeTemplate` item labels are exactly `[Application, Entities, Queries, Reports, Menus, Endpoints, Runners, Tests, Model-Data Divider]` (8 report links + divider).
- `getApplicationSection(Miroir, MiroirTest)` is `"data"`; `getApplicationSection(Library, MiroirTest)` is `"model"`.

Do **not** import `UI_INTEGRATION_RUNNER_SUITE_REGISTRY` into `miroir-core` if that creates a new package dependency. Split: core file locks schema/assets/section; standalone-app file locks the 14 registry rows:

**Test:** `packages/miroir-standalone-app/tests/4-tests/issues/252-self-contained-testbed/runnerRegistry.252.phase0.unit.test.ts`

### Validation

```bash
RUN_TEST=selfContainedTestbed.252.phase0 npm run testByFile -w miroir-core -- selfContainedTestbed.252.phase0
RUN_TEST=runnerRegistry.252.phase0 npm run testByFile -w miroir-standalone-app -- runnerRegistry.252.phase0
```

### Realization

- Core inventory: `packages/miroir-core/tests/5_tests/issues/252-self-contained-testbed/selfContainedTestbed.252.phase0.unit.test.ts` (4 tests) — 14 integ suite JSON roots have no playfield fields; no Entity named `TestConfiguration`; model-scope labels are the eight report links + divider; `getApplicationSection` is Miroir **data** / Library **model** for `MiroirTest`.
- Registry inventory: `packages/miroir-standalone-app/tests/4-tests/issues/252-self-contained-testbed/runnerRegistry.252.phase0.unit.test.ts` (2 tests) — 14 keys; kinds; create/drop `testBedModelAndInstances === null`; other rows carry the nested triple.
- No production code. Characterization of current state, all GREEN.

---

## Slice 1 — Tracer: suite-owned seed for undo_redo

**Status:** ✅ DONE

### Goal

As a test author, I can put `testbedModel` + `testbedEntitiesAndInstances` on a `MiroirTestSuite` and the UI/CLI integ host will seed from that instead of from `testBedModelAndInstances` for **that** suite.

**Layers cut:** Jzod on Entity `MiroirTest` + EntityVersion dual-write → generated `MiroirTestSuite` → suite JSON `domain_controller_model_undo_redo` → `resolveSuitePlayfieldSeed` → `buildUiIntegrationRunnerSessionSpecificOptions` → existing integ session.

This is the tracer bullet.

### 1.1 RED

**Test (schema / type):** extend Slice 0 core file or `selfContainedTestbed.252.phase1.unit.test.ts`

- Type/value: a `MiroirTestSuite` may carry optional `testbedModel`, `testbedEntitiesAndInstances`, `testConfiguration`.
- Existing unit-only suite JSON (no new fields) still typechecks / loads.
- XOR is **not** a Jzod union; it is enforced in `resolveSuitePlayfieldSeed`.

**Test (helper):** `packages/miroir-core/tests/5_tests/issues/252-self-contained-testbed/resolveSuitePlayfieldSeed.252.phase1.unit.test.ts`

Import the **real** `miroirTest_domain_controller_model_undo_redo` JSON (after GREEN it will have the fields). Until GREEN, this test is RED.

Behavior:

- `skipRunTargetPlayfieldReset` suite (use real `runner_create_entity` JSON) → `null`.
- Inline model + empty instances on undo_redo → returned seed equals the JSON literals (applicationUuid / applicationName of Library; `testbedEntitiesAndInstances: []`).
- Both `testConfiguration` and inline fields → throw.
- `testConfiguration` uuid with no loader / unknown uuid → throw.
- `testConfiguration` uuid with loader → returned seed is the loaded payload (tiny in-memory config object is OK **only** for this XOR path; happy path uses real assets once Slice 3+ exist).
- Neither uuid nor inline, not skipReset → `null` (transitional; launcher falls back).

**Test (launcher):** extend `packages/miroir-standalone-app/tests/helpers/uiIntegrationTestLauncher.unit.test.ts`

- `buildUiIntegrationOrchestratorCreateSessionParams` for `domain_controller_model_undo_redo` still yields `kind: "action"` with `testBedModelAndInstances.testbedModel` / `.testbedEntitiesAndInstances` matching the **suite JSON**, and `.testbedInitApplicationParameters` matching `libraryTestbedInitParams`.
- That registry **entry** no longer has `testBedModelAndInstances`.
- Create/drop still omit a playfield seed (`skipRunTargetPlayfieldReset`).

### 1.2 GREEN

1. Dual-write `miroirTestSuite.definition` on Entity `a311f363-…` **and** EntityVersion `51c647fe-…` (D10 — **no** `testConfiguration` field yet):
   - `testbedModel`: optional `schemaReference` → `metaModelPartial`.
   - `testbedEntitiesAndInstances`: optional array of `{ entity, instances }` (`entity` as `schemaReference` to `entity` if codegen size allows, else `any`; `instances` as `array` of `any`). If codegen blows up, record the fallback in Realization.
   - Defer `testConfiguration` uuid + FK `targetEntity: 675ccd46-…` to **Slice 2** (after Entity `TestConfiguration` exists).
2. `npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core`.
3. Add `resolveSuitePlayfieldSeed` in `packages/miroir-core/src/5_tests/` and export from `miroir-core`.
4. Write inline fields onto `miroirTest_domain_controller_model_undo_redo` (Miroir data JSON): `testbedModel: { applicationUuid, applicationName }` (Library), `testbedEntitiesAndInstances: []`. Rebuild miroir package.
5. Lift `testbedInitApplicationParameters` to a **sibling** on **all 14** registry entries (`null`/omit for create/drop). `buildUiIntegrationRunnerSessionSpecificOptions` composes:
   - if skipReset → no seed;
   - else `resolveSuitePlayfieldSeed(suite)` if non-null, else `entry.testBedModelAndInstances` model+instances (**transitional fallback**, deleted in Slice 7);
   - init always from `entry.testbedInitApplicationParameters` (lifted; for unmigrated rows copy the nested value up).
6. Remove `testBedModelAndInstances` from the undo_redo registry row only.

### 1.3 Refactor checkpoint

- Nested init inside remaining `testBedModelAndInstances` is duplication of the lifted sibling — leave until Slice 7 deletes the nested object.
- Do not remap in the resolver; `RunnerTestSession` already remaps onto `runTarget`.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run devBuild -w miroir-core
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
RUN_TEST=resolveSuitePlayfieldSeed.252.phase1 npm run testByFile -w miroir-core -- resolveSuitePlayfieldSeed.252.phase1
npm run testByFile -w miroir-standalone-app -- uiIntegrationTestLauncher.unit
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites domain_controller_model_undo_redo --mode integ
```

### Realization

- Dual-write on Entity `a311f363-…` and EntityVersion `51c647fe-…`: optional `testbedModel` + `testbedEntitiesAndInstances` on `miroirTestSuite` (no `testConfiguration` yet, D10).
- `testbedEntitiesAndInstances` uses `schemaReference` → `entity` (codegen produced `{ entity: Entity; instances: any[] }[]`).
- `testbedModel` is `any`, not `schemaReference` → `metaModelPartial`. Instance validation (`modelValidation` on `domain_controller_model_undo_redo`) could not flatten `metaModelPartial`: its `extend` is `{ partial, eager, relativePath: "metaModel" }` with `absolutePath` commented out in `getMiroirFundamentalJzodSchema.ts` (circularity). Resolver/`SuitePlayfieldSeed` still type the payload as `MetaModelPartial`.
- Host helper `resolveSuitePlayfieldSeed` in `packages/miroir-core/src/5_tests/resolveSuitePlayfieldSeed.ts`, exported from `miroir-core`. skipReset wins (D11); uuid XOR inline; neither → `null` (Slice 7 fallback).
- Tracer JSON `c6d8e70a-…` has inline Library `{ applicationUuid, applicationName }` and `testbedEntitiesAndInstances: []`.
- Registry: lifted `testbedInitApplicationParameters` on all seeded rows; `domain_controller_model_undo_redo` dropped `testBedModelAndInstances`; `buildUiIntegrationRunnerSessionSpecificOptions` composes suite seed + registry init (unmigrated rows still fall back to nested playfield).
- Slice 0 inventory tests updated so undo_redo is the migrated case.
- Proof: `resolveSuitePlayfieldSeed.252.phase1` (8) GREEN; launcher unit (11) GREEN; `modelValidation.unit` (148) GREEN; `testMiroir … --suites domain_controller_model_undo_redo --mode integ` GREEN. `npx tsc` miroir-core GREEN. standalone-app tsc still reports two pre-existing errors in `ReportSectionListDisplay.tsx` / `ReportTools.ts` (not this slice). Vitest root for the miroir package is `tests/`, so modelValidation is `modelValidation.unit` not `tests/modelValidation.unit.test.ts`.

---

## Slice 2 — Entity `TestConfiguration` + reports + menus

**Status:** ✅ DONE

### Goal

As a report viewer I can open Test Configurations from the model-scope block and from the Miroir menu next to Miroir Tests. As an application maintainer, instances of the new Entity follow the same section rule as Query / `MiroirTest`.

**Layers cut:** Entity + EntityVersion JSON → `defaultMiroirMetaModel` / create-entity order / `index.ts` → Reports → both menus → `getApplicationSection` + modelValidation + #240 helper tests.

### 2.1 RED

**Test:** `packages/miroir-core/tests/1_core/issues/252-self-contained-testbed/testConfigurationEntity.252.phase2.unit.test.ts`

Behavior:

- Entity JSON `675ccd46-…` exists under `miroir_model/16dbfe28-…/`, `name: "TestConfiguration"`, `conceptLevel: "Model"`, `cache.cacheAllInstancesOnRefresh: true`, `defaultInstanceDetailsReportUuid: 21a693e4-…`.
- EntityVersion JSON `d85749be-…` exists under `miroir_modelVersion/54b9c72f-…/`, `entityUuid: 675ccd46-…`, `mlSchema` dual-write with the Entity.
- `defaultMiroirMetaModel.entities` includes that Entity uuid (so `metaModelEntityUuids` does too).
- `getApplicationSection(Miroir, 675ccd46-…)` is `"data"`; `getApplicationSection(Library, 675ccd46-…)` is `"model"`.
- List report `08cd379a-…` extractor `extractorInstancesByEntity` on `675ccd46-…` (clone `QueryList` `32e52150-…`, not `MiroirTestList` — no `miroirTestReportSection`).
- Details report `21a693e4-…` uses `extractorByPrimaryKey` + `objectInstanceReportSection`.
- `ApplicationModelScopeTemplate` labels become `[…, Runners, Tests, Test Configurations, Model-Data Divider]` (length **10**); divider is last; new item `section: "model"`, `menuItemScope: "model"`, `reportUuid: 08cd379a-…`.
- `MiroirMenu` has “Miroir Test Configurations” immediately after “Miroir Tests”, `section: "data"`, same report uuid.

**Test:** update `packages/miroir-standalone-app/tests/4_view/applicationModelScopeMenu.unit.test.ts` (permanent feature suite, not issue-scoped):

- `toHaveLength(9)` → **10**; label list includes `Test Configurations`; divider index **9**.

This overrules #240’s locked eight report links.

### 2.2 GREEN

1. Entity + EntityVersion JSON (Query-like: `parentName: "Entity"` / `"EntityVersion"`, `parentDefinitionVersionUuid: 381ab1be-…` on the Entity row). `mlSchema` extends `entityDefinitionRoot`; attributes: `selfApplication` (FK SelfApplication), `name`, `description`, `testbedModel` (`metaModelPartial`), `testbedEntitiesAndInstances` (same shape as on `MiroirTestSuite`). **No** init-params field.
2. Export `entityTestConfiguration` / `entityDefinitionTestConfiguration` from `miroir-test-app_deployment-miroir/index.ts` + `index.d.ts`.
3. Add to `defaultMiroirMetaModel.entities` and `.entityVersions`, `miroirModelInitializeCreateEntityOrder`, `appModelInitializeCreateEntityOrder`. Add list report to `miroirModelInitializeDataInstances` if other framework list reports are bootstrapped that way (`reportQueryList` is).
4. Reports under `miroir_data/3f2baa83-…/`; export them.
5. Add `testConfiguration`: optional uuid with FK `targetEntity: 675ccd46-…` to `miroirTestSuite` (D10); dual-write Entity + EntityVersion of `MiroirTest`; rebuild.
6. Menu JSON edits (D9). Icon: distinguish from Tests (e.g. MUI `tune`).
7. Rebuild miroir package + `devBuild` miroir-core.

### 2.3 Refactor checkpoint

- List report is a plain object list (QueryList), not a test-runner section.
- #240 analysis still says “8 report links”; do not rewrite that historical record; this issue’s analysis already notes the override.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run devBuild -w miroir-core
npm run testByFile -w miroir-core -- testConfigurationEntity.252.phase2
npm run testByFile -w miroir-standalone-app -- applicationModelScopeMenu
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

- Entity `675ccd46-…` (Query-like: `conceptLevel: Model`, `parentDefinitionVersionUuid: 381ab1be-…`) and EntityVersion `d85749be-…` dual-write the same `mlSchema`. Payload: `selfApplication`, `name`, optional `description`, optional `testbedModel` **`any`** (same Slice 1 circularity on `metaModelPartial`), optional `testbedEntitiesAndInstances` (`schemaReference` → `entity` + `instances` any). No init-params. Icon `tune`.
- List report `08cd379a-…` is a QueryList clone (`extractorInstancesByEntity`, `objectListReportSection`). Details `21a693e4-…` is a QueryDetails clone. List report is in `defaultMiroirMetaModel.reports` and `miroirModelInitializeDataInstances`; details is an asset only (same as QueryDetails).
- Menus (D9): `ApplicationModelScopeTemplate` 10 items (`Test Configurations` after Tests, `section`/`menuItemScope: model`); `MiroirMenu` has “Miroir Test Configurations” immediately after “Miroir Tests” (`section: data`). Both point at `08cd379a-…`.
- `testConfiguration` optional uuid FK (`targetEntity: 675ccd46-…`) on `miroirTestSuite` dual-write Entity `a311f363-…` + EntityVersion `51c647fe-…`. Generated `MiroirTestSuite.testConfiguration?: string`. TestConfiguration’s own mlSchema is **not** in `generate-ts-types.ts`.
- Exports: `entityTestConfiguration`, `entityVersionTestConfiguration` / deprecated `entityDefinitionTestConfiguration`, `reportTestConfigurationList` / `reportTestConfigurationDetails`. Bootstrap: `defaultMiroirMetaModel.entities` + `.entityVersions`, both create-entity orders after `entityMiroirTest`.
- Slice 0 inventory and `applicationModelScopeMenu.unit.test.ts` updated for the 9th report link (length 10, divider index 9).
- Proof: `testConfigurationEntity.252.phase2` (9) GREEN; `applicationModelScopeMenu` (15) GREEN; `selfContainedTestbed.252.phase0` (4) GREEN; `modelValidation.unit` (151) GREEN — Entity + EntityVersion + TestConfigurationList rows; `npx tsc` miroir-core GREEN. Vitest root for the miroir package is `tests/`, so modelValidation is `modelValidation.unit` not `tests/modelValidation.unit.test.ts`.

---

## Slice 3 — Library document config; lend / return by uuid

**Status:** ✅ DONE

### Goal

As a test author I can share one Library-owned `TestConfiguration` between `runner_lend_document` and `runner_return_document` instead of copying Entity/instance arrays in TypeScript.

**Layers cut:** Library `library_model/<entityUuid>/<instanceUuid>.json` → suite JSON `testConfiguration` uuid (no inline fields) → config index + resolver → registry drops those two playfields → integ.

### 3.1 RED

**Test:** extend `resolveSuitePlayfieldSeed.252.phase1` (or `…phase3.unit.test.ts`) using **real** Library assets:

- `getTestConfiguration(d669558c-…)` returns the Library instance’s `testbedModel` + `testbedEntitiesAndInstances`.
- `resolveSuitePlayfieldSeed(lendSuite, getTestConfiguration)` equals that payload; same for return.
- Neither suite JSON has inline `testbedModel` / `testbedEntitiesAndInstances`.
- `getApplicationSection(Library, 675ccd46-…)` is `"model"` (already Slice 2); instance file lives under `library_model/675ccd46-…/`, `selfApplication` = Library.

**Test:** launcher unit — lend/return registry rows have no `testBedModelAndInstances`; composed session seed still has the document entities (Author, Book, Publisher, User) and `libraryTestbedInitParams`.

### 3.2 GREEN

1. Instance `d669558c-…` in `packages/miroir-test-app_deployment-library/assets/library_model/675ccd46-7dd3-400b-a2bd-1319c39e11da/`. `selfApplication: 5af03c98-…`. Payload = today’s `runnerLibraryDocumentEntitiesAndInstances` plus a **slice** `testbedModel` of those entities’ applicationUuid/name/entities — **not** `defaultLibraryAppModel` (D1).
2. Export from library `index.ts` / `index.d.ts`. Rebuild library.
3. Set `testConfiguration: "d669558c-…"` on both Library `MiroirTest` JSON files; rebuild library.
4. `TEST_CONFIGURATION_INSTANCE_INDEX` in standalone-app (uuid → instance), passed into `resolveSuitePlayfieldSeed` from launcher and CLI (`createSessionParamsForSuite`). Do not put this index in `miroir-core` (core must not import library/appForTest packages).
5. Drop `testBedModelAndInstances` from those two registry rows; keep `kind` + lifted init.

### 3.3 Refactor checkpoint

- Delete unused TS export of `runnerLibraryDocumentEntitiesAndInstances` from the UI seeds file **only if** nothing else imports it (CLI helpers `libraryPlayfieldSeeds.ts` re-export it — grep before deleting; vitest twins out of scope may still import it).

### Validation

```bash
npm run build -w miroir-test-app_deployment-library
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-core -- resolveSuitePlayfieldSeed.252
npm run testByFile -w miroir-standalone-app -- uiIntegrationTestLauncher.unit
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites runner_lend_document,runner_return_document --mode integ
```

### Realization

- Library instance `d669558c-…` (`libraryDocumentSeed`) under `library_model/675ccd46-…/`, `selfApplication: 5af03c98-…`. Instances: Author (3), Book (6), Publisher (3), User (1) — same as `runnerLibraryDocumentEntitiesAndInstances`.
- `testbedModel` is a **slice**, not `defaultLibraryAppModel`: `{ applicationUuid, applicationName, entities: [Author, Book, Country, LendingHistoryItem, Publisher, User], endpoints: [Books, Lending] }`. First integ with only the four instance entities failed (`could not find action endpoint: 212f2784-…`). Leaf `initialModel` stays `defaultLibraryAppModel` via `getFromParameters`.
- Both Library suite JSON files have `testConfiguration: d669558c-…` and no inline playfield. Export `testConfiguration_libraryDocumentSeed`.
- Host index `TEST_CONFIGURATION_INSTANCE_INDEX` / `getTestConfigurationFromIndex` in `packages/miroir-standalone-app/src/miroir-fwk/4-tests/testConfigurationInstanceIndex.ts`. `composeUiIntegrationPlayfieldSeed` passes that loader into `resolveSuitePlayfieldSeed`. CLI `createSessionParamsForSuite` already goes through the same composer.
- Registry lend/return rows dropped `testBedModelAndInstances`; kept `kind` + `libraryTestbedInitParams`. Kept `runnerLibraryDocumentEntitiesAndInstances` for `Runner_Miroir.integ.test.tsx`.
- Slice 0 inventory/registry tests updated for uuid-owned lend/return.
- Proof: `resolveSuitePlayfieldSeed.252.phase3` (3) GREEN; phase1+3 (11) GREEN; launcher unit (12) GREEN; library `modelValidation.unit` (180) GREEN including `TestConfiguration > libraryDocumentSeed`; Slice 0 core (4) + registry (2) GREEN; `testMiroir … --suites runner_lend_document,runner_return_document --mode integ` (2) GREEN. Vitest root for the library package is `tests/`, so modelValidation is `modelValidation.unit`.

---

## Slice 4 — Miroir Publisher+Country config; three suites by uuid

**Status:** ⬜ pending

### Goal

The three Miroir-owned suites that share Publisher+Country (`domain_controller_model_crud`, `domain_controller_application_version_freeze`, `evolutionTraceWP1`) reference one Miroir-data `TestConfiguration` instead of three TypeScript copies.

### 4.1 RED

Same pattern as Slice 3 against instance `431e0903-…` in `miroir_data/675ccd46-…/`, `selfApplication` = Miroir. Three suite JSON files have `testConfiguration` uuid and no inline playfield. Registry rows drop `testBedModelAndInstances`.

### 4.2 GREEN

1. Instance payload = today’s `libraryEntitiesAndInstancesPublisherAndCountry` + slice model `{ applicationUuid, applicationName, entities: [Publisher, Country] }`.
2. Export from miroir `index.ts`. Point the three suite JSON files at `431e0903-…`. Add to the standalone-app config index.
3. Drop those three registry playfields.

No cross-app FK: these suites are Miroir-owned; the config is Miroir-owned.

### 4.3 Refactor checkpoint

- Grep `libraryEntitiesAndInstancesPublisherAndCountry`; keep the TS literal only if still imported outside the registry.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites domain_controller_model_crud,domain_controller_application_version_freeze,evolutionTraceWP1 --mode integ
```

### Realization

<Appended on completion.>

---

## Slice 5 — Remaining unique DC slices inlined on suite JSON

**Status:** ⬜ pending

### Goal

Unique playfields (including synthetic entities that must not become Library Entity rows) live on the suite JSON itself.

Suites: `domain_controller_data_crud`, `domain_controller_composite_pk_crud`, `domain_controller_non_uuid_pk_model_crud`, `domain_controller_non_uuid_pk_data_crud`, `domain_controller_no_parent_uuid_crud`. (`domain_controller_model_undo_redo` already done in Slice 1.)

### 5.1 RED

For each suite: JSON has inline `testbedModel` + `testbedEntitiesAndInstances`; no `testConfiguration`; registry row has no `testBedModelAndInstances`. Resolver returns the JSON payload without a config loader. Synthetics `44691d2c-…`, `4bbf4d19-…`, `803b81ad-…` appear **only** in those suite JSON (or a TestConfiguration — not in `library_model/16dbfe28-…/`).

### 5.2 GREEN

Copy today’s unique registry **instances** onto the five Miroir-data `MiroirTest` JSON files. Drop those registry playfields. Rebuild miroir.

**D1 — do not copy `defaultLibraryAppModel`:** the registry row for `domain_controller_data_crud` currently uses full `defaultLibraryAppModel`; inline a **playfield slice** only (`applicationUuid`, `applicationName`, `entities: [Author, Book, Publisher]` — the entities present in that suite’s instances), same as other DC suites. All five suites use slice-shaped `testbedModel`, never the full Library meta-model dump.

**JSON size:** suites with synthetic entities (`composite_pk`, `non_uuid_pk_data`, `no_parent`) will carry full inline `Entity` + `mlSchema` in JSON (multi-KB per file). Expected for #252; not a reason to switch to uuid-only references (D1-b).

### 5.3 Refactor checkpoint

- Seeds file `uiIntegrationPlayfieldSeeds.ts` should now only hold `libraryTestbedInitParams` / `appForTestTestbedInitParams` (and any leftover still imported by out-of-scope vitest). Delete dead unique-slice literals.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites domain_controller_data_crud,domain_controller_composite_pk_crud,domain_controller_non_uuid_pk_model_crud,domain_controller_non_uuid_pk_data_crud,domain_controller_no_parent_uuid_crud --mode integ
```

### Realization

<Appended on completion.>

---

## Slice 6 — Freeze suite playfield (appForTest seed)

**Status:** ⬜ pending

### Goal

`runner_freeze_application_version` no longer takes playfield model + instances from the TypeScript registry.

**Locked default (D12):** keep the seed **inline** on the Miroir-owned suite JSON (Publisher+Country instances + appForTest model slice from today’s registry entry). Do **not** reference an appForTest-owned `TestConfiguration` uuid — the only cross-app case (Miroir `MiroirTest` → appForTest config) is avoided. Instance `343d4d68-…` and appForTest `TestConfiguration` assets are **optional**; add them only if a later issue needs a reusable appForTest seed outside this suite.

### 6.1 RED

`runner_freeze_application_version` suite JSON has inline `testbedModel` + `testbedEntitiesAndInstances` (appForTest slice + Publisher/Country instances); no `testConfiguration`. Registry row drops playfield. Init stays `appForTestTestbedInitParams` on the registry entry.

### 6.2 GREEN

1. Copy today’s freeze-suite playfield from the registry onto the Miroir-data `MiroirTest` JSON: instances (Publisher, Country) + slice `testbedModel` (`selfApplicationAppForTest`, `entityPublisher`, `entityCountry`, `appForTestInitialApplicationVersion` — not a full meta-model dump).
2. Drop registry `testBedModelAndInstances` for this row; keep lifted `testbedInitApplicationParameters: appForTestTestbedInitParams`.
3. Rebuild miroir package. No `TEST_CONFIGURATION_INSTANCE_INDEX` entry required for this slice.

### 6.3 Refactor checkpoint

- `uiIntegrationAppForTestPlayfieldSeed.ts` playfield literals (not `appForTestTestbedInitParams`) become unused by the registry.

### Validation

```bash
npm run build -w miroir-test-app_deployment-miroir
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites runner_freeze_application_version --mode integ
```

### Realization

<Appended on completion.>

---

## Slice 7 — Drop registry fallback; final registry type

**Status:** ⬜ pending

### Goal

`UI_INTEGRATION_RUNNER_SUITE_REGISTRY` is only `{ kind, suiteDefinition, testbedInitApplicationParameters }`. No `testBedModelAndInstances`. Create/drop omit/null init. Launcher has no fallback to a registry playfield.

### 7.1 RED

**Test:** Slice 0 standalone inventory, rewritten as **target** (or a new `runnerRegistry.252.phase7.unit.test.ts`):

- Every entry’s keys are exactly `kind`, `suiteDefinition`, and optionally `testbedInitApplicationParameters`.
- `testBedModelAndInstances` is not on the type (tsc) and not on any object.
- create/drop: no `testbedInitApplicationParameters` (or `null`); skipReset still holds.
- `resolveSuitePlayfieldSeed` returning `null` for a non-skipReset suite now **throws** in the launcher (no fallback) — those suites must have uuid or inline.

Extend launcher unit: action session still receives composed `testBedModelAndInstances` on **session options** (that name on the session is fine; it is not the registry field).

### 7.2 GREEN

1. Delete transitional fallback in `buildUiIntegrationRunnerSessionSpecificOptions`.
2. Narrow `UiIntegrationRunnerSuiteEntry` types; `TestbedSetupParameters` may remain as the **session** triple type or be renamed in a later cleanup — do not rename session fields in this slice unless tsc forces it.
3. Seeds file keeps `libraryTestbedInitParams` and `appForTestTestbedInitParams` only.

### 7.3 Refactor checkpoint

- Analysis misalignment §3.3 (playfield triple in the registry) is closed.
- CLI `createSessionParamsForSuite` uses the same composition as the UI launcher.

### Validation

```bash
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run testByFile -w miroir-standalone-app -- uiIntegrationTestLauncher.unit
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites runner_create_entity,runner_drop_entity --mode integ
```

Plus a spot-check of one uuid suite and one inline suite already proven in earlier slices.

### Realization

<Appended on completion.>

---

## Slice 8 — Nonreg, docs, cleanup, AC

**Status:** ⬜ pending

### 8.1 Nonreg

- Add `unit-resolveSuitePlayfieldSeed` to `scripts/nonreg-manifest.json` (`testByFile -w miroir-core -- resolveSuitePlayfieldSeed`).
- Add **missing integ steps** (same `--profile {profile}` / `--mode integ` pattern as existing runner/action entries):

| `id` | `--suites` |
|------|------------|
| `integ-runner-runner_create_entity` | `runner_create_entity` |
| `integ-runner-runner_drop_entity` | `runner_drop_entity` |
| `integ-action-evolutionTraceWP1` | `evolutionTraceWP1` |

These three are in `UI_INTEGRATION_RUNNER_SUITE_REGISTRY` but absent from nonreg today; create/drop are highest-risk after Slice 7 (skipReset, no playfield fallback).

- Existing `integ-runner-*` / `integ-action-domain_controller*` / `appstack-uiIntegrationTestLauncher.integ` cover the other 11 integ suites.

### 8.2 Docs

- `docs/reference/testing.md` “Adding a new suite”: for **integ** suites, put model+instances on the suite or a `TestConfiguration`; add `kind` + `testbedInitApplicationParameters` to `UI_INTEGRATION_RUNNER_SUITE_REGISTRY`; do **not** paste Entity arrays in TypeScript.
- Feature 197 notes: playfield seed is suite/config data; registry leftover is kind + init.
- `analysis.md` status → implemented once this slice is done.

### 8.3 Issue-directory cleanup

- Move still-valuable assertions from `tests/**/issues/252-*/` into feature-named files (`resolveSuitePlayfieldSeed.unit.test.ts`, `testConfigurationSection.unit.test.ts`).
- Delete the `issues/252-*` directories (`docs/contributing/testing.md`, #238).

### 8.4 Tracer bullet (narrative)

1. Open Miroir Tests, run `domain_controller_model_undo_redo` in integ (ephemeral runTarget) — playfield comes from the suite JSON (empty instances).
2. Open **Miroir Test Configurations** (Miroir menu) and **Test Configurations** (Library model-scope) — list shows the named configs in the correct section.
3. Run `runner_return_document` — seed is the Library document `TestConfiguration`, not a TS literal.

Automated equivalent: Slice 1 integ + Slice 3 integ + Slice 2 modelValidation / menu unit.

### AC checklist (#252, as superseded by the analysis)

| Criterion | Proven by | Status |
|---|---|---|
| `MiroirTestSuite` optional `testbedModel` + `testbedEntitiesAndInstances`; unit suites valid without them | Slice 1 schema + existing unit `testMiroir` still in nonreg | ⬜ |
| Integ suites with a non-null playfield today run with model+instances from the suite or a `TestConfiguration`, not from `testBedModelAndInstances` | Slices 1, 3–7 integ | ⬜ |
| `testbedInitApplicationParameters` is **not** on `MiroirTestSuite` **nor** on `TestConfiguration`; it stays on the registry | D2/D4; Slice 2 entity schema; Slice 7 registry type | ⬜ |
| `TestConfiguration` Entity exists; Miroir instances in data, user-app instances in model | Slice 2 `getApplicationSection`; Slices 3–6 asset paths | ⬜ |
| Suites can reference a `TestConfiguration`; shared document / Publisher+Country seeds are instances | Slices 3–4 | ⬜ |
| Freeze suite playfield inline on suite JSON (no cross-app config uuid) | Slice 6 (D12) | ⬜ |
| `skipRunTargetPlayfieldReset` suites still run with no testbed seed | Slice 1 + Slice 7 create/drop integ | ⬜ |
| UI and CLI share the resolution path; registry `kind` **remains** | Slice 7; D8 | ⬜ |
| Docs describe self-contained suite + optional `TestConfiguration` | Slice 8.2 | ⬜ |

Withdrawn ACs (do **not** implement): init on `TestConfiguration`; drop registry `kind`; appForTest `TestConfiguration` uuid for freeze (D12).

### Validation

```bash
npm run testByFile -w miroir-core -- resolveSuitePlayfieldSeed
npm run testByFile -w miroir-standalone-app -- applicationModelScopeMenu
npm run testByFile -w miroir-standalone-app -- uiIntegrationTestLauncher.unit
# After issue-dir cleanup, Slice 0 paths must be gone:
#   tests/**/issues/252-self-contained-testbed/  → must not exist
```

### Realization

<Appended on completion.>
