# Issue #473 — TDD Implementation Plan

> Integration first, no mocks. The recording side is two `miroir-app-meta` npm scripts in TypeScript
> (`bundle-size:record`, `bundle-size:backfill`), tested with vitest through their command-line entry
> points on copies of the real report fixture, temporary data folders and temporary git repositories, with
> the real guard (`scripts/check_bundle_policy.py`) called as a process. The guard's new `history` rule is
> tested with pytest like its other rules. The applicative side is the `miroir-app-meta`
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
| 1 | A bundle report becomes a valid `BundleSizeMeasurement` instance (tracer) | ⬜ pending | `bundleSizeRecord.unit.test.ts`, `modelValidation` |
| 2 | The backfill writes the baseline history | ⬜ pending | `bundleSizeBackfill.unit.test.ts`, 21 tracked instances |
| 3 | Recording the baseline writes the policy and the instance | ⬜ pending | `bundleSizeRecord.unit.test.ts` (policy cases) |
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
| D8 | One record command `npm run bundle-size:record -w miroir-app-meta -- <report> [--baseline N] [--reason TEXT] [--init]` writes the policy baseline and the instance; new guard rule `history` | G2 |
| D9 | Installed in `dev` (`live`) and `test-filesystem` (`copy`) + store overrides of the other `test-*` | G1 |
| D10 | Attributes per analysis §3 D10 (totals only; optional where the backfill cannot fill them) | G1, G3 |
| D11 | `previousBaseline` and `baselineChange` stored at write time | G1 |
| D12 | Revised by A 2026-10-05: TypeScript in `miroir-app-meta` run by `tsx` (`src/bundleSizeHistory.ts`, `scripts/recordBundleSize.ts`, `scripts/backfillBundleSize.ts`); the guard stays Python and owns the `history` rule | G2, G3 |
| D13 | Report `BundleSizeHistory`: per app, anchored `application` filter, `measuredAt` desc, line graph | G1 |

## Allocated UUIDs / keys

Model uuids: analysis §5 (SelfApplication `9ff432a9-…`, Deployment `40b74910-…`, branch `4408382d-…`, Menu `c95bfb70-…`, Entity `90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b`, Reports `e8c6faa5-…` and `85077493-…`, MiroirTest `d13c9b9e-36fa-4ef0-975b-53751862300a`).
Suite key: `report.bundleSizeHistory`. Environment application key: `meta`. Testbed init parameters key (if the Report test needs one, as `githubTestbedInitParams`): `metaTestbedInitParams`.

## Test execution conventions

| Purpose | Command |
|---|---|
| Recording scripts | `npm run testByFile -w miroir-app-meta -- tests/bundleSize` |
| Guard | `python -m pytest scripts/tests/test_check_bundle_policy.py -q` |
| Record / backfill by hand | `npm run bundle-size:record -w miroir-app-meta -- <report> [...]`, `npm run bundle-size:backfill -w miroir-app-meta -- --dry-run` |
| Meta model + data validation | `npm run build -w miroir-app-meta && npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts` |
| Environment registration | `RUN_TEST=testEnvironmentConfig npm run testByFile -w miroir-standalone-app -- testEnvironmentConfig` |
| Report MiroirTest | `npm run testMiroir -w miroir-standalone-app -- --profile emulatedServer-filesystem --suites report.bundleSizeHistory --mode integ` |
| Environments | `npm run miroir-env -- check --strict --tracked-clean` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Scoped nonreg | `npm run nonreg:filesystem -- --runner shared --scope smoke,<scopes>` |

The recording scripts are tested with vitest in `miroir-app-meta`, not MiroirTest: they are build tooling that reads report files and git history, not reachable through the ML. The guard's rule is tested with pytest, next to its other rules.

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

**Goal:** `npm run bundle-size:record -w miroir-app-meta -- <report> --no-policy` writes one instance to `meta_data/90d603f9-…/`, validated against the Entity before writing, and the Meta `modelValidation` accepts it. End to end: report JSON → TypeScript builder → Entity `mlSchema` check → tracked file. (`--no-policy` exists for this slice and the tests; Slice 3 adds the policy write, which becomes the default.)

**RED:** new `packages/miroir-app-meta/tests/bundleSizeRecord.unit.test.ts`, running the script's `main(argv)` with `--data-dir` on a temporary folder:
- "writes one instance from the report": on a copy of `scripts/tests/fixtures/bundle_policy/bundle-report.json`, one file whose `application`, `eagerGzipBytes`, `totalGzipBytes`, `eagerChunks` come from the fixture `app` and `totals`, `baseline == eagerGzipBytes`, a v4 `uuid`, `parentUuid` = Entity uuid, `measuredAt` an ISO date.
- "links the previous measurement": a second record with another `eager.gzipBytes` has `previousBaseline` = the first `baseline` and `baselineChange` = their difference; an instance of the other application is ignored.
- "`--baseline N` keeps the measured size": `baseline = N`, `eagerGzipBytes` measured.
- "refuses an instance the Entity rejects": a report without `totals.eager` writes nothing and exits non-zero with the validation message.

