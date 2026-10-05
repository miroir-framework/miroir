# 473 — Bundle size history in miroir-app-meta

> A new application package, `miroir-app-meta`, holds data about the development process of the
> Miroir platform. Its first Entity records the bundle size of the standalone web app and of the
> Electron main process each time a baseline is recorded, and a Report shows the history.

Related issue: https://github.com/miroir-framework/miroir/issues/473
Sibling: [#474 test run history](https://github.com/miroir-framework/miroir/issues/474), which adds its Entities to the same package once this issue has created it.
Prerequisites: [#326 build hardening](../326-BUILD-build-hardening/analysis.md) ✅ (bundle report, guard) · [#337](../337-BUILD-bundle-size-cuts/analysis.md) ✅ · [#370](../370-BUILD-bundle-size-followup/) ✅ · [#344 package split](https://github.com/miroir-framework/miroir/issues/344) ✅ · [#472 GitHub example](../472-FEATURE-github-example-app/analysis.md) ✅ (latest new application package, the registration checklist to copy)
Key sources: [`check_bundle_policy.py`](../../../scripts/check_bundle_policy.py) · [`test_check_bundle_policy.py`](../../../scripts/tests/test_check_bundle_policy.py) · [`bundleReportPlugin.js`](../../../packages/miroir-standalone-app/vite/bundleReportPlugin.js) · [`bundleReportCore.js`](../../../packages/miroir-standalone-app/vite/bundleReportCore.js) · [`bundle-main.mjs`](../../../packages/miroir-standalone-app-electron/scripts/bundle-main.mjs) · [`code-splitting.md`](../../../docs/internals/code-splitting.md) · [`pr-checks.yml`](../../../.github/workflows/pr-checks.yml) · [`environments.md`](../../../docs/reference/environments.md)

**Document role:** analysis and decision record.
**Status:** D1–D7 are A's decisions (issue discussion, 2026-10-04: Admin first, then `miroir-app-meta` instead of Admin). D8–D13 are mechanism choices made while mapping the code; they follow from D1–D7 and are flagged for A in the delivery reply.

---

## 1. Goals

| Id | Story |
|---|---|
| G1 | **See the size history.** In order to notice when a change grows the page or the Electron start, as a Miroir maintainer, I can open a Report that lists every recorded bundle size per application, newest first, with the change from the previous record. |
| G2 | **Record without extra steps.** In order to keep the history complete, as a contributor whose PR moves the bundle size, I record the new size with the same command that updates the baseline today, and the history entry lands in my PR with the policy change. |
| G3 | **Start with the past.** In order to read the trend since the bundle guard exists (#326, 2026-09-28), as a Miroir maintainer, I find the earlier baselines already in the history. |
| G4 | **A home for development data.** In order to keep data about how Miroir is built apart from the applications Miroir serves, as a Miroir maintainer, I have one application, `miroir-app-meta`, that later issues (#474 test runs first) extend. |

## 2. Non-goals

| Excluded | Owner |
|---|---|
| Test run history | #474 |
| Per-package or per-chunk sizes in the history (only totals) | later, unscheduled; the report artifact keeps them for 14 days |
| Recording every build, CI builds, or failed builds | rejected by A (D4, D5) |
| Bundle sizes of other artefacts (`miroir-server` release binary, Docker image) | later, unscheduled |
| Installing `miroir-app-meta` in docker, desktop or the release server | not needed: the history is about the repository (D9) |

## 3. Decision record

### A's decisions (2026-10-04)

| Id | Decision | Serves |
|---|---|---|
| D1 | New application package `miroir-app-meta` (name chosen by A) for data on the Miroir development process. Not the Admin application (A's first choice, replaced the same day). | G4 |
| D2 | One Entity instance per recorded measurement. | G1 |
| D3 | The existing process changes so that recording the baseline writes both the legacy `eagerGzipBaseline` in `bundle-policy.json` and a new instance. | G2 |
| D4 | Which builds are recorded: the same as today, the builds whose size someone records as the new baseline. | G2 |
| D5 | A build that fails the guard is not recorded. | G2 |
| D6 | The history is tracked in git, in the package's data section. | G1, G3 |
| D7 | A script turns a bundle report into an instance; the same instance builder backfills the history from the git log of the two `bundle-policy.json` files. A Report shows the measurements. | G1, G3 |

### Mechanism choices (to confirm)

**D8 — how a baseline gets recorded.** Today the guard never writes. A size outside ±2% fails the `budget` rule, and the author either runs `--init` (rewrites the whole policy from the report) or edits `eagerGzipBaseline` by hand. Both happen: `42aa8d81` (#472) set 785 650 by hand, with headroom over the measured ~783 kB; `d8162f88` (#370) moved the baseline and the lists together.

| Option | Pros | Cons |
|---|---|---|
| A. `--init` records; hand edits stay possible and unrecorded | smallest change | the common hand edit bypasses the history, so it drifts from the policy (breaks D3) |
| **B. New `--record-baseline [--baseline N] [--reason TEXT]` writes `eagerGzipBaseline` (the measured size, or N) and the instance; `--init` records too; a new guard rule `history` fails when the policy baseline differs from the newest instance's `baseline` for that app** | every baseline change lands in the history; a hand edit fails CI with the command to run; headroom (N) still possible | one more rule to explain |
| C. The guard records on every passing build | complete history | contradicts D4; CI cannot commit |

**Chosen: B.** Serves G2, D3, D4. The `history` rule is what makes D3 hold; without it, option B degrades to A. On a failing build `--record-baseline` refuses unless the new baseline makes the build pass, which keeps D5 (see D12).

**D9 — where `miroir-app-meta` is installed.**

| Option | Pros | Cons |
|---|---|---|
| **A. `dev` (model and data `live`, so the Report reads the tracked files) and `test-filesystem` (copy, for tests), plus the one-line store overrides of the other `test-*` environments** | the history in the app is the git history; tests cover it | not visible in Docker or Electron |
| B. Every environment, like `miroir-app-admin` | visible everywhere | ships repository history in user installs; Docker and desktop seed copies that go stale |

**Chosen: A.** Serves G1, D6. `miroir-env deploy` only handles `miroir-example-*` packages (`EXAMPLE_PREFIX` in [`deployExample.ts`](../../../packages/miroir-env/src/deployExample.ts)), so other environments add `meta` by editing their definition; no change to `deploy`.

**D10 — what one instance holds.** Totals only (G1 needs nothing else; non-goal on packages).

| Attribute | Type | From a report (`record`) | From git (backfill) |
|---|---|---|---|
| `uuid` | uuid (v4) | new | new |
| `application` | string: `miroir-standalone-app` or `miroir-standalone-app-electron` | `report.app` | policy path |
| `measuredAt` | date (ISO string, as Library `birthDate`) | now | committer date |
| `gitCommit` | string, optional | `HEAD` the build was made from | the commit that changed the baseline |
| `gitBranch` | string, optional | current branch | absent |
| `miroirVersion` | string, optional | root `package.json` `version` | absent |
| `eagerGzipBytes` | number | `totals.eager.gzipBytes` | the baseline (only value known) |
| `baseline` | number | the baseline written (= `eagerGzipBytes`, or `--baseline N`) | the baseline |
| `previousBaseline` | number, optional | newest earlier instance's `baseline` for the same app | previous baseline in the log |
| `baselineChange` | number, optional | `baseline − previousBaseline` | same |
| `eagerChunks`, `eagerRawBytes`, `totalChunks`, `totalRawBytes`, `totalGzipBytes` | number, optional | `totals` | absent |
| `reason` | string, optional | `--reason` | commit subject |

`gitCommit` of a recorded instance is the parent of the commit that carries it, because the author records before committing; the backfill names the carrying commit. The Report does not rely on either.

**D11 — the change from the previous record.** G1 asks for it in the list.

| Option | Pros | Cons |
|---|---|---|
| **A. Stored at write time (`previousBaseline`, `baselineChange`)** | plain `objectListReportSection`; the history is append-only per app, so the value never goes stale | redundant data |
| B. Computed by a Report transformer | no redundancy | needs a "previous row" step that the transformer library does not obviously have; more Report work for one column |

**Chosen: A.**

**D12 — script shape.** Repo rule: ad-hoc scripts in Python. New `scripts/bundle_size_history.py`:
- `measurement_from_report(report, ...)`, `measurement_from_baseline(app, baseline, commit, date, subject, previous)`: pure builders;
- `newest(app, data_dir)`, `write(instance, data_dir)`: read and write `packages/miroir-app-meta/assets/meta_data/<entity uuid>/<uuid>.json`;
- CLI `record <report> [--baseline N] [--reason TEXT]` and `backfill [--dry-run]`.

`check_bundle_policy.py` imports it for `--record-baseline`, `--init` and the `history` rule. `--record-baseline` writes nothing when the build would still fail with the new baseline (allowlist, forbidden, defeated or size violations), which keeps D5. The backfill skips a baseline already present for the same commit and app, so re-running it is harmless.

**D13 — the Report.** One Report `BundleSizeHistory`, the application's home page:
- two `objectListReportSection`s, one per application, from `extractorInstancesByEntity` with `filter {attributeName: "application", value: "^miroir-standalone-app$"}` (and `…-electron$`), `sortByAttribute: "measuredAt"`, `sortOrder: "desc"`;
- two `graphReportSection`s, `graphType: "line"`, `labelField: "measuredAt"`, `valueField: "eagerGzipBytes"`.

The filter anchors are needed: string filters are case-insensitive regex matches (`instanceMatchesFilter` in [`ExtractorByEntityReturningObjectListTools.ts`](../../../packages/miroir-core/src/2_domain/ExtractorByEntityReturningObjectListTools.ts)), so `miroir-standalone-app` alone also matches `miroir-standalone-app-electron`. The graph is cheap (the section exists, Library `CountryList` uses one), so it is in scope; dropping it does not affect the ACs.

---

## 4. Current state

### 4.1 Bundle report and guard (aligned, extended by D8)

- Web build: `miroirBundleReport` ([`bundleReportPlugin.js`](../../../packages/miroir-standalone-app/vite/bundleReportPlugin.js)) writes `dist/.vite/bundle-report.json` and `bundle-report.html` (treemap). Electron: [`bundle-main.mjs`](../../../packages/miroir-standalone-app-electron/scripts/bundle-main.mjs) writes `dist/bundle-report.json` with the same `buildBundleReport` (`app: "miroir-standalone-app-electron"`).
- Top-level keys (fixture [`bundle-report.json`](../../../scripts/tests/fixtures/bundle_policy/bundle-report.json)): `app`, `totals {chunks, rawBytes, gzipBytes, eager {chunks, rawBytes, gzipBytes}}`, `packages`, `chunks`, `findings`.
- [`check_bundle_policy.py`](../../../scripts/check_bundle_policy.py): `check()` runs the `allowlist`, `forbidden`, `defeated`, `size` and `budget` rules. `check_budget` (L166–) fails above `baseline × (1 + tolerance)` and below `baseline × (1 − tolerance)`, with "lower eagerGzipBaseline to N". `init()` (L191–203) rebuilds the policy from the report, keeping `$comment`, tolerance, `forbiddenEager`, `eagerPackageMaxBytes`. `main()` (L210–) writes the policy on `--init`, then checks. Nothing else writes the policy.
- CI: job `bundle report + guards` of [`pr-checks.yml`](../../../.github/workflows/pr-checks.yml) builds both apps, runs the guard on each, uploads `bundle-reports` (14 days). It runs when the PR touches `packages/`, the lockfile, `.npmrc`, `tsconfig.json`, `scripts/patch-tsup-baseurl.cjs`, the guard or the workflow; `scripts/bundle_size_history.py` must join that list once the guard imports it.
- Tests: [`test_check_bundle_policy.py`](../../../scripts/tests/test_check_bundle_policy.py) (pytest, run by the pre-push gate and pr-checks) copies the fixture, changes one thing, runs the CLI.

### 4.2 Baseline history in git (input of the backfill)

Enumerated with `git log --follow` on `origin/_integration` (a6ba1aad), one row per change of `eagerGzipBaseline`:

| App | Commits touching the policy | Baseline changes | First | Latest |
|---|---|---|---|---|
| `miroir-standalone-app` | 22 | 14 | 2 709 170 (`e3368568`, 2026-09-28) | 785 650 (`42aa8d81`, 2026-10-04) |
| `miroir-standalone-app-electron` | 10 | 7 | 4 749 138 (`d3167ab1`, 2026-09-28) | 942 479 (`0ed2b798`, 2026-10-03) |

Web: 2709170, 2721507, 1577325, 1402592, 1070644, 902938, 867330, 850787, 816811, 784301, 757610, 746687, 770102, 785650. Electron: 4749138, 4769537, 3184200, 3251249, 1005067, 1095651, 942479. The log includes branch commits merged later (the #337 and #370 slices), which is the wanted granularity. Commit dates are the committer dates.

### 4.3 Application packages (model to copy)

`miroir-example-github` (#472) is the latest new package; its plan's Slice 0 lists every registration place ([`tdd-implementation-plan.md`](../472-FEATURE-github-example-app/tdd-implementation-plan.md), Slice 0, and analysis §4.1). Library is the model for an Entity with data and list Reports:

| Piece | Example |
|---|---|
| Entity row with `mlSchema` (extends `entityDefinitionRoot`), `viewAttributes`, `defaultInstanceDetailsReportUuid` | Library `Country` `d3139a6d-0486-4ec8-bded-2a83a3c3cee4` in `library_model/16dbfe28-…/` |
| Data instance | `library_data/d3139a6d-…/<uuid>.json` (`uuid`, `parentName`, `parentUuid`, attributes) |
| `date` attribute stored as ISO string | Library `Author.birthDate` (`d7a144ff-…`) |
| List Report with `objectListReportSection` + `graphReportSection` | Library `CountryList` `08176cc7-43ae-4fca-91b7-bf869d19e4b9` |
| Model validation of model and data | `tests/modelValidation.unit.test.ts` of `miroir-example-github` (`buildModelValidationGroupsFromFilesystem` with `modelPath`, `dataPath`) |
| Deployment + SelfApplication rows | `miroir-example-github/assets/deployment/` |

Package-name handling for the `miroir-app-` prefix (searched across `*.ts`, `*.js`, `*.mjs`, `*.py`, `*.sh`, `*.json`):
- `DEPLOYMENT_PACKAGE_PREFIXES` ([`applicationMiroirTestFolders.ts`](../../../packages/miroir-core/src/5_tests/applicationMiroirTestFolders.ts)) includes `miroir-app-`, so `deploymentPackageApplicationKey("miroir-app-meta")` is `meta` (asset prefix `meta_`) and MiroirTest discovery finds the package with no change.
- `ci/build/build_server.sh` and `miroir-core/tsup.config.js` only mention `miroir-app-*` in comments.
- `miroir-env deploy` ignores it (D9).
- Build order: `miroir-app-miroir` and `miroir-app-admin` build before `miroir-core`; `miroir-app-meta` has no such dependant and builds with the examples (its tests import `miroir-core`).

### 4.4 Environments (D9)

`environments/dev.json` installs `miroir`, `admin` (data copied), `library`, `designer` (both `live`). `test-filesystem.json` installs `miroir`, `admin`, `library`, `appForTest`, `spotify`, `github`, all `copy`. `live` is refused in `test-*` ([`environments.md`](../../../docs/reference/environments.md) L31, L113).

---

## 5. Key reuse

| Piece | Location |
|---|---|
| Package skeleton and registration list | `packages/miroir-example-github/`, #472 plan Slice 0 |
| Entity / data / list Report / graph | Library `Country`, `CountryList` |
| Report MiroirTest | `github_model/a311f363-…/2b1cb9f1-f230-48f0-bae0-7aee8f9dddee.json` (`report.githubConnect`) |
| Guard CLI tests | `scripts/tests/test_check_bundle_policy.py`, fixture `scripts/tests/fixtures/bundle_policy/bundle-report.json` |
| Extractor filter / order | `extractorInstancesByEntity.filter`, `objectListReportSection.sortByAttribute` / `sortOrder` |

New identifiers:

| Element | uuid |
|---|---|
| SelfApplication `Meta` | `9ff432a9-89a1-460b-a263-1672d084a9e0` |
| Filesystem Deployment | `40b74910-4c63-4bd9-8e7d-2bc051342908` |
| ApplicationModelBranch `master` | `4408382d-daee-41d0-a53d-80a44c0f79e6` |
| Menu `MetaMenu` | `c95bfb70-62bd-4f40-ac2b-04857124f133` |
| Entity `BundleSizeMeasurement` | `90d603f9-58f8-4ac4-b2eb-cb1d718e8b3b` |
| Report `BundleSizeHistory` (home) | `e8c6faa5-a117-4afd-b7ae-4a40c6111f95` |
| Report `BundleSizeMeasurementDetails` | `85077493-0fea-4969-96c8-b994272de284` |
| MiroirTest `report.bundleSizeHistory` | `d13c9b9e-36fa-4ef0-975b-53751862300a` |

Application key in environments: `meta`.

## 6. Risks

- A contributor without the meta data checked out cannot run the guard: not a real case, the data is in the repository. The `history` rule must say which command fixes it.
- Two PRs that both record a baseline for the same app conflict only in `bundle-policy.json` (same line), as today; their instances are separate files, so after the merge the newest instance may not match the merged baseline. The `history` rule then fails on `_integration` and the merge resolution re-runs `--record-baseline`.
- Committer dates of rebased commits are later than the original work. In the history of §4.2 they still increase along the git order for both policy files (checked on all 22 and 10 commits), so "newest" can be the largest `measuredAt`. D11 does not depend on dates at backfill: `previousBaseline` follows the git order there.
- The `budget` messages say "raise eagerGzipBaseline" and "lower eagerGzipBaseline to N"; they must name `--record-baseline` instead, or contributors keep editing by hand and hit the `history` rule.

Implementation plan: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
