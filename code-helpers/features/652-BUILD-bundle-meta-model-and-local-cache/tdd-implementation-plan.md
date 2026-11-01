# Issue #652 — TDD Implementation Plan

> Testing posture: a build change, so the proofs are pytest guards over manifests, sources and packed tarballs (`test_package_manifests.py` pack cases under `MIROIR_REQUIRE_PACK=1`), a fixture-tree test for the import scanner, the bundle-report unit test for attribution, and then the repo's safety nets on the new layout: full build, pre-push gate, `nonreg:filesystem` (which runs the server release smoke test and the bundle guards). No mocks; no MiroirTest change (nothing here is reachable through the ML: it is packaging).

**Resume note:** start at the first slice whose Status is not ✅. v2 after the adversarial plan review (13 findings applied: 8 vite alias configs, a second owner for the local cache's Node entry, `./startup` inlined by ncc, build orders, tsup array concurrency, the release check's placement, validation commands, Docker prune).

## Scope

In (analysis goals):
- **G1** Core and react install from the registry with their JavaScript modules complete.
- **G2** The Node startup call comes from `@miroir-framework/server/startup`.
- **G3** One meta-model and one local cache per process and per bundle.

Out (analysis §2): `private` flags and publishing (I8); the meta-model size; the zustand cache beyond its imports; the asset folders `@miroir-framework/env` opens by package name (I7); type generation.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/652 (epic #621, plan I6 slice 3)
- Analysis: [`analysis.md`](./analysis.md) (v2)
- Epic plan: [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md)
- Working branch: `claude/652-bundle-meta-model`, from `_integration` at `24ba0aa46`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Guards learn about bundled folders (green before and after) | ✅ | `test_package_manifests.py` owner rule (react owns the local cache, the server library its `./node` entry), unchanged results today |
| 1 | Import scanner on a fixture tree | ✅ | `test_rename_packages.py` import cases |
| 2 | Core carries the meta-model; everyone imports the subpaths | ✅ | core pack cases, `--check`, alias rule, bundle report, full build |
| 3 | The server library exposes `./startup` | ⏳ | server pack case, startup boundaries, release check |
| 4 | React carries the local cache | ⏳ | react pack cases, dependency rule, local cache source rule |
| 5 | Docs, nonreg, acceptance | ⏳ | gate, `nonreg:filesystem`, AC table |

Slice 3 comes before 4: once react bundles the local cache, a Node process importing react's copy and the private package would hold two; moving the Node importers to the server first keeps every intermediate state at one copy.

## Locked implementation defaults

| Decision | Default | Serves |
|---|---|---|
| D1 | core: tsup array config (tsup runs the builds concurrently): build A entries `meta-model`, `admin` bundle the private packages from their `index.ts` (not `dist`, the stale-map problem); build B the current entries, `miroir-app-*` removed from `external` and rewritten by an `onResolve` plugin (filter `^miroir-app-(miroir|admin)$`) to the external subpaths, `onSuccess` there; no tsup `clean` (a concurrent build would delete the other's output): the `build` script empties `dist` first, then `copy-files`; `dist/meta-model.d.ts`, `dist/admin.d.ts` copied from the stubs; `exports`, `files`; the two packages move to `devDependencies` | G1, G3 |
| D2 | every importer outside core and the two packages moves to the subpaths (scanner); the 8 vite configs with a string alias on core (core, app-miroir, app-admin, app-meta, 4 examples) gain `meta-model` / `admin` aliases to the private packages before the root alias; ncc `-e` adds the two core subpaths and drops `miroir-app-*`; tsup `external` lists follow; `miroir-ai` drops its unused `miroir-app-miroir` dependency | G3 |
| D3 | react: `noExternal: ["miroir-localcache-redux"]`, `dts.resolve`, the local cache's runtime deps declared, the private package a devDependency; the standalone app takes the local cache from `@miroir-framework/react` (re-exports added as needed); `vi.mock` target moved | G1, G3 |
| D4 | server library: `src/startup.ts`, entry `startup`, `exports["./startup"]`, `noExternal`, `dts.resolve`, the redux deps declared; CLI, server binary, Electron and the cli/ai/server-library test platforms import it (Electron and `miroir-ai` gain a devDependency); react and mcp tests keep the private package; ncc inlines `./startup` into the server release like the root (no `-e`: `test_server_library_boundaries.py:81-83` and one copy, nothing else in the release loads the local cache); the server library builds in its own stage before the CLI (`build-all.sh`, `ci/lib/common.sh`, `pr-checks.yml`, session setup, nonreg prerequisites) | G2, G3 |
| D5 | `scripts/package-import-map.json`; a scanner of import specifiers in code files outside the owners, in `rename_packages.py` `--apply` / `--check` / `--report` | G3 |
| D6 | `bundleReportCore.js`: a workspace file that is an `exports` subpath target is named `<name>/<subpath>`; policies renamed (`miroir-app-*` → core subpaths, cap key), `miroir-localcache-redux` dropped, Electron gains the server entry | G3 |
| D7 | owner rule in the declaration tests; dependency rule; pack cases on `.js` and `.d.ts`; local cache source rule; vite alias rule; release check (`MIROIR_RELEASE_SMOKE=1`, added to the argv of nonreg step `build-636-server-release`) | G1–G3 |

Deviations found while implementing go to the slice's Realization.

## Allocated keys

- Data: `scripts/package-import-map.json`.
- Tests: `scripts/tests/test_package_manifests.py` (owner rule, dependency rule, pack cases), `scripts/tests/test_rename_packages.py` (import scanner), `scripts/tests/test_bundled_packages.py` (local cache source rule, vite alias rule, release check helper), `packages/miroir-standalone-app/tests/0_build/bundleReportCore.unit.test.ts` (subpath attribution).
- Nonreg: no new step; the pack cases run in `unit-643-package-manifests` (`MIROIR_REQUIRE_PACK=1`); the release check (`test_bundled_packages.py::test_the_server_release_holds_no_meta_model`, skipped unless `MIROIR_RELEASE_SMOKE=1`) joins the argv of `build-636-server-release`.

## Test execution conventions

| Purpose | Command |
|---|---|
| Guards | `python -m pytest scripts/tests -q` |
| Pack cases | `MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_package_manifests.py -q` |
| Import change | `python scripts/rename_packages.py --apply` then `--check` |
| Bundle report | `npm run testByFile -w miroir-standalone-app -- bundleReportCore.unit` |
| Bundle guards | `npm run build -w miroir-standalone-app -w miroir-standalone-app-electron`, then the two `check_bundle_policy.py <report> <policy>` commands of `pr-checks.yml` |
| Full build | `./build-all.sh` |
| Safety net | pre-push gate (AGENTS.md), `npm run nonreg:filesystem` |

---

## Slice 0 — Guards learn about bundled folders

**Status:** ✅

### Goal

The manifest declaration rules treat a `BUNDLED_INTO_ANOTHER` folder as part of its owner, so the later slices change manifests without weakening the rules. Green on today's tree (no package bundles yet, so the rule changes nothing).

### Tests (RED first)

- A case with a synthetic owner/bundled pair (helper-level): an owner importing its bundled folder undeclared passes; a non-owner importing it undeclared fails; the bundled folder's third-party imports count as the owner's for "imports what it declares".

### Work

- Read ownership from `published-packages.json` (folders sharing a `publishedName` with a non-bundled folder): react owns `miroir-localcache-redux`, core owns the two meta-model packages.
- A second, entry-limited owner: the server library owns `miroir-localcache-redux/node` (an explicit table in the test: the files reachable from `src/node.ts`), so its third-party imports (redux, saga; not `react`, `react-redux`) count as the server library's. `SHARED_LIBRARIES` (`:318-319`) stays consistent.
- Rules at `test_package_manifests.py:415`, `:426` use the owner's import set (own `src` plus owned `src`).

### Validation

```bash
python -m pytest scripts/tests/test_package_manifests.py -q
```

### Realization

- `owned_folders`, `reachable_sources`, `bundled_owned`, `owner_imports` in `test_package_manifests.py`; `ENTRY_OWNERS` gives the server library the files reachable from the local cache's `src/node.ts`. An owned folder counts as bundled only when the owner imports it without declaring it (a declared one stays external), so today's results are unchanged (123 passed). `test_an_owner_counts_the_imports_of_what_it_bundles` pins the ownership table and the Node entry's reach.

---

## Slice 1 — Import scanner on a fixture tree

**Status:** ✅

### Tests (RED first)

Fixture tree in `tmp_path`: TS files with `import … from "miroir-app-miroir"`, `import type … from 'miroir-app-admin'`, `await import("miroir-app-miroir")`, `vi.mock("miroir-app-miroir")`, `export * from "miroir-app-admin"`; the same lines under `packages/miroir-core/` and `packages/miroir-app-admin/` (kept); a manifest with `"miroir-app-miroir": "*"` (kept), an environment JSON with `"package": "miroir-app-miroir"` (kept), `build.sh` with `-w miroir-app-miroir` (kept), a deployment JSON with `"directory": "miroir-app-admin/assets"` (kept). Cases: `--apply` rewrites exactly the import lines; a second run changes nothing; `--check` names each import left; the #650 renames still behave (existing cases unchanged).

### Work

- The scanner in `rename_packages.py` (code suffixes only, owners skipped, specifier contexts only), active when `scripts/package-import-map.json` exists; the fixture tests bring their own map. The repo's map file lands in Slice 2, with the `--apply`, so the gate's `--check` stays green between slices.

### Validation

```bash
python -m pytest scripts/tests/test_rename_packages.py -q
```

### Realization

- `scan_imports` in `rename_packages.py` (forms: `from`, `import(`, `require(`, `vi.mock(`, side-effect `import`), the map file read from `--root` when present. RED checked by running the new cases on the previous script (2 failed), GREEN after.

---

## Slice 2 — Core carries the meta-model; everyone imports the subpaths

**Status:** ✅

### Tests (RED first)

- Pack cases (`test_package_manifests.py`): core declares `./meta-model` and `./admin`, packs `dist/meta-model.js`, `dist/admin.js` and their `.d.ts`; no built `.js` or `.d.ts` of core names `miroir-app-miroir` or `miroir-app-admin` as a module; no published manifest lists `miroir-app-*` in `dependencies`/`peerDependencies`/`optionalDependencies` (fails today on core, react, the 4 stores, the CLI; the local cache, private and bundled, follows the same rule for the meta-model).
- `rename_packages.py --check` over the repo fails (190 importers).
- `test_bundled_packages.py`: a vite config with a string alias on `@miroir-framework/core` and no `meta-model` / `admin` alias fails (8 configs today: core, app-miroir, app-admin, app-meta, 4 examples).
- Release check (regression guard, passes today): `test_the_server_release_holds_no_meta_model`, under `MIROIR_RELEASE_SMOKE=1`, finds no `"16dbfe28-e1d7-4f20-9ba4-c1a9873202ad"` JSON value in `packages/miroir-server/release/index.js`; added to step `build-636-server-release`.
- `bundleReportCore.unit.test.ts`: a module at `packages/miroir-core/dist/meta-model.js`, with core's workspace declaring `./meta-model`, is attributed to `@miroir-framework/core/meta-model`.

### Work

- core `tsup.config.js` array (D1), `src/meta-model.ts`, `src/admin.ts`, `package.json` (`exports`, `files`, deps, `build` empties `dist` first).
- `scripts/package-import-map.json`, `--apply`; the 8 vite aliases; tsup `external` lists of `miroir-app-meta`, `miroir-example-github`, `miroir-example-spotify`; ncc `-e` in `miroir-server` (`build:server`); manifests: `miroir-app-*` out of published packages' dependencies, `@miroir-framework/core` added where missing; `miroir-ai` drops `miroir-app-miroir`; `npm install --package-lock-only` then `npm install`.
- Attribution in `bundleReportCore.js`, with `readWorkspaces` (`vite/bundleReportPlugin.js:31`) reading `exports`; both policies' keys; `eagerGzipBaseline` re-measured if the minified meta-model entry moves it (recorded).
- Docker: `npm prune --omit=dev` (`Dockerfile:93`) drops `miroir-app-*` once no runtime manifest lists them: no runtime import by bare name may remain (the dist check covers core; the scanner the rest).
- Existing expectations: `test_package_manifests.py:436-442` expects `@miroir-framework/core/admin` in the local cache's `dist`.
- Rebuild (`./build-all.sh`), fix what the scanner could not reach, recorded in the Realization.

### Validation

```bash
./build-all.sh
python scripts/rename_packages.py --check
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests -q
npm run testByFile -w miroir-standalone-app -- bundleReportCore.unit
npm run test -w @miroir-framework/core -- ''
npm run build:server -w miroir-server && MIROIR_RELEASE_SMOKE=1 python -m pytest scripts/tests/test_bundled_packages.py -q
# bundle guards (conventions table)
```

### Realization

- `--apply` moved 265 imports in 190 files; 8 vite configs aliased; the meta-model packages left the manifests of react, the 4 stores, both local caches, mcp, cli, ai and the sandbox (the apps, examples and fixtures keep theirs as workspace links); `package-lock.json` refreshed.
- Deviation, found by the bundle guard: the first build grew the browser's meta-model from 2 392 997 to 3 615 678 bytes. `miroir-app-miroir/src/Model.ts` imported `from ".."`, which esbuild resolves through the package's `main` to `dist/index.js` when the build starts from `../miroir-app-miroir/index.ts`: two copies in `dist/meta-model.js`. It imports `"../index"` now; the eager page is 839 175 bytes gzipped (839 471 before the change).
- The attribution rule names every `exports` subpath entry, so the standalone policy lists `@miroir-framework/mcp/client` (lazy, and forbidden eager next to `@miroir-framework/mcp`) instead of `@miroir-framework/mcp`.
- `test_core_public_api.py`: the template may import the meta-model subpaths by name or as a namespace (data, no API); a re-export of them still fails.
- The release check passes on the release built with the new `-e` flags (9 passed with the release smoke test); it was not run against a release built without them.
- Gate: pytest 545 passed (pack cases required), lint, dependency policy, env check, tsc on 12 packages, core unit 3292 passed; both bundle guards 0 violations.

---

## Slice 3 — The server library exposes `./startup`

**Status:** ⏳

### Tests (RED first)

- Pack case: the server library declares `./startup` and packs `dist/startup.js` and `dist/startup.d.ts`; neither names `miroir-localcache-redux`.
- `test_bundled_packages.py`: no Node `src/` outside the server library imports `miroir-localcache-redux/node` (fails today: CLI, server binary, Electron); no file imports it together with `@miroir-framework/server/startup`.
- `test_startup_calls_boundaries.py`: the server library joins `CALL_PACKAGES` (a coverage addition, passes before).

### Work

- server library: `src/startup.ts`, tsup entry, `noExternal`, `dts.resolve`, deps; forbidden-imports plugin unchanged (must still pass).
- CLI (`platform.ts`, manifest, tsup `external`: `@miroir-framework/server` replaces `miroir-localcache-redux`), server binary (`server.ts`; ncc inlines it, no `-e`), Electron (`environmentBoot.ts`, devDependency), `miroir-ai` (devDependency), test platforms of cli, ai, server-library; mcp tsup `external` drops the stale `miroir-localcache-redux`.
- Build order: the server library gets its own stage after `STAGE_UI_SERVICES` and before `STAGE_APPS` (`build-all.sh`, `ci/lib/common.sh`; `test_server_library_boundaries.py:69` kept green); `pr-checks.yml` builds it before Electron; `agent_session_setup.py` `BUILD_GROUPS` and nonreg steps that build the CLI, ai or Electron build it first.
- Electron bundle policy gains the server entry if the report shows it.

### Validation

```bash
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests -q
npm run build -w packages/miroir-server-library && npm run build -w packages/miroir-cli
npm run build:server -w miroir-server && MIROIR_RELEASE_SMOKE=1 python -m pytest scripts/tests/test_bundled_packages.py -q
npm run testByFile -w @miroir-framework/cli -- startMiroirNode
# bundle guards (conventions table)
```

---

## Slice 4 — React carries the local cache

**Status:** ⏳

### Tests (RED first)

- Pack cases: react's manifest does not list `miroir-localcache-redux`; no built `.js` or `.d.ts` of react names it.
- Dependency rule (Slice 2) now covers the local cache too.
- `test_bundled_packages.py`: only react and the server library import `miroir-localcache-redux` in `src/` (fails before this slice on the standalone app's `localCacheImplementation.ts`); no file imports it together with `@miroir-framework/react`.

### Work

- react `tsup.config.js` (`noExternal`, `dts.resolve`), manifest (devDependency, redux runtime deps declared).
- standalone app: `localCacheImplementation.ts` and the 3 test importers (`localCacheImplementation.unit`, `useCurrentModelEnvironment.unit`, `view/ReportComponent.test`) take the redux implementation from `@miroir-framework/react` (react re-exports what is missing); `IntegrationTestSession.unit.test.ts` mock target.
- Policies drop `miroir-localcache-redux` from `eager`.

### Validation

```bash
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests -q
npm run build -w packages/miroir-react
npm run testByFile -w miroir-standalone-app -- localCacheImplementation IntegrationTestSession useCurrentModelEnvironment ReportComponent.test
# bundle guards (conventions table)
```

---

## Slice 5 — Docs, nonreg, acceptance

**Status:** ⏳

### Work

- `AGENTS.md` (package list and build order note: the private packages are bundled into core, react and the server), `docs/reference/release-process.md` §10e, epic plan I6 row 3, `docs/reference/data-architecture-deployments.md` if it names the imports.
- Full build, pre-push gate, `nonreg:filesystem`; a Docker build (`docker build .`) when the session can run it, else recorded as not run.

### Validation

```bash
./build-all.sh
# pre-push gate (AGENTS.md)
npm run nonreg:filesystem
```

---

## Acceptance criteria → proof

| Issue criterion | Proof |
|---|---|
| Packed core holds the meta-model and declares `./meta-model`, `./admin` | core pack cases (Slice 2) |
| Packed react does not depend on the local cache; the server exposes the Node startup call | react pack cases (Slice 4), server pack case (Slice 3) |
| No published package depends on the 3 private packages | dependency rule (Slices 2, 4) |
| Full build, gate, `nonreg:filesystem`; AGENTS.md and release-process updated | Slice 5 |

## Revision history

- v1 (2026-11-01): first version.
- v2 (2026-11-01): adversarial plan review, 13 findings applied (see resume note).
