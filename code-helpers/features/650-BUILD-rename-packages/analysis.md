# 650 — Rename the published packages to `@miroir-framework/*`

> The epic publishes Miroir under the `@miroir-framework` scope, and decided that packages are renamed in the repo, not at publish time. This analysis settles which workspace packages get which name now, what counts as a reference to a package name (and what only looks like one), how the rename is applied and kept applied while other branches are open, and what moves to a follow-up issue.

Related issue: https://github.com/miroir-framework/miroir/issues/650
Parent issue: #621 (work item "Rename packages", epic plan I6, decisions D7-b and D8-a)
Prerequisites: #643 (PR #644: `scripts/published-packages.json`, the manifest contract), #649 (PR to come, this branch's base: `test_core_public_api.py` reads `"miroir-core"` imports)
Related analyses: [`../621-FEATURE-npm-packages/analysis.md`](../621-FEATURE-npm-packages/analysis.md) (D1 target set, D7, D8), [`../643-BUILD-manifest-hygiene/analysis.md`](../643-BUILD-manifest-hygiene/analysis.md)
Key sources: [`scripts/published-packages.json`](../../../scripts/published-packages.json), [`build-all.sh`](../../../build-all.sh), [`scripts/nonreg-manifest.json`](../../../scripts/nonreg-manifest.json), [`ci/release/release_lib/workspace.py`](../../../ci/release/release_lib/workspace.py), [`packages/miroir-core/src/5_tests/FunctionCallTestRegistry.ts`](../../../packages/miroir-core/src/5_tests/FunctionCallTestRegistry.ts)

**Status:** the epic decided the rename and the target names. The decisions below are technical and recorded here; the user asked to proceed without further confirmation. Revision history at the end.

