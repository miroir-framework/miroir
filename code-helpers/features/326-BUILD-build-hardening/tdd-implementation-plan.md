# Issue #326 — TDD Implementation Plan

> Vertical slices (RED → GREEN each) for a build issue: the behaviours are checks that pass or fail on the real repository, the real `npm audit` output and the real production build. Tests exercise the public command-line interfaces of the checkers (`python scripts/check_dependency_policy.py`, `python scripts/check_bundle_policy.py`) and the real build output (`dist/.vite/bundle-report.json`), never mocked dependency trees or synthetic bundles invented for the test: pytest fixtures are subsets copied from real audit and report output.
> No MiroirTest applies: no behaviour here is expressible as ML model data (no Entity, Query, Transformer, Runner or Endpoint is involved), so pytest covers the Python checkers and vitest covers the build output, as the #286 bundle guard already does.
> The tracer bullet of PR 1 (Slice 1) proves that a PR adding a `^` spec fails; the tracer bullet of PR 2 (Slice 11) proves that the build prints and writes a per-chunk attribution report.
>
> **Execution model:** A's standing preference is one green commit per slice (memory `dev-workflow-preferences`). Each slice ends with its Validation commands; on success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/326
Working branches: PR 1 `claude/build-hardening-81mz9d`, PR 2 `claude/build-hardening-bundles` (D17), both from `_integration`

