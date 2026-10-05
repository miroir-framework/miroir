# Issue #473 — TDD Implementation Plan

> Integration first, no mocks. The recording side is a Python CLI (`scripts/bundle_size_history.py`, and
> `scripts/check_bundle_policy.py` which uses it), tested through its command line with pytest on copies of
> the real report fixture and on temporary git repositories. The applicative side is the `miroir-app-meta`
> package: its Entity, data and Report are proven by the package's `modelValidation` (every tracked instance
> is valid against the Entity's `mlSchema`) and by a Report MiroirTest run on the real DomainController and
> filesystem store (`emulatedServer-filesystem`).

**Resume note:** update the progress table and each slice's Status / Realization as slices land.

## Scope

In: G1 (see the size history), G2 (record without extra steps), G3 (start with the past), G4 (a home for development data), per [`analysis.md`](./analysis.md).

Out: test run history (#474); per-package sizes; recording every build, CI builds or failed builds (A, D4/D5); server binary and Docker image sizes; `miroir-app-meta` in docker, desktop or release installs (D9).

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/473
- Analysis: [`analysis.md`](./analysis.md)
- Prerequisite plans: [`../326-BUILD-build-hardening/tdd-implementation-plan.md`](../326-BUILD-build-hardening/tdd-implementation-plan.md) (guard, Slices 12 and 14), [`../472-FEATURE-github-example-app/tdd-implementation-plan.md`](../472-FEATURE-github-example-app/tdd-implementation-plan.md) (Slice 0: new package registration)
- Branch: `claude/473-bundle-size-history` (from `_integration` a6ba1aad)

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | `miroir-app-meta` skeleton, registered in dev and test environments | ⬜ pending | `modelValidation` of miroir-app-meta, `testEnvironmentConfig.unit` |
| 1 | A bundle report becomes a valid `BundleSizeMeasurement` instance (tracer) | ⬜ pending | `test_bundle_size_history.py::test_record_*`, `modelValidation` |
| 2 | The backfill writes the baseline history | ⬜ pending | `test_bundle_size_history.py::test_backfill_*`, 21 tracked instances |
| 3 | Recording the baseline writes the policy and the instance | ⬜ pending | `test_check_bundle_policy.py::test_record_baseline_*` |
| 4 | The guard refuses a baseline missing from the history | ⬜ pending | `test_check_bundle_policy.py::test_history_*` |
| 5 | The Meta home Report shows the history | ⬜ pending | MiroirTest `report.bundleSizeHistory` |
| 6 | Nonreg steps, docs, cleanup | ⬜ pending | `npm run nonreg:filesystem -- --runner shared` |

## Locked implementation defaults

| ID | Default | Serves |
|---|---|---|
| D1 | New package `miroir-app-meta`, application key `meta`, asset prefix `meta_` | G4 |
| D2 | One `BundleSizeMeasurement` instance per recorded measurement | G1 |
| D3 | Recording the baseline writes `eagerGzipBaseline` and the instance in one step | G2 |
| D4 | Recorded: the builds whose size becomes the baseline, as today | G2 |
| D5 | A build that fails the guard writes nothing | G2 |
| D6 | Instances tracked in `packages/miroir-app-meta/assets/meta_data/90d603f9-…/` | G1, G3 |
| D7 | One instance builder for record and backfill; a Report shows the measurements | G1, G3 |
| D8 | `check_bundle_policy.py --record-baseline [--baseline N] [--reason TEXT]`; `--init` records too; new guard rule `history` | G2 |
| D9 | Installed in `dev` (`live`) and `test-filesystem` (`copy`) + store overrides of the other `test-*` | G1 |
| D10 | Attributes per analysis §3 D10 (totals only; optional where the backfill cannot fill them) | G1, G3 |
| D11 | `previousBaseline` and `baselineChange` stored at write time | G1 |
| D12 | `scripts/bundle_size_history.py` (builders, `newest`, `write`, CLI `record` / `backfill`) | G2, G3 |
| D13 | Report `BundleSizeHistory`: per app, anchored `application` filter, `measuredAt` desc, line graph | G1 |

## Allocated UUIDs / keys

Model uuids: analysis §5 (SelfApplication `9ff432a9-…`, Deployment `40b74910-…`, branch `4408382d-…`, Menu `c95bfb70-…`, Entity `90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b`, Reports `e8c6faa5-…` and `85077493-…`, MiroirTest `d13c9b9e-36fa-4ef0-975b-53751862300a`).
Suite key: `report.bundleSizeHistory`. Environment application key: `meta`. Testbed init parameters key (if the Report test needs one, as `githubTestbedInitParams`): `metaTestbedInitParams`.

## Test execution conventions

| Purpose | Command |
|---|---|
| Recording scripts | `python -m pytest scripts/tests/test_bundle_size_history.py scripts/tests/test_check_bundle_policy.py -q` |
| Meta model + data validation | `npm run build -w miroir-app-meta && npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts` |
| Environment registration | `RUN_TEST=testEnvironmentConfig npm run testByFile -w miroir-standalone-app -- testEnvironmentConfig` |
| Report MiroirTest | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.bundleSizeHistory --mode integ` |
| Environments | `npm run miroir-env -- check --strict --tracked-clean` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |

Vitest is used only for `modelValidation` and `testEnvironmentConfig` (existing framework machinery). The scripts are Python by repo rule, so their tests are pytest, not MiroirTest: they are not reachable through the ML.

---

## Slice 0 — `miroir-app-meta` skeleton, registered in dev and test environments

**Status:** ⬜ pending

**Goal:** the Meta application deploys in `dev` and `test-filesystem` with no Entity yet (SelfApplication, branch, menu, deployment rows). Characterization: the existing `test_check_bundle_policy.py` stays green unchanged; it is the safety net for Slices 3–4.

**RED:** `testEnvironmentConfig.unit.test.ts` expects deployment `40b74910-…` among the test-filesystem keys; `miroir-app-meta` has no `tests/modelValidation.unit.test.ts`.

**GREEN:**
- `packages/miroir-app-meta/` copied from `miroir-example-github` minus the Endpoint, Query, Report and test resources: `package.json` (`"name": "miroir-app-meta"`), `tsup.config.js`, `vite.config.js`, `tsconfig.json`, `.gitignore`, `index.ts`, `index.d.ts`, `src/Meta.ts`, `assets/deployment/{9ff432a9…,40b74910…}.json`, `assets/meta_model/` (SelfApplication `Meta`, ApplicationModelBranch, Menu `MetaMenu`), `assets/meta_data/.gitkeep`, `tests/modelValidation.unit.test.ts`.
- Registration, following #472 Slice 0: `environments/dev.json` (`meta`, `mode: live`), `environments/test-filesystem.json` (`copy`) and the one-line overrides of `test-{indexedDb,mongodb,sql}.json`; browser indexedDb config `miroirConfig.browser-emulatedServer-indexedDb.json`; `testEnvironmentConfig.unit.test.ts`; `build-all.sh` and `Dockerfile` build lists (with the examples, after `miroir-core`); `pr-checks.yml` build list; standalone-app dependency and lockfile entries only if the test helpers import the package (#472 needed it; check before adding); `multistep.274.phase0` `ASSET_TREES` if it enumerates packages.
- `docs/reference/data-architecture-deployments.md`: `miroir-app-meta` in the package table (framework prefix, installed in dev and tests only).

**Refactor checkpoint:** none expected (pure data). Note in Realization any registration place the #472 list missed.

**Validation:**
```bash
npm run build -w miroir-app-meta
npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts
RUN_TEST=testEnvironmentConfig npm run testByFile -w miroir-standalone-app -- testEnvironmentConfig
npm run miroir-env -- check --strict --tracked-clean
python -m pytest scripts/tests/test_check_bundle_policy.py -q
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling
```

### Realization

_(pending)_

## Slice 1 — A bundle report becomes a valid `BundleSizeMeasurement` instance (tracer)

**Status:** ⬜ pending

**Goal:** `python scripts/bundle_size_history.py record <report> [--baseline N] [--reason TEXT]` writes one instance to `meta_data/90d603f9-…/`, and the Meta `modelValidation` accepts it. End to end: report JSON → Python builder → tracked file → Entity `mlSchema` validation.

**RED:** new `scripts/tests/test_bundle_size_history.py`:
- `test_record_writes_one_instance_from_the_report`: on a temporary data directory (`--data-dir`, default the package path), `record` on the fixture `scripts/tests/fixtures/bundle_policy/bundle-report.json` writes one file whose `application`, `eagerGzipBytes`, `totalGzipBytes`, `eagerChunks` come from the fixture `app` and `totals`, with `baseline == eagerGzipBytes`, a v4 `uuid`, `parentUuid` = Entity uuid and `measuredAt` an ISO date.
- `test_record_links_the_previous_measurement`: a second `record` with another `eager.gzipBytes` has `previousBaseline` = the first `baseline` and `baselineChange` = their difference; an instance of the other application is ignored.
- `test_record_baseline_override`: `--baseline N` stores `baseline = N` and the measured `eagerGzipBytes`.

And the Meta `modelValidation` fails until the Entity exists, once one recorded instance is committed as test data (see GREEN).

**GREEN:**
- Entity `BundleSizeMeasurement` `90d603f9-…` in `meta_model/16dbfe28-…/` with the D10 attributes (`date` type for `measuredAt`, `number` for sizes), `viewAttributes` `measuredAt, application, eagerGzipBytes, baselineChange, reason`, `defaultInstanceDetailsReportUuid` `85077493-…` (Report added in Slice 5; validation must not require it before, otherwise add the details Report here).
- `scripts/bundle_size_history.py` per D12: `measurement_from_report`, `newest(app, data_dir)` (largest `measuredAt` for that app), `write`, CLI `record`. Git commit and branch from `git rev-parse` when available, omitted otherwise; `miroirVersion` from the root `package.json`.
- No instance is committed in this slice; tracked data arrives with the backfill in Slice 2. The `modelValidation` proof runs on one instance recorded into `meta_data` from the fixture, deleted once the run is green.

**Refactor checkpoint:** `check_bundle_policy.read_json` and the new script's JSON reading share one helper only if both end up identical.

**Validation:**
```bash
python -m pytest scripts/tests/test_bundle_size_history.py -q
python scripts/bundle_size_history.py record scripts/tests/fixtures/bundle_policy/bundle-report.json
npm run build -w miroir-app-meta && npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts
git clean -n packages/miroir-app-meta/assets/meta_data   # then remove the recorded file
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling
```

### Realization

_(pending)_

## Slice 2 — The backfill writes the baseline history

**Status:** ⬜ pending

**Goal:** `python scripts/bundle_size_history.py backfill` reads the git log of both `bundle-policy.json` files and writes one instance per baseline change (14 web, 7 Electron at a6ba1aad, analysis §4.2), committed with the slice.

**RED:** in `test_bundle_size_history.py`, on a temporary git repository built by the test (three commits of a `packages/miroir-standalone-app/bundle-policy.json`, two of them changing the baseline, one changing only the lists):
- `test_backfill_one_instance_per_baseline_change`: two instances, with the committing commit, committer date, commit subject as `reason`, `eagerGzipBytes == baseline`, the second with `previousBaseline` and `baselineChange`.
- `test_backfill_is_idempotent`: a second run writes nothing.
- `test_backfill_dry_run_writes_nothing`: `--dry-run` prints the rows and writes no file.

**GREEN:** `measurement_from_baseline` and the `backfill` subcommand (`git log --follow --format=%H %cI %s` oldest first, `git show <commit>:<path>`; skip when the same app and commit already has an instance). Run it on the repository and commit the 21 instances in `meta_data/90d603f9-…/`.

**Refactor checkpoint:** `measurement_from_report` and `measurement_from_baseline` share the instance shell (uuid, parent, previous linkage).

**Validation:**
```bash
python -m pytest scripts/tests/test_bundle_size_history.py -q
python scripts/bundle_size_history.py backfill --dry-run
npm run build -w miroir-app-meta && npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts
npm run miroir-env -- check --strict --tracked-clean
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling
```

### Realization

_(pending)_

## Slice 3 — Recording the baseline writes the policy and the instance

**Status:** ⬜ pending

**Goal:** a contributor whose build moved the size runs `python scripts/check_bundle_policy.py <report> <policy> --record-baseline [--baseline N] [--reason TEXT]`: the policy gets the new `eagerGzipBaseline`, `meta_data` gets the instance, and the check passes. `--init` records the same way. A build that would still fail writes nothing (D5).

**RED:** in `scripts/tests/test_check_bundle_policy.py` (data directory passed with `--meta-data-dir` to a temporary copy):
- `test_record_baseline_writes_policy_and_instance`: fixture shrunk by 10% fails `budget`; with `--record-baseline` the exit code is 0, the policy baseline is the measured size, one new instance has the same `baseline`.
- `test_record_baseline_with_headroom`: `--baseline N` writes N in both.
- `test_record_baseline_refuses_other_violations`: a fixture with a new unlisted package exits 1 with the `allowlist` message, and neither the policy nor `meta_data` changes.
- `test_init_records`: `--init` writes one instance.

**GREEN:** `check_bundle_policy.main` gains `--record-baseline`, `--baseline`, `--reason`, `--meta-data-dir` (default `packages/miroir-app-meta/assets/meta_data`); it computes the violations against the policy with the new baseline first, and writes nothing when any remain. The `budget` messages name the command (`run … --record-baseline` instead of "raise / lower eagerGzipBaseline"). Module docstring and `code-splitting.md` "When a change is intended" paragraph updated.

**Refactor checkpoint:** keep `init()` pure; the writing stays in `main`.

**Validation:**
```bash
python -m pytest scripts/tests/test_check_bundle_policy.py scripts/tests/test_bundle_size_history.py -q
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

_(pending)_

## Slice 4 — The guard refuses a baseline missing from the history

**Status:** ⬜ pending

**Goal:** a PR that edits `eagerGzipBaseline` by hand fails the bundle job with rule `history`, naming the command that records it. Together with Slice 3 this makes D3 hold.

**RED:** in `test_check_bundle_policy.py`:
- `test_history_rule_fails_on_a_hand_edit`: policy baseline changed without an instance → exit 1, `[history] … run check_bundle_policy.py … --record-baseline`.
- `test_history_rule_passes_when_recorded`: after `--record-baseline`, exit 0.
- `test_history_rule_on_the_repository`: the real policies and the real `meta_data` pass (guards the backfill of Slice 2 against drift).
- The existing `pr-checks.yml` path-filter test (`_gate` cases, #326 Slice 14) extended: a change to `scripts/bundle_size_history.py` or `packages/miroir-app-meta/assets/meta_data/` triggers the bundle job (the latter is already under `packages/`).

**GREEN:** `check_history(policy, app, meta_data_dir)` in `check_bundle_policy.py`, added to `check()`'s caller in `main` (the report gives `app`). `pr-checks.yml` `inputs` regex gains `scripts/bundle_size_history\.py`.

**Refactor checkpoint:** if `check()` keeps a pure signature, the history rule stays in `main`'s composition, not inside `check()`.

**Validation:**
```bash
python -m pytest scripts/tests -q
python scripts/check_bundle_policy.py scripts/tests/fixtures/bundle_policy/bundle-report.json packages/miroir-standalone-app/bundle-policy.json || true   # shows the history rule wording
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

_(pending)_

## Slice 5 — The Meta home Report shows the history

**Status:** ⬜ pending

**Goal:** opening the Meta application shows `BundleSizeHistory`: for each app, the measurements newest first with eager gzip size, baseline, change and reason, and a line graph of eager gzip size over time. A row opens `BundleSizeMeasurementDetails`.

**RED:** MiroirTest `report.bundleSizeHistory` (`d13c9b9e-…`, in `meta_model/a311f363-…/`, tags `integ`, `ui`, `report`, `issue: "473"`), run target Meta deployment `40b74910-…`, `reportTest` steps on Report `e8c6faa5-…`:
- the web section shows the first backfilled baseline `2709170` and the Electron section shows `4749138` (values that never change once backfilled);
- the web section does not show an Electron row (proves the anchored filter, D13);
- the newest web row is first (ordering on `measuredAt` desc): asserted on a row-order test id if the grid exposes one, else on the first cell text of the section.

**GREEN:** Reports `BundleSizeHistory` and `BundleSizeMeasurementDetails` per D13; SelfApplication `homePageUrl` to `BundleSizeHistory`; `MetaMenu` entries. Testbed init parameters `metaTestbedInitParams` registered in `testbedInitApplicationParametersIndex.ts` if the run target needs them (as `githubTestbedInitParams`). Standalone-app `bundle-policy.json` lists `miroir-app-meta` as lazy if the web build picks it up.

**Refactor checkpoint:** if the two list sections differ only by the filter value, keep them as is (Reports have no section templating); note it.

**Validation:**
```bash
npm run build -w miroir-app-meta && npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts
npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.bundleSizeHistory --mode integ
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,ui
```

### Realization

_(pending)_

## Slice 6 — Nonreg steps, docs, cleanup

**Status:** ⬜ pending

**Goal:** the new tests run in nonreg; the docs say where the history lives and how a measurement is added.

**GREEN:**
- `scripts/nonreg-manifest.json`: `default-meta-modelValidation` (scopes `core`) and `integ-report.bundleSizeHistory` (scopes `ui`), modelled on the `github` steps. The pytest files already run in the pre-push gate and in pr-checks.
- Docs: `docs/internals/code-splitting.md` (history section: where, `--record-baseline`, `history` rule, backfill); `docs/reference/environments.md` (dev installs `meta`); `docs/reference/testing.md` (new suite).
- Cleanup: the MiroirTest `description` drops the issue reference once green; no `issues/473-*` vitest directory is created by this plan, so nothing to delete.
- Tracer narrative: a contributor shrinks the page, the guard fails with `budget`, they run `--record-baseline --reason "…"`, commit the policy and the new instance; the Meta home page shows the new row with its negative change. Automated equivalent: Slice 3 tests + `report.bundleSizeHistory`.

**Validation:**
```bash
python scripts/sync_agent_skills.py --check
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py
npm run lint
npm run miroir-env -- check --strict --tracked-clean
npm run nonreg:filesystem -- --runner shared
```

### Realization

_(pending)_

---

## AC checklist

| Issue AC | Proof |
|---|---|
| The `miroir-app-meta` package exists, builds, and is installed by the environments chosen in the analysis | Slice 0: `modelValidation`, `testEnvironmentConfig.unit`, `miroir-env check` |
| An Entity of `miroir-app-meta` describes a bundle size measurement, with its MLS and at least the application, date, commit and eager gzip bytes | Slice 1: Entity `90d603f9-…`, `modelValidation` |
| `check_bundle_policy.py --init` writes both `eagerGzipBaseline` and a new instance, for the web app and for Electron | Slice 3: `test_init_records`, `test_record_baseline_*` (both apps share the code path; the fixture `app` is switched in one test) |
| A build that fails the guard writes no instance | Slice 3: `test_record_baseline_refuses_other_violations` |
| A documented script turns a `bundle-report.json` into an instance | Slice 1: `test_record_*`; docs in Slice 6 |
| The history from the git log of both `bundle-policy.json` files is backfilled as tracked instances | Slice 2: `test_backfill_*`, 21 committed instances, Slice 4 `test_history_rule_on_the_repository` |
| A `miroir-app-meta` Report shows the measurements per application in date order, with the size change from one measurement to the next | Slice 5: `report.bundleSizeHistory` |
| `docs/internals/code-splitting.md` says where the history lives and how a measurement is added | Slice 6 |
