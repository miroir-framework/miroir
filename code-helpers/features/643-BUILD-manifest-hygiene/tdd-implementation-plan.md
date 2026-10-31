# Issue #643 — TDD Implementation Plan

> Testing posture: the behaviour under test is what `npm pack` and `npm install` see, so the tests read manifests and pack lists, not code. Pytest (`scripts/tests/test_package_manifests.py`) checks the manifests of the published set; its pack cases run `npm pack --dry-run --json` on the built packages. No MiroirTest: manifests are not reachable through the ML. No mocks. The existing suites (pre-push gate, web self-test, bundle guards, release tests, filesystem nonreg) prove that hosts still build and run.

**Resume note:** start at the first slice whose Status is not ✅.

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
| 0 | The published set is listed, and today's manifests characterized | ⬜ | `test_package_manifests.py` (set cases) |
| 1 | Tarballs ship built files and declared entry points only | ⬜ | `test_package_manifests.py` (files, exports, pack cases) |
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
| Web self-test (D6 net) | `MIROIR_ENV=self-test npm run build -w miroir-standalone-app && MIROIR_ENV=self-test npm run nonreg -- --only unit-487-self-test` |
| App bundle guard (D6 net) | `npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json` |
| Pre-push gate | the AGENTS.md block |

---

## Slice 0 — The published set is listed, and today's manifests characterized

**Status:** ⬜ pending

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

---

## Slice 1 — Tarballs ship built files and declared entry points only

**Status:** ⬜ pending

### Goal

`npm pack` of each package of the set lists no `src/`, `tests/` or `.d.ts.map` file, every `exports` target is in the tarball, and no package exports `./src/*`. The CLI's package cannot be imported as a library.

### RED