**Resume note:** PR 1 (Slices 0–9 and 7b) DONE 2026-09-27 on `claude/build-hardening-81mz9d` (PR #334). PR 2 on `claude/build-hardening-bundles`, branched from PR 1's head: Slices 10 to 15 DONE (draft PR #335, stacked on #334); next: Slice 16. Lockfiles are regenerated with npm 11 and `--before` (Slice 4 realization).

---

## Scope

- PR 1, dependencies (D1 to D10, D23, D24): exact pins and `save-exact`, build tools out of runtime `dependencies`, exact internal versions at release, an enforced lockfile, no critical or high advisory, a blocking audit gate with dated exceptions, Dependabot with a cooldown, SHA-pinned actions. Blocks the release.
- PR 2, bundles (D11 to D16, D18 to D22, D25, D26): vendor sourcemaps restored, a per-chunk attribution report printed and written by the standalone build, eager/lazy package allowlist and eager gzip budget guards, the Electron main process bundled with esbuild and traced the same way, a path-filtered CI job, an on-demand coverage tour.

This plan does **not** cut bundle size (D19: separate issue opened in Slice 17 from the first report), touch linting (#325), environment configuration or Jenkins-era `ci/build` (#321), trace `miroir-sandbox` or the `miroir-server` bundle (D16, later), or block on moderate/low advisories (D24).

---

## Progress summary

| Slice | PR | Title | Status | Primary proof |
|---|---|---|---|---|
| 0 | 1 | Baseline: audit, specs, build sizes, nonreg | ✅ | `baseline.json` + nonreg:unit / nonreg:filesystem results |
| 1 | 1 | Tracer: a floating spec fails the check; every spec pinned | ✅ | `test_check_dependency_policy.py` specs rules + real repo exits 0 |
| 2 | 1 | The release writes exact internal versions | ✅ | `ci/release/tests` new test |
| 3 | 1 | Build tools leave runtime `dependencies` | ✅ | `classification` rule + `npm audit --omit=dev` drop |
| 4 | 1 | `npm ci` works everywhere from the lockfile alone | ✅ | `workflows` rule + clean `npm ci` + tsup/vite build on Linux |
| 5 | 1 | No critical advisory | ✅ | `audit --level critical` exits 0 |
| 6 | 1 | No high advisory in build and test tooling | ✅ | `audit` lists no high in tooling packages |
| 7 | 1 | No high advisory at all; audit gate blocking in PR checks | ✅ | `audit` exits 0 on the real repo; `pr-checks.yml` step |
| 7b | 1 | Every locked package is checked against its hash (added) | ✅ | `lockfile` rule + `test_fill_lockfile_integrity.py` + clean `npm ci` |
| 8 | 1 | Updates only through reviewed, cooled-down PRs; actions pinned | ✅ | `actions` rule + `dependabot.yml` test |
| 9 | 1 | PR 1 wrap-up: gate docs, nonreg step, full nonreg | ✅ | nonreg:unit + nonreg:filesystem green |
| 10 | 2 | Vendor sourcemaps restored | ✅ | `bundleSourcemaps.326.phase10.unit.test.ts` |
| 11 | 2 | Tracer: the build prints and writes the attribution report | ✅ | `bundleReport.326.phase11.unit.test.ts` + `bundleReportCore.326.phase11.unit.test.ts` |
| 12 | 2 | Allowlist and eager budget guards | ✅ | `test_check_bundle_policy.py` + real report exits 0 |
| 13 | 2 | Electron main bundled with esbuild, traced and guarded | ✅ | esbuild metafile report + `electron-builder --dir` content check |
| 14 | 2 | Bundle guards run on PRs | ✅ | `bundle` job in `pr-checks.yml` |
| 15 | 2 | Sourcemaps kept out of the Electron package | ✅ | asar / resources listing has no `.map` |
| 16 | 2 | On-demand coverage tour | ⬜ | `coverage-report.json` from a real tour |
| 17 | 2 | Docs, size issue, #286 guard folded, cleanup, AC | ⬜ | AC checklist |

---

## Locked implementation defaults

Copied from the analysis decision record (`D<n>` = grilling `Q<n>`); binding for this plan.

| Decision | Choice |
|---|---|
| D2 Audit scope | dev tooling and shipped code, every workspace package |
| D3 Lerna | 9 → 10, kept |
| D4 xlsx | SheetJS 0.20.3 tarball committed under `dependency-policy/vendor/`, `"xlsx": "file:../../dependency-policy/vendor/xlsx-0.20.3.tgz"` in `miroir-standalone-app` |
| D5 undici | root `overrides` to a fixed version; dated exception if the Cursor path breaks |
| D6 Third-party specs | exact in `dependencies`, `devDependencies`, `optionalDependencies`, root `overrides`; peers keep ranges; root `.npmrc` `save-exact=true` |
| D7 Internal specs | `*` at dev time; release writes the exact product version |
| D8 Gate | `npm audit` blocking at high in `pr-checks.yml`; `dependency-policy/audit-exceptions.json` entries carry `advisory`, `package`, `reason`, `expires` (≤ 90 days) |
| D9 Lockfile | `npm ci` in every workflow and composite action |
| D10 / D23 Updates | Dependabot `npm` + `github-actions`, `target-branch: _integration`, weekly grouped minor/patch, `cooldown` 7 days; actions pinned to SHAs |
| D11 Report | `vite/bundleReportPlugin.js`: console table + `dist/.vite/bundle-report.json` + `dist/.vite/bundle-report.html` (`rollup-plugin-visualizer`, pinned) |
| D12 / D26 Coverage | Playwright tour, on demand, production build + Library deployment, pages listed in D26 |
| D13 / D18 / D19 Guards | `bundle-policy.json` per app: eager and lazy package allowlists, forbidden-eager list, eager gzip baseline; fail above +2%, fail below −2% until the baseline is lowered; baseline = today |
| D14 / D15 Electron | esbuild bundle of main and preload, `electron` + native modules external, all four stores kept |
| D20 CI | second job in `pr-checks.yml`, skipped unless `packages/**` or `package-lock.json` changed |
| D21 Sourcemaps | generated; excluded from the Electron package; uploaded as CI artifact |
| D22 Logger | preamble emitted through Rollup `output.banner` |
| D24 Moderate/low | listed, not blocking |
| D25 Warnings | externalized Node modules and defeated dynamic imports become report findings with import chains |

---

## Allocated keys

| Artefact | Value |
|---|---|
| Dependency checker | `scripts/check_dependency_policy.py`, rules `specs`, `classification`, `workflows`, `actions`, `audit` (all by default; `--rule <name>` to run one) |
| Dependency checker tests | `scripts/tests/test_check_dependency_policy.py`, fixtures `scripts/tests/fixtures/dependency_policy/` |
| Audit exceptions | `dependency-policy/audit-exceptions.json` |
| Bundle checker | `scripts/check_bundle_policy.py <report> <policy>` |
| Bundle checker tests | `scripts/tests/test_check_bundle_policy.py`, fixtures `scripts/tests/fixtures/bundle_policy/` |
| Bundle policies | `packages/miroir-standalone-app/bundle-policy.json`, `packages/miroir-standalone-app-electron/bundle-policy.json` |
| Report plugin / shared core | `packages/miroir-standalone-app/vite/bundleReportPlugin.js`, `packages/miroir-standalone-app/vite/bundleReportCore.js` |
| Electron bundler | `packages/miroir-standalone-app-electron/scripts/bundle-main.mjs` |
| Coverage tour | `packages/miroir-standalone-app/scripts/coverage-tour.ts` |
| Issue-scoped vitest dir | `packages/miroir-standalone-app/tests/0_build/issues/326-build-hardening/` |
| Nonreg step | `unit-check-dependency-policy` (rules `specs`, `classification`, `workflows`, `actions`; no network) |
| CI job | `pr-checks.yml` job `bundle` |

---

## Test execution conventions

| Purpose | Command |
|---|---|
| Dependency checker, all rules | `python scripts/check_dependency_policy.py` |
| Dependency checker, one rule | `python scripts/check_dependency_policy.py --rule specs` |
| Checker tests | `python -m pytest scripts/tests/test_check_dependency_policy.py scripts/tests/test_check_bundle_policy.py -q` |
| Release script tests | `python -m pytest ci/release/tests -q` |
| Full ordered build | `./build-all.sh devBuild` |
| Standalone build | `npm run build -w miroir-standalone-app` |
| Build-output vitest | `RUN_TEST=bundleReport.326.phase11 npm run testByFile -w miroir-standalone-app -- bundleReport.326.phase11` |
| Bundle guard | `python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json` |
| Pre-push gate (AGENTS.md) | `python scripts/sync_agent_skills.py --check && python -m pytest scripts/tests -q && npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json && npm run test -w miroir-core -- ''` |
| Type check per touched package | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Safety net | `npm run nonreg:unit`, `npm run nonreg:filesystem` |

Run `./build-all.sh devBuild` before any baseline or nonreg run in a cloud session (memory `stale-dist-in-cloud-sessions`), and restore the timestamp-only change it makes to `miroirFundamentalType.ts`.

---

# PR 1 — dependencies

## Slice 0 — Baseline

**Status:** ✅ DONE

### Goal

Record the before picture every later slice is measured against, and the nonreg results that must not regress.

### 0.1 Characterization

- `baseline.json` in this folder: `npm audit` counts per severity and the critical/high package list (from `npm audit --json`), spec-style counts (§3.2), standalone build measures (§3.5: chunk count, raw/gzip totals, eager closure raw/gzip, eager chunk list).
- `npm run nonreg:unit` and `npm run nonreg:filesystem` results after `./build-all.sh devBuild`; failures already known in cloud sessions (memory `nonreg-filesystem-env-failures`) listed in the Realization so later slices compare like for like.

### Validation

```bash
./build-all.sh devBuild && git checkout -- packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts
npm audit --json > /tmp/audit-before.json; npm run nonreg:unit; npm run nonreg:filesystem
```

### Realization

2026-09-27, tree `f4fc620` (= `_integration` `a4a17be` + the two docs), after `./build-all.sh devBuild` (206 s). [`baseline.json`](./baseline.json) holds the numbers:
- `npm audit`: 4 critical, 50 high, 25 moderate, 19 low (98), same as the issue.
- Specs: 343 `^`, 120 `*`/range, 37 exact, 2 aliases. The draft `specs` rule counts 338 manifest violations plus the missing `.npmrc`.
- Standalone build: 387 JS chunks, 27.07 MB raw / 6.23 MB gzip; eager closure 7 chunks, 10.40 MB raw / 2.71 MB gzip.
- `npm run nonreg:unit`: 38/38 passed (583 s). `npm run nonreg:filesystem`: 74/74 passed (1310 s). The earlier Postgres-bound failures (memory `nonreg-filesystem-env-failures`) no longer occur.
- Problem met: nonreg rewrites 8 tracked files and adds 2 under `packages/miroir-standalone-app/tests/assets/admin_data/` (the #321 problem). Every later nonreg run is followed by `git checkout -- packages/miroir-standalone-app/tests/assets/admin_data && git clean -fdq packages/miroir-standalone-app/tests/assets/admin_data`.

---

## Slice 1 — Tracer: a floating spec fails the check; every spec is pinned

**Status:** ✅ DONE

### Goal

A contributor whose change adds `"foo": "^1.2.3"` gets a failing check, locally and in PR checks, and `npm install foo` writes an exact version.

**Layers cut:** checker script → root `.npmrc` → every `package.json` (+ lockfile specs) → `pr-checks.yml` step.

### 1.1 RED

**Test:** `scripts/tests/test_check_dependency_policy.py` (pytest; the checker takes a repo root, tests run it on `tmp_path` repos built from real `package.json` excerpts, plus one test on the real repo).

Behavior asserted (rule `specs`):
- `^`, `~`, `*`, `x`, `>`/`>=`/`<`, `||` and space ranges on a third-party dep in `dependencies`, `devDependencies`, `optionalDependencies`, or root `overrides` are violations, reported as `path: section.name spec`.
- Exact versions, `npm:alias@<exact>`, and `file:`/tarball URLs with a pinned version pass.
- `peerDependencies` ranges pass.
- Internal `miroir-*` workspace deps must be `*` (`^0.5.0-rc.1` is a violation).
- A missing root `.npmrc` or one without `save-exact=true` is a violation.
- The real repo passes (fails RED today: 343 `^`, `mermaid: *`, 2 internal `^`, no `.npmrc`).

### 1.2 GREEN

- `scripts/check_dependency_policy.py` with the `specs` rule and the rule-selection CLI.
- Pin every third-party spec to the version currently resolved for that package directory (Node resolution from the package's folder), with a one-off Python helper kept out of the repo; root `overrides` `yaml`, `rxjs` and the `typescript` aliases pinned the same way; `mermaid: *` pinned; the two internal `^0.5.0-rc.1` become `*`.
- Root `.npmrc`: `save-exact=true`.
- `npm install --package-lock-only`; the lockfile diff touches spec fields only, no resolved version changes.
- `pr-checks.yml` job `core`: step `python3 scripts/check_dependency_policy.py --rule specs` after the repo script tests.

### Refactor checkpoint

The checker is one module with one entry point and one rule table; later rules plug into the table, not into new scripts.

### Validation

```bash
python -m pytest scripts/tests/test_check_dependency_policy.py -q
python scripts/check_dependency_policy.py --rule specs
git diff package-lock.json | grep '"version"' | wc -l   # expect 0 changed resolved versions
npm ci && ./build-all.sh devBuild
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json && npm run test -w miroir-core -- ''
npm run nonreg:unit
```

### Realization

- `scripts/check_dependency_policy.py`: rule `specs`, a rule table and `--rule` selection. `scripts/tests/test_check_dependency_policy.py`: 27 cases on `tmp_path` workspaces, plus the real repo.
- RED on the real repo: 339 violations, i.e. 338 specs and the missing `.npmrc` (the plan's 343 counted differently; the 10 `^` peer ranges are not violations).
- 338 specs pinned by a one-off helper (kept out of the repo) to the version the lockfile resolves for each package directory: nested `packages/<pkg>/node_modules/<name>` first, then the hoisted copy. The deployment packages keep their different `vite` 6.4.x versions; unifying them is Slice 6. `mermaid: *`, the root `yaml`/`rxjs` overrides and the `typescript` alias are pinned; the two internal `^0.5.0-rc.1` in `miroir-standalone-app` became `*`.
- `npm install --package-lock-only` changed spec lines only (336 lines, no `version`, `resolved` or `integrity` change). It also dropped the `libc` field of the four `@nx/nx-linux-*` entries (npm 10.9 does not write it); they were restored from the previous lockfile. Slice 4 has to regenerate the lockfile with the same care.
- `pr-checks.yml` job `core`: step "Dependency policy" (`--rule specs`) after the repo script tests.
- Validation: pytest 73 passed; `npm ci` rc 0 and the lockfile still matches every manifest; `./build-all.sh devBuild` rc 0 (189 s); `tsc` miroir-core rc 0; miroir-core tests 2078 passed; nonreg:unit 38/38 passed (579 s).

---

## Slice 2 — The release writes exact internal versions

**Status:** ✅ DONE

### Goal

A released manifest names its internal dependencies with the exact product version (`0.5.0`), never `^0.5.0` (D7).

**Layers cut:** `ci/release/release_lib/lerna_ops.py` → its tests.

### 2.1 RED

**Test:** `ci/release/tests/test_release_version.py`, new case: a manifest with `"miroir-core": "*"` and a `file:` edge is rewritten to `"0.5.0"`; the log line names the exact version.

### 2.2 GREEN

Line 129: `f"^{plan.product_version}"` → `plan.product_version`; docstring and log message updated.

### Refactor checkpoint

The docstring above the rewrite (lines 103–110) explains why `*` needs rewriting; keep it accurate for exact versions.

### Validation

```bash
python -m pytest ci/release/tests -q
```

### Realization

- `rewrite_internal_wildcard_ranges` writes `plan.product_version` instead of `^<product_version>`; docstring and log line say "exact version".
- No new test case was needed: `test_rewrite_internal_wildcard_ranges_makes_ranges_releaseable` already covers a `*` and a `file:` edge; its expectations moved from `^1.3.0` to `1.3.0` (RED before the change, GREEN after). `verify_release_ranges` accepts exact versions unchanged.
- `docs/reference/release-process.md`: every `^<product_version>` mention now says the exact `<product_version>`.
- Validation: `python -m pytest ci/release/tests -q`, 15 passed.

---

## Slice 3 — Build tools leave runtime `dependencies`

**Status:** ✅ DONE

### Goal

`npm audit --omit=dev` and the Electron `node_modules` no longer carry `electron`, `electron-builder`, `happy-dom`, `vite` or `vitest` through runtime packages (analysis §3.2, default 5).

**Layers cut:** checker rule `classification` → `package.json` of `miroir-core`, `miroir-localcache`, `miroir-localcache-redux`, `miroir-server`, `miroir-store-filesystem`, `miroir-standalone-app-electron`.

### 3.1 RED

**Test:** `test_check_dependency_policy.py`, rule `classification`: a build tool in `dependencies` is a violation; in `devDependencies` it passes; the real repo passes. The tool list is the rule's single table.

### 3.2 GREEN

Move each flagged entry to `devDependencies` (exact version kept). `sequelize` in `miroir-store-filesystem` moves too if no `src` file imports it (checked with `rg`), otherwise it stays and the Realization says why.

### Refactor checkpoint

None expected beyond the rule table.

### Validation

```bash
python scripts/check_dependency_policy.py --rule classification
npm install && ./build-all.sh devBuild
npm audit --omit=dev --json | python -c "import json,sys;print(json.load(sys.stdin)['metadata']['vulnerabilities'])"
npm run nonreg:unit
```

### Realization

- Rule `classification` in `check_dependency_policy.py`: exact names `electron`, `electron-builder`, `happy-dom`, `vite`, `vitest`, plus the prefixes `vite-plugin-`, `@vitejs/`, `@vitest/`. **Deviation:** the prefixes were added because `vite-plugin-node` sat in three runtime `dependencies` and npm installs its `vite` peer, so `vite` would have stayed in the production tree. 10 new pytest cases (37 in the file); RED on the real repo with 18 violations.
- Per entry, `rg` over `src`, `tests`, configs and scripts decided remove or move (**deviation** from "move everything": an entry nothing uses is removed):

  | Package | Removed (unused) | Moved to `devDependencies` |
  |---|---|---|
  | `miroir-core` | | `vite` (`vite.config.js`) |
  | `miroir-localcache`, `miroir-localcache-redux` | `electron`, `electron-builder`, `vite-plugin-node` | `happy-dom` (vitest environment) |
  | `miroir-server` | `electron`, `electron-builder`, `happy-dom`, `vite` | |
  | `miroir-store-filesystem` | `electron`, `sequelize` | `vite` (`vite.config.js`) |
  | `miroir-standalone-app` | `vite-plugin-node` | |
  | `miroir-standalone-app-electron` | `happy-dom`, `vite` (shipped in the app until now) | |

- Lockfile regenerated with `npx npm@11 install --package-lock-only` (npm 11 keeps the `libc` fields that npm 10.9 drops). With the root override pinned to `rxjs` 7.8.2 in Slice 1, npm 11 now applies it everywhere and removes 22 stale nested copies (`rxjs` 7.8.1 under `@ag-ui/*`, `@copilotkit/*` and `miroir-ai`, duplicated `@copilotkit/shared`, `chalk`, `zod`), which is what the former `^7.8.1` override intended. `miroir-ai`'s own `rxjs` spec follows: 7.8.1 → 7.8.2. No other version changes.
- `npm audit --omit=dev` (lockfile only): total 73 → 55, high 39 → 23, critical 1 → 0; production packages 1630 → 1335. Gone from the production tree: `electron`, the `electron-builder` family, `happy-dom`, `vite`, `tar`, `postcss`, `extract-zip`, `@xmldom/xmldom`, `js-yaml`, `nanoid`, `tmp`.
- `pr-checks.yml`: the "Dependency policy" step runs `--rule specs --rule classification`.
- Validation: pytest 83 passed; checker rc 0; `npm ci` rc 0 with the lockfile unchanged; `./build-all.sh devBuild` rc 0 (180 s); `tsc` rc 0 for miroir-core, -localcache, -localcache-redux, -server, -store-filesystem, -standalone-app-electron, -standalone-app, -ai; Electron app build rc 0; miroir-core tests 2078 passed; nonreg:unit 37/38. The one failure, `unit-301-agent-tooling` (pytest on `scripts/tests`), came from Slice 4's RED tests written into the working tree while nonreg ran; the same pytest on the Slice 3 commit passes (83 passed at the start of the run).
- Known failures outside PR checks and nonreg, not caused by this slice (inferred: the code under test is unchanged and the packages they use resolve to the same versions): `npm run vitest -w miroir-localcache-redux`, 6 of 46 in `LocalCache.unit.test` "custom idAttribute"; `npm run test -w miroir-ai`, `miroirTools.unit.test` expects 5 tools where `createMiroirCopilotKitActions` returns 3 (two tools are commented out in the source).

---

## Slice 4 — `npm ci` works everywhere from the lockfile alone

**Status:** ✅ DONE

### Goal

Every workflow, composite action and the agent session setup install exactly the lockfile (D9); Linux builds no longer need the `@rollup/rollup-linux-x64-gnu` side install.

**Layers cut:** `package-lock.json` → `.github/workflows/*.yml`, `.github/actions/*/action.yml` → `scripts/agent_session_setup.py` → checker rule `workflows`.

### 4.1 RED

**Test:** `test_check_dependency_policy.py`, rule `workflows`: a `run:` step containing `npm install` (any form) in `.github/workflows/*.yml` or `.github/actions/*/action.yml` is a violation; `npm ci` passes; the real repo passes (RED today: 6 jobs of `build-linux-runnables.yml`, 2 composite actions, `build-sandbox-for-github-pages.yml`, the rollup step of `pr-checks.yml`).

### 4.2 GREEN

- Regenerate the lockfile from an empty `node_modules` so it lists every platform's optional packages (`@rollup/rollup-*`, `@esbuild/*`, …); check `@rollup/rollup-linux-x64-gnu` is present.
- Replace every `npm install` with `npm ci` in workflows and actions; drop the rollup side-install from `pr-checks.yml` and from `agent_session_setup.py` (its test in `scripts/tests/test_agent_session_setup.py` updated).
- If the regenerated lockfile still lacks a platform binary, keep the side-install for that binary only, pinned to the lockfile's version, and record it here.

### Refactor checkpoint

`build-linux-runnables.yml` comments (lines 7–10) explaining `npm install` are removed or rewritten.

### Validation

```bash
rm -rf node_modules packages/*/node_modules && npm ci
./build-all.sh devBuild
python scripts/check_dependency_policy.py --rule workflows
python -m pytest scripts/tests -q
```

### Realization

- Rule `workflows`: `npm install`, `npm i` or `npm add` in a `run:` line of `.github/workflows/*.yml` or `.github/actions/*/action.yml` fails; comments are ignored. RED on 10 lines (the 9 of the plan plus the rollup step of `pr-checks.yml`).
- **Added rule `lockfile`** (not in the plan): every dependency and optional dependency of every lockfile entry resolves to an entry (Node resolution), and every exact spec of a manifest is the version the lockfile installs for that package. RED on 5 entries: `rollup`, the three `esbuild` copies and `dmg-builder` lacked their other-platform packages (the lockfile was written on Windows: only `win32-x64` binaries were listed). The spec check would have caught the `rxjs` drift of Slice 3. Without this rule, the next `npm install` on a machine with a `node_modules` (npm/cli#4828) could silently bring the side-install back.
- Regeneration from an empty `node_modules` (the plan's route) does not work: with a lockfile present, npm keeps its entries and never re-adds missing optional packages, and deleting an entry makes npm drop it rather than re-resolve it. What worked, with npm 11 (`npx npm@11`, which keeps the `libc` fields) and `--before=2026-09-20` so every new version is at least 7 days old (D10):
  - `npm update rollup esbuild --package-lock-only`: re-resolves them with every platform package: `rollup` 4.59.0 → 4.63.4, `esbuild` 0.25.5 → 0.25.12 and 0.27.2/0.27.3 → 0.27.7, `@types/estree` 1.0.8 → 1.0.9.
  - `electron-builder` is pinned exactly, so `npm update` leaves it alone: its and `dmg-builder`'s entries were removed and `npm install --package-lock-only` re-resolved `electron-builder` 26.8.1, adding the macOS-only `dmg-license` and its 12 dependencies; nested `yargs` 17.7.2 → 17.7.3.
  - No other entry changed; 112 entries added. These commands go in the Dependency policy docs (Slice 9).
- `npm ci --no-audit` replaces `npm install` in `build-linux-runnables.yml` (6 jobs, which also deleted the lockfile first, so every Linux build resolved fresh versions), both composite actions and `build-sandbox-for-github-pages.yml`. The `~/.npm` cache key of `build-linux-runnables.yml` hashes `package-lock.json` instead of the manifests; its header comment is rewritten.
- `pr-checks.yml`: the rollup side-install step is gone; the policy step runs `specs`, `classification`, `lockfile`, `workflows`.
- `agent_session_setup.py`: no more side-install. A `node_modules` without the Linux rollup binary (installed from an older lockfile) now triggers `npm ci`; tests updated.
- Validation: pytest 96 passed; rules `specs`, `classification`, `lockfile`, `workflows` rc 0; `rm -rf node_modules packages/*/node_modules && npm ci` rc 0 (64 s) with no side install: `@rollup/rollup-linux-x64-gnu` and the three `@esbuild/linux-x64` copies installed, the win32 ones skipped, lockfile unchanged; `./build-all.sh devBuild` rc 0 (173 s); `miroir-homepage` and `miroir-sandbox` builds rc 0; `tsc` miroir-core rc 0; miroir-core tests 2078 passed; nonreg:unit 38/38 (637 s).

---

## Slice 5 — No critical advisory

**Status:** ✅ DONE

### Goal

`npm audit` reports no critical advisory (D1).

**Layers cut:** checker rule `audit` → root and package manifests → lockfile.

### 5.1 RED

**Test:** `test_check_dependency_policy.py`, rule `audit`, fed the real `npm audit --json` of Slice 0 (fixture `audit-2026-09-27.json`, trimmed to the entries under test):
- a critical or high entry not in the exceptions file fails, naming package, severity and advisory ids;
- an entry covered by a live exception passes; an expired exception fails;
- moderate and low entries are printed, not failing (D24);
- `--level critical` fails only on critical.

Real-repo run: `--level critical` is RED today (`handlebars`, `shell-quote`, `tar`, `vitest`).

### 5.2 GREEN

- `lerna` 10 (removes `tar`, `pacote`, `@lerna/create` advisories); check `npx lerna ls --since` and `npx lerna version --help` still behave as `ci/release` expects.
- `vitest` to the first fixed version in every package (same version everywhere).
- `handlebars`, `shell-quote`: bump their parents; exact root `overrides` only when no parent release carries the fix.

### Refactor checkpoint

Each root `override` gets an entry in `dependency-policy/README.md` (package, reason, advisory, when to remove), since JSON cannot hold comments.

### Validation

```bash
python scripts/check_dependency_policy.py --rule audit --level critical
python -m pytest ci/release/tests -q
./build-all.sh devBuild && npm run nonreg:unit
```

### Realization

- Rule `audit` (`--level high|critical`, `--audit-json FILE`): one entry per (package, GHSA id) that npm reports as a root cause; exceptions from `dependency-policy/audit-exceptions.json` (`package`, `advisory`, `reason`, `expires`); an expired exception fails, an unused one is printed; lower severities print as "not blocking"; an `npm audit` error exits 2. Fixture `scripts/tests/fixtures/audit-2026-09-27.json`: the Slice 0 audit trimmed to `vitest`, `@vitest/mocker`, `shell-quote`, `undici`. 9 new pytest cases. The rule is not in the default static set of PR checks yet (Slice 7).
- RED on the real repo at `--level critical`: `handlebars`, `shell-quote`, `tar`, `vitest`.
- Fixes (npm 11, `--before=2026-09-20`, so nothing younger than 7 days):
  - `lerna` 9.0.5 → 10.0.1: `tar` 7.5.8 → 7.5.22, `nx` 22.5.3 → 23.2.1, the conventional-changelog chain, `pacote` 21.4.0 → 21.5.1 under `@npmcli/arborist`; 169 entries removed, 40 added, 88 changed in the lockfile.
  - `vitest` 3.2.4 → 3.2.7 in all 17 manifests that declare it (**deviation:** the latest 3.2.x instead of the first fixed 3.2.6; still v3, so no `--poolOptions` change). The moderate GHSA-82fw-gwwq-j7x9 needs 4.1.11 and stays non-blocking (D24).
  - `handlebars` 4.7.8 → 4.7.9 (`npm update handlebars`, in range of `conventional-changelog-writer`).
  - `shell-quote`: **removed** with its only parent, `concurrently` 7.6.0, a `miroir-server` devDependency no script uses. `concurrently` 9.2.4 would pull `shell-quote` 1.9.0 if it is ever needed again.
- `lerna` 10 with `ci/release`: `npx lerna ls --json` lists the 5 public packages, `lerna ls --since origin/_integration` answers, `lerna version --help` rc 0, `ci/release/tests` 15 passed. `nx` 23 pins `yaml` 2.9.0; the root override keeps 2.8.4.
- `dependency-policy/README.md` started: the reasons for the two root overrides (`rxjs`, `yaml`) and when to remove them.
- Audit after the slice: critical 4 → 0; high 50 → 44 (all) and 23 → 22 (production).
- Validation: pytest 104 passed; static rules rc 0; `--rule audit --level critical` rc 0; `npm ci` rc 0, lockfile unchanged; `./build-all.sh devBuild` rc 0 (194 s); `tsc` miroir-core and miroir-server rc 0; miroir-core tests 2078 passed; nonreg:unit 38/38 (612 s).

---

## Slice 6 — No high advisory in build and test tooling

**Status:** ✅ DONE

### Goal

The high advisories of the build and test chain are gone: `electron` 40.10.6, `electron-builder` 26.15.3 (and `app-builder-lib`, `dmg-builder`, `builder-util*`), `vite` 7.3.6 (the `vite` 6 copies in `miroir-homepage`, `miroir-sandbox` and the deployment packages moved to the same fixed version), `happy-dom` 20.14.5, `nx` (through lerna 10), `postcss`, `picomatch`, `brace-expansion`, `browserslist`, `@babel/plugin-transform-modules-systemjs`, `tmp`, `serialize-javascript`.

**Layers cut:** manifests → lockfile → builds of every artefact that uses these tools.

### 6.1 RED

Real-repo `check_dependency_policy.py --rule audit` lists each of these packages as high (Slice 0 baseline).

### 6.2 GREEN

Exact bumps; overrides only when no parent release carries the fix.

### Refactor checkpoint

One `vite` version across the workspace if the fixed 7.x builds `miroir-homepage` and `miroir-sandbox`; otherwise one fixed 6.x for those and the Realization says why.

### Validation

```bash
./build-all.sh devBuild
npm run build -w miroir-homepage && npm run build -w miroir-sandbox
(cd packages/miroir-standalone-app-electron && npm run build && npx electron-builder --dir --linux)
npm run nonreg:unit && npm run nonreg:filesystem
```

### Realization

- RED: `--rule audit` listed 32 packages with a high advisory after Slice 5; after this slice, 18 remain (high 44 → 18 over the whole tree), all in the production tree: 13 root causes plus the `chevrotain` / `langium` chain that only carries `lodash-es`. They are Slice 7.
- Exact bumps (npm 11, `--before=2026-09-20`):

  | Package | From | To | Manifests |
  |---|---|---|---|
  | `electron` | 40.6.1 | **44.4.3** | `miroir-standalone-app-electron`, `miroir-standalone-app` |
  | `electron-builder` | 26.8.1 | 26.15.3 | same two |
  | `vite` | 7.3.1, and 6.4.1 / 6.4.2 / 6.4.3 | 7.3.6 | 15 manifests, the `vite` 6 ones included (`miroir-homepage`, `miroir-sandbox`, the 7 deployment packages, which use it only through vitest) |
  | `happy-dom` | 20.7.0 | 20.14.5 | `miroir-localcache`, `-localcache-redux`, `miroir-standalone-app` |
  | `postcss` | 8.5.6 | 8.5.28 | `miroir-homepage` |
  | `vite-plugin-node-polyfills` | 0.23.0 | 0.25.0 | `miroir-sandbox` (0.23 does not accept `vite` 7; the lockfile rule caught the stale nested `vite` 6.4.2) |

- **Deviation, Electron major:** a high advisory published after the plan (GHSA-9f4c-93c8-jc8g, sandboxed iframe popup bypass) is fixed only from 41.10.3; Electron 40 is out of support (supported lines: 42, 43, 44). Moved to 44.4.3, the latest line, on a decision card to A (alternatives: 42, or 40 with an exception). The app uses only APIs that exist unchanged in 44 (`protocol.handle`, `net.fetch`, `setWindowOpenHandler`, `contextBridge`, `ipcMain.handle`).
- In-range transitive updates (`npm update`): `@babel/plugin-transform-modules-systemjs` 7.27.1 → 7.29.8 (and the `@babel/*` 7.29 helpers), `brace-expansion` (1.1.21, 2.1.7, 5.0.12), `browserslist` 4.28.2 → 4.29.0, `flatted` 3.3.3 → 3.4.4, `picomatch` 2.3.2 / 4.0.7, `js-yaml` 3.15.2 under `@istanbuljs/load-nyc-config`, `terser-webpack-plugin` 5.3.16 → 5.6.1 (drops the vulnerable `serialize-javascript` 6).
- Scoped root overrides where a parent pins the vulnerable version exactly, each documented in `dependency-policy/README.md`: `lerna > js-yaml` 4.3.2, `lerna > pacote` 21.5.1, `nx > smol-toml` 1.7.1. `nx` itself needed no change (its advisories came from these).
- Electron packaging: `electron-builder --dir --linux` packages Electron 44.4.3 when told to skip the native rebuild (`-c.npmRebuild=false`); with the rebuild it stops at `@electron/rebuild` of the native `classic-level`, because the cloud proxy denies `www.electronjs.org` (Electron headers for node-gyp). That is an environment limit, the same for any Electron version. The rebuild against Electron 44 headers is to check on a machine that reaches that host.
- The 6 known `LocalCache.unit.test` failures of `miroir-localcache-redux` (Slice 3) are unchanged with `happy-dom` 20.14.5 (40 passed, 6 failed).
- Validation: pytest 104 passed; static rules and `--rule audit --level critical` pass; `npm ci` leaves the lockfile unchanged; `./build-all.sh` and the homepage, sandbox and Electron app builds pass; `tsc` on `miroir-core` and `miroir-standalone-app` clean; `miroir-core` 2078 tests pass; `nonreg:unit` 38/38 and `nonreg:filesystem` 74/74 pass.

---

## Slice 7 — No high advisory at all; the audit gate blocks PRs

**Status:** ✅ DONE

### Goal

`python scripts/check_dependency_policy.py` exits 0 on the real repo, and PR checks fail on any new critical or high advisory (D8).

**Layers cut:** manifests and overrides → D4 change → exceptions file → `pr-checks.yml`.

### 7.1 RED

Real-repo `--rule audit` is RED on the remaining highs: `http-proxy-middleware`, `sequelize`, `lodash`/`lodash-es`, `axios`, `ws`, `hono`/`@hono/node-server`, `express-rate-limit`/`ip-address`, `path-to-regexp`, `form-data`, `fast-uri`, `flatted`, `nanoid`, `underscore`, `@xmldom/xmldom`, `extract-zip`, `sigstore`, `chevrotain`/`langium`, `js-yaml`, `undici`, `xlsx`.

### 7.2 GREEN

- Exact bumps, overrides where needed (each documented, see Slice 5 refactor).
- `undici`: exact root override to the first fixed version; verify the Cursor path (`npm run test -w miroir-ai`, and `assertCursorSdkPackaged` in the Electron build). If it breaks, revert the override and add a dated exception (D5).
- `xlsx`: commit `xlsx-0.20.3.tgz` (from `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, supplied by A or fetched once the host is allowed) under `dependency-policy/vendor/`, record its SHA-512 in `dependency-policy/README.md`, and point the `miroir-standalone-app` spec at it; `npx tsc` on the standalone app proves `Importer.tsx` and `ImportEntityFromSpreadsheetRunner.tsx` still compile.
- `pr-checks.yml`: step `python3 scripts/check_dependency_policy.py` (all rules, audit included) after `npm ci`.

### Refactor checkpoint

Exceptions file holds only what cannot be fixed, each with an expiry.

### Validation

```bash
python scripts/check_dependency_policy.py
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json
./build-all.sh devBuild && npm run test -w miroir-ai
npm run nonreg:unit && npm run nonreg:filesystem
```

### Realization

- RED: after Slice 6, `--rule audit` listed 18 packages with a high advisory, all in the production tree. Most of the plan's 7.1 list (`axios`, `ws`, `form-data`, `flatted`, `nanoid`, `@xmldom/xmldom`, `extract-zip`, `sigstore`, `js-yaml`) had already gone with Slices 3 to 6.
- Exact bumps: `http-proxy-middleware` 3.0.5 → 3.0.7 (5 manifests), `sequelize` 6.37.7 → 6.37.8 (`miroir-core`, `miroir-store-postgres`, `miroir-standalone-app`), `lodash` 4.17.23 → 4.18.1 (3 localcache packages).
- `xlsx`: `dependency-policy/vendor/xlsx-0.20.3.tgz` (supplied by A; no install script, Apache-2.0, no dependencies since 0.19, which drops `adler-32`, `cfb`, `codepage`, `frac`, `ssf`, `wmf`, `word`), spec `file:../../dependency-policy/vendor/xlsx-0.20.3.tgz`. Its SHA-512 is in `dependency-policy/README.md` and the lockfile. `tsc` on `miroir-standalone-app` is clean, and a write / `read(…, {type: 'binary'})` / `sheet_to_json(…, {header: "A"})` round trip, the calls `Importer.tsx` and `ImportEntityFromSpreadsheetRunner.tsx` make, gives the expected rows.
- Overrides, documented in `dependency-policy/README.md`: `lodash-es` 4.18.1 (`chevrotain` 11.1, under `mermaid` > `langium`, pins 4.17.23; that clears the 5 `chevrotain` / `langium` entries too) and `@connectrpc/connect-node` > `undici` 6.28.1 (it asks for `^5.28.4`). npm applied the nested override only once the stale `packages/miroir-ai/node_modules/undici` entry was removed from the lockfile before relocking.
- `undici` / Cursor path (D5): `@connectrpc/connect-node` imports `undici` only for a `Headers` polyfill it installs on Node < 18. `@connectrpc/connect-node` and `@cursor/sdk` load with `undici` 6.28.1, and the 6 Cursor SDK test files of `miroir-ai` (#275) pass. No exception was needed, so there is no `audit-exceptions.json`.
- In-range updates (`npm update`): `hono` 4.12.3 → 4.13.8, `@hono/node-server` 1.19.9 → 1.19.17, `express-rate-limit` 8.2.1 → 8.7.0 (its nested `ip-address` 10.0.1 goes), `ip-address` 9.0.5 → 10.7.2 with `socks` 2.8.5 → 2.8.10 (`jsbn` goes), `fast-uri` 3.0.6 → 3.1.8, `path-to-regexp` 0.1.12 → 0.1.13 and 8.3.0 → 8.4.2, `underscore` 1.13.7 → 1.13.8.
- `pr-checks.yml`: step "No high or critical advisory (npm audit)" runs `--rule audit` right after `npm ci` (now `--no-audit`, since the step audits). Deviation: the static rules keep their own step before `npm ci`, so they fail fast; the plan had one step with every rule.
- Known failures, unchanged by this slice: `miroir-ai` `tests/unit/miroirTools.unit.test.ts` (14 of 19 tests: the tool registry exports 3 tools, the test expects 5; the same first failure as in Slice 3, before any change here), the 6 `LocalCache.unit.test` failures of `miroir-localcache-redux` (Slice 3), and `tsc` on `miroir-localcache-zustand` (`Model.ts`: a `MetaModel` literal lacks 13 properties, which no dependency change affects; inferred, not bisected).
- Electron: `electron-builder --dir --linux -c.npmRebuild=false` packages the app.
- Validation: pytest 104 passed; every rule, `audit` included, passes; `./build-all.sh devBuild` and the Electron app build pass; `tsc` clean on `miroir-core`, `miroir-standalone-app`, `miroir-localcache`, `-localcache-redux`, `miroir-server`, `miroir-store-postgres`, `miroir-standalone-app-electron`, `miroir-ai`; `miroir-core` 2078 tests pass; `nonreg:unit` 38/38 and `nonreg:filesystem` 74/74 pass.

---

## Slice 7b — Every locked package is checked against its hash (added during Slice 7)

**Status:** ✅ DONE

### Goal

`npm ci` installs the exact tarballs that were locked: every registry package of `package-lock.json` carries its `integrity` hash, and the `lockfile` rule fails when one does not. Found while relocking in Slice 7: 2051 of 2695 locked packages had neither `resolved` nor `integrity` (2738 of 2786 at Slice 0; the entries relocked in Slices 4 to 7 had regained theirs). Without the hash, `npm ci` checks a tarball only against what the registry says at install time, and asks the registry for every such package.

**Layers cut:** `check_dependency_policy.py` (`lockfile` rule) → new `scripts/fill_lockfile_integrity.py` → `package-lock.json`.

### RED

- `test_a_registry_package_without_integrity_is_a_violation`: an entry without `integrity` gives one `lockfile` violation that counts and names the entries and points to the fill script.
- `test_workspaces_links_and_git_packages_need_no_integrity`: workspace entries, `link` entries and git references pass.
- The real repository: `[lockfile] package-lock.json: 2051 package(s) have no integrity hash, …`.

### GREEN

- `needs_integrity(key, entry)` in `check_dependency_policy.py`; the `lockfile` rule reports all such entries as one violation.
- `scripts/fill_lockfile_integrity.py`: for each such entry, `npm view <name>@<version> dist.tarball dist.integrity` (the entry's `name` for an alias; the user's npm configuration, so it works behind a proxy or a mirror), then writes `resolved` and `integrity` right after `version`, as npm does. Versions are never changed; if the registry does not answer for one package, nothing is written. `--dry-run` reports only. Tests: `scripts/tests/test_fill_lockfile_integrity.py` (7), with a stand-in for `npm view` (the network boundary).
- Ran it: 2051 entries filled in 330 s, nothing else changed in the lockfile.

### Refactor checkpoint

The fill script reuses `needs_integrity` from the checker, so both agree on which entries need a hash.

### Validation

```bash
python -m pytest scripts/tests -q
python scripts/check_dependency_policy.py --rule lockfile
rm -rf node_modules && npm ci    # verifies every tarball against the lockfile hash
npx npm@11 install --package-lock-only --before=2026-09-20T00:00:00Z    # npm keeps the filled fields
```

### Realization

- Tried first: npm's own "old lockfile" inflate (setting `lockfileVersion` to 1 and relocking). It filled most hashes but not those of aliases and packages nested under workspaces, and it dropped `node_modules/@typescript/old`, which `@typescript/typescript6` needs. Rejected for the script.
- npm 11 relocks the filled lockfile byte for byte; npm 10.9 keeps every hash (it drops only the `libc` fields, as known since Slice 4).
- Only the entries' `resolved` and `integrity` were added: no version, key or other field changed.
- Validation: pytest 120 passed; every rule passes, `audit` included; after removing every `node_modules`, `npm ci` verifies each tarball against its hash in 39 s (about 60 s before, when npm fetched each package's registry metadata) and leaves the lockfile unchanged. On the branch with `_integration` merged in: `npm run lint`, `./build-all.sh devBuild`, `tsc` on `miroir-core` and `miroir-standalone-app`, 2078 `miroir-core` tests, `nonreg:unit` 38/38 and `nonreg:filesystem` 74/74 pass.

---

## Slice 8 — Updates arrive only through reviewed, cooled-down PRs; actions pinned

**Status:** ✅ DONE

### Goal

New dependency and action versions reach `_integration` only as Dependabot PRs, at least 7 days after their release, and every action reference is a commit SHA (D10, D23).

**Layers cut:** checker rule `actions` → `.github/dependabot.yml` → every workflow and composite action.

### 8.1 RED

**Test:** `test_check_dependency_policy.py`:
- rule `actions`: `uses: owner/repo@v4` is a violation; `uses: owner/repo@<40-hex> # v4` passes; local `./.github/actions/*` passes; the real repo passes (RED today, 55 tag references).
- `.github/dependabot.yml` exists with `npm` and `github-actions` ecosystems, `target-branch: _integration`, weekly schedule, a minor/patch group, and `cooldown.default-days: 7` (parsed as YAML).

### 8.2 GREEN

- Resolve each tag to its commit SHA through the GitHub API, rewrite `uses:` with the tag in a trailing comment.
- Write `.github/dependabot.yml`.
- Known constraint to record in the Realization and the docs: Dependabot raises **security** update PRs against the default branch (`main`), whatever `target-branch` says; version-update PRs follow `target-branch`.

### Validation

```bash
python scripts/check_dependency_policy.py --rule actions
python -m pytest scripts/tests/test_check_dependency_policy.py -q
```

### Realization

- Rule `actions`: a `uses:` line of `.github/workflows/*.yml` or `.github/actions/*/action.yml` that is not a local action and does not end in a 40-hex commit SHA is a violation; comment lines are ignored. RED on 60 references (10 tags), not the 55 of the plan.
- SHAs: this session may read only the miroir repository, so it could not resolve tags through the GitHub API (the plan's route). 7 tags came from the "Download action repository" lines of this repository's own job logs (PR checks of 2026-09-27, GitHub Pages build of 2026-07-27); A supplied the 3 whose logs had expired: `actions/cache` v4.3.0, `actions/download-artifact` v4.3.0, `actions/setup-python` v5.6.0. Each `uses:` keeps its tag in a trailing comment, which Dependabot updates with the SHA.
- Deviation: `release-tree.yml` (never run) moves from `actions/checkout@v4` and `actions/setup-node@v4` to v6, like every other workflow, so the repository uses one version of each.
- `.github/dependabot.yml`: `npm` (root, workspaces included) and `github-actions` (`/` and `/.github/actions/*`), `target-branch: _integration`, weekly, `cooldown.default-days: 7`, one group per ecosystem (npm: minor and patch). Security updates still target `main`, the default branch, and skip the cooldown: recorded in the docs (Slice 9).
- Tests: 3 for the rule, 3 on the real `dependabot.yml` (parsed with PyYAML, which the PR checks now install next to pytest), and the real-repository test covers `actions`. PR checks run `--rule actions` with the other static rules.
- Validation: `--rule actions` passes; pytest 115 passed; every workflow and `dependabot.yml` parses as YAML.

---

## Slice 9 — PR 1 wrap-up

**Status:** ✅ DONE

### Goal

The dependency policy is documented where contributors and agents look, runs in nonreg, and the whole safety net is green.

### 9.1 GREEN

- `docs/contributing/development-setup.md`: "Dependency policy" section (exact pins, `save-exact`, `npm ci`, audit gate and exceptions, Dependabot and its security-PR constraint, how to add a dependency).
- `AGENTS.md` pre-push gate: add `python scripts/check_dependency_policy.py`; AGENTS.md is 12 284 of its 12 288-byte budget, so trim an equal amount elsewhere (test `scripts/tests/test_agent_instructions.py`).
- `scripts/nonreg-manifest.json`: step `unit-check-dependency-policy` (rules `specs`, `classification`, `workflows`, `actions`; the network-bound `audit` rule stays in PR checks).
- Open PR 1 against `_integration`.

### Validation

```bash
python scripts/sync_agent_skills.py --check && python -m pytest scripts/tests -q
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json && npm run test -w miroir-core -- ''
npm run nonreg:unit && npm run nonreg:filesystem
```

### Realization

- `docs/contributing/development-setup.md`, new section "Dependency policy": the six rules, installing, adding or updating a dependency, regenerating the lockfile (npm 11, `--before`, `npm update` for missing platform binaries, deleting entries of an exact-pinned parent or a stale nested override, `fill_lockfile_integrity.py`), overrides and vendored packages, audit exceptions (format and lifecycle), Dependabot and its security-PR exception. "Install and build" points to it.
- `AGENTS.md`: `python scripts/check_dependency_policy.py` in the pre-push gate; the graphify line lost "with a scoped subgraph" and "(about 40 seconds)" to stay within 12 KiB (12 284 bytes); the `nonreg:unit` row now says 39 steps, about 10 min.
- `scripts/nonreg-manifest.json`: step `unit-check-dependency-policy` runs rules `specs`, `classification`, `lockfile`, `workflows`, `actions` (the network-bound `audit` stays in PR checks).
- `_integration` was merged in before this slice (ESLint, #325); its new devDependencies are pinned to the versions its lockfile used, relocked with npm 11.
- Validation: `sync_agent_skills.py --check` passes; pytest 121 passed; every rule passes, `audit` included; the new nonreg step passes. The full safety net ran on the merged branch before Slices 8 and 9, which change only workflows, repo scripts, docs and the manifest: clean `npm ci`, `npm run lint`, `./build-all.sh devBuild`, `tsc` on `miroir-core` and `miroir-standalone-app`, 2078 `miroir-core` tests, `nonreg:unit` 38/38 and `nonreg:filesystem` 74/74.

---

# PR 2 — bundles

## Slice 10 — Vendor sourcemaps restored

**Status:** ✅ DONE

### Goal

Every chunk of the standalone build, vendor chunks included, has a sourcemap listing its sources, so any tool (and the #286 guard) can see inside it (D22).

**Layers cut:** `vite/chunkLoadLoggerPlugin.js` → build output → #286 guard.

### 10.1 RED

**Test:** `tests/0_build/issues/326-build-hardening/bundleSourcemaps.326.phase10.unit.test.ts` (vitest reading `dist/`, like the #286 guard; not reachable through MiroirTest because it inspects build output). Asserts: every `.js` file in `dist/.vite/manifest.json` has a `.map` with at least one source; `vendor-copilotkit`'s map lists `node_modules/@copilotkit/react-core` sources. RED today: the five `vendor-*` maps have 0 sources.

### 10.2 GREEN

Emit the preamble through `output.banner(chunk)` for manual chunks instead of `renderChunk`; the console line and `globalThis.__miroirLoggedManualChunks` dedupe stay identical.

### Refactor checkpoint

Re-run the #286 guard; it now also inspects vendor chunks. A new violation it finds is recorded in the Realization.

### Validation

```bash
npm run build -w miroir-standalone-app 2>&1 | grep -c "Sourcemap is likely to be incorrect"   # expect 0
RUN_TEST=bundleSourcemaps.326.phase10 npm run testByFile -w miroir-standalone-app -- bundleSourcemaps.326.phase10
npm run testByFile -w miroir-standalone-app -- componentTestChunk.286.phase4
```

### Realization

- Deviation, branch: PR 2's branch starts from PR 1's head, not from `_integration` (D17), so its builds use the pinned Vite 7.3.6 and the lockfile PR 1 fixed; PR 2's diff shows only its own commits once PR 1 is merged.
- RED: `bundleSourcemaps.326.phase10.unit.test.ts` listed the 5 `vendor-*` chunks, whose maps had 0 sources (maps of 102 to 375 bytes).
- GREEN: `vite/chunkLoadLoggerPlugin.js` adds the preamble with Rollup's `banner(chunk)` hook instead of `renderChunk`, which returned code without a map; Rollup shifts the chunk's map past a banner. The minified preamble, its `[miroir-chunk-load]` line and the `__miroirLoggedManualChunks` dedupe are unchanged, and so are the chunk file names.
- Vendor maps now list their sources: `vendor-copilotkit` 2813, `vendor-mui` 382, `vendor-d3` 212, `vendor-react` 14, `vendor-ag-grid` 3.
- Refactor checkpoint: the #286 guard now also sees inside the vendor chunks and still passes (4/4): no `@testing-library` source there.
- Validation: build passes with no "Sourcemap is likely to be incorrect" warning; `bundleSourcemaps.326.phase10` 2/2; `componentTestChunk.286.phase4` 4/4.

---

## Slice 11 — Tracer: the build prints and writes the attribution report

**Status:** ✅ DONE

### Goal

A developer running `npm run build -w miroir-standalone-app` reads, in the build output, each chunk's raw and gzip size, load kind and top packages, and finds in `dist/.vite/bundle-report.json` every package per chunk with its rendered bytes and the import chain from the first Miroir file, plus findings for leaked Node modules and defeated dynamic imports (D11, D25).

**Layers cut:** `vite/bundleReportCore.js` (module graph → report) → `vite/bundleReportPlugin.js` (Rollup hooks, console table, JSON, HTML treemap) → `vite.config.js` → build output.

### 11.1 RED

**Test:** `tests/0_build/issues/326-build-hardening/bundleReport.326.phase11.unit.test.ts`, on the real build:
- `chunks[]` has `file`, `name`, `loadKind` (`entry` | `eager` | `lazy`), `rawBytes`, `gzipBytes`, `packages[]` (`name`, `renderedBytes`, `chain[]`).
- `vendor-copilotkit` is `eager`, and its `zod` (or `rxjs`) entry has a chain starting in `packages/miroir-standalone-app/src/` (analysis §3.5 finding 2).
- The chunk whose file starts with `mermaid-VLURNSYL` attributes more than 90% of its bytes to `miroir-test-app_deployment-miroir` (finding 3).
- `mongodb` is `lazy` with a chain through `IntegrationTestSession.ts` (finding 5).
- `findings[]` holds an `externalized-node-module` entry for `fs` imported by `miroir-store-indexedDb` and a `defeated-dynamic-import` entry for `ReportDisplay.tsx` (findings 4 and 5).
- The eager closure totals match the manifest's `index.html` import closure.

### 11.2 GREEN

- `bundleReportCore.js`: pure functions from a module graph (`id → importers`, `id → renderedLength`, chunk membership) to the report: package attribution from module ids (npm packages, workspace packages, app source), shortest importer chain to an app source file, load kind from the entry's static import closure.
- `bundleReportPlugin.js`: `onLog` collects the two warning kinds; `generateBundle` reads `chunk.modules` and `this.getModuleInfo`; `writeBundle` computes gzip sizes, prints the table (top 5 packages per chunk, chunks sorted eager first then by size), writes the JSON; `rollup-plugin-visualizer` (pinned devDependency) writes the HTML treemap.
- Helper cycles for the core (attribution of `\0` virtual ids, pnpm-style nested `node_modules`, workspace paths, chain selection) grouped in this slice, tested on real module ids copied from the Slice 11 report.

### Refactor checkpoint

`resolveManualChunk` and the report share the package-from-id function (one implementation in `bundleReportCore.js`).

### Validation

```bash
npm run build -w miroir-standalone-app
RUN_TEST=bundleReport.326.phase11 npm run testByFile -w miroir-standalone-app -- bundleReport.326.phase11
```

### Realization

- RED: `bundleReport.326.phase11.unit.test.ts` (6 cases on the real build) failed: `dist/.vite/bundle-report.json` is missing.
- GREEN:
  - `vite/bundleReportCore.js`, pure functions over a plain module graph: package of a module id (the app, another workspace package, an npm package, or `virtual` for bundler helpers and emptied Node built-ins), import chains, load kind from the entry chunk's static imports, the report and its findings.
  - `vite/bundleReportPlugin.js`: a `resolveId` hook (`enforce: "pre"`) records each Node built-in that Vite empties for the browser, with its importer; `writeBundle` reads each chunk as written (raw and gzip sizes), takes the module graph from `this.getModuleInfo`, writes `dist/.vite/bundle-report.json` and prints the table. `rollup-plugin-visualizer` 7.1.1 (exact devDependency of `miroir-standalone-app`, released 2026-08-14; relocked with npm 11 and `--before`, no new advisory) writes `dist/.vite/bundle-report.html`, a treemap. `VITE_MIROIR_BUNDLE_REPORT=false` turns both off.
  - `vite.config.js` adds the plugin.
- Deviations:
  - Findings come from the module graph rather than from the log. In a production build Vite resolves every Node built-in to the one id `__vite-browser-external`, so the plugin asks the other plugins how each built-in import resolves (`this.resolve`) and records it when it gets that id. This finds 58 (built-in, importer) pairs, the 47 Vite warns about plus 11 `require()` calls in `bn.js` and `readable-stream` copies that Vite empties without a warning.
  - The defeated dynamic import finding uses Vite 7.3.6's own condition: the module is also imported statically, and one of its `import()` callers outside `node_modules` sits in the same chunk. It finds the 2 modules Vite warns about, `ReportDisplay.tsx` and `uiIntegrationTestRunState.ts`. Vite's warnings stay in the output.
  - The table prints the entry and eager chunks, then the 15 largest of the 380 lazy chunks and one line for the others, each with its 5 largest packages; the JSON has every chunk and package.
  - Package sizes are Rollup's rendered length, before minification: they rank packages within a chunk but do not add up to the chunk's file size. Chunk sizes are those of the written files.
  - Chains: in a chunk loaded with the page, a package's chain starts at an app file also loaded with the page and follows static imports only, when such a chain exists, since that is why the package loads eagerly; otherwise it starts at the nearest app file, fewest `import()` hops first. `import(<path>)` marks a dynamic hop, and a CommonJS wrapper and its module make one step.
  - `file` is the path in `dist` (`assets/…`), as in the manifest.
  - Added to the report: `totals`, and `packages[]`, one line per package over the whole build (`eager` when any of its code loads with the page).
  - Added test `bundleReportCore.326.phase11.unit.test.ts`: 12 cases on module ids and edges copied from the real graph (virtual ids, nested `node_modules`, workspace and Windows paths, chain selection, report); it needs no build.
- Refactor checkpoint: `resolveManualChunk` now uses the core's `npmPackagesOfId`. The old rules matched a package anywhere on the path (`id.includes("node_modules/@copilotkit")`), so 378 modules nested in another package's `node_modules` (e.g. `@copilotkit/react-core/node_modules/react-markdown`) go with the outer package; the new rules match any package on the path to keep that. On the 13,819 ids of the real graph no module changes chunk; the rebuilt manifest is byte for byte the one built before the refactor, with the same chunk files as the Slice 10 build.
- What the first report shows (input for the Slice 17 size issue):
  - Loaded with the page: 7 chunks, 10,381.2 kB, gzip 2,709.2 kB; whole build: 387 chunks, 27,061.6 kB, gzip 6,245.2 kB.
  - `vendor-copilotkit` (3,032 kB, eager): `refractor`, `katex` and `parse5` come through `@copilotkit/react-ui`; `lucide` and `@copilotkit/web-inspector` are reached only through an `import()` inside `@copilotkit/react-core`, yet load with the page because the manual chunk holds them.
  - `mermaid-VLURNSYL-*.js` (1,954 kB, eager) is entirely the meta-model deployment `miroir-test-app_deployment-miroir`, statically imported from `src/miroir-fwk/4_view/ModelEnvironmentSync.tsx`.
  - `index-BuTvIIq4.js` (628 kB, eager) is the `crypto` polyfill: `bn.js`, `elliptic`, `readable-stream`, … via `miroir-core` → `crypto-browserify`.
  - The Node store drivers (`mongodb`, `sequelize`) are lazy, through the dynamic imports of `IntegrationTestSession.ts`. `miroir-store-indexedDb` imports `fs` in the entry chunk; `colors` (`json-diff`, via `miroir-core`) imports `os`.
  - The manual chunk rule for `miroir-diagram-class` never matches: Vite resolves that workspace package to `packages/miroir-diagram-class/`, not to a `node_modules/` path.
- Build time unchanged (107 s).
- Validation: build passes; `bundleReport.326.phase11` 6/6, `bundleReportCore.326.phase11` 12/12, `bundleSourcemaps.326.phase10` 2/2, `componentTestChunk.286.phase4` 4/4; `tsc` on `miroir-standalone-app` clean; ESLint clean on the changed files; every dependency policy rule passes, `audit` included; the treemap renders in headless Chromium.

---

## Slice 12 — Allowlist and eager budget guards

**Status:** ✅ DONE

### Goal

A contributor gets a failing check when a third-party package enters the bundle or moves from lazy to eager without being listed, when a forbidden package reaches the eager set, or when the eager gzip size leaves the ±2% band around the committed baseline (D13, D18, D19).

**Layers cut:** `scripts/check_bundle_policy.py` → `packages/miroir-standalone-app/bundle-policy.json` → report of Slice 11.

### 12.1 RED

**Test:** `scripts/tests/test_check_bundle_policy.py`, fixtures trimmed from the real Slice 11 report:
- an unlisted package in any chunk fails, naming it and its chain;
- a package listed `lazy` found in an `eager` chunk fails;
- `@testing-library/*` in an eager chunk fails (`forbiddenEager`, the #286 rule);
- eager gzip above baseline × 1.02 fails with both numbers; below baseline × 0.98 fails asking to lower `eagerGzipBaseline`; inside the band passes;
- `--init` writes a policy that makes the given report pass.

### 12.2 GREEN

Checker, then `python scripts/check_bundle_policy.py <report> <policy> --init` on today's build to create the committed policy (D19: today's numbers).

### Validation

```bash
python -m pytest scripts/tests/test_check_bundle_policy.py -q
npm run build -w miroir-standalone-app
python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
```

### Realization

- `scripts/check_bundle_policy.py <report> <policy> [--init]`, three rules:
  - `allowlist`: every npm and workspace package of the build is listed under `eager` (some of its code loads with the page) or `lazy`. A new package, or a `lazy` one that now loads with the page, fails with its import chain. **Deviations:** workspace packages count too (a `miroir-store-*` package reaching the page matters as much as an npm one), and so does each Node built-in the build empties for the browser, named `node:<module> via <importing package>` (D25), when its importer ships. The lists are a ratchet like the budget: a listed package that left the build, or an `eager` one that became lazy, fails until the policy says so; a name in both lists fails.
  - `forbidden`: no package matching a `forbiddenEager` glob loads with the page, even if listed. The policy holds `@testing-library/*`, the #286 rule.
  - `budget`: eager gzip above `eagerGzipBaseline` × 1.02 fails with both numbers; below × 0.98 fails and gives the new baseline to write.
  - `--init` writes the lists and the baseline from the report and keeps `$comment`, `eagerGzipTolerance` and `forbiddenEager` from the existing policy.
- The report gained `via` on each package and finding: the chain condensed to one step per package (`src/…/Foo.tsx → miroir-core → zod`), which the checker prints; the build's table prints the same string.
- Tests: `scripts/tests/test_check_bundle_policy.py`, 17 cases on `scripts/tests/fixtures/bundle_policy/bundle-report.json`, the real report trimmed to 10 packages, 3 chunks and 6 findings. Written with the checker; against a checker whose rules are removed, 11 of them fail (the 6 others check `--init`, the passing cases and the missing-report message). No pytest case reads the real build, so `scripts/tests` stays independent of a build; the real check is the Validation below and, from Slice 14, the CI job.
- `packages/miroir-standalone-app/bundle-policy.json` from today's build (D19): 392 eager and 156 lazy entries, eager gzip baseline 2,709,170 bytes (the same in the two builds of this slice). The eager list includes `miroir-test-app_deployment-admin`, `-library` and `-miroir`, and 7 Node built-ins (`node:fs via miroir-store-indexedDb`, `node:os via colors`, and 5 from the `crypto` polyfill).
- Validation: `scripts/tests` 138 passed; build passes; the checker passes on the real report (0 violations); `bundleReport.326.phase11` 6/6 and `bundleReportCore.326.phase11` 12/12 after the `via` change; ESLint clean on `vite/`.

---

## Slice 13 — Electron main bundled with esbuild, traced and guarded

**Status:** ✅ DONE

### Goal

The Electron package holds a bundled main process and preload plus the Vite `dist`, and its content is reported and guarded like the standalone app's (D14, D15).

**Layers cut:** `scripts/bundle-main.mjs` (esbuild, metafile) → `bundleReportCore.js` (metafile input) → electron `package.json` (`build`, `files`, `dependencies`) → `bundle-policy.json` → electron-builder output.

### 13.1 RED

**Test:** `tests/0_build/issues/326-build-hardening/electronBundle.326.phase13.unit.test.ts` (vitest on build output): after `npm run build -w miroir-standalone-app-electron`, `dist/bundle-report.json` exists in the Slice 11 format with one `main` chunk; its packages include the four `miroir-store-*` packages and `express`; no package under `react`, `@mui/*` or `@copilotkit/*`. The bundle guard passes on it with the Electron policy.

### 13.2 GREEN

- `scripts/bundle-main.mjs`: esbuild (pinned devDependency) bundles `src/main.ts` and `src/preload.ts` (preload as CommonJS), platform node, `electron` and native/optional driver modules external (list derived from esbuild's errors, recorded here), `metafile: true` → `bundleReportCore.js`.
- `package.json`: `build` script uses it; `dependencies` reduced to the externals that must ship; everything else to `devDependencies`.
- `bundle-policy.json` for Electron via `--init`.

### Refactor checkpoint

`build-main` / `build-preload` `tsc` scripts removed; `start-dev.sh` / `start-dev.bat` updated if they call them.

### Validation

```bash
npm run build -w miroir-standalone-app-electron
RUN_TEST=electronBundle.326.phase13 npm run testByFile -w miroir-standalone-app -- electronBundle.326.phase13
cd packages/miroir-standalone-app-electron && npx electron-builder --dir --linux
npx @electron/asar list release/linux-unpacked/resources/app.asar | grep -c node_modules/react   # expect 0
xvfb-run -a release/linux-unpacked/miroir-standalone-app-electron --no-sandbox   # smoke start, if xvfb is available; else manual check by A
```

### Realization

- `packages/miroir-standalone-app-electron/scripts/bundle-main.mjs` (esbuild 0.25.12, pinned devDependency; about 4 s): `src/main.ts` → `dist/src/main.js` (ESM, with a banner defining `require`, `__filename` and `__dirname` for the bundled CommonJS code) and `src/preload.ts` → `dist/src/preload.js` (CommonJS, as a sandboxed preload needs), platform node, `keepNames`, sourcemaps, metafile. `npm run build` is now `tsc --noEmit -p tsconfig.json && node scripts/bundle-main.mjs`; `build-main` and `build-preload` are gone (`start-dev.sh` / `.bat` call `build-electron`, unchanged).
- Externals (`EXTERNALS` in the script, each in `dependencies` so electron-builder ships it): `electron`; `@cursor/sdk` (native binaries, located at run time by `assertCursorSdkPackaged`; esbuild cannot resolve its internals either); `classic-level` (native, found by `node-gyp-build` next to its own files); `pg` (sequelize loads its dialect with a computed `require`, so esbuild never sees it). `electron-squirrel-startup` stays in `dependencies`: `main.ts` requires it at run time through `createRequire`. Every workspace package, `express`, `@types/*`, `electron` and `electron-builder` are `devDependencies`; `diff` and `http-proxy-middleware` were unused and removed. The optional mongodb drivers (`kerberos`, `snappy`, `@mongodb-js/zstd`, `mongodb-client-encryption`, `@aws-sdk/credential-providers`, `gcp-metadata`) are not installed; esbuild leaves their `require` in a `try` outside the bundle, where it fails and is caught as before.
- `bundleReportCore.js` gained `reportInputFromEsbuildMetafile(metafile, workingDir, outDir)`: chunks (one per `.js` output, `entryPoint` → entry), module graph (`dynamic-import` edges apart), and the specifiers left outside the bundle. The script adds file sizes, calls `buildBundleReport`, writes `dist/bundle-report.json` with `externals` (the configured list plus the non-built-in specifiers esbuild left out) and prints the standalone table through `bundleReportLines`, now exported from `bundleReportPlugin.js`.
- **Deviations:**
  - `main.ts` read `__dirname` / `__filename` computed from `import.meta.url`; the banner declares the same names, so esbuild renamed them. They are now `mainDirname` / `mainFilename`.
  - `react` and `react-dom` are in the main bundle, through `miroir-localcache-redux` → `react-redux`. The RED test therefore checks for no `@mui/*`, `@copilotkit/react-*` or `@testing-library/*`, and leaves React to the size issue (Slice 17). The Electron policy forbids the same three globs.
  - The RED test does not run the guard (vitest does not call Python); the guard runs in the Validation below and, from Slice 14, in CI.
- `packages/miroir-standalone-app-electron/bundle-policy.json` via `--init`: 263 packages, all `eager` (the main process loads its whole bundle), gzip baseline 4,749,138 bytes (main.js 29.4 MB raw); `forbiddenEager` `@testing-library/*`, `@mui/*`, `@copilotkit/react-*`. Largest packages (rendered bytes, before gzip): `miroir-test-app_deployment-miroir` 4.2 MB, `miroir-store-mongodb` 2.9 MB, `miroir-core` 2.1 MB, `iconv-lite` 1.6 MB, `zod` 1.3 MB, `react-dom` 1.2 MB, `sequelize` 1.1 MB, `mongodb` 1.0 MB.
- Package content (`electron-builder --dir --linux -c.npmRebuild=false`; the cloud proxy blocks the Electron headers download that the native rebuild needs): `app.asar` 673 MB → 108 MB, 1,714 entries, no `node_modules/react`. What remains: `main.js` 29 MB, `main.js.map` 52 MB (Slice 15), `bundle-report.json`, and 44 `node_modules` directories, the externals and their dependencies (`@cursor/sdk` and `@cursor/sdk-linux-x64` the largest, `classic-level`, `pg`).
- Smoke start: the packaged app under `xvfb-run` prints `IPC server ready`, listens on 127.0.0.1:3080, and the renderer opens its stores and runs queries. The main process logs 12 `could not find controller for deployment` errors from `refreshLocalCachesForDeployedApplications` (MCP setup, before any store is opened); the pre-slice `tsc` build, started the same way from a worktree, logs the same 12. The only new line is a `punycode` deprecation warning: the bundle evaluates `node-fetch` 2 (`miroir-ai` → `openai` → `node-fetch` → `whatwg-url` 5 → `tr46` 0.0.3, which requires the built-in `punycode`) at start, which the unbundled run did not.
- Tests: `electronBundle.326.phase13.unit.test.ts` 4/4 (two entry chunks, the four stores and `express` bundled, no browser UI library, externals); `bundleReportCore.326.phase11.unit.test.ts` gained 4 metafile cases (16/16); `bundleReport.326.phase11` 6/6 and `bundleSourcemaps.326.phase10` after rebuilding the standalone app, whose guard still passes with 0 violations. `tsc` on the Electron package, ESLint on the changed files, `check_dependency_policy.py` and `scripts/tests` (138 passed) clean.

---

## Slice 14 — Bundle guards run on PRs

**Status:** ✅ DONE

### Goal

A PR touching `packages/**` or `package-lock.json` runs the full build, the standalone and Electron reports and both guards, and exposes the reports and sourcemaps as a build artifact (D20, D21).

**Layers cut:** `pr-checks.yml` job `bundle`.

### 14.1 RED

`test_check_dependency_policy.py` extension: `pr-checks.yml` has a `bundle` job whose steps run `check_bundle_policy.py` for both apps and upload `dist/.vite/bundle-report.*`; its path gate compares the PR diff against `packages/` and `package-lock.json`.

### 14.2 GREEN

Job `bundle`: checkout with history, a first step computing `git diff --name-only ${{ github.event.pull_request.base.sha }}...HEAD` and setting an output that skips the rest when no path matches (no third-party path-filter action), `npm ci`, `./build-all.sh devBuild`, Electron build, both guards, `actions/upload-artifact` (SHA-pinned) with reports, HTML and maps.

### Validation

Push the branch; the `bundle` job runs green on the PR; a throwaway commit adding an unlisted dependency import (reverted) turns it red. Both runs linked in the Realization.

### Realization

- `.github/workflows/pr-checks.yml` gained two jobs:
  - `bundle-paths` ("bundle guards needed?"): checkout with `fetch-depth: 2`, then `git diff --name-only HEAD^1 HEAD` (on a `pull_request` run, HEAD is the merge commit and HEAD^1 the base) matched against `packages/`, `package-lock.json`, `scripts/check_bundle_policy.py` and the workflow itself; a manual `workflow_dispatch` run always passes. **Deviations:** a separate gate job instead of a first step, so a skipped `bundle` job shows as skipped rather than as a green job that did nothing; the checker and the workflow file join the paths D20 named, so a change to the guard itself is checked.
  - `bundle` ("bundle report + guards"): `npm ci`, then the packages the two apps import in five `npm run build` lines, each after the ones it needs (`miroir-mcp` and `miroir-ai` import `miroir-test-app_deployment-library`, `miroir-diagram-class` imports `miroir-react`); then both apps (each prints its report), both guards in one step that runs both before failing, and `actions/upload-artifact` (SHA-pinned v4, `include-hidden-files` for `dist/.vite`, 14 days, also when a guard fails) with the reports, the treemap and every `.map`. **Deviation:** not `./build-all.sh devBuild`, which also builds packages the apps do not import and the server binary; the generated types are committed, so `build` is enough.
- Tests: `scripts/tests/test_check_bundle_policy.py` gained 9 cases. The gate's own script, read from the workflow, runs on a two-commit repository for 6 changed paths and for a manual run; two more read the job graph and the steps (both guards, `npm ci`, the artifact paths). 9 failed before the workflow change.
- Replay of the job's build and guard steps from empty `dist` folders in the cloud session: packages 1 min 4 s, standalone app 1 min 56 s, Electron main 4 s, both guards 0 violations.
- On GitHub (draft PR #335, stacked on #334): [run 36345779727](https://github.com/miroir-framework/miroir/actions/runs/36345779727) green, `bundle` job 3 min 28 s, the same eager gzip sizes as locally (2,709,170 and 4,749,138 bytes, so the baselines hold across machines), artifact `bundle-reports` 23.5 MB, 392 files. A throwaway commit removing `zod` from the standalone policy, reverted next: [run 36346058620](https://github.com/miroir-framework/miroir/actions/runs/36346058620) red with `[allowlist] zod is new in the build and loads with the page (packages/miroir-standalone-app/src/index.tsx → miroir-core → zod)`, the Electron guard still run, the artifact still uploaded.

---

## Slice 15 — Sourcemaps kept out of the Electron package

**Status:** ✅ DONE

### Goal

The packaged Electron app ships no `.map` file, while the build and CI artifact keep them (D21).

### 15.1 RED

`electronBundle.326.phase13` extended: the electron-builder `extraResources` entry for the standalone `dist` excludes `**/*.map`; the `--dir` output has no `.map` under `resources/app`.

### 15.2 GREEN

`"filter": ["**/*", "!**/*.map"]` on that entry; esbuild main bundle built without inline maps.

### Validation

```bash
cd packages/miroir-standalone-app-electron && npx electron-builder --dir --linux && find release/linux-unpacked -name '*.map' | wc -l   # expect 0
```

### Realization

- `packages/miroir-standalone-app-electron/package.json`, `build`: `files` is `["dist/**/*", "!**/*.map", "!dist/bundle-report.json", "package.json"]`; the `extraResources` entry for `../miroir-standalone-app/dist` filters `["**/*", "!**/*.map", "!.vite/**"]` (the Vite manifest, the report and the treemap). The build output keeps them all, and the CI artifact of Slice 14 carries them.
- **Deviation:** `!**/*.map` rather than `!dist/**/*.map`: electron-builder applies `files` to the shipped `node_modules` too, and `@cursor/sdk`, `pg-protocol` and `pg-cloudflare` carried 145 maps (712 kB). The esbuild bundle keeps external `.map` files (no inline maps), so nothing else changed there.
- Test: `electronBundle.326.phase13.unit.test.ts` gained `electronPackage.326.phase15`, 2 cases on the `build` config (RED first, 6/6 after).
- Package (`electron-builder --dir --linux -c.npmRebuild=false`): no `.map` in `release/linux-unpacked` nor in `app.asar`, no `.vite`; `app.asar` 108 MB → 57 MB, `resources/app` (the standalone `dist`) 108 MB → 32 MB; whole unpacked app 395 MB, most of it the Electron runtime. Smoke start under `xvfb-run`: `IPC server ready`, stores opened, queries answered.

---

## Slice 16 — On-demand coverage tour

**Status:** ⬜ pending

### Goal

A maintainer runs one command and gets, per package, bytes shipped versus bytes executed during a scripted tour of the app, pointing at features the app never uses (D12, D26).

**Layers cut:** `scripts/coverage-tour.ts` (Playwright, pinned devDependency) → production build served with the Library deployment → `bundleReportCore.js` attribution → `dist/.vite/coverage-report.json` + console table.

### 16.1 RED

**Test:** `tests/0_build/issues/326-build-hardening/coverageTour.326.phase16.integ.test.ts`: runs the tour against a production build and the server, then asserts the report lists each D26 page as visited, a non-zero executed share for `react-dom`, and `mongodb` with 0 executed bytes.

### 16.2 GREEN

Tour steps: home page, a Library report with a grid, an instance editor, Runners, MiroirTest page, model diagram, Copilot sidebar. `page.coverage.startJSCoverage()`; executed ranges mapped to sources through the chunk sourcemaps; aggregated per package with the Slice 11 attribution.

### Validation

```bash
npm run build -w miroir-standalone-app && npm run build:server -w miroir-server
NODE_ENV=development node packages/miroir-server/release/index.js &
npx tsx packages/miroir-standalone-app/scripts/coverage-tour.ts
RUN_TEST=coverageTour.326.phase16 npm run testByFile -w miroir-standalone-app -- coverageTour.326.phase16
```

### Realization

---

## Slice 17 — Docs, size issue, #286 guard folded, cleanup, AC

**Status:** ⬜ pending

### Goal

The report, guards and tour are documented; the size findings become their own issue; issue-scoped tests are migrated.

### 17.1 GREEN

- `docs/internals/code-splitting.md`: corrected claims (CopilotKit and the meta-model deployment are eager today, `ReportDisplay` lazy loading is defeated), a "Bundle report and guards" section (reading the table, `bundle-report.json`, updating `bundle-policy.json`, the ratchet), the coverage tour.
- New GitHub issue for the size cuts (D19) with the report's chains: eager `vendor-copilotkit` (manual chunk absorbing shared deps), eager meta-model deployment, defeated `ReportDisplay` lazy route, Node store drivers in the browser build, the `crypto` polyfill, shiki grammars, and the coverage tour's zero-execution packages.
- `componentTestChunk.286.phase4` assertions now covered by `forbiddenEager`: the eager part deleted; its component-test chunk assertions stay if the allowlist does not express them.
- `tests/0_build/issues/326-build-hardening/` assertions migrated to `tests/0_build/bundleReport.unit.test.ts` (feature-named), the issue directory deleted.
- Open PR 2 against `_integration`.

### Tracer narrative

Manual: add `import "left-pad"` to `HomePage.tsx`, build, read the new package in the console table with its chain, run the guard and see it fail, revert. Automated equivalent: `test_check_bundle_policy.py` unlisted-package case and the `bundle` CI job.

### AC checklist

| Acceptance criterion (issue #326) | Proof |
|---|---|
| Every critical and high advisory corrected | Slice 7: `check_dependency_policy.py` exits 0; `pr-checks.yml` audit step |
| No `^` specs; no unreviewed versions | Slices 1, 4, 8: `specs`, `workflows`, `actions` rules; Dependabot cooldown |
| Build output identifies the incoming code of each sub-bundle | Slice 11: console table + `bundle-report.json` test |
| Features we do not use can be found | Slices 11 and 16: chains, findings, coverage report |
| Long-term control over size | Slices 12, 14: guards in PR checks, ratchet |
| Standalone and Electron both covered | Slices 11–15 |

### Validation

```bash
python -m pytest scripts/tests -q
npm run nonreg:unit && npm run nonreg:filesystem
```

### Realization