**Baseline:** `claude/649-core-public-api` at `35d179f25` (PR #651), all packages at `0.5.0-rc.1`.

---

## 1. Goals

- **G1 — Install by the published name.** In order to install Miroir from npm, as an application developer, I add `@miroir-framework/core`, `@miroir-framework/react`, a store and the server, and the code I copy from Miroir's docs and template imports those same names.
- **G2 — The repo runs under the published names.** In order to release what the repo tests, as a maintainer, I build, lint and run nonreg with the packages under their `@miroir-framework/*` names, with no rewriting step between the repo and the tarballs.
- **G3 — Open branches can catch up.** In order to merge a branch started before the rename, as a contributor, I run one script that renames the references my branch added, and a check tells me when an old name is left.

## 2. Non-goals

- Bundling the meta-model packages into core and the local cache into react (D7-b, D8-a): a build change of its own, moved to #652 (D1).
- Flipping `private` on core, react and the server library: with the publish item, once #652 makes core and react complete (D6).
- Renaming the package folders (`packages/miroir-core` stays): D2.
- Publishing, provenance, the consumer test: later epic items.
- Renaming private packages (examples, fixtures, the standalone app, the server binary).

## 3. Decision record

| Decision | Choice | Goals | Status |
|---|---|---|---|
| D1 Which packages now | **the 11 packages that become one published package each; the 3 that are bundled into another (`miroir-app-miroir`, `miroir-app-admin`, `miroir-localcache-redux`) keep their private names until a follow-up issue bundles them** | G1, G2 | Accepted |
| D2 Folders | **unchanged; only the `name` in `package.json` and the references change** | G2, G3 | Accepted |
| D3 What is a reference | **npm specifiers and workspace selectors; not folder paths, logger names, MiroirTest `functionRef.module` ids or the `Symbol.for` key** (§4.3) | G1, G2 | Accepted |
| D4 How | **`scripts/rename_packages.py` driven by `scripts/package-rename-map.json`: `--report`, `--apply`, `--check`; idempotent; a pytest on a fixture tree; `--check` in the pre-push gate** | G2, G3 | Accepted |
| D6 Publish flags | **`publishConfig.access: "public"` on the 11; `private` flags unchanged** | G1 | Accepted |
| D5 Living docs only | **rename in `docs/`, `AGENTS.md`, READMEs, skills, `ci/release/*.md`; leave `code-helpers/features/**` and changelogs as written** | G1 | Accepted |

### D1 — Which packages now

`scripts/published-packages.json` maps 14 folders to 11 published names. 11 folders map one to one:

| Folder | Today | Published name |
|---|---|---|
| `packages/miroir-core` | `miroir-core` | `@miroir-framework/core` |
| `packages/miroir-react` | `miroir-react` | `@miroir-framework/react` |
| `packages/miroir-store-postgres` | `miroir-store-postgres` | `@miroir-framework/store-postgres` |
| `packages/miroir-store-filesystem` | `miroir-store-filesystem` | `@miroir-framework/store-filesystem` |
| `packages/miroir-store-indexedDb` | `miroir-store-indexedDb` | `@miroir-framework/store-indexeddb` |
| `packages/miroir-store-mongodb` | `miroir-store-mongodb` | `@miroir-framework/store-mongodb` |
| `packages/miroir-store-bundled` | `miroir-store-bundled` | `@miroir-framework/store-bundled` |
| `packages/miroir-env` | `miroir-env` | `@miroir-framework/env` |
| `packages/miroir-mcp` | `miroir-mcp` | `@miroir-framework/mcp` |
| `packages/miroir-server-library` | `miroir-server-library` | `@miroir-framework/server` |
| `packages/miroir-cli` | `miroir-cli` | `@miroir-framework/cli` |

The other 3 map to a name another folder already takes (core, react). Two workspace packages cannot share a name, so they keep theirs until they are bundled.

| Option | Pros | Cons |
|---|---|---|
| **A. Rename the 11 now; bundling in a follow-up issue** ★ | the rename is mechanical and reviewable alone; the bundling (tsup `noExternal` of the meta-model JSON, the type generation that reads built `miroir-app-miroir`, the local cache's Node entry through the server) gets its own analysis | the epic item closes in two issues |
| B. Rename and bundle in one PR | one item, one PR | a mechanical diff over ~900 files mixed with a build change; a failure in the bundling blocks the rename for every open branch |

The 3 private names stay valid until #652. `published-packages.json` keeps its mapping; the manifest test checks that, for each published name, exactly one folder has that `name` (the 11 above), and that the other folders mapped to it (the 3) keep their `miroir-*` name and stay private.

### D2 — Folders

npm workspaces resolve by `name`, not by folder; `-w` accepts a name or a folder path (`-w packages/miroir-core`), checked with npm 10. `build-all.sh` (its stage lists and `packages/$pkg` paths), `eslint-suppressions.json` (119 paths), `release_lib/workspace.py` (reads each folder's manifest), the nonreg snapshots and every `packages/miroir-*/…` path in docs and tests refer to folders. Keeping the folders leaves all of these as they are. A later folder rename can follow if wanted; it is not needed for publishing.

Some scripts use one string as both folder and workspace name, so no text replacement can make them right; they change to select the workspace by folder path:
- `build-all.sh`: `packages/$pkg` tests (`:389`, `:439`) and `npm run build -w "$pkg"` / `typecheck_package "$pkg"` (`:482`, `:485`, `:561`, `:564`), over folder-name stage arrays (`:93-110`): `-w "packages/$pkg"`.
- `ci/lib/common.sh`: `packages/$pkg` (`:80`) and `-w "$pkg"` (`:105`), fed bare folder lists by `ci/build/build_server.sh`: same change.
- `scripts/agent_session_setup.py`: `root / "packages" / package` (`:83`) and `-w {p}` (`:112`) from `BUILD_GROUPS`: same change.

### D3 — What is a reference

| Kind | Example | Renamed |
|---|---|---|
| Import specifier (static, `import type`, dynamic `import()`, `require`, `vi.mock`, `export … from`), with subpaths | `from "miroir-core"`, `"miroir-core/model-validation-fs"` | yes |
| Manifest `name`, `dependencies` / `devDependencies` / `peerDependencies` keys | `"miroir-core": "0.5.0-rc.1"` | yes |
| Workspace selector | `npm run test -w miroir-core`, `--workspace=miroir-react` (about 1300 on one line for the 11 names, in scripts, docs and CI) | yes |
| Bundler and resolver config naming a package | vite `optimizeDeps` / aliases / `external`, tsup `external` / `noExternal`, tsconfig `paths`, eslint rules matching specifiers | yes |
| Release tooling naming packages | `ci/release/` | yes |
| Folder path | `packages/miroir-core/src/…` | no (D2) |
| Logger package name | `packageName = "miroir-core"` in `constants.ts`, giving logger names `…_miroir-core_…` used by log presets | no: an identifier of log configs, not an npm name |
| MiroirTest function references | `"module": "miroir-core/tools"` (855 in assets), keys of `FunctionCallTestRegistry.ts` | no: logical module ids of the model, resolved by the registry, not by npm |
| The duplicate-core record key | `Symbol.for("miroir-core.instances")` | no: a cross-version contract (#645) |
| Bin names | `miroir-env`, `miroir-cli` commands | no: what users type; only the package name changes |
| Messages naming the package | `npm ls miroir-core` in #645's warning | yes |
| Quoted whole names in configs and policy files | tsup `external` arrays, vite `optimizeDeps.exclude`, vite alias keys, `NODE_STORE_PACKAGES`, eslint `paths`, `bundle-policy.json` | yes |
| A selector split over two JSON or list elements | `"-w",` then `"miroir-core"` on the next line (144 in `scripts/nonreg-manifest.json`; Python lists in tests) | yes |
| Prefix patterns and regex literals | `/^miroir-store-/` in `miroir-server-library/tsup.config.js:7-15`, `STORE` in `test_startup_calls_boundaries.py:26`, `FORBIDDEN` in `test_server_library_boundaries.py:25-27`, `/^(\.\|miroir-)/` in `eslint-rules/smell-lens.config.mjs:154` | by hand, to match both forms where sibling folders and `node_modules` both reach them (`^(@miroir-framework/store-\|miroir-store-)`); each gets a must-still-catch case. The script cannot see them: `miroir-store-` is not one of the 11 names |
| Names that are not npm names | the root script `miroir-env` (`npm run miroir-env --`), vitest project names, agent bench arm ids (`scripts/agent_bench/`), CI artifact names (`dist-miroir-core`), nonreg step ids (`unit-miroir-core`), temp-folder prefixes, test file names, commander `.name('miroir-cli')` | no: listed in the allow-list |

The script renames an old name when it is quoted as a whole specifier (alone or with a subpath, in any file: imports, configs, JSON, Python lists) or follows `-w` / `--workspace` (on the same line or as the next list element), and leaves the "no" kinds through an allow-list of files and line patterns. `--check` lists any old name left outside the allow-list, bare or quoted.

### D4 — How

| Option | Pros | Cons |
|---|---|---|
| **A. A Python script with a map, `--report` / `--apply` / `--check`, idempotent** ★ | rerunnable on open branches (G3); `--check` keeps the rename applied; repo preference for Python tooling | regex level: the contexts of D3 must be enumerated and tested |
| B. One-off `sed` | quick | not rerunnable with the same exclusions; no check |
| C. A codemod (jscodeshift / ts-morph) | exact for TS imports | covers TS only, not manifests, shell, JSON, docs; a Node dependency |

`--apply` also runs `npm install --package-lock-only` (lockfile entries move from `node_modules/miroir-core` to `node_modules/@miroir-framework/core`) only when asked (`--lockfile`), since the lockfile is regenerated once in the PR and on each rebase.

### D6 — Publish flags

Scoped packages publish as restricted unless `publishConfig.access` is `public`. The 11 get it now, with their name. `private` stays as it is (core, react and the server library are private; env, mcp and cli are not, since #643): core and react are only complete after #652, and the publish item decides when they become publishable. `test_server_library_boundaries.py`'s `test_library_stays_private_until_the_rename` is renamed to say "until the publish item".

### D5 — Living docs only

The 3459 doc occurrences are in 268 files; most are in `code-helpers/features/**`, analyses and plans that record what was decided with the names of their time. Rewriting them makes their history wrong. Living docs (`docs/`, `AGENTS.md`, package READMEs, `.agents/skills/`, `.github/skills/`, `ci/release/*.md`, `CONTRIBUTING`) are renamed; `docs-OLD/` is historical and left; the generated `.claude/skills/` copies follow through `sync_agent_skills.py`.

## 4. Current state

### 4.1 Counts (tracked files, the 11 names as whole words, not after `/`, `@`, `.`)

| Where | Occurrences | Files |
|---|---|---|
| docs (`.md`) | 3459 | 268 |
| code (`.ts`, `.tsx`, `.js`, `.mjs`, …) | 1776 | 845 |
| model assets (`functionRef.module`, not renamed) | 874 | 49 |
| config (`.json`, `.yml`, `.sh`) | 269 | 15 |
| other (Dockerfiles, `.html`, `.txt`, `.svg`) | 90 | 5 |
| Python | 163 | 27 |
| manifests | 119 | 30 |
| lockfile | 84 | 1 |

By name: `miroir-core` 4102, `miroir-react` 859, `miroir-env` 486, `miroir-mcp` 453, `miroir-cli` 195, the five stores 632, `miroir-server-library` 107.

Code splits into 1298 `from "…"` specifiers, 52 dynamic imports and mocks, 19 logger `packageName` values, and about 500 others (vite and tsup configs, tests that assert on names, `FunctionCallTestRegistry` keys, messages): those are where the script's contexts matter most, and the report (Slice 0) lists them by context.

### 4.2 Things that depend on the current names

- `node_modules/miroir-core` is a symlink to `packages/miroir-core`; after the rename it is `node_modules/@miroir-framework/core`. Any code resolving `node_modules/miroir-*` by path (tests copying the built core, release scripts) breaks.
- `test_package_manifests.py` asserts the published set and its names; `test_core_public_api.py` (#649) reads `from "miroir-core"` in the sandbox; `check_dependency_policy.py` reads internal pins by name.
- `lerna.json` lists packages by folder glob (unaffected); the root `package.json` scripts use `-w` names.
- Lockfile: today `node_modules/miroir-core` is `{ link, resolved: "packages/miroir-core" }` and `packages/miroir-core` has no `name` (npm omits it when it matches the folder). After the rename npm writes `"name": "@miroir-framework/core"` there and moves the link key to `node_modules/@miroir-framework/core`: expected, not churn. `check_dependency_policy.py` resolves scoped keys already.
- `ci/release` keys packages by manifest name, takes tarball names from `npm pack --json` (`miroir-framework-core-<version>.tgz`) and joins `node_modules/@miroir-framework/core` correctly: no change beyond the docs.
- `@miroir-framework/jzod` and `jzod-ts` are already in the scope, as npm dependencies: no clash with the 11 names.

## 4.3 Acceptance criteria of #650 and deviations

| Criterion | Where |
|---|---|
| Every package of the published set has its new name, checked by a manifest test | the 11 (D1); the 3 bundled ones keep private names until #652, and the test checks exactly that |
| No reference to an old name, except the map and historical notes | `rename_packages.py --check` in the pre-push gate, with the D3 allow-list |
| Script tested on a fixture tree, idempotent | `test_rename_packages.py` |
| Lockfile regenerated; build, lint, gate, `nonreg:filesystem` | Slice "apply" validation |
| Docs give the new names | D5 |

Deviations from the issue's scope list: logger `packageName` strings are kept (log-preset identifiers, about 25 `packageName =` lines); bundling moved to #652.

## 5. Key reuse

| Piece | Location |
|---|---|
| Published set and names | `scripts/published-packages.json` |
| Comment-aware TS reading | `scripts/ts_source.py` (#649) |
| Pack-style checks | `scripts/tests/test_package_manifests.py` |
| Workspace graph | `ci/release/release_lib/workspace.py` |

## 6. Risks

| Risk | Effect | Mitigation |
|---|---|---|
| A context the script misses (a config naming a package in an unusual form) | a build or test breaks, or a stale name stays | `--report` lists every occurrence by context before `--apply`; `--check` fails on any bare old name outside the allow-list; full build and `nonreg:filesystem` |
| The script renames a "no" kind (logger name, `functionRef.module`) | log presets stop matching, MiroirTests stop resolving | those contexts are in the fixture tree as must-not-change cases |
| A prefix guard keeps passing after the rename while checking nothing | a boundary test or the server library's externals silently stop working | the 4 sites are changed by hand with must-still-catch cases (D3) |
| Open branches conflict on ~900 files | painful merges | merge the rename quickly; `--apply` on the branch after merging resolves the rest (G3) |
| Lockfile regeneration changes resolved versions | unrelated churn | `npm install --package-lock-only` with the same registry; diff reviewed for non-Miroir changes |
| `npm ci` in CI on a stale cache | resolution failures | the lockfile is committed with the rename |

## Revision history

- v1 (2026-11-01): first version.
- v2 (2026-11-01): adversarial review, 8 findings applied: scripts that use one string as folder and workspace select by folder path (D2); prefix patterns and regex literals changed by hand with must-still-catch cases; quoted names in configs and split `-w` pairs as contexts; the allow-list of names that are not npm names; AC mapping and deviations, one manifest-test rule, bundling split into #652; D6 publish flags; counts corrected; lockfile shape.