`test_package_manifests.py`, parametrized over the set:
- `test_a_published_package_lists_its_files`: `files` is present; no entry names `src` or matches `*.d.ts.map`.
- Pack case `test_every_files_entry_matches_a_built_file`: each `files` entry other than `package.json`, `LICENSE*`, `README*` matches at least one file of the built package (catches core's `dist/index.cjs`, `dist/index.cjs.map`, `dist/src/worker.js`).
- `test_a_published_package_declares_its_entry_points`: `exports` is an object with `./package.json`; no key or target contains `/src/`; every `types`/`import` target starts with `./dist/` (or is `./package.json`); `miroir-cli` has only `./package.json` and no `main` (D7).
- `test_a_published_tarball_holds_its_entry_points_and_no_sources` (pack case, skipped when `dist/` is missing unless `MIROIR_REQUIRE_PACK=1`): `npm pack --dry-run --json` lists every `exports`, `bin` and `main` target, and no path under `src/` or `tests/` and no `.d.ts.map`.

Also `test_no_repo_code_imports_a_package_source_folder`: no `.ts`/`.tsx` under `packages/` or `scripts/` (outside `node_modules`, `dist`, `release`) has a specifier `miroir-<x>/src/…` for a package of the set (relative paths are allowed: they are not resolved through `exports`).

### GREEN

- Add `files: ["dist"]` (npm adds `package.json`, `README*`, `LICENSE*`) where missing; core drops `dist/**/*.d.ts.map` (D4) and the three entries it does not build.
- Add `exports` to the five stores and `miroir-env` (`.` and `./package.json`); drop `./src/*` from core and store-postgres; set the CLI's (D7).
- Move the 19 specifiers to `miroir-core/model-validation-fs` (D3), the `vi.mock` factories included; the postgres test imports through a relative path.
- If a pack lists a file the package reads at runtime outside `dist/` (asset, worker), add it to `files` and record it.

### Refactor checkpoint

The standalone app's tests now share one import path for the test catalog helpers; if a helper file re-exports them, keep one.

### Validation

```bash
npm run build -w miroir-core -w miroir-store-postgres -w miroir-cli -w miroir-env
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_package_manifests.py -q
npx tsc --noEmit --skipLibCheck -p packages/miroir-core/tsconfig.json
npx tsc --noEmit --skipLibCheck -p packages/miroir-standalone-app/tsconfig.json   # 2 known MUI errors only
npm run test -w miroir-core -- sqlCreateSchemaIfNotExists
npm run testByFile -w miroir-standalone-app -- testMiroirLauncher.tags
python -m pytest ci/release/tests -q
npm run nonreg:filesystem -- --runner shared --scope smoke,core,tooling,ui
```

### Realization

---

## Slice 2 — Packages carry their metadata and their TSDoc

**Status:** ⬜ pending

### Goal

Each package of the set says where it comes from, which Node it needs and that it can be tree-shaken, and its declarations keep their TSDoc.

### RED

`test_package_manifests.py`, parametrized over the set:
- `test_a_published_package_carries_its_metadata`: `sideEffects` is `false` (D6); `engines.node` is `">=22"` (D8); `repository` is `{type: "git", url: "git+https://github.com/miroir-framework/miroir.git", directory: <folder>}`; `license` is `"MIT"`.
- `test_a_published_package_keeps_comments_in_its_declarations`: the effective `removeComments` of the package's `tsconfig.json`, followed through `extends`, is not `true` (D5).
- Pack case `test_published_declarations_carry_tsdoc`: `miroir-localcache-redux/dist/node.d.ts` contains the TSDoc of `startMiroirNode`, and `miroir-core/dist/index.d.ts` or a declaration it re-exports contains a `/**` block.

### GREEN

- Manifest fields on the 14 packages; `miroir-server`'s `repository` fixed (analysis §4.4).
- Root `tsconfig.json`: `removeComments: false`. If tsup's dts build ignores it, set it in the tsup `dts.compilerOptions` of the affected packages and record it.

### Refactor checkpoint

If several manifests now repeat the same block, leave it: npm has no manifest inheritance, and I6 rewrites them.

### Validation

```bash
npm run build -w miroir-core -w miroir-localcache-redux
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_package_manifests.py -q
npm run nonreg -- --only build-633-sandbox   # sandbox build and its bundle guard
npm run build -w miroir-standalone-app && python scripts/check_bundle_policy.py packages/miroir-standalone-app/dist/.vite/bundle-report.json packages/miroir-standalone-app/bundle-policy.json
MIROIR_ENV=self-test npm run build -w miroir-standalone-app && MIROIR_ENV=self-test npm run nonreg -- --only unit-487-self-test   # D6 net
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
   - a matching pair → no violation; internal (`miroir-*`) peers are not checked; optional peers (`peerDependenciesMeta.optional`) are checked the same way only when third-party.
2. `test_package_manifests.py`:
   - `test_shared_libraries_are_peers_of_the_published_set`: none of `zod`, `react`, `react-dom`, `react-redux`, `@mui/material`, `@emotion/react`, `@emotion/styled` is in `dependencies` of a package of the set;
   - `test_each_shared_library_has_one_peer_range_across_the_set`: per library, one range across the packages that declare it, equal to analysis D1's table;
   - `test_a_shared_library_peer_is_imported_by_its_owner`: a package lists one of these libraries as a peer only if its `src/` imports it or the library is a † peer in analysis D1.

### GREEN

- `check_dependency_policy.py`: `check_peers` with a small range matcher for the forms the repo uses (`^x.y.z`, `>=a <b`, `>=a`, exact); registered under `--rule peers`, documented in the module docstring.
- Manifests per analysis D1: move the libraries to `peerDependencies` + exact `devDependencies`; remove `zod` and the `react-dom` peer from `miroir-localcache-redux` (unused, D9).
- Hosts that relied on a package of the set for one of these libraries get it as a `dependency` (check the Electron package, which electron-builder installs with production dependencies only, and the server binary).
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
npm run nonreg -- --only build-636-server-release,build-633-sandbox,unit-487-self-test-electron
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
- `test_a_published_package_declares_what_its_sources_import`: every bare import is in `dependencies` or `peerDependencies`, except the D9 allowlist. Fails today on core (`immer`), react (`@codemirror/view`), localcache-redux (`immer`, `miroir-app-admin`), store-mongodb (`miroir-app-miroir`).
- `test_a_published_package_imports_what_it_declares`: every `dependencies` and `peerDependencies` entry is imported, except the allowlist. Fails today on the "declared, not imported" column of analysis §4.6, among them `miroir-react` → `miroir-localcache-zustand` and the store peers of `miroir-mcp`.
- A scanner self-test on a small inline source (multi-line import, `import type`, dynamic import, a commented-out import, a relative import) so the pattern cannot go stale silently.

Also a pack case `test_localcache_redux_dist_does_not_inline_its_dependencies`: after the build, `miroir-localcache-redux/dist` imports `immer` and `miroir-app-admin` instead of defining `enablePatches` and the admin model.

### GREEN

- Declare: `immer` `11.1.21` in core and localcache-redux, `miroir-app-admin` `*` in localcache-redux, `miroir-app-miroir` `*` in store-mongodb, `@codemirror/view` `6.37.2` in react.
- Remove the unused entries of analysis §4.6 (including `peerDependenciesMeta` of `miroir-mcp`), keeping the allowlist.
- `npm install`; review the lockfile diff.
- Rebuild localcache-redux with `clean: true` (its `dist/` keeps stale chunks today: four chunks of about 172 KB from earlier builds) if the stale files would enter the tarball.

### Refactor checkpoint

If the allowlist grows past the four entries, stop and revisit D9 with the user.

### Validation

```bash
npm install
python scripts/check_dependency_policy.py
npm run build -w miroir-core -w miroir-localcache-redux -w miroir-store-mongodb -w miroir-react -w miroir-mcp -w miroir-cli
MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_package_manifests.py -q
(cd packages/miroir-localcache-redux && npx vitest run tests/LocalCache.createEntity.undo.unit.test.ts)   # immer patches from the shared copy
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

- Nonreg step `unit-643-package-manifests` (scopes `tooling`, `core`; `MIROIR_REQUIRE_PACK=1 python -m pytest scripts/tests/test_package_manifests.py -q`).
- Docs: `docs/reference/release-process.md`, a "Manifests of the published set" section (fields, peers rule, `published-packages.json`); `scripts/check_dependency_policy.py` docstring (peers); `docs/contributing/development-setup.md` if it lists the policy rules.
- Epic: the I5 rows of `../621-FEATURE-npm-packages/tdd-implementation-plan.md` (slices 2 and 3 ✅ #643, slice 3's `./testing` replaced by `./model-validation-fs`, the `@public` part left to "Public API of core"); D10 and D11 rows of the epic analysis.
- Release pipeline: one `python ci/release/release_version.py --bump patch --since 0.5.0-rc.1 --apply --worktree` run (it packs every layer and installs `miroir-mcp`, `miroir-cli`, `miroir-env` in a clean consumer); if the environment cannot reach the registry, record that and rely on the pack cases.
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
