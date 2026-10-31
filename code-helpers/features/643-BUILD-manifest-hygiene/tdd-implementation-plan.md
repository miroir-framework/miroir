# Issue #643 — TDD Implementation Plan

> Testing posture: the behaviour under test is what `npm pack` and `npm install` see, so the tests read manifests and pack lists, not code. Pytest (`scripts/tests/test_package_manifests.py`) checks the manifests of the published set; its pack cases run `npm pack --dry-run --json` on the built packages. No MiroirTest: manifests are not reachable through the ML. No mocks. The existing suites (pre-push gate, web self-test, bundle guards, release tests, filesystem nonreg) prove that hosts still build and run.

**Resume note:** start at the first slice whose Status is not ✅. v2 after the adversarial plan review (16 findings applied: router and formik in the peer test, peers rule scoped to the set and added to CI, mcp and cli test entries to devDependencies, the browser net for `sideEffects`, the whole set built before pack cases).

## Scope

In (analysis goals):
- **G1** Install exactly what runs: `files`, `exports` without `./src/*`, `sideEffects`, `engines`, the CLI's entry points.
- **G2** One copy of the shared libraries: peers for `zod`, `react`, `react-dom`, `react-redux`, `react-router-dom`, `formik`, `@mui/material`, `@emotion/*`, checked by the dependency policy; no undeclared import bundled into a `dist/` (D9).
- **G3** Documented types: TSDoc in the declarations, no `.d.ts.map` pointing to missing sources.
- **G4** Manifests stay correct: the manifest test in the pre-push gate and a nonreg step.

