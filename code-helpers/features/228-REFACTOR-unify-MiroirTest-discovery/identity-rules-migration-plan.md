# #228 — Identity rules migration plan

Issue: [miroir-framework/miroir#228](https://github.com/miroir-framework/miroir/issues/228)  
AC: *Identity rules: one canonical suite key (or uuid) for selection; document how labels/names map without silent no-match.*

**Status:** slices 0–6 implemented (2026-09-07). Do not rename instances or change `nonreg-manifest.json` in this work. Unit-tier nonreg snapshot: `test-results/nonreg/20260907T172101Z` (23 passed, 0 failed, 0 skipped).

Inventory date: 2026-09-07. Catalog: 54 `miroirTestSuite` instances under deployment `assets/…/a311f363-…`.

---

## Locked target

| Role | Target field | Used to |
|------|----------------|---------|
| **Suite key** | instance `name` | `--suites` / `MIROIR_TEST_SUITES` / UI suite identity / **catalog-root `--filter` keys** |
| **Optional stable id** | instance `uuid` | `--suites` may accept uuid (unambiguous); not required to pick by name |
| **Leaf id** | leaf `miroirTestLabel` | `--filter` values / UI leaf checkboxes |
| **Nested-suite path** | nested `miroirTestLabel` | `--filter` object keys **inside** a catalog root (inline suites have no `name`) |

`miroirTestLabel` stays a **display** string and the key for **nested** filter paths. It is not a suite key and not the catalog-root `--filter` key.

Completion of this AC: a caller who uses only `name` (and leaf labels inside `--filter`) can launch any suite; using a label, prefix, or legacy registry token as `--suites` **or** as a catalog-root `--filter` key **errors** with the target `name` listed; named exports are `miroirTest_<name>`; docs no longer say “Registry key”.

---

## Selection channels — present vs target

One column per way a human or agent launches or names a suite today.

| Channel | Present tokens that work | Silent? | Target |
|---------|--------------------------|---------|--------|
| `--suites` / `-s` / `MIROIR_TEST_SUITES` | instance `name`; **or** unique `miroirTestLabel`; **or** unique prefix of `name` (`menu` → `menu_build`) | Yes — prefix/label resolve with no warning | `name` only (optional: `uuid`) |
| UI (Miroir Tests) | instance `name` (`suiteKeyFromMiroirTestInstance`); label used only if `name` missing or as registry fallback | Partial — label fallback in `resolveUiIntegrationRunnerSuiteKey` | `name` |
| `--filter` / `-f` / `MIROIR_TEST_FILTER` **keys** | suite / nested `miroirTestLabel` (e.g. `runner.returnDocument`) | Wrong key that is a `name` matches nothing (warn / empty inner list) | catalog-root key = **`name`**; nested keys stay **label**; wrong root key **errors** listing both |
| `--filter` **values** | leaf `miroirTestLabel` | Unknown leaf → that leaf skipped (other leaves run) | leaf `miroirTestLabel`; unknown leaf should error listing available leaves |
| Named export `miroirTest_*` | optional TS import; suffix often equals `name`, sometimes equals a **legacy** token (`miroirTest_menu` → instance `menu_build`) | N/A (not a launcher) | keep optional; suffix **should** equal `name` (fix the four mismatches) |
| Legacy name lists | `MIROIR_TEST_SUITE_REGISTRY_NAMES`, `MIROIR_RUNNER_TEST_SUITE_REGISTRY_NAMES` | Used only as snapshots / characterization | snapshots may keep old tokens; live CLI must not |

`npm run nonreg` already passes **target `name`** in `--suites`. Leave the manifest alone.

Vitest filename / `RUN_TEST` is not a MiroirTest launch channel (PLATFORM only).

---

## Code that implements the present aliases

| Function | File | Present behaviour |
|----------|------|-------------------|
| `suiteKeyFromMiroirTestInstance` | `applicationMiroirTestCatalog.ts` | `name` → label → uuid |
| `resolveApplicationMiroirTestSuiteKey` | same | exact `name`, then exact label, then unique prefix |
| `resolveUiIntegrationRunnerSuiteKey` | `resolveUiIntegrationRunnerSuiteKey.ts` | `name` in registry, else label match, else `suiteKeyFromMiroirTestInstance` |
| `resolveSuiteInnerFilter` | `miroirTestFilter.ts` | keys = suite/nested **label**, or all keys are leaf labels |
| `listSuiteIdentityKey` | `miroirTestSuiteUiExecution.ts` | `name` \|\| label \|\| uuid |

Unknown `--suites` already throws with the available **names**. Prefix/label hits never reach that error.

---

## Table A — Suites already aligned (19)

These already have `name` == `miroirTestLabel` and `miroirTest_<name>` export. `--suites` / UI / filter key / export are the same string (plus accidental unique prefixes — retire those globally, not per suite).

`EntityPrimaryKey` · `adminTransformers` · `ansiColumnsToJzodSchema` · `defaultValueForMLSchema` · `getAttributeTypesFromJzodSchema` · `jzodToJsonSchema` · `jzodUnionResolvedTypeForArray` · `jzodUnionResolvedTypeForObject` · `jzodUnion_RecursiveUnfold` · `miroirCoreTransformers` · `resolveConditionalSchema` · `resolveSchemaReferenceInContext` · `tools` · `transformerInterfaceCheck` · `transformerResultSchema` · `unfoldSchemaOnce` · `unionArrayChoices` · `unionObjectChoices` · `virtualAttributes`

---

## Table B — Suites with more than one present name (35)

Work list for **Slice 6** (and the four export rows also in Slice 5). Columns = ways of **naming** the suite today. **Target** is always instance `name`.

`--suites` extras = tokens that resolve today **in addition to** `name` (unique label, and the four documented / legacy prefixes). Accidental 3-character prefixes (`mus` → `mustache`) are **not** listed; they all die when prefix match is removed (Slice 2).

Present `--filter` suite key = that instance’s root `definition.miroirTestLabel` (often a dotted display string, **not** a nested path). Target `--filter` key for every row = **`name`**. Target export for every row = **`miroirTest_<name>`**.

| Target (`name`) | App | `--suites` extras (present) | `--filter` suite key (present) | Named export (present) |
|-----------------|-----|-----------------------------|--------------------------------|------------------------|
| `JzodSchemaReferencesList` | miroir | label | `jzod.JzodSchemaReferencesList` | `miroirTest_JzodSchemaReferencesList` |
| `JzodSchemaReferencesSet` | miroir | label | `jzod.JzodSchemaReferencesSet` | `miroirTest_JzodSchemaReferencesSet` |
| `alterObject_atPath` | miroir | label; `alterObject` (prefix + legacy list + export suffix) | `alterObject.atPath` | `miroirTest_alterObject` |
| `buildAnyKeyMap` | miroir | label | `jzod.buildAnyKeyMap` | `miroirTest_buildAnyKeyMap` |
| `domain_controller_application_version_freeze` | miroir | label | `domainController.applicationVersion.freeze` | `miroirTest_domain_controller_application_version_freeze` |
| `domain_controller_composite_pk_crud` | miroir | label | `domainController.compositePK.data.crud` | `miroirTest_domain_controller_composite_pk_crud` |
| `domain_controller_data_crud` | miroir | label | `domainController.data.crud` | `miroirTest_domain_controller_data_crud` |
| `domain_controller_model_crud` | miroir | label | `domainController.model.crud` | `miroirTest_domain_controller_model_crud` |
| `domain_controller_model_undo_redo` | miroir | label | `domainController.model.undoRedo` | `miroirTest_domain_controller_model_undo_redo` |
| `domain_controller_no_parent_uuid_crud` | miroir | label | `domainController.noParentUuid.crud` | `miroirTest_domain_controller_no_parent_uuid_crud` |
| `domain_controller_non_uuid_pk_data_crud` | miroir | label | `domainController.nonUuidPK.data.crud` | `miroirTest_domain_controller_non_uuid_pk_data_crud` |
| `domain_controller_non_uuid_pk_model_crud` | miroir | label | `domainController.nonUuidPK.model.crud` | `miroirTest_domain_controller_non_uuid_pk_model_crud` |
| `evolutionTraceWP1` | miroir | label | `evolutionTrace.WP1` | `miroirTest_evolutionTraceWP1` |
| `jzodObjectFlatten` | miroir | label | `jzod.jzodObjectFlatten` | `miroirTest_jzodObjectFlatten` |
| `jzodToCopilotKitParameter` | miroir | label | `jzod.jzodToCopilotKitParameter` | `miroirTest_jzodToCopilotKitParameter` |
| `jzodToJzod_Summary` | miroir | label | `jzod.jzodToJzod_Summary` | `miroirTest_jzodToJzod_Summary` |
| `jzodTransitiveDependencySet` | miroir | label | `jzod.jzodTransitiveDependencySet` | `miroirTest_jzodTransitiveDependencySet` |
| `jzodTypeCheck_TransformerTestSuite` | miroir | label `jzodTypeCheck`; legacy list `jzodTypeCheck` | `jzodTypeCheck` | `miroirTest_jzodTypeCheck` |
| `localizeJzodSchemaReferenceContext` | miroir | label | `localizeReferenceContext` | `miroirTest_localizeJzodSchemaReferenceContext` |
| `menu_build` | miroir | label `menu.build`; prefix/legacy/export `menu` | `menu.build` | `miroirTest_menu` |
| `mergePositionBased` | miroir | label | `jzod.mergePositionBased` | `miroirTest_mergePositionBased` |
| `metaModelTransformersTest` | miroir | prefix/legacy/export `metaModelTransformers` | `metaModelTransformersTest` | `miroirTest_metaModelTransformers` |
| `modelUpdates` | miroir | label | `modelUpdates.getModelUpdate` | `miroirTest_modelUpdates` |
| `mustache` | miroir | label | `mustache.extractDoubleBracePatterns` | `miroirTest_mustache` |
| `pilot_transformer_plus` | miroir | label | `pilot_resolveConditionalSchema` | `miroirTest_pilot_transformer_plus` |
| `queries_library` | miroir | label | `queries.library` | `miroirTest_queries_library` |
| `resolveQueryTemplates` | miroir | label | `resolveQueryTemplates.unit.test` | `miroirTest_resolveQueryTemplates` |
| `runner_create_entity` | miroir | label | `runner.createEntity` | `miroirTest_runner_create_entity` |
| `runner_drop_entity` | miroir | label | `runner.dropEntity` | `miroirTest_runner_drop_entity` |
| `runner_freeze_application_version` | miroir | label | `runner.freezeApplicationVersion` | `miroirTest_runner_freeze_application_version` |
| `runner_lend_document` | library | label | `runner.lendDocument` | `miroirTest_runner_lend_document` |
| `runner_mcp_get_instances` | miroir | label | `runner.mcpGetInstances` | `miroirTest_runner_mcp_get_instances` |
| `runner_mcp_lend_document` | library | label | `runner.mcpLendDocument` | `miroirTest_runner_mcp_lend_document` |
| `runner_return_document` | library | label | `runner.returnDocument` | `miroirTest_runner_return_document` |
| `selectUnionBranchFromDiscriminator` | miroir | label | `jzod.selectUnionBranchFromDiscriminator` | `miroirTest_selectUnionBranchFromDiscriminator` |

---

## Table C — Documented / leftover aliases to retire

These are the tokens people still type because docs, skills, or `MIROIR_TEST_SUITE_REGISTRY_NAMES` taught them.

| Present token | How it resolves today | Target `--suites` | Target `--filter` key |
|---------------|----------------------|-------------------|------------------------|
| `menu` | unique prefix of `menu_build` | `menu_build` | `menu_build` |
| `jzodTypeCheck` | unique **label** of `jzodTypeCheck_TransformerTestSuite` | `jzodTypeCheck_TransformerTestSuite` | `jzodTypeCheck_TransformerTestSuite` |
| `alterObject` | unique prefix of `alterObject_atPath` | `alterObject_atPath` | `alterObject_atPath` |
| `metaModelTransformers` | unique prefix of `metaModelTransformersTest` | `metaModelTransformersTest` | `metaModelTransformersTest` |
| `runner.returnDocument` | unique **label** | `runner_return_document` | `runner_return_document` |
| any other unique prefix (`runner_l`, `mus`, …) | `name.startsWith(token)` when exactly one hit | the full `name` | the full `name` |

Worked example (Library return):

```bash
# target (after Slice 6)
npm run testMiroir -w miroir-standalone-app -- --suites runner_return_document --mode integ \
  --filter '{"runner_return_document":["Return Book Test Composite Action"]}'

# present extras that must start failing as --suites (Slice 2)
--suites runner.returnDocument
--suites runner_r

# present extras that must start failing as --filter keys (Slice 6)
--filter '{"runner.returnDocument":["Return Book Test Composite Action"]}'
```

---

## Table D — Leaf filter (not a suite key)

`--filter` never selects which **suite** runs; `--suites` already did that.

| Channel | Present | Target |
|---------|---------|--------|
| Filter object **key** (catalog root) | root `definition.miroirTestLabel` | instance **`name`**. If the key equals the root label and not `name`, **error** listing both |
| Filter object **key** (nested) | nested `miroirTestLabel` | same (labels). Inline suites have no `name` |
| Filter object **value** / array entry | leaf `miroirTestLabel` | same. Unknown leaf → **error** with available leaf labels (today: silent skip of that leaf) |
| Flat filter `{ "Return Book…": ["*"] }` | every key is a leaf label | keep |

Catalog-root key and nested keys are **different rules**. Do not invent a `name` for inline suites.

---

## Verification gates (major slices)

Do **not** edit `scripts/nonreg-manifest.json`. Use it as the scope meter.

Before Slice 2 (first behaviour change), take a baseline:

```bash
npm run build -w miroir-test-app_deployment-miroir -w miroir-test-app_deployment-library
npm run build -w miroir-core
npm run nonreg
```

Keep the stamp under `test-results/nonreg/`. After each **major** slice (2, 4, 5, 6; Slice 3 if UI launchability changes), rebuild the touched packages, then:

```bash
npm run nonreg -- --compare latest
```

`--compare` must show **no missing steps, no newly skipped steps, no new failures**. Added steps are not expected (manifest unchanged). That is “constant testing scope”.

Nonreg does not exercise alias rejection or `--filter` identity. After each major slice, also run the extra launches listed on that slice (and the post–Slice 2 / Slice 6 commands at the bottom). A launch that must start **failing** is in scope: it must fail for the documented reason, not because the suite disappeared.

Slices 0–1 are docs / characterization only — no nonreg gate.

---

## Migration slices

Human-in-the-loop. No commit step. Do not edit `scripts/nonreg-manifest.json`.

### Slice 0 — Docs (no behaviour change)

Rewrite `docs/reference/testing.md` “Three names (easy to confuse)”:

| Name | Example | Used in |
|------|---------|---------|
| **Suite key** (`name`) | `runner_return_document` | `--suites`, `MIROIR_TEST_SUITES`, UI, catalog-root `--filter` keys |
| **Suite `miroirTestLabel`** | `runner.returnDocument` | display; **nested** `--filter` keys only |
| **Leaf `miroirTestLabel`** | `Return Book Test Composite Action` | `--filter` **values**, UI leaf checkboxes |

Delete the words “Registry key”. Point contributing / developer guides / transformer skills at `name`. Live `--filter` examples may still show present labels until Slice 6.

**Done when:** those three docs use the table above; no “Registry key” in live testing docs.

### Slice 1 — Characterization of present resolution

Unit test (PLATFORM) that locks Table C + “unknown token throws with available names”. Input: catalog from folders. Assert today’s aliases still resolve (this slice is red only if someone already removed them).

**Done when:** `applicationMiroirTestCatalog.unit.test.ts` (or sibling) lists each Table C token → target `name`.

### Slice 2 — `--suites` exact `name` only (or uuid)

`resolveApplicationMiroirTestSuiteKey`: drop label match and prefix match. Optional: accept `uuid`. Error text:

`Unknown suite key "<token>". Use instance name. Available: …`  
If `<token>` equals a label, add: `Did you mean "<name>"? ("<token>" is miroirTestLabel, not a suite key).`

**Done when:** `--suites menu` / `jzodTypeCheck` / `alterObject` / `runner.returnDocument` throw; `--suites menu_build` / `runner_return_document` still run. Slice 1 tests updated to expect the errors.

**Gate:** rebuild `miroir-core` → `npm run nonreg -- --compare latest` → extra launches in “Suggested extra launches” (Slice 2 pair).

### Slice 3 — UI identity = `name` only

`resolveUiIntegrationRunnerSuiteKey` / `listSuiteIdentityKey`: no label fallback when `name` is set. Launchability stays “has integ leaves”, not “key ∈ legacy registry”.

**Done when:** UI suite key for Library return is `runner_return_document`; existing `RunAllMiroirTestsButton` / `MiroirTestListDisplay` units still pass.

**Gate:** rebuild `miroir-core` (and `miroir-standalone-app` if the UI units live there) → `npm run nonreg -- --compare latest` if those packages are on the nonreg path.

**Gate:** rebuild `miroir-core` (and `miroir-standalone-app` if the UI units live there) → `npm run nonreg -- --compare latest` if those packages are on the nonreg path.

### Slice 4 — `--filter` mismatch is explicit (no silent skip)

Do **not** lock “`name` as root key errors” as the end state — Slice 6 flips the accepted root key to `name`. This slice only stops silent empty matches.

`resolveSuiteInnerFilter` / walk: if a key matches neither this suite’s root label nor its catalog `name`, **throw** listing both strings. If a leaf token is unknown, **throw** with available leaf labels (today: that leaf is skipped, other leaves run).

**Done when:** a typo leaf label errors instead of skipping; `--filter '{"notASuite":[…]}'` errors with `name` and label. Using `name` as the root key may still miss until Slice 6 — that miss must be an **error**, not a silent skip.

**Gate:** rebuild `miroir-core` → `npm run nonreg -- --compare latest` → extra:

```bash
npm run testMiroir -w miroir-core -- --suites mustache --mode unit \
  --filter '{"mustache.extractDoubleBracePatterns":["this leaf does not exist"]}'
# expect error listing available leaf labels (present root key still works until Slice 6)
```

### Slice 5 — Named-export suffix = `name` (four rows)

Rename exports only (JSON `name` unchanged):

| Present export | Target export |
|----------------|---------------|
| `miroirTest_menu` | `miroirTest_menu_build` |
| `miroirTest_jzodTypeCheck` | `miroirTest_jzodTypeCheck_TransformerTestSuite` |
| `miroirTest_alterObject` | `miroirTest_alterObject_atPath` |
| `miroirTest_metaModelTransformers` | `miroirTest_metaModelTransformersTest` |

Update TS imports. Optional deprecated aliases for one release if something outside tests imports the old names.

**Done when:** every `miroirTest_*` **declaration** suffix equals instance `name`; `tsc` of touched packages is clean. Remaining import / docs references are Slice 6.

**Gate:** rebuild `miroir-test-app_deployment-miroir` (and library if its exports moved) then `miroir-core` → `npm run nonreg -- --compare latest`.

### Slice 6 — Align `--filter` and named-export **references** on `name` (Table B)

Table B is the work list (35 rows). Table A already has root label == `name`; only nested-path examples need a glance.

**Resolver (catalog root only).** Pass instance `name` into the root `resolveSuiteInnerFilter` (the walk today uses `definition.miroirTestLabel`). Accept the root key when it equals `name`. If it equals the root label and that label ≠ `name`, **error**: `Did you mean "<name>"? ("<token>" is miroirTestLabel).` Nested keys stay labels. Leaf values stay leaf labels.

**References.** For every Table B row, retarget live usages:

| Present (Table B) | Target |
|-------------------|--------|
| `--filter` suite key (root `miroirTestLabel`) | instance `name` |
| `miroirTest_<legacy>` import / re-export use | `miroirTest_<name>` (Slice 5 already renamed the four declarations) |

Sweep: `docs/reference/testing.md`, `docs/guides/developer/testing.md`, transformer / query skills, `miroirTestFilter.unit.test.ts` and any other filter fixtures, leftover `miroirTest_*` imports (including wrappers still calling `runMiroirCoreTestSuite` — retarget the import; do not revive filename launch). Do not rename JSON `name` / `miroirTestLabel`.

**Done when:**

- `--filter '{"runner_return_document":["Return Book Test Composite Action"]}'` selects that leaf
- `--filter '{"runner.returnDocument":[…]}'` errors pointing at `runner_return_document`
- `--filter '{"mustache":["should extract patterns with double braces"]}'` selects that leaf; `mustache.extractDoubleBracePatterns` as root key errors
- every live `--filter` example in testing docs / skills uses `name` as the root key
- no remaining import of `miroirTest_menu` / `miroirTest_jzodTypeCheck` / `miroirTest_alterObject` / `miroirTest_metaModelTransformers`

**Gate:** rebuild deployment packages + `miroir-core` (+ `miroir-standalone-app` if UI tests import exports) → `npm run nonreg -- --compare latest` → extra launches below.

### Out of scope

- Renaming instance `name` / `miroirTestLabel` in JSON (would churn `--filter` and UI display).
- `scripts/nonreg-manifest.json`.
- Replacing `FunctionCallTestRegistry`.
- PLATFORM `RUN_TEST` filenames.

---

## Suggested extra launches

After Slice 2:

```bash
npm run testMiroir -w miroir-core -- --suites menu --mode unit
# expect error → use menu_build

npm run testMiroir -w miroir-core -- --suites menu_build --mode unit
# expect green
```

After Slice 6 (plus the Slice 2 pair still holds):

```bash
npm run testMiroir -w miroir-core -- --suites mustache --mode unit \
  --filter '{"mustache":["should extract patterns with double braces"]}'
# expect that leaf only

npm run testMiroir -w miroir-core -- --suites mustache --mode unit \
  --filter '{"mustache.extractDoubleBracePatterns":["should extract patterns with double braces"]}'
# expect error → use mustache

npm run testMiroir -w miroir-standalone-app -- --suites runner_return_document --mode integ \
  --filter '{"runner_return_document":["Return Book Test Composite Action"]}'
# expect that leaf only
```
