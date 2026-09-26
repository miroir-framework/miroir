# Issue #312 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`:
> tests exercise the real folder catalog (the 66 deployment JSON instances on disk), the real
> MiroirTest Entity / EntityVersion, the real model validation (`checkModelValidationInstance`)
> and the real `MiroirTestListDisplay`, through the applicative interface (`tags` in the MiroirTest
> schema and instances) and the CLI config API (`parseMiroirTestCliConfig`,
> `resolveCliSuiteKeysFromCatalog`). No new mocks. The tracer proves that
> `npm run testMiroir -w miroir-core -- --tags tools` runs exactly the suites tagged `tools`.
>
> **Execution model:** AFK, one commit per slice, as A asked on 2026-09-26 (this replaces the
> default human-in-the-loop model). Each slice ends with its Validation commands; on success its
> Realization summary is appended, its Status flips to ✅ DONE, and the slice is committed.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/312
Working branch: `claude/project-thread-4gyfzk` (from `_integration`)

**Resume note:** Slices 1–4 DONE.

---

## Scope

- `tags` (array of enum) on MiroirTest instances; vocabulary in the MiroirTest Entity; leaf `testTag` removed.
- CLI selection by tag in both `testMiroir` launchers and the vitest entries (`--tags`, `MIROIR_TEST_TAGS`).
- All 66 instances tagged, with a guard test.
- UI: Tags column in the Miroir Tests grid; tag chips restricting "Run All".
- Docs: `docs/reference/testing.md`, `docs/contributing/testing.md`.

This plan does **not** tag leaves, add all-of matching, tag other Entities, change grid cell rendering of arrays, or touch the nonreg manifest (analysis §2).

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 1 | Tracer: `--tags` selects a tagged unit suite | ✅ | `miroirTestTags.unit.test.ts` + `testMiroir --tags tools` |
| 2 | Unknown tags rejected, from the Entity vocabulary | ✅ | `miroirTestTags.unit.test.ts` (CLI errors) |
| 3 | Every MiroirTest tagged | ✅ | guard test over the folder catalog + `modelValidation` |
| 4 | `--tags` in the standalone-app launcher | ✅ | `testMiroirLauncher.tags.unit.test.ts` |
| 5 | Tags in the Miroir Tests page | ⬜ | `MiroirTestListDisplay.unit.test.tsx` + grid column test |
| 6 | Docs, nonreg, AC | ⬜ | `nonreg:unit` + tracer narrative |

---

## Locked implementation defaults

From the analysis decision record (D1–D9, T1–T7):

| Decision | Choice |
|---|---|
| Shape (D1) | `tags: string[]` per instance, no category |
| Allowed values (D2, T1, T2) | `enum` inside the `tags` array schema of the MiroirTest Entity row and EntityVersion `51c647fe-…`; read by `getMiroirTestAllowedTags(entity)`, `undefined` when the item type is not an enum |
| Level (D3) | instance only |
| Leaf `testTag` (D4) | removed from the 4 leaf schemas |
| CLI (D5, T4) | `--tags a,b` / `MIROIR_TEST_TAGS`; any-of; intersected with `--suites`; unknown tag and empty selection are errors; filter applied in `resolveCliSuiteKeysFromCatalog` |
| CLI Entity source (T3) | live Entity row read from the miroir deployment folder |
| Launcher (T5) | tags resolved before routing; core + runner mix is an error |
| Derived facets (D6) | not tags |
| Backfill (D7, T7) | all 66, per [`tag-assignment.md`](tag-assignment.md); guard test |
| UI (D8, T6) | `viewAttributes` gets `tags` after `name`; chips = tags present on listed instances, alphabetical, with counts |
| Nonreg (D9) | manifest unchanged |

---

## Allocated UUIDs / keys

No new model element. New keys:

| Artefact | Value |
|---|---|
| Instance attribute | `tags` (MiroirTest Entity `a311f363-e238-4203-bdfc-29e8c160c26b`) |
| CLI flag / env | `--tags` / `MIROIR_TEST_TAGS` |
| Helper module | `packages/miroir-core/src/5_tests/miroirTestTags.ts` |
| Vocabulary | the 20 tags of [`tag-assignment.md`](tag-assignment.md), in that order |

---

## Test execution conventions

Vitest is the vehicle throughout: the behaviors are the test apparatus itself (CLI selection, catalog, Run section), which a MiroirTest cannot select or run without being circular. Tests go into the existing feature-named files, plus one new feature-named file `miroirTestTags.unit.test.ts`; no `issues/312-*` directory is created, so there is nothing to migrate at the end.