Out (analysis §2): duplicate-core detection and `@public` TSDoc (#621 items), `import.meta.env` (I5 slice 4), removing `private` (I7, I8), the rename (I6), deleting `miroir-localcache*`.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/643 (epic #621)
- Analysis: [`analysis.md`](./analysis.md)
- Epic plan: [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md) (I5 slices 2 and 3)
- Working branch: `claude/643-manifest-hygiene`, from `claude/639-startup-calls` (PR #642)

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | The published set is listed, and today's manifests characterized | ✅ | `test_package_manifests.py` (set cases) |
| 1 | Tarballs ship built files and declared entry points only | ✅ | `test_package_manifests.py` (files, exports, pack cases) |
| 2 | Packages carry their metadata and their TSDoc | ⬜ | `test_package_manifests.py` (metadata, TSDoc cases) |
| 3 | Shared libraries are peers, checked by the dependency policy | ⬜ | `test_package_manifests.py` (peer cases), `test_check_dependency_policy.py` (peers rule) |
| 3b | Every import is declared, every declared runtime dependency is imported | ⬜ | `test_package_manifests.py` (declared-imports cases) |
| 4 | Nonreg step, docs, AC | ⬜ | `unit-643-package-manifests`, full filesystem nonreg |

## Locked implementation defaults

| Decision | Default | Serves |
|---|---|---|
| D1 | peers with a caret range from the repo's version, exact version in `devDependencies`; ranges and owners as in analysis D1's table (`react-redux`, `react-router-dom`, `formik` included; † owners for transitive peers) | G2 |
| D2 | `scripts/published-packages.json`: `[{ "folder": "packages/<name>", "publishedName": "@miroir-framework/<…>" }]` for the 14 packages of analysis §4.1 | G4 |
| D3 | no `./src/*`; the 19 specifiers move to `miroir-core/model-validation-fs`; the postgres test uses a relative path | G1 |
| D4 | core's `files` drops `dist/**/*.d.ts.map`; `tsconfig.declarations.json` keeps emitting them | G3 |
| D5 | `removeComments: false` in the root `tsconfig.json` | G3 |
| D6 | `sideEffects: false` on the 14 packages | G1 |
| D7 | `miroir-cli`: `exports` = `{ "./package.json": "./package.json" }`, no `main`/`types`, `bin` unchanged | G1 |
| D8 | `engines.node` = `">=22"` | G1 |
| D9 | bare imports of `src/` declared as `dependencies` or peers, runtime declarations imported; allowlist of analysis D9 (pg/pg-hstore in store-postgres, react in localcache-redux, @emotion/styled in react, type-only vitest in core) | G1, G2, G4 |

Deviations found while implementing go to the slice's Realization.

## Allocated keys

- Test file: `scripts/tests/test_package_manifests.py` (feature-named, no issue directory).
- Data file: `scripts/published-packages.json`.
- Nonreg step: `unit-643-package-manifests`, scopes `tooling`, `core`, tier `default`.
- Environment switch for the pack cases: `MIROIR_REQUIRE_PACK=1` turns "package not built, skipped" into a failure (set by the nonreg step).

No model element, no uuid, no MiroirTest suite.

## Test execution conventions

| Purpose | Command |
|---|---|
| Manifest test | `python -m pytest scripts/tests/test_package_manifests.py -q` |
| Manifest test with pack cases required | `MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_package_manifests.py -q` |
| Dependency policy and its tests | `python scripts/check_dependency_policy.py` · `python -m pytest scripts/tests/test_check_dependency_policy.py -q` |
| Release pipeline tests | `python -m pytest ci/release/tests -q` |
| One package's pack list | `cd packages/<pkg> && npm pack --dry-run --json && cd -` |
| Typecheck | `npx tsc --noEmit --skipLibCheck -p packages/<pkg>/tsconfig.json` |
| Build the set (before any pack case) | `npm run build -w miroir-app-miroir -w miroir-app-admin -w miroir-core -w miroir-localcache-redux -w miroir-store-postgres -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-mongodb -w miroir-store-bundled -w miroir-env -w miroir-react -w miroir-mcp -w miroir-server-library -w miroir-cli` |
| Browser net (D6, D1) | sandbox build; `MIROIR_ENV=self-test` app build and its bundle guard; Electron build and its bundle guard; `build:release -w miroir-server`; `MIROIR_ENV=self-test npm run selfTest -w miroir-standalone-app -- --serve` (the production bundles in Chromium; `unit-487-self-test` runs the suites in Node from sources and does not see `sideEffects`) |
| Pre-push gate | the AGENTS.md block |

---

## Slice 0 — The published set is listed, and today's manifests characterized

**Status:** ✅ DONE

### Goal

One file names the 14 packages, and the test fails if one is renamed or removed without updating it. Today's manifest fields and pack lists are recorded, so later slices show what they change.

### RED

`test_package_manifests.py`:
- `test_the_published_set_names_existing_workspace_packages`: each `folder` exists, holds a `package.json` and is a root workspace; no duplicate.
- `test_the_published_set_matches_the_epic_mapping`: the set's workspace names equal the 14 of analysis §4.1 (the list is written in the test once, as the characterization; I6 changes both).

Fails: the JSON file does not exist.

### GREEN

Write `scripts/published-packages.json`.

### Characterization (no assertion)

Record in the Realization, per package: the field table of analysis §4.2 (script output) and `npm pack --dry-run --json` file count and size, with any `src/`, `tests/` or `.d.ts.map` entry counted.

### Refactor checkpoint

None expected.

### Validation

```bash
python -m pytest scripts/tests/test_package_manifests.py -q
python -m pytest scripts/tests -q
```

### Realization

- `scripts/published-packages.json` lists the 14 folders with their target names (`@miroir-framework/core` three times, `-react` twice: #621 D7-b, D8-a). RED: 3 failures (file missing); GREEN: 3 passed. A third case, `test_each_package_of_the_set_has_a_scoped_published_name`, locks the 11 target names.
- Characterization, `npm pack --dry-run --json --ignore-scripts` on the built packages at `f2ce72969` (files, packed size, then `src/`, `tests/`, `.d.ts.map` entries):

| Package | Files | Size | `src/` | tests | `.d.ts.map` |
|---|---|---|---|---|---|
| miroir-app-miroir | 5 | 1308 KB | 0 | 0 | 0 |
| miroir-app-admin | 5 | 19 KB | 0 | 0 | 0 |
| miroir-core | 550 | 1590 KB | 0 | 0 | 270 |
| miroir-localcache-redux | 41 | 162 KB | 17 | 12 | 0 |
| miroir-store-postgres | 40 | 114 KB | 22 | 10 | 0 |
| miroir-store-filesystem | 25 | 17 KB | 14 | 2 | 0 |
| miroir-store-indexedDb | 26 | 16 KB | 12 | 0 | 0 |
| miroir-store-mongodb | 17 | 211 KB | 12 | 0 | 0 |
| miroir-store-bundled | 14 | 6 KB | 9 | 0 | 0 |
| miroir-env | 42 | 102 KB | 13 | 17 | 0 |
| miroir-react | 1212 | 1576 KB | 247 | 12 | 0 |
| miroir-mcp | 42 | 61 KB | 13 | 17 | 0 |
| miroir-server-library | 6 | 11 KB | 0 | 0 | 0 |
| miroir-cli | 18 | 33 KB | 6 | 4 | 0 |

  The field table of analysis §4.2 was re-checked by the same script; no difference.

---

## Slice 1 — Tarballs ship built files and declared entry points only

**Status:** ✅ DONE

### Goal

`npm pack` of each package of the set lists no `src/`, `tests/` or `.d.ts.map` file, every `exports` target is in the tarball, and no package exports `./src/*`. The CLI's package cannot be imported as a library.

### RED

`test_package_manifests.py`, parametrized over the set:
- `test_a_published_package_lists_its_files`: `files` is present; no entry names `src` or matches `*.d.ts.map`.
- Pack case `test_every_files_entry_matches_a_built_file`: each `files` entry other than `package.json`, `LICENSE*`, `README*` matches at least one file of the built package (catches core's `dist/index.cjs`, `dist/index.cjs.map`, `dist/src/worker.js`).
- `test_a_published_package_declares_its_entry_points`: `exports` is an object with `./package.json`; no key or target contains `/src/`; every `types`/`import` target starts with `./dist/`, is `./package.json`, or is the hand-written `./index.d.ts` stub of `miroir-app-miroir` and `miroir-app-admin` (listed in their `files`); `miroir-cli` has only `./package.json` and no `main` (D7).
- `test_a_published_tarball_holds_its_entry_points_and_no_sources` (pack case, skipped when `dist/` is missing unless `MIROIR_REQUIRE_PACK=1`): `npm pack --dry-run --json` lists every `exports`, `bin` and `main` target, and no path under `src/` or `tests/` and no `.d.ts.map`.

Also `test_no_repo_code_imports_a_package_source_folder`: no `.ts`/`.tsx` under `packages/` or `scripts/` (outside `node_modules`, `dist`, `release`) has an import specifier (static, dynamic, `vi.mock`/`vi.importActual` argument; comments removed) `miroir-<x>/src/…` for a package of the set. Relative paths are allowed (not resolved through `exports`), and so are path strings that are not specifiers (`packages/miroir-core/src/...` in scripts, `"directory": "../miroir-core/src/assets/…"`).

### GREEN

- Add `files: ["dist"]` (npm adds `package.json`, `README*`, `LICENSE*`) where missing; core drops `dist/**/*.d.ts.map` (D4) and the three entries it does not build.
- Add `exports` to the five stores and `miroir-env` (`.` and `./package.json`), and `./package.json` to `miroir-react`'s; drop `./src/*` from core and store-postgres; set the CLI's (D7).
- Move the 19 specifiers to `miroir-core/model-validation-fs` (D3), the `vi.mock` factories included; the postgres test imports through a relative path.
- If a pack lists a file the package reads at runtime outside `dist/` (asset, worker), add it to `files` and record it.

### Refactor checkpoint

The standalone app's tests now share one import path for the test catalog helpers; if a helper file re-exports them, keep one.

### Validation

```bash
npm run build -w miroir-app-miroir -w miroir-app-admin -w miroir-core -w miroir-localcache-redux -w miroir-store-postgres -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-mongodb -w miroir-store-bundled -w miroir-env -w miroir-react -w miroir-mcp -w miroir-server-library -w miroir-cli   # the whole set, in build order
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_package_manifests.py -q
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.tests.json   # covers tests/; 2 known MUI errors only
npm run testByFile -w miroir-core -- sqlCreateSchemaIfNotExists
npm run testByFile -w miroir-standalone-app -- testMiroirLauncher.tags   # also runs scripts/testMiroirLauncher.ts's imports
npm run testByFile -w miroir-standalone-app -- uiIntegrationTestLauncher   # a vi.mock factory that moved
python -m pytest ci/release/tests -q
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling,ui
```

### Realization

- RED: 33 failures (11 packages without `files`, 9 without a well-formed `exports`, 11 pack lists with `src/`, tests or `.d.ts.map`, core's 3 unbuilt `files` entries, and the 20 `src/` specifiers). A pattern self-test (`test_the_specifier_pattern_sees_every_import_form`) locks the import forms the scanner sees.
- GREEN: `files: ["dist"]` on 10 packages; core's `files` without `dist/**/*.d.ts.map`, `dist/index.cjs`, `dist/index.cjs.map`, `dist/src/worker.js`; `exports` (`./package.json`, `.`) on the five stores and `miroir-env`; `./package.json` in `miroir-react`'s; no `./src/*` in core and store-postgres; `miroir-cli` with `exports: {"./package.json"}` and no `main`/`types`. The 19 specifiers now use `miroir-core/model-validation-fs`; the postgres test imports through `../../../miroir-store-postgres/src/...`. 61 passed.
- No package reads a file outside `dist/` at runtime (grep of `import.meta.url` and `__dirname` in the set's `src/`: only `miroir-env`'s entry guard).
- Validation: core `tsc` clean; the standalone app's `tsconfig.tests.json` has 576 errors before and after, none from the moved imports (the two touched files with errors have the jest-dom matcher and env typing errors they had before). `sqlCreateSchemaIfNotExists` passes. Of the six standalone-app helper tests, `uiIntegrationTestLauncher` has one failure (`freezeApplicationVersion: expected 'libraryVersionedTestbedInitParams' to be 'libraryTestbedInitParams'`) that fails the same way on the base with the change stashed: pre-existing, not in a nonreg step. Release tests 15 passed. Scoped nonreg (`smoke,core,tooling,ui`): 80 of 80.

---

## Slice 2 — Packages carry their metadata and their TSDoc

**Status:** ⬜ pending

### Goal

Each package of the set says where it comes from, which Node it needs and that it can be tree-shaken, and its declarations keep their TSDoc.

### RED

`test_package_manifests.py`, parametrized over the set:
- `test_a_published_package_carries_its_metadata`: `sideEffects` is `false` (D6); `engines.node` is `">=22"` (D8); `repository` is `{type: "git", url: "git+https://github.com/miroir-framework/miroir.git", directory: <folder>}`; `license` is `"MIT"`.
- `test_a_published_package_keeps_comments_in_its_declarations`: the effective `removeComments` of the tsconfig that emits the package's declarations, followed through `extends`, is not `true` (D5): `tsconfig.declarations.json` for core (tsup `onSuccess`), `tsconfig.json` for the others.
- Pack case `test_published_declarations_carry_tsdoc`: `miroir-localcache-redux/dist/node.d.ts` contains the TSDoc of `startMiroirNode`, and `miroir-core/dist/index.d.ts` or a declaration it re-exports contains a `/**` block.

### GREEN

- Manifest fields on the 14 packages; `miroir-server`'s `repository` fixed (analysis §4.4).
- Root `tsconfig.json`: `removeComments: false`. If tsup's dts build ignores it, set it in the tsup `dts.compilerOptions` of the affected packages and record it.

### Refactor checkpoint

If several manifests now repeat the same block, leave it: npm has no manifest inheritance, and I6 rewrites them.

### Validation

```bash
npm run build -w miroir-app-miroir -w miroir-app-admin -w miroir-core -w miroir-localcache-redux -w miroir-store-postgres -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-mongodb -w miroir-store-bundled -w miroir-env -w miroir-react -w miroir-mcp -w miroir-server-library -w miroir-cli   # the whole set, in build order
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_package_manifests.py -q
# browser net (D6, D1): built bundles in a real browser, as in #639
npm run build -w miroir-sandbox
MIROIR_ENV=self-test npm run build -w miroir-standalone-app
python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run build -w miroir-standalone-app-electron
python scripts/check_bundle_policy.py packages/miroir-standalone-app-electron/dist/bundle-report.json packages/miroir-standalone-app-electron/bundle-policy.json
npm run build:release -w miroir-server
MIROIR_ENV=self-test npm run selfTest -w miroir-standalone-app -- --serve --out <scratch>/web.json   # 1224 tests in Chromium
npm run nonreg:filesystem -- --runner shared --scope smoke,core,localcache,ui
```

### Realization

---

## Slice 3 — Shared libraries are peers, checked by the dependency policy

**Status:** ⬜ pending

### Goal

A consumer's tree holds one copy of each shared library, and npm warns when a version is outside what Miroir accepts. The repo still builds and tests against one pinned version.

### RED

1. `test_check_dependency_policy.py`, a new `peers` rule:
   - a fixture package with a third-party peer and no matching devDependency → `[peers] packages/x/package.json: peerDependencies.zod "^4.6.7" has no devDependency to build and test with`;
   - a devDependency outside the range (`zod` `3.25.0` for `^4.6.7`) → violation naming both;
   - a matching pair → no violation; internal (`miroir-*`) peers are not checked; optional peers (`peerDependenciesMeta.optional`) are checked the same way only when third-party;
   - scope: the packages of `scripts/published-packages.json`. Packages outside the set (`miroir-diagram-class`, `miroir-localcache`, `miroir-localcache-zustand`) declare peers with no devDependency and stay out of the rule; a fixture outside the set yields no violation.
2. `test_package_manifests.py`:
   - `test_shared_libraries_are_peers_of_the_published_set`: none of `zod`, `react`, `react-dom`, `react-redux`, `react-router-dom`, `formik`, `@mui/material`, `@emotion/react`, `@emotion/styled` is in `dependencies` of a package of the set;
   - `test_each_shared_library_has_one_peer_range_across_the_set`: per library, one range across the packages that declare it, equal to analysis D1's table;
   - `test_a_shared_library_peer_is_imported_by_its_owner`: a package lists one of these libraries as a peer only if its `src/` imports it or the library is a † peer in analysis D1.

### GREEN

- `check_dependency_policy.py`: `check_peers` with a small range matcher for the forms the repo uses (`^x.y.z`, `>=a <b`, `>=a`, exact); registered under `--rule peers`, documented in the module docstring; `.github/workflows/pr-checks.yml` adds `--rule peers` to its explicit rule list (line 26).
- devDependencies added for peers that have none today: `miroir-react` → `react`, `react-dom`, `@emotion/react`, `@emotion/styled` (and the moved `zod`, `react-redux`, `react-router-dom`, `formik`); `miroir-localcache-redux` → `react`, `react-redux`; the other moved peers likewise, at the installed exact version.
- Manifests per analysis D1: move the libraries to `peerDependencies` + exact `devDependencies`; remove `zod` and the `react-dom` peer from `miroir-localcache-redux` (unused, D9).
- Hosts that relied on a package of the set for one of these libraries get it as a `dependency`: `miroir-sandbox` (`formik`, `zod`), `miroir-server` (`zod`: its ncc build keeps `miroir-core`, `miroir-mcp` and the stores external), and any other host the RED run of the D1 tests or the builds reveal. Electron bundles its main process with esbuild and is not affected.
- `npm install`; review the `package-lock.json` diff (no version change of the libraries themselves).

### Refactor checkpoint

The #627 test (`test_package_runtime_dependencies.py`) keeps its own list (analysis D2); add a comment there pointing to `published-packages.json` for the published set.

### Validation

```bash
npm install
python scripts/check_dependency_policy.py
python -m pytest scripts/tests -q
python -m pytest ci/release/tests -q
./build-all.sh devBuild
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_package_manifests.py -q
npm run nonreg -- --only build-636-server-release,unit-487-self-test-electron
# browser net (D6, D1): built bundles in a real browser, as in #639
npm run build -w miroir-sandbox
MIROIR_ENV=self-test npm run build -w miroir-standalone-app
python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
npm run build -w miroir-standalone-app-electron
python scripts/check_bundle_policy.py packages/miroir-standalone-app-electron/dist/bundle-report.json packages/miroir-standalone-app-electron/bundle-policy.json
npm run build:release -w miroir-server
MIROIR_ENV=self-test npm run selfTest -w miroir-standalone-app -- --serve --out <scratch>/web.json   # 1224 tests in Chromium
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

## Slice 3b — Every import is declared, every declared runtime dependency is imported

**Status:** ⬜ pending

### Goal

No package of the set bundles an undeclared library or Miroir package into its `dist/` (tsup inlines what is not declared), and none asks npm to install something it never loads.

### RED

`test_package_manifests.py`, parametrized over the set, with an import scanner shared by both cases (comments removed; static `import`/`export … from`, `import type`, `import("…")`; relative paths, Node built-ins and ambient `*.d.ts` files skipped):
- `test_a_published_package_declares_what_its_sources_import`: every bare import is in `dependencies` or `peerDependencies`, except the D9 allowlist (core `vitest`, app-miroir `miroir-core`, both type-only). Fails today on core (`immer`), react (`@codemirror/view`), localcache-redux (`immer`, `miroir-app-admin`), store-mongodb (`miroir-app-miroir`). `require(...)` calls are not imports (`(window as any).require("electron")` in react).
- `test_a_published_package_imports_what_it_declares`: every `dependencies` and `peerDependencies` entry is imported, except the allowlist. Fails today on the "declared, not imported" column of analysis §4.6, among them `miroir-react` → `miroir-localcache-zustand` and the store peers of `miroir-mcp`.
- A scanner self-test on a small inline source (multi-line import, `import type`, dynamic import, a commented-out import, a relative import) so the pattern cannot go stale silently.

Also a pack case `test_localcache_redux_dist_does_not_inline_its_dependencies`: after the build, `miroir-localcache-redux/dist` imports `immer` and `miroir-app-admin` instead of defining `enablePatches` and the admin model.

### GREEN

- Declare: `immer` `11.1.21` in core and localcache-redux, `miroir-app-admin` `*` in localcache-redux, `miroir-app-miroir` `*` in store-mongodb, `@codemirror/view` `6.37.2` in react.
- Remove the unused entries of analysis §4.6, keeping the allowlist. Entries a package's own tests import move to `devDependencies` instead: `miroir-mcp` → `miroir-localcache-redux`, the three stores (their peer and `peerDependenciesMeta` entries go), `miroir-app-admin`, `miroir-app-miroir`; `miroir-cli` → `miroir-app-admin`, `miroir-app-miroir` (check each with a grep of `tests/`). `uuid` stays in core and react (imported); it goes from mcp and cli (their tests do not import it).
- `npm install`; review the lockfile diff.
- Set `clean: true` in localcache-redux's tsup config: its `dist/` keeps four stale chunks of about 172 KB from earlier builds, which `files: ["dist"]` would ship and which still define `enablePatches`.

### Refactor checkpoint

If the allowlist grows past its six entries (pg, pg-hstore, react in localcache-redux, @emotion/styled, core's vitest, app-miroir's miroir-core), stop and revisit D9.

### Validation

```bash
npm install
python scripts/check_dependency_policy.py
npm run build -w miroir-app-miroir -w miroir-app-admin -w miroir-core -w miroir-localcache-redux -w miroir-store-postgres -w miroir-store-filesystem -w miroir-store-indexedDb -w miroir-store-mongodb -w miroir-store-bundled -w miroir-env -w miroir-react -w miroir-mcp -w miroir-server-library -w miroir-cli   # the whole set, in build order
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_package_manifests.py -q
(cd packages/miroir-localcache-redux && npx vitest run tests/LocalCache.createEntity.undo.unit.test.ts)   # undo still works (from src; the pack case proves dist imports the shared immer)
npm run testByFile -w miroir-mcp -- mcpPackageSurface   # mcp tests still resolve their devDependencies
python -m pytest ci/release/tests -q
npm run nonreg:filesystem -- --runner shared
```

### Realization

---

## Slice 4 — Nonreg step, docs, AC

**Status:** ⬜ pending

### Goal

The manifest contract runs with the pack cases required in nonreg, the docs say what a package of the set must declare, and every acceptance criterion maps to a test.

### Work

- Nonreg step `unit-643-package-manifests` (scopes `tooling`, `core`; `MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_package_manifests.py -q`). Nonreg unit steps run on built packages; the step checks that the 14 `dist/` exist and fails otherwise. In PR CI the `core` job runs `pytest scripts/tests` before any build, so the pack cases skip there: add a `MIROIR_REQUIRE_PACK=1` run of the test to the `bundle` job of `pr-checks.yml`, which builds every package.
- Docs: `docs/reference/release-process.md`, a "Manifests of the published set" section (fields, peers rule, `published-packages.json`); `scripts/check_dependency_policy.py` docstring (peers); `docs/contributing/development-setup.md` if it lists the policy rules.
- Epic: the I5 rows of `../621-FEATURE-npm-packages/tdd-implementation-plan.md` (slices 2 and 3 ✅ #643, slice 3's `./testing` replaced by `./model-validation-fs`, the `@public` part left to "Public API of core"); D10 and D11 rows of the epic analysis.
- Release pipeline: one `python ci/release/release_version.py --bump patch --since 0.5.0-rc.1 --apply --worktree` run on the pushed branch head (`--worktree` checks out `HEAD`, `worktree.py:25–31`, so every slice must be committed first). It packs every layer and installs `miroir-mcp`, `miroir-cli`, `miroir-env` in a clean consumer. If the environment cannot reach the registry, record that and rely on the pack cases.
- Tracer narrative: `npm pack` of `miroir-store-filesystem` before (sources, tests, configs) and after (dist and manifest); automated equivalent: the pack cases.
- Cleanup: no issue directory to remove (the tests are feature-named).

### Validation

```bash
npm run nonreg -- --only unit-643-package-manifests
# pre-push gate (AGENTS.md)
npm run nonreg:filesystem -- --runner shared
```

### AC checklist

| Acceptance criterion (#643) | Proof |
|---|---|
| Manifest test checks files, exports without `./src/*`, sideEffects, engines, repository, license, peer ranges, D10-b peers, no zustand, no unused MCP store peer | `test_package_manifests.py` |
| Published declarations keep TSDoc | `test_a_published_package_keeps_comments_in_its_declarations`, `test_published_declarations_carry_tsdoc` |
| In-repo `src/` imports use named entry points; pack lists no `src/` and no `.d.ts.map` | `test_no_repo_code_imports_a_package_source_folder`, `test_a_published_tarball_holds_its_entry_points_and_no_sources` |
| Dependency policy accepts the peers | `test_check_dependency_policy.py` (peers), `check_dependency_policy.py` green |
| (D9, from the analysis review) no undeclared or unused runtime dependency in the set | `test_a_published_package_declares_what_its_sources_import`, `test_a_published_package_imports_what_it_declares` |
| `npm install`, gate, release tests, filesystem nonreg | Slice 3 and 4 validation |

### Realization
