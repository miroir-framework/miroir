# 252 — Self-contained MiroirTestSuite testbed + TestConfiguration

> Analysis: how to stop carrying playfield **model + instances** in
> `UI_INTEGRATION_RUNNER_SUITE_REGISTRY`, by putting them on `MiroirTestSuite`
> (inline or via a `TestConfiguration` uuid). Init params and registry `kind`
> stay in the TypeScript registry. `TestConfiguration` instances follow the same
> section rule as Query / Report / `MiroirTest`: Miroir **data**, other apps **model**.

Related issue: https://github.com/miroir-framework/miroir/issues/252
Parent: https://github.com/miroir-framework/miroir/issues/197 (UI integ)
Related: #196 (MiroirTest entity, ✅), #204 (test classification), #228 (retire suite-*key* registries)

Related analyses / plans:
- [`../197-FEATURE- run integration tests in the UI/plan.md`](../197-FEATURE-%20run%20integration%20tests%20in%20the%20UI/plan.md)
- [`../196-FEATURE-migrate-tests-to-MiroirTest/plan.md`](../196-FEATURE-migrate-tests-to-MiroirTest/plan.md)

Key sources:
- [`packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationTestRunnerSuiteRegistry.ts)
- [`packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.ts`](../../../packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.ts)
- [`packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a311f363-e238-4203-bdfc-29e8c160c26b.json`](../../../packages/miroir-test-app_deployment-miroir/assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a311f363-e238-4203-bdfc-29e8c160c26b.json) (Entity `MiroirTest`)
- [`packages/miroir-core/src/1_core/Model.ts`](../../../packages/miroir-core/src/1_core/Model.ts) (`getApplicationSection`)
- [`packages/miroir-core/src/5_tests/LibraryPlayfield.ts`](../../../packages/miroir-core/src/5_tests/LibraryPlayfield.ts) (`resetIntegTestbed`)

**Document role:** analysis and architectural decision record.
**Status:** **implemented** (2026-08-31). Decision record confirmed (user 2026-08-31, including Q1). Implementation: [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
**Document history:** first draft mixed “which `TestConfiguration` to use” with “where `testbedInitApplicationParameters` lives” (old D3/D4/D5). Round 1 split those. Round 2: `runTarget` is the **sandbox identity** (ephemeral vs pinned), not TestConfiguration ownership; instance **section** follows Query/MiroirTest (`getApplicationSection`); registry keeps `{ kind, suiteDefinition, testbedInitApplicationParameters }`; menus on model-scope template **and** Miroir menu. Q1 confirmed: TestConfiguration payload is model + instances only.

---

## Sequencing

| Step | Issue | Status |
|------|-------|--------|
| Unified `MiroirTest` entity | #196 | ✅ |
| Run integ tests in the UI (playfield still in TS registry) | #197 | parent, in progress |
| Classify remaining vitest twins | #204 | later |
| Retire multi-registry *keys* / vitest-name discovery | #228 | complementary, later |
| **Self-contained testbed + `TestConfiguration`** | **#252** | ✅ |

#228 retires *how suites are listed*. This issue moves **model + instances** out of the UI registry. The registry **keeps** `kind` and `testbedInitApplicationParameters`.

---

## Decision record

Confirmed with user 2026-08-31. GitHub issue #252 body aligned with this record (2026-08-31 review). Old D3 (derive init from `runTarget`) and old D4 (init FKs on `TestConfiguration`) are **rejected**.

| Decision | Choice | Status |
|---|---|---|
| D0. What the **suite** may carry | **`testbedModel` + `testbedEntitiesAndInstances`, or a `TestConfiguration` uuid (XOR, not both).** Never `testbedInitApplicationParameters`. | **Accepted** |
| D1. Shape of `testbedModel` | **Inline `metaModelPartial` playfield slice** (not a dump of `defaultLibraryAppModel`). Synthetics travel with the suite or a config instance. | **Accepted** |
| D2. What a `TestConfiguration` instance contains | **`testbedModel` + `testbedEntitiesAndInstances`** (the named form of the suite’s inline seed). Not init params (those stay in the registry). Q1 confirmed. | **Accepted** |
| D3. How the suite chooses a seed | **Uuid of a `TestConfiguration` XOR the inline equivalent** of that payload. Not derived. Not merged. | **Accepted** |
| D4. Where `testbedInitApplicationParameters` lives | **`UI_INTEGRATION_RUNNER_SUITE_REGISTRY` only.** Does not go on `suiteDefinition`. | **Accepted** |
| D5. Registry playfield triple | **Drop `testBedModelAndInstances`.** Entry is `{ kind, suiteDefinition, testbedInitApplicationParameters }` (Q4). Seed is read from the suite object (`suiteDefinition`, already the inner `MiroirTestSuite`). | **Accepted** |
| D6. Where suite fields live | **Root `definition` (`MiroirTestSuite`) only.** | **Accepted** |
| D7. Where `TestConfiguration` **instances** live | **Same rule as Query / Report / `MiroirTest`:** Miroir app → **data**; any other app (Library, appForTest, …) → **model**. `getApplicationSection` already does this. Instances **may exist on Miroir and on Library**. Independent of `runTarget` (Q2). | **Accepted** |
| D8. Registry `kind` | **Stays. Does not move. Does not change.** | **Accepted** |
| D9. Menu | **Both:** `ApplicationModelScopeTemplate` (next to “Tests”, `section: "model"`) **and** `MiroirMenu` next to “Miroir Tests” (`section: "data"`). | **Accepted** |
| D10. Schema bootstrap order | Entity `TestConfiguration` before `testConfiguration` FK on `MiroirTestSuite` (Slice 2 before FK field). | **Accepted** |
| D11. `skipReset` precedence | `resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite` → no seed; uuid/inline ignored. | **Accepted** |
| D12. Freeze suite seed | **`runner_freeze_application_version` playfield stays inline** on the Miroir suite JSON; no cross-app `TestConfiguration` uuid. | **Accepted** |

**Rejected / withdrawn from first draft**

| Id | Withdrawn choice | Why |
|----|------------------|-----|
| old D3-b | Derive `InitApplicationParameters` from `runTarget` | Mixes “which config” with “where init params live”. Init stays TS. |
| old D4-a | Store init as FKs on `TestConfiguration` | Init stays in the registry, not on the suite and not on the entity. |
| old D5-a | Merge config base + suite overrides | XOR uuid vs inline. No overlay. |
| old D7-a | First configs only in `miroir_data/` as a shared dump | Configs follow Query/`MiroirTest` section rules; can exist on Miroir **and** Library |
| old D8-b | Infer `kind` from leaves and drop it from the registry | `kind` stays on the registry. |
| old D9-a | No sidebar item | Add items on model-scope template **and** Miroir menu. |
| old Q2-A/B | Own configs by `runTarget` or by the test’s `selfApplication` as a special rule | `runTarget` is sandbox UUIDs/name, not ownership. Ownership is ordinary `selfApplication` + `getApplicationSection`. |
| old D12-a | appForTest `TestConfiguration` uuid on freeze suite | Only cross-app case; inline seed on Miroir JSON avoids FK/index complexity (D12). |

**Rationale (settled part):** The boilerplate that hurts is repeating Entity + instance arrays and a `MetaModelPartial` in TypeScript. That payload becomes suite data (inline) or a named `TestConfiguration` (uuid). `testbedInitApplicationParameters` is a different object (full `SelfApplication` / branch / version / `defaultMiroirMetaModel`); it stays in the registry as the “dealt with separately” leftover. Registry `kind` is left alone in this issue.

### D1 — `testbedModel` representation

**Status:** **Accepted** — inline `metaModelPartial` playfield slice (D1-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D1-a. Inline `metaModelPartial`** ★ | Same shape as today’s registry `testbedModel`; schema ref `metaModelPartial` | Matches `resetIntegTestbed`; synthetics work; schema already exists | JSON size if someone inlines `defaultLibraryAppModel` |
| D1-b. Entity-uuid list resolved from runTarget | `{ applicationUuid, entityUuids[] }` | Tiny JSON | **Cannot express synthetic entities** (`entityCompositePK` `44691d2c-…`, `entityCodeNumber` `4bbf4d19-…`, `entityNoParentUuid` `803b81ad-…`) that exist only in TS seeds |
| D1-c. `getFromParameters` transformer | Same as leaf `initialModel` on lend/return | Reuses Phase R | Still needs a TypeScript/named-parameter bank |

**Decision:** D1-a. Leaf `initialModel` on lend/return stays as the *action* model; playfield seed is the smaller `{ applicationUuid, applicationName, entities: [...] }` slice plus instances. Do not serialise `defaultLibraryAppModel` into suite JSON. **`domain_controller_data_crud`** is the one registry row that uses full `defaultLibraryAppModel` today — migrate it to a slice (Author, Book, Publisher only), not a literal copy.

### D3 / D4 / D5 — three separate concerns (do not mix)

**Status:** **Accepted** as restated by the user.

| Concern | Lives where | Does not live where |
|---------|-------------|---------------------|
| Which playfield **model + instances** | Suite: `testConfiguration` uuid **XOR** inline `testbedModel` + `testbedEntitiesAndInstances` | Not merged; not in the registry |
| `testbedInitApplicationParameters` | `UI_INTEGRATION_RUNNER_SUITE_REGISTRY[suiteKey]` | Not on `suiteDefinition`; not derived from `runTarget` in this issue |
| Registry `kind` | Same registry field as today | Not inferred; not removed (D8) |

After this issue a registry entry is:

```ts
{
  kind: "runnerTest" | "domainControllerTest" | "actionTest"; // unchanged
  suiteDefinition: MiroirTestSuite; // already the inner definition, not the envelope
  testbedInitApplicationParameters: InitApplicationParameters; // stays
  // testBedModelAndInstances: removed
}
```

Launcher change: read `testbedModel` / `testbedEntitiesAndInstances` from `suiteDefinition` (or, if `suiteDefinition.testConfiguration` is set, from that instance). Do **not** read them from the registry. `kind` and init params still come from the registry entry.

Note on wording: `suiteDefinition` in the registry is already `MiroirTestDefinition.definition` (`MiroirTestSuite`). There is no further `.definition` nesting on the registry object. Today `testbedInitApplicationParameters` is nested inside `testBedModelAndInstances`; after this issue it is lifted to a sibling of `kind` / `suiteDefinition`. Create/drop keep it omitted/`null` (today `testBedModelAndInstances: null`).

### D6 — Where fields live on the instance

**Status:** **Accepted** — root suite `definition` (D6-a).

| Option | Mechanism | Pros | Cons |
|---|---|---|---|
| **D6-a. Root `MiroirTestSuite`** ★ | Next to existing `runTarget` | One playfield per `MiroirTest` instance; `runTarget` already lives there | Nested suites cannot have their own playfield (none do today) |
| D6-b. Envelope (`MiroirTestDefinition`) | Sibling of `definition` | Easy FK editor on the instance form | Splits testbed from `runTarget` |
| D6-c. Each `runnerTest` / `actionTest` leaf | Per-leaf seed | Fine-grained | Today session `beforeEach` seeds once per suite |

**Decision:** D6-a.

### D7 — Section for `TestConfiguration` instances

**Status:** **Accepted** — same dissymmetry as Query / Report / `MiroirTest`.

| Application (`selfApplication` of the instance) | Section | Asset tree (filesystem) |
|---|---|---|
| Miroir (`360fcf1f-…`) | **data** | `miroir_data/<entityUuid>/` |
| Library, appForTest, any other app | **model** | `library_model/<entityUuid>/`, … |

This is `getApplicationSection` as it exists: Miroir → everything except Entity-the-metaclass is `data`; other apps → framework entity uuids in `metaModelEntityUuids` are `model`. Adding `TestConfiguration` to `defaultMiroirMetaModel.entities` is sufficient. **No special case.** LocalCache already loads both.

`runTarget` does **not** choose this section (see §3.1).

### D8 — Registry `kind`

**Status:** **Accepted** — keep the field as it is (`runnerTest` \| `domainControllerTest` \| `actionTest`). Current-state fact: `domainControllerTest` and `actionTest` already share the orchestrator session `"action"`. This issue does not collapse or infer `kind`.

### D9 — Menu item

**Status:** **Accepted** — two items.

| Menu | uuid today | New item | `section` |
|------|------------|----------|-----------|
| `ApplicationModelScopeTemplate` | `a4ed0b44-57c2-45ee-a33c-c7c09bde969d` | Next to “Tests” (9th model-scope link; #240’s eight-link lock is overridden) | `model` (`menuItemScope: "model"`) |
| `MiroirMenu` | `eaac459c-6c2b-475c-8ae4-c6c3032dae00` | Next to “Miroir Tests” | `data` |

Both point at a new TestConfiguration **list** report (canonical uuid, same pattern as `MiroirTestList` `58dc6706-…`). Miroir uses the data-section item; other apps get the model-scope item via #240 injection.

---

## 1. Goals

1. **Self-contained playfield seed** — In order not to copy Entity/instance arrays in TypeScript as a **test author**, I can put `testbedModel` and `testbedEntitiesAndInstances` on the `MiroirTestSuite`, or point the suite at one `TestConfiguration` uuid.
2. **Shared named seed** — In order to reuse the same playfield model/instances across suites as a **test author**, I can define a `TestConfiguration` on Miroir (data) or on another app (model) and reference it by uuid.
3. **Init params stay a registry concern** — In order not to bloat suite JSON as a **test author**, I still supply `testbedInitApplicationParameters` (and `kind`) via `UI_INTEGRATION_RUNNER_SUITE_REGISTRY`.
4. **Find configs in the UI** — In order to browse them as a **report viewer**, I can open Test Configurations from the model-scope block (non-Miroir apps) and from the Miroir menu next to Miroir Tests.
5. **Synthetic playfield entities stay with the test** — In order not to pollute Library’s permanent Entity list as an **application maintainer**, I can carry composite-PK / non-UUID-PK / no-`parentUuid` Entity definitions on the suite or on a `TestConfiguration`.

## 2. Non-goals

- Retiring suite-*key* registries, thin vitest wrappers, `RUN_TEST`, `nonreg-manifest.json` — #228.
- Migrating remaining MIGRATE/DISPOSABLE vitest twins — #204.
- Inlining `InitApplicationParameters` / `defaultMiroirMetaModel` on every `MiroirTest` JSON.
- Host/store profile selection (`--profile`, emulated vs real server) — remains a run-time concern.
- Inferring or removing registry `kind` — stays as today (D8).
- Moving `testbedInitApplicationParameters` onto the suite or deriving it from `runTarget` — stays in the registry (D4).
- Rich TestConfiguration authoring UI beyond default Entity list/details reports.
- Changing leaf `initialModel` / `getFromParameters` on lend/return (action-time model, not playfield seed).
- Filling `conceptLevel` on Entity `MiroirTest` (currently absent; Query has `"Model"`). Drive-by, not this issue.
- Transformer integ registry (`UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY`, currently one key `miroirCoreTransformers`) — no playfield seed; #228.

---

## 3. Current state

Inventory produced programmatically from deployment JSON + the runner registry (2026-08-31).

### 3.1 `MiroirTestSuite` schema (**aligned** for identity, **misaligned** for playfield)

Entity `MiroirTest` uuid `a311f363-e238-4203-bdfc-29e8c160c26b`; EntityVersion snapshot `51c647fe-07ec-411c-89cc-02689dc66d6a` (must stay in dual-write with the Entity row).

Root suite fields today: `miroirTestType`, `miroirTestLabel`, optional `skip`, `testParams`, `runTarget`, `miroirTests`. **No** `testbedModel`, **no** `testbedEntitiesAndInstances`, **no** config FK.

`skipRunTargetPlayfieldReset` lives on **`runnerTest` leaves**, resolved suite-wide by `resolveSkipRunTargetPlayfieldResetFromMiroirTestSuite` (all leaves must agree). Present and `true` on `runner_create_entity` (2 leaves) and `runner_drop_entity` (1 leaf). Those two suites **omit** `runTarget` entirely.

#### What `runTarget` actually is (Q2 — codebase)

It is **not** “which application owns this test” and **not** “which application owns a `TestConfiguration`”. Ownership of tests/configs is `selfApplication` on the instance.

`runTarget` on the suite is `{ applicationUuid?, applicationName?, deploymentUuid? }` — identity of the **sandbox application/deployment the session will reset and run against**.

Resolution (`getTestbedUuidsForTestSuite` in `TestbedUuids.ts`):

- If a field is missing, **generate a uuid v4** (application and deployment) or fall back `applicationName` from runner leaves / default `"Library"`.
- Caller override wins.

UI default is **ephemeral**. That path **drops** the suite’s `runTarget` uuids on purpose:

```77:90:packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationTestLauncher.ts
export function resolveUiIntegrationTestRunTarget(
  runTargetMode: UiIntegrationTestRunTargetMode,
  suite: MiroirTestSuite,
): TestbedUuids {
  if (runTargetMode === "ephemeral") {
    return getTestbedUuidsForTestSuite({
      suite: {
        miroirTestLabel: suite.miroirTestLabel,
        miroirTests: suite.miroirTests,
      },
    });
  }
  return getTestbedUuidsForTestSuite({ suite });
}
```

Pinned mode keeps the JSON uuids (often the canonical Library pair `5af03c98-…` / `f714bb2f-…`). Ephemeral mode mints new uuids and keeps only `applicationName` (from leaves or `"Library"`). `RunnerTestSession` then **remaps** the playfield seed’s canonical application/deployment uuids onto that sandbox (`remapLibraryAppModelForRunTarget`). `applicationName === "appForTest"` selects the appForTest canonical pair instead of Library.

So JSON that says `applicationName: "Library"` is a **template label for remapping**, not a statement that the `MiroirTest` belongs to Library. DC suites are `selfApplication` Miroir and still write Library uuids in `runTarget` for pinned mode / as the remap source. Lend/return are `selfApplication` Library **and** use the same Library uuids in `runTarget` — that overlap is incidental.

Create/drop: no `runTarget`; ephemeral uuids; `skipRunTargetPlayfieldReset`; they create the sandbox inside the composite action.

Generated type (`miroirFundamentalType.ts`):

```2518:2531:packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts
export type MiroirTestSuite = {
    miroirTestType: "miroirTestSuite";
    miroirTestLabel: string;
    skip?: boolean | undefined;
    testParams?: {
        [x: string]: any;
    } | undefined;
    runTarget?: {
        applicationUuid?: string | undefined;
        applicationName?: string | undefined;
        deploymentUuid?: string | undefined;
    } | undefined;
    miroirTests: (MiroirTestLeaf | MiroirTestSuite)[];
};
```

### 3.2 Instance inventory (**aligned** with entity placement)

| Location | Section | Count | Notes |
|----------|---------|-------|--------|
| `miroir_data/a311f363-…/` | Miroir **data** | **49** | Framework-owned suites |
| `library_model/a311f363-…/` | Library **model** | **2** | `runner_lend_document` (`f8e7d6c5-…`), `runner_return_document` (`a1b2c3d4-…`) |
| Other deployments | — | **0** | |

**51** `MiroirTest` instances total. **14** have `runnerTest` or `actionTest` leaves (integ). **37** are unit-only (no playfield).

Among the 49 Miroir-data instances, **12** are integ (8 `domain_controller_*` + `evolutionTraceWP1` + `runner_create_entity` + `runner_drop_entity` + `runner_freeze_application_version`). None of the 51 instance `definition` objects currently contain testbed fields (keys enumerated: only `miroirTestType`, `miroirTestLabel`, `miroirTests`, and optionally `runTarget` / `testParams`).

`getApplicationSection` stores Query / Report / `MiroirTest` instances in Miroir **data** and user-app **model**. Entity `MiroirTest` has **no** `conceptLevel`; Query has `"Model"`. Section routing uses `metaModelEntityUuids`, not `conceptLevel`. `TestConfiguration` uses **that same rule** (D7): Miroir-hosted instances in `miroir_data/`, Library-hosted instances in `library_model/`. Not a new section policy.

### 3.3 UI/CLI playfield registry (**misaligned**)

`TestbedSetupParameters` / `RunnerLibraryPlayfieldSeed`:

```44:48:packages/miroir-standalone-app/src/miroir-fwk/4-tests/uiIntegrationPlayfieldSeeds.ts
export type TestbedSetupParameters = {
  testbedEntitiesAndInstances: ApplicationEntitiesAndInstances;
  testbedInitApplicationParameters: InitApplicationParameters;
  testbedModel: MetaModelPartial;
};
```

Same triple in `packages/miroir-core/src/5_tests/IntegTestHostOptions.ts` as `RunnerLibraryPlayfieldSeed`.

`UI_INTEGRATION_RUNNER_SUITE_REGISTRY`: **14** keys, each `{ kind, suiteDefinition, testBedModelAndInstances }`.

| `kind` | Count | Orchestrator session |
|--------|-------|----------------------|
| `runnerTest` | 5 | `"runner"` |
| `domainControllerTest` | 8 | `"action"` (same as `actionTest`) |
| `actionTest` | 1 (`evolutionTraceWP1`) | `"action"` |

`kind: "domainControllerTest"` is **not** a distinct orchestrator session kind (`inferIntegrationSessionKind` maps `runnerTest` leaves → `"runner"`, `actionTest` leaves → `"action"`). This issue **keeps** the registry `kind` field unchanged (D8).

Playfield reuse in that registry (exact TS object identity, not eyeballed):

| Playfield | Suites | Count |
|-----------|--------|-------|
| `runnerLibraryDocumentEntitiesAndInstances` + `defaultLibraryAppModel` + `libraryTestbedInitParams` | `runner_lend_document`, `runner_return_document` | 2 |
| `testBedModelAndInstances: null` | `runner_create_entity`, `runner_drop_entity` | 2 |
| `libraryEntitiesAndInstancesPublisherAndCountry` + Publisher/Country model slice + `libraryTestbedInitParams` | `domain_controller_model_crud`, `domain_controller_application_version_freeze`, `evolutionTraceWP1` | 3 |
| `libraryTestbedInitParams` (model/instances differ) | the 11 non-null, non-appForTest entries | 11 |
| `appForTestTestbedInitParams` + Publisher/Country + appForTest model | `runner_freeze_application_version` | 1 |
| Unique instance/model slices | data_crud (slice, not `defaultLibraryAppModel`), composite_pk, non_uuid_pk_model, non_uuid_pk_data, no_parent, undo_redo (`[]` instances), freeze (inline appForTest slice) | 7 |

**10** distinct playfield shapes, **14** registry rows.

Parallel CLI key list (same 14 names, no playfield): `MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES` in `parseMiroirRunnerTestCLIConfig.ts`. Suite JSON load map: `SUITE_BY_KEY` in `runMiroirRunnerTestsFromCLI.ts`. CLI session still **requires** the UI registry:

```73:90:packages/miroir-standalone-app/tests/miroir-runner-tests.integ.test.ts
function createSessionParamsForSuite(suiteKey: string, suite: MiroirTestSuite) {
  const registryEntry = UI_INTEGRATION_RUNNER_SUITE_REGISTRY[suiteKey];
  if (!registryEntry) {
    throw new Error(`Unknown runner/action suite key: ${suiteKey}`);
  }
  const runTarget = getTestbedUuidsForTestSuite({ suite });
  return buildUiIntegrationOrchestratorCreateSessionParams(
    registryEntry,
    // ...
  );
}
```

UI details (`MiroirTestDisplay`): unit button uses `classifyMiroirTestSuiteExecutionCapabilities` only; **integ** button is `disabled` unless `isUiIntegrationRunnerSuiteSupportedForInstance` (registry membership). A new integ `MiroirTest` that is not in the registry shows a button that cannot launch.

Transformer registry (`UI_INTEGRATION_TRANSFORMER_SUITE_REGISTRY`): **1** key (`miroirCoreTransformers`), **no** `testBedModelAndInstances`. Out of scope.

### 3.4 Playfield apply path (**aligned** once seed is in hand)

`resetIntegTestbed` (`LibraryPlayfield.ts`): if `testbedEntitiesAndInstances` is set, **both** `testbedInitApplicationParameters` and `testbedModel` are required; then `resetAndinitializeDeploymentCompositeAction`. `RunnerTestSession` remaps `testbedModel` UUIDs onto the ephemeral `runTarget` via `remapLibraryAppModelForRunTarget` (isolated UI/CLI runs). That remap stays, regardless of where the seed is stored.

`InitApplicationParameters` (`PersistenceStoreControllerInterface.ts`): `dataStoreType`, `selfApplication` (full object), `applicationModelBranch` (full instance), `applicationVersion` (full instance), optional `metaModel`. `libraryTestbedInitParams.metaModel` is `defaultMiroirMetaModel`. `dataStoreType` is `"app"` for all current seeds.

Synthetic Entity definitions exist **only** in `uiIntegrationPlayfieldSeeds.ts` (not in Library `library_model/` Entity rows):

| Entity | uuid | Used by |
|--------|------|---------|
| `TestEntityCompositePK` | `44691d2c-d7c1-48e0-8363-71c51195e104` | `domain_controller_composite_pk_crud` |
| `TestEntityCodeNumber` (`entityCodeNumber`) | `4bbf4d19-7ac5-4fff-88ee-63ee49c7802f` | `domain_controller_non_uuid_pk_data_crud` |
| `TestEntityNoParentUuid` | `803b81ad-fda4-4206-8860-cc86f37c7a6e` | `domain_controller_no_parent_uuid_crud` |

### 3.5 Reports / menu for `MiroirTest` (**aligned**, not extended)

| Asset | uuid | Role |
|-------|------|------|
| Report `MiroirTestList` | `58dc6706-0473-468c-90ee-61b54b157140` | extractor `extractorInstancesByEntity` on `a311f363-…`; section type `miroirTestReportSection` + object list |
| Report `MiroirTestDetails` | `0ad63f27-c4df-4fb8-9a79-cb257c7a2958` | Entity `defaultInstanceDetailsReportUuid` |
| Menu `MiroirMenu` item “Miroir Tests” | menu `eaac459c-6c2b-475c-8ae4-c6c3032dae00` | `section: "data"`, report `58dc6706-…` |
| Menu `ApplicationModelScopeTemplate` item “Tests” | menu `a4ed0b44-57c2-45ee-a33c-c7c09bde969d` | `section: "model"`, `menuItemScope: "model"`, same list report |

`TestConfiguration` has no reports or menu items yet. D9 adds a list report plus two menu links (model-scope template + Miroir menu).

### 3.6 `defaultMiroirMetaModel` bootstrap (**must be extended**)

`packages/miroir-test-app_deployment-miroir/src/Model.ts`: `entities` includes `entityMiroirTest`; `entityVersions` includes `entityDefinitionMiroirTest`. A new framework Entity that user apps store in **model** **must** be on this list (otherwise `metaModelEntityUuids` misses it and `getApplicationSection` would put user-app instances in **data**). Also: `index.ts` export, Entity JSON under `miroir_model/16dbfe28-…/`, EntityVersion JSON under `miroir_modelVersion/54b9c72f-…/`.

Fundamental schema already has `metaModel` and `metaModelPartial` (`getMiroirFundamentalJzodSchema.ts`) — reuse for `testbedModel`. There is **no** Jzod for `InitApplicationParameters` or `ApplicationEntitiesAndInstances`.

---

## 4. Key reuse

| Piece | Location |
|-------|----------|
| Entity `MiroirTest` | uuid `a311f363-e238-4203-bdfc-29e8c160c26b` |
| EntityVersion of MiroirTest | uuid `51c647fe-07ec-411c-89cc-02689dc66d6a` |
| `metaModelPartial` Jzod | `getMiroirFundamentalJzodSchema.ts` |
| `ApplicationEntitiesAndInstances` | `packages/miroir-core/src/1_core/Deployment.ts` |
| `resetIntegTestbed` | `LibraryPlayfield.ts` |
| `inferIntegrationSessionKind` / `classifyMiroirTestSuiteExecutionCapabilities` | `inferIntegrationSessionKind.ts` |
| `getTestbedUuidsForTestSuite` | `TestbedUuids.ts` (already reads suite `runTarget`) |
| `getApplicationSection` | `Model.ts` — placement rule for the new Entity |
| `remapLibraryAppModelForRunTarget` | `RunnerTestSession.ts` |
| Query as placement template | Entity `e4320b9e-ab45-4abe-85d8-359604b3c62f`, `conceptLevel: "Model"` |
| SelfApplication FK target | Entity `a659d350-dd97-4da9-91de-524fa01745dc` |
| Playfield literals to migrate | `uiIntegrationPlayfieldSeeds.ts`, `uiIntegrationAppForTestPlayfieldSeed.ts` |
| Dual export of those literals | `tests/helpers/libraryPlayfieldSeeds.ts` (`export *` from the UI seeds file) |

---

## 5. Target design

Not an implementation plan — the document the suite and the new Entity should satisfy after #252.

### 5.1 `MiroirTestSuite` (root `definition` only)

Optional, absent on unit suites and on `skipRunTargetPlayfieldReset` suites. **XOR** (D3, D5):

- either `testConfiguration: uuid`
- or `testbedModel` + `testbedEntitiesAndInstances` (the inline equivalent)

Never both. Never `testbedInitApplicationParameters` (D0, D4).

### 5.2 Entity `TestConfiguration`

Framework Entity, `conceptLevel: "Model"`, listed in `defaultMiroirMetaModel.entities`.

| Where | Section |
|-------|---------|
| Entity + EntityVersion rows | Miroir **model** / **modelVersion** |
| Instances on Miroir | **data** (`miroir_data/<entityUuid>/`) — same as `MiroirTest` |
| Instances on Library / other apps | **model** (`library_model/<entityUuid>/`) — same as `MiroirTest` |

Payload (Q1): `name` / `description` plus `testbedModel` + `testbedEntitiesAndInstances`. **Not** `testbedInitApplicationParameters`.

`cache.cacheAllInstancesOnRefresh: true`. List + details reports. Menu: D9 (both).

### 5.3 Resolution (UI and CLI)

Registry lookup **unchanged** except the seed source:

1. Entry still supplies `kind`, `suiteDefinition`, `testbedInitApplicationParameters`.
2. If every `runnerTest` leaf has `skipRunTargetPlayfieldReset` → no model/instances seed (`testBedModelAndInstances` was `null`).
3. Else, from **`suiteDefinition`** (the `MiroirTestSuite`): if `testConfiguration` uuid is set, load that instance and use its model + instances; else use inline `testbedModel` + `testbedEntitiesAndInstances`. XOR, no merge.
4. Remap model onto the **session** `runTarget` (ephemeral or pinned) as `RunnerTestSession` already does. Loading the config instance uses the **authoring** app’s section (`getApplicationSection`), not the sandbox.
5. `resetIntegTestbed` still requires init (from registry) + model when instances are set.

### 5.4 First config instances

May live on Miroir (data) and/or Library (model). Natural split for today’s 14 suites (no cross-app FK required):

| Config (working name) | Home | Used by |
|-----------------------|------|---------|
| Library document seed | Library **model** | `runner_lend_document`, `runner_return_document` |
| Publisher+Country seed | Miroir **data** | `domain_controller_model_crud`, `domain_controller_application_version_freeze`, `evolutionTraceWP1` |

Unique DC slices and **`runner_freeze_application_version`** (appForTest playfield slice) stay **inline** on the Miroir-owned suite JSON (D12). Init params stay **registry**.

### 5.5 Registry entry after this issue

See D3/D4/D5 above. `{ kind, suiteDefinition, testbedInitApplicationParameters }` only.

---

## 6. Proposals / impact

| # | Proposal | Impact | Effort | Verdict |
|---|----------|--------|--------|---------|
| 1 | Suite XOR config uuid for model+instances; registry keeps `kind` + init params; configs in Miroir **data** and other-app **model** | High | Med–high | **adopt** |
| 2 | Delete the UI registry / drop `kind` | High | High, contradicts D8 | **reject** |
| 3 | Put `testbedInitApplicationParameters` on the suite or on `TestConfiguration` | Mixes D3/D4 | — | **reject** |
| 4 | Derive init from `runTarget` | Mixes D3 | — | **reject** |

---

## Next step

Decision record complete (Q1 confirmed). Implementation: [`./tdd-implementation-plan.md`](./tdd-implementation-plan.md).