**GREEN:**
- Entity `BundleSizeMeasurement` `90d603f9-…` in `meta_model/16dbfe28-…/` with the D10 attributes (`date` for `measuredAt`, `number` for sizes), `viewAttributes` `measuredAt, application, eagerGzipBytes, baselineChange, reason`. `defaultInstanceDetailsReportUuid` is set in Slice 5 with the details Report.
- `src/bundleSizeHistory.ts`: `measurementFromReport`, `newestMeasurement(app, dataDir)` (largest `measuredAt` for that app), `writeMeasurement` (validation with the same Entity-schema check the package `modelValidation` uses; find the smallest `miroir-core` entry point that validates one instance against an Entity row, e.g. through `model-validation-fs`). Git commit and branch from `git rev-parse` when available; `miroirVersion` from the root `package.json`.
- `scripts/recordBundleSize.ts` exporting `main(argv)`, and `"bundle-size:record": "tsx ./scripts/recordBundleSize.ts"` in `package.json`; `tsx` in devDependencies as in `miroir-example-github`.
- No instance is committed in this slice; tracked data arrives with the backfill in Slice 2.

**Refactor checkpoint:** the report fixture is read from `scripts/tests/fixtures/`, not copied into the package.

**Validation:**
```bash
npm run build -w miroir-app-meta
npm run testByFile -w miroir-app-meta -- tests/bundleSizeRecord.unit.test.ts
npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts
npx tsc --noEmit --skipLibCheck -p packages/miroir-app-meta/tsconfig.json
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling
```

### Realization

_(pending)_

## Slice 2 — The backfill writes the baseline history

**Status:** ⬜ pending

**Goal:** `npm run bundle-size:backfill -w miroir-app-meta` reads the git log of both `bundle-policy.json` files and writes one instance per baseline change (14 web, 7 Electron at a6ba1aad, analysis §4.2), committed with the slice.

**RED:** new `packages/miroir-app-meta/tests/bundleSizeBackfill.unit.test.ts`, on a temporary git repository built by the test (three commits of a `packages/miroir-standalone-app/bundle-policy.json`, two changing the baseline, one changing only the lists):
- "one instance per baseline change": two instances with the commit, committer date, commit subject as `reason`, `eagerGzipBytes == baseline`; the second has `previousBaseline` and `baselineChange`.
- "is idempotent": a second run writes nothing.
- "`--dry-run` writes nothing": prints the rows only.

**GREEN:** `measurementFromBaseline` and `scripts/backfillBundleSize.ts` (`git log --follow --format=%H %cI %s`, oldest first, `git show <commit>:<path>`; skip when the app and commit already have an instance); `"bundle-size:backfill"` npm script. Run it on the repository and commit the 21 instances.

**Refactor checkpoint:** `measurementFromReport` and `measurementFromBaseline` share the instance shell (uuid, parent, previous linkage).

**Validation:**
```bash
npm run testByFile -w miroir-app-meta -- tests/bundleSizeBackfill.unit.test.ts
npm run bundle-size:backfill -w miroir-app-meta -- --dry-run
npm run build -w miroir-app-meta && npm run testByFile -w miroir-app-meta -- tests/modelValidation.unit.test.ts
npm run miroir-env -- check --strict --tracked-clean
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling
```

### Realization

_(pending)_

## Slice 3 — Recording the baseline writes the policy and the instance

**Status:** ⬜ pending

**Goal:** a contributor whose build moved the size runs `npm run bundle-size:record -w miroir-app-meta -- <report> [--baseline N] [--reason TEXT] [--init]`: the policy gets the new `eagerGzipBaseline`, `meta_data` gets the instance, and the guard passes. A build that would still fail writes nothing (D5).

**RED:** in `bundleSizeRecord.unit.test.ts` (policy and data in a temporary folder, `--policy` and `--data-dir` options; the guard run for real with `python3`):
- "writes the policy and the instance": fixture shrunk by 10% (the guard fails `budget` before); after record, the policy baseline is the measured size, one new instance has the same `baseline`, and the guard exits 0.
- "with headroom": `--baseline N` writes N in both.
- "refuses other violations": a report with a new unlisted package → non-zero exit with the guard's `allowlist` message; policy and data unchanged.
- "`--init` rewrites the lists": a report with that new package and `--init` → the package is in the policy lists, one instance written.
- The Electron report path: the fixture with `app: "miroir-standalone-app-electron"` updates the Electron policy (default policy path from `report.app`).