| Purpose | Command |
|---|---|
| Rebuild deployments after JSON changes | `npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-test-app_deployment-library` |
| Regenerate types after a schema change | `npm run devBuild -w miroir-core` |
| miroir-core file | `npm run testByFile -w miroir-core -- <name>` |
| Model validation | `npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts` and `-w miroir-test-app_deployment-library` |
| Tracer | `npm run testMiroir -w miroir-core -- --tags tools --mode unit` |
| standalone-app file | `npm run testByFile -w miroir-standalone-app -- <name>` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Gate | AGENTS.md pre-push gate; `npm run nonreg:unit` at the end |

---

## Slice 1 — Tracer: `--tags` selects a tagged unit suite

**Status:** ✅ DONE

**Goal:** a developer runs `testMiroir -w miroir-core -- --tags tools` and gets the suites tagged `tools`.

**RED** — `packages/miroir-core/tests/5-tests/miroirTestTags.unit.test.ts`:
- `parseMiroirTestCliConfig({}, ["--tags", "tools, data"])` gives `tags: ["tools", "data"]`; `MIROIR_TEST_TAGS=tools` gives `["tools"]`; argv wins over env.
- `miroirTestCliConfigToEnv` writes `MIROIR_TEST_TAGS`.
- Over the real folder catalog, with `mustache` tagged `["tools"]` in its JSON: `resolveCliSuiteKeysFromCatalog([], unitKeys, catalog, ["tools"])` is `["mustache"]`; with `--suites mustache,tools` and tags `["tools"]` it is `["mustache"]` (intersection).
- `checkModelValidationInstance` of the real `mustache` instance against the EntityVersion `mlSchema` is `ok` (fails today: `tags` is not in the schema).

**GREEN:**
- Schema (T1): `tags` on the instance in the Entity row and EntityVersion, full vocabulary; leaf `testTag` removed from both (D4). Rebuild deployment, `devBuild` miroir-core.
- `mustache` instance gets `"tags": ["tools"]`.
- `MiroirTestCliConfig.tags?: string[]`; `--tags` in `parseMiroirTestCliArgs`; `MIROIR_TEST_TAGS` fallback; export in `miroirTestCliConfigToEnv`.
- `miroirTestTags.ts`: `getMiroirTestInstanceTags(instance)`, `miroirTestInstanceHasAnyTag(instance, tags)`.
- `resolveCliSuiteKeysFromCatalog(rawKeys, availableKeys, catalog, tags?)` filters the resolved keys by catalog entry tags.
- Pass `config.tags` at every caller (§3.4 of the analysis): `miroir-core-tests.unit.test.ts`, standalone `miroir-core-tests.integ.test.ts`, `testMiroirLauncher.ts` (routing change is Slice 4, only plumbing here).

**Refactor checkpoint:** the three `resolveCliSuiteKeysFromCatalog` call sites in the launcher repeat the catalog/keys arguments; leave for Slice 4 which rewrites the routing.