**GREEN:** `recordBundleSize.ts` drops `--no-policy` as default: locate the policy from `report.app` (overridable with `--policy`), copy it with the new baseline to a temporary file, run the guard on it, stop on failure; then write the policy (`--init`: run the guard's `--init` on the real policy first) and the instance. The guard's `budget` messages name `npm run bundle-size:record -w miroir-app-meta -- <report>`; guard docstring and `code-splitting.md` "When a change is intended" paragraph updated.

**Refactor checkpoint:** the guard's Python is unchanged apart from messages; the record command only shells out to it.

**Validation:**
```bash
npm run testByFile -w miroir-app-meta -- tests/bundleSizeRecord.unit.test.ts
python -m pytest scripts/tests/test_check_bundle_policy.py -q
npm run nonreg:filesystem -- --runner shared --scope smoke,tooling
```

### Realization

_(pending)_

## Slice 4 — The guard refuses a baseline missing from the history

**Status:** ⬜ pending

**Goal:** a PR that edits `eagerGzipBaseline` by hand, or runs a bare `--init`, fails the bundle job with rule `history`, naming the record command. Together with Slice 3 this makes D3 hold.

**RED:** in `scripts/tests/test_check_bundle_policy.py` (meta data folder passed with `--meta-data-dir`, default `packages/miroir-app-meta/assets/meta_data`):
- `test_history_rule_fails_on_a_hand_edit`: policy baseline changed with no matching instance → exit 1, `[history] … npm run bundle-size:record -w miroir-app-meta -- <report>`.
- `test_history_rule_passes_when_recorded`: an instance with that baseline in the folder → exit 0.
- `test_history_rule_on_the_repository`: the real policies and the real `meta_data` agree (guards the Slice 2 backfill against drift).
- `_gate` cases: a change under `packages/miroir-app-meta/` triggers the bundle job (already true through `packages/`; the case documents it).

**GREEN:** `check_history(policy, app, meta_data_dir)` in `check_bundle_policy.py`, reading the instance JSON files, composed in `main` after `check()`.

**Refactor checkpoint:** keep `check()` pure; the file reading stays in `main`'s composition.

**Validation:**
```bash
python -m pytest scripts/tests -q
npm run testByFile -w miroir-app-meta -- tests/bundleSize
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
- `scripts/nonreg-manifest.json`: `default-meta-modelValidation` (scopes `core`), `unit-473-bundle-size-scripts` (`npm run testByFile -w miroir-app-meta -- tests/bundleSize`, scopes `tooling`) and `integ-report.bundleSizeHistory` (scopes `ui`), modelled on the `github` steps. The guard's pytest file already runs in the pre-push gate and in pr-checks.
- Docs: `docs/internals/code-splitting.md` (history section: where, the record and backfill npm scripts, `history` rule, backfill); `docs/reference/environments.md` (dev installs `meta`); `docs/reference/testing.md` (new suite).
- Cleanup: the MiroirTest `description` drops the issue reference once green; no `issues/473-*` vitest directory is created by this plan, so nothing to delete.
- `packages/miroir-app-meta/README.md`: the two npm scripts.
- Tracer narrative: a contributor shrinks the page, the guard fails with `budget` and names the record command; they run `npm run bundle-size:record -w miroir-app-meta -- <report> --reason "…"`, commit the policy and the new instance; the Meta home page shows the new row with its negative change. Automated equivalent: Slice 3 tests + `report.bundleSizeHistory`.

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
| `check_bundle_policy.py --init` writes both `eagerGzipBaseline` and a new instance, for the web app and for Electron (revised: the record command writes both, `--init` included; a bare guard `--init` fails `history` until recorded) | Slice 3: `bundleSizeRecord.unit` policy cases, Electron case; Slice 4: `test_history_rule_fails_on_a_hand_edit` |
| A build that fails the guard writes no instance | Slice 3: "refuses other violations" |
| A documented script turns a `bundle-report.json` into an instance | Slice 1: `bundleSizeRecord.unit`; docs in Slice 6 |
| The history from the git log of both `bundle-policy.json` files is backfilled as tracked instances | Slice 2: `bundleSizeBackfill.unit`, 21 committed instances, Slice 4 `test_history_rule_on_the_repository` |
| A `miroir-app-meta` Report shows the measurements per application in date order, with the size change from one measurement to the next | Slice 5: `report.bundleSizeHistory` |
| `docs/internals/code-splitting.md` says where the history lives and how a measurement is added | Slice 6 |