**Validation:**
```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-core -- miroirTestTags.unit
npm run testByFile -w miroir-core -- parseMiroirTestCliConfig.unit
npm run testByFile -w miroir-core -- loadApplicationMiroirTestsFromFolders.unit
npm run testMiroir -w miroir-core -- --tags tools --mode unit   # runs mustache only
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- Schema: `tags` (array of the 20-value enum) after `description` in the Entity row and EntityVersion, identical; leaf `testTag` removed from the 4 leaf schemas. Both files rewritten with `json.dumps(indent=2)`, which round-trips them byte for byte. Rebuild + `devBuild` regenerated `miroirFundamentalType.ts` (`tags?: ("transformer" | … | "tools")[]`) and `miroirFundamentalMlSchema.ts`.
- RED confirmed first: with `mustache` tagged and the schema unchanged, model validation returned `error` (MiroirTest objects reject unknown attributes).
- `MiroirTestCliConfig.tags`, `splitTags`, `--tags`, `MIROIR_TEST_TAGS` both ways; `miroirTestTags.ts` (`getMiroirTestInstanceTags`, `miroirTestInstanceHasAnyTag`, exported from `index.ts`); `resolveCliSuiteKeysFromCatalog(..., tags?)`.
- Callers pass `tags`: miroir-core unit entry, standalone core integ entry, launcher (core and runner branches). Deviation: the runner vitest entry (`miroir-runner-tests.integ.test.ts`) did not go through `resolveCliSuiteKeysFromCatalog` at all; it now does, so `MIROIR_TEST_TAGS` works there too.
- Tracer: `npm run testMiroir -w miroir-core -- --tags tools --mode unit` ran the 6 `mustache` tests only.
- Validation: `miroirTestTags.unit` 7/7, `parseMiroirTestCliConfig.unit` 13/13, `loadApplicationMiroirTestsFromFolders.unit` 5/5, miroir `modelValidation` 162/162, `componentMiroirTests.consistency` 6/6, `miroirModelVersionLayout` 10/10, `tsc` miroir-core and miroir-standalone-app clean.

---

## Slice 2 — Unknown tags rejected, from the Entity vocabulary

**Status:** ✅ DONE

**Goal:** a typo in `--tags` or in an instance is reported with the allowed values, taken from the MiroirTest Entity.

**RED** — `miroirTestTags.unit.test.ts`:
- `getMiroirTestAllowedTags` of the live Entity row read from disk is the 20-tag vocabulary, in order; of a copy whose `tags` item type is `{type: "string"}` it is `undefined`.
- `resolveCliSuiteKeysFromCatalog([], unitKeys, catalog, ["toolz"])` throws, naming `toolz` and listing the allowed tags.
- A tag selection matching no available suite throws, naming the tags.
- `checkModelValidationInstance` of the `mustache` instance with `tags: ["toolz"]` is `error`.

**GREEN:** `getMiroirTestAllowedTags(entity)`, `loadMiroirTestEntityFromFolders(repoRoot)` (reads `miroir_model/16dbfe28-…/a311f363-….json`), the two checks inside `resolveCliSuiteKeysFromCatalog`.

**Refactor checkpoint:** keep the path of the Entity row next to `ENTITY_MIROIR_TEST_UUID` in `applicationMiroirTestFolders.ts` rather than a new constant elsewhere.

**Validation:**
```bash
npm run testByFile -w miroir-core -- miroirTestTags.unit
npm run testMiroir -w miroir-core -- --tags toolz --mode unit   # exits non-zero with the allowed list
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
```

### Realization

- `getMiroirTestAllowedTags` and `assertAllowedMiroirTestTags` in `miroirTestTags.ts` (exported); `loadMiroirTestEntityFromFolders` reads the live Entity row at `MIROIR_TEST_ENTITY_RELATIVE_PATH` (`applicationMiroirTestFolders.ts`); `resolveCliSuiteKeysFromCatalog` checks tags against it and fails on an empty tagged selection.
- Deviation: the planned "model validation rejects an unknown tag" assertion could not go green. `mlsTypeCheck` accepts any enum value; the strict version turned 7 existing instances red (library `conceptLevel` values, miroir Theme `format: "color"`, a `domain_controller_data_crud` fixture). That is a separate bug with its own data fixes: filed as #313, `mlsTypeCheck` left unchanged, assertion dropped. Committed values are guarded by the Slice 3 test instead (analysis T7 updated).
- `testMiroir -w miroir-core -- --tags toolz` fails with `Unknown tag "toolz". Allowed tags (MiroirTest Entity): transformer, …`.
- Validation: `miroirTestTags.unit` 11/11; `npm run test -w miroir-core -- ''` 2054 passed (run with the strict enum, before reverting it; the revert only restores the previous code); `tsc` miroir-core clean.

---

## Slice 3 — Every MiroirTest tagged

**Status:** ✅ DONE

**Goal:** every one of the 66 tests can be found by tag, and a new untagged test is caught.

**RED** — `miroirTestTags.unit.test.ts`, over `loadApplicationMiroirTestsFromFolders()`: every instance has at least one tag, and every tag is in `getMiroirTestAllowedTags` of the live Entity row. Fails on 65 instances.

**GREEN:** a script (scratch, not committed) writes `tags` per [`tag-assignment.md`](tag-assignment.md) into the 66 JSON files, placed right after `description`, keeping each file's formatting.

**Refactor checkpoint:** none expected (pure data).

**Validation:**
```bash
npm run build -w miroir-test-app_deployment-miroir && npm run build -w miroir-test-app_deployment-library
npm run testByFile -w miroir-core -- miroirTestTags.unit
npm run testByFile -w miroir-test-app_deployment-miroir -- tests/modelValidation.unit.test.ts
npm run testByFile -w miroir-test-app_deployment-library -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-core -- --tags ml-union --mode unit   # the 6 ml-union suites
```

### Realization

- Guard tests added to `miroirTestTags.unit.test.ts` (every instance tagged; every tag allowed by the live Entity). RED: 65 untagged instances.
- A scratch script inserted `"tags"` after `"description"` in the 65 remaining files per `tag-assignment.md` (65 files, +260 lines, no other line touched).
- Validation: `miroirTestTags.unit` 13/13; `modelValidation` miroir 162/162, library 183/183; `testMiroir -w miroir-core -- --tags ml-union --mode unit` ran the 6 `ml-union` suites, 36 tests.

---

## Slice 4 — `--tags` in the standalone-app launcher

**Status:** ✅ DONE

**Goal:** `npm run testMiroir -w miroir-standalone-app -- --tags domain-controller --mode integ` runs the 8 DomainController suites through the runner entry.

**RED** — `packages/miroir-standalone-app/tests/scripts/testMiroirLauncher.unit.test.ts` (or the existing launcher test if one exists), calling `resolveVitestEntry(env, argv)`:
- `--tags domain-controller --mode integ` → runner entry, `MIROIR_TEST_SUITES` = the 8 `domain_controller_*` keys.
- `--tags transformer --mode integ` → core integ entry, suites = the transformer-tagged integ-capable suites.
- a tag selection spanning core and runner suites (`--tags model`) → error naming both groups.

**GREEN:** in `resolveVitestEntry`, resolve requested keys through `resolveCliSuiteKeysFromCatalog(..., tags)` over core + runner keys before routing; error on a mix.

**Refactor checkpoint:** fold the three resolution calls into one resolved key list used by both branches.

**Validation:**
```bash
npm run testByFile -w miroir-standalone-app -- testMiroirLauncher
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

- New `tests/helpers/testMiroirLauncher.tags.unit.test.ts` (4 cases: runner route, core route limited to integration-capable suites, intersection with `--suites`, core + runner mix refused). RED: the core route threw "No suite carries … transformer", because the launcher filtered unit keys only.
- `resolveVitestEntry` now computes one selected key list before routing: with tags, among transformer-integration + runner keys (the suites this integ-only launcher can run); without tags, as before. Both branches use it; the three separate resolution calls are gone (the refactor checkpoint).
- End to end: `testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --tags domain-controller --suites domain_controller_data_crud,runner_create_entity --mode integ` ran the 6 `domain_controller_data_crud` tests only.
- Validation: `testMiroirLauncher.tags` 4/4, `test-miroir-runner.profile` 4/4, `tsc` miroir-standalone-app clean.

---

## Slice 5 — Tags in the Miroir Tests page

**Status:** ⬜ pending

**Goal:** in the app, the Miroir Tests grid shows a sortable, filterable Tags column, and tag chips restrict "Run All".

**RED:**
- `MiroirTestListDisplay.unit.test.tsx` (existing file, keeps its existing `RunAllMiroirTestsButton` stub): with real instances, chips show each present tag with its count; clicking a chip changes the header count to the matching instances and the unit/integ buttons follow the filtered list (the integ button disappears when only unit suites remain); clicking again restores all.
- A column test: `getMDataGridColumnDefinitionsFromEntity` with the real MiroirTest Entity yields a `tags` column right after `name`.

**GREEN:** `viewAttributes` of the Entity row (and EntityVersion) gets `tags`; `MiroirTestListDisplay` keeps `selectedTags` state, filters with `miroirTestInstanceHasAnyTag`, renders chips from `listMiroirTestTagCounts(instances)`.

**Refactor checkpoint:** `sortMiroirTestInstances` / `getMiroirTestSuiteKey` in the app duplicate `suiteKeyFromMiroirTestInstance` of miroir-core; replace the app copy if the change stays local.

**Validation:**
```bash
npm run build -w miroir-test-app_deployment-miroir && npm run devBuild -w miroir-core
npm run testByFile -w miroir-standalone-app -- MiroirTestListDisplay.unit
npm run testByFile -w miroir-standalone-app -- getColumnDefinitionsFromEntityAttributes
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
```

### Realization

_(pending)_

---

## Slice 6 — Docs, nonreg, AC

**Status:** ⬜ pending

**Goal:** the feature is documented and the whole unit tier is green.

- Docs: `docs/reference/testing.md` (Selection row, `--tags` examples, env table, the tag vocabulary and how to extend it), `docs/contributing/testing.md` (tag a new test).
- Nonreg: no new step; `unit-miroir-core` / catalog sweep and `unit-MiroirTestListDisplay` already run the new tests. Run `npm run nonreg:unit`.
- Tracer narrative: `testMiroir -w miroir-core -- --tags ml-union` runs 6 suites; in the app, Miroir Tests → click `editor` → "Run All Unit Tests" runs the 9 editor suites.
- Cleanup: no `issues/312-*` directory was created.

**AC checklist:**

| Goal (analysis §1) | Proof |
|---|---|
| 1 Run one area from the CLI | `miroirTestTags.unit.test.ts` (Slices 1–3), tracer command |
| 2 Narrow the Run section | `MiroirTestListDisplay.unit.test.tsx` (Slice 5) |
| 3 Sort and filter the list | grid column test (Slice 5) |
| 4 Tag a test from the allowed values | model validation test (Slice 2), generated type |
| 5 Extend the vocabulary | `getMiroirTestAllowedTags` reads the Entity (Slice 2) |

**Validation:**
```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npm run test -w miroir-core -- ''
npm run nonreg:unit
```

### Realization

_(pending)_
