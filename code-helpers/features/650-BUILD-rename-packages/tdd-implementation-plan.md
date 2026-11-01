# Issue #650 — TDD Implementation Plan

> Testing posture: the rename is a repo-wide text change, so the proof is a pytest over a fixture tree for the script (every context of analysis D3 renamed, every "no" kind left, a second run changes nothing), the manifest test for the names, `--check` over the real repo, and then the repo's own safety nets under the new names: full build, lint, pre-push gate, `nonreg:filesystem`. No mocks, no MiroirTest change (MiroirTest `functionRef.module` ids are kept).

**Resume note:** start at the first slice whose Status is not ✅. v2 after the adversarial plan review (11 findings applied: quoted folder names, a `--check` limited to the renamed contexts, ncc `-e` and nx `!` contexts, every regex guard on package names, generated docs, word boundaries, deviations).

## Scope

In (analysis goals):
- **G1** Code and docs import the published names.
- **G2** The repo builds and tests under the published names, with no rewriting step.
- **G3** Open branches catch up with one script, and a check reports any old name left.

Out (analysis §2): bundling (#652); folder renames; `private` flags (publish item); private packages' names.

## Related links

- Issue: https://github.com/miroir-framework/miroir/issues/650 (epic #621, plan I6 slices 0–2); follow-up #652 (I6 slice 3)
- Analysis: [`analysis.md`](./analysis.md)
- Epic plan: [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md)
- Working branch: `claude/650-rename-packages`, from `claude/649-core-public-api` at `35d179f25` (PR #651, stacked on #648)

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Report every reference by context (characterization) | ✅ | `rename_packages.py --report`, committed report |
| 1 | Rename script on a fixture tree | ✅ | `test_rename_packages.py` |
| 2 | Name-independent scripts and guards (before the rename) | ⏳ | must-still-catch cases; build and setup scripts select by folder |
| 3 | Apply the rename | ⏳ | manifest name rule, `--check`, full build, gate, `nonreg:filesystem` |

## Locked implementation defaults

| Decision | Default | Serves |
|---|---|---|
| D1 | 11 packages renamed (analysis D1 table); `miroir-app-miroir`, `miroir-app-admin`, `miroir-localcache-redux` keep their names until #652 | G1, G2 |
| D2 | folders unchanged; `build-all.sh`, `ci/lib/common.sh`, `scripts/agent_session_setup.py` select workspaces with `-w packages/<folder>` | G2 |
| D3 | match boundary: no word character, `-`, `/`, `@` or `.`+word on either side (so `packages/miroir-core`, `unit-miroir-core`, `4_miroir-core_X`, `miroir-mcp-server`, `miroir-core.instances` never match); renamed contexts: a whole name between quotes or backticks (alone or with a `/subpath`; also `"!name"` for nx `implicitDependencies`), a name after `-w` / `--workspace` / ncc `-e` / `npm ls`, and a bare name in a living `.md` doc unless it is a bin name (`miroir-env`, `miroir-cli`); bare names in code comments and shell are left; `--check` reports exactly the renamed contexts left. Kept by the allow-list: the allow-list of analysis D3 (folder paths, logger `packageName`, `functionRef.module` and `FunctionCallTestRegistry` keys, `Symbol.for("miroir-core.instances")`, bin and root-script names, vitest project names, agent bench arm ids, CI artifact names, nonreg step ids, temp prefixes, test file names, commander names); prefix patterns changed by hand | G1, G2 |
| D4b | quoted folder names (paths built as `packages/<x>`) are rewritten in Slice 2 to carry `packages/` or to read `published-packages.json`, or allow-listed by file for self-contained fixture repos (`test_check_dependency_policy.py`, `test_fill_lockfile_integrity.py`, `scripts/tests/fixtures/**`) | G2 |
| D4 | `scripts/rename_packages.py` (`--report`, `--apply`, `--check`), map `scripts/package-rename-map.json`, allow-list `scripts/package-rename-allow.json`; `--check` joins the pre-push gate and `pr-checks.yml` | G2, G3 |
| D5 | living docs renamed (`docs/`, `AGENTS.md`, READMEs, `.agents/skills/` then `sync_agent_skills.py`, `.github/skills/`, `ci/release/*.md`); `code-helpers/features/**`, `docs-OLD/`, changelogs skipped | G1 |
| D6 | `publishConfig.access: "public"` on the 11; `private` unchanged | G1 |

Deviations found while implementing go to the slice's Realization.

## Allocated keys

- Script: `scripts/rename_packages.py`; data: `scripts/package-rename-map.json`, `scripts/package-rename-allow.json`.
- Test: `scripts/tests/test_rename_packages.py` (fixture tree written in `tmp_path`).
- Report: `code-helpers/features/650-BUILD-rename-packages/references-report.md` (Slice 0, before the rename).
- Nonreg: no new step; `--check` runs in the pre-push gate and pr-checks (fast, no build).

## Test execution conventions

| Purpose | Command |
|---|---|
| Script tests | `python -m pytest scripts/tests/test_rename_packages.py -q` |
| Report | `python scripts/rename_packages.py --report` |
| Apply | `python scripts/rename_packages.py --apply` then `npm install --package-lock-only` then `npm install` |
| Check | `python scripts/rename_packages.py --check` |
| Full build | `./build-all.sh` |
| Safety net | pre-push gate (AGENTS.md), `npm run nonreg:filesystem` |

---

## Slice 0 — Report every reference by context (characterization)

**Status:** ⏳

### Goal

Every occurrence of the 11 names is classified (renamed context, allow-listed, or unclassified) before anything changes; unclassified occurrences drive the contexts and the allow-list.

### Work

- `--report` prints counts per name and per context, and lists unclassified occurrences with file and line. Iterate until unclassified is empty or each remaining case is an explained manual edit.
- Commit the report.

### Validation

```bash
python scripts/rename_packages.py --report > code-helpers/features/650-BUILD-rename-packages/references-report.md
```

---

## Slice 1 — Rename script on a fixture tree

**Status:** ⏳

### Tests (RED first)

A fixture tree in `tmp_path` with: a manifest (`name`, dependencies, peer dependencies), TS files with static, `import type`, dynamic `import()`, `require`, `vi.mock`, `export … from` and subpath specifiers; a vite config with an alias key, `optimizeDeps.exclude` and a `NODE_STORE_PACKAGES` array; a tsup `external` array; a `bundle-policy.json`; a nonreg-style JSON with `"-w",` and the name on the next line; a shell script with `-w miroir-core` and `--workspace=miroir-react`; a Markdown doc with both; a Python list `["npm", "run", "x", "-w", "miroir-core"]`.

Must not change: `packages/miroir-core/src/x.ts` paths, `"packages" / "miroir-core"` is not in the fixture (folder sites are rewritten in Slice 2), `module: "miroir-core/tools"` in a TS test and a registry key, `export const packageName = "miroir-core"`, `"module": "miroir-core/tools"` in an asset, `Symbol.for("miroir-core.instances")`, `"miroir-env": "node …"` root script and `npm run miroir-env --`, `.name('miroir-cli')`, a nonreg id `unit-miroir-core`, `miroir-app-miroir` (not in the map), `@miroir-framework/core` (already renamed), `code-helpers/features/x.md`.

Cases: `--apply` gives the expected tree; a second `--apply` changes nothing; `--check` fails on the original tree naming each old reference, passes on the applied one, and flags an old name in a non-allow-listed bare context.

### Work

The script: walks `git ls-files` (or a given root for tests), skips binary and skipped folders, applies the contexts in order, honours the allow-list.

### Validation

```bash
python -m pytest scripts/tests/test_rename_packages.py -q
```

---

## Slice 2 — Name-independent scripts and guards (before the rename)

**Status:** ⏳

### Goal

The places a text replacement cannot fix work under both names, so the rename itself is mechanical.

### Tests (RED first)

- `test_startup_calls_boundaries.py`, `test_server_library_boundaries.py`: a must-still-catch case with an `@miroir-framework/store-x` specifier (fails today: the prefix only matches `miroir-store-`).
- `eslint-rules` smell-lens test: a `vi.mock("@miroir-framework/core/…")` target still flags `mocked-own-module`.
- `scripts/tests/test_agent_session_setup.py`: the build command selects `-w packages/<folder>`.
- A static pytest: `build-all.sh` and `ci/lib/common.sh` build with `-w "packages/$pkg"`.

### Work

- Every regex or prefix guard on package names accepts both forms, with a case on the scoped name: `miroir-server-library/tsup.config.js:8-15` (a static test on its externals), `test_startup_calls_boundaries.py:26`, `test_server_library_boundaries.py:25-27`, `eslint-rules/smell-lens.config.mjs:154` (`@miroir-framework/jzod` counts as external, not own code), `test_core_public_api.py` `IMPORT_FROM_CORE` / `CORE_SPECIFIER`, `test_shell_package_boundaries.py:18` `SELF_IMPORT`. Sweep: `git grep -nE "re.compile|RegExp|/\^" | grep -E "miroir-(core|react|store|env|mcp|cli|server-library)"`.
- Quoted folder names to explicit folder paths: `agent_session_setup.py` `BUILD_GROUPS` (kept as folders, allow-listed by line) and its tests, `test_server_library_boundaries.py:20`, `test_startup_calls_boundaries.py:22`, `test_package_runtime_dependencies.py:18-25`, `LIBRARY_TMP.ts:19`.
- `-w "packages/$pkg"` in `build-all.sh`, `ci/lib/common.sh`; `-w packages/{p}` in `agent_session_setup.py`.

### Validation

```bash
python -m pytest scripts/tests -q
node --test eslint-rules/
./build-all.sh   # still green under the old names
```

---

## Slice 3 — Apply the rename

**Status:** ⏳

### Tests (RED first)

- `test_package_manifests.py`: `test_the_published_set_matches_the_epic_mapping` is replaced (not duplicated) by: for each published name, exactly one folder of `published-packages.json` has that `name`, and the other folders mapped to it keep a `miroir-*` name and are private; each of the 11 has `publishConfig.access: "public"`. Fails before the rename.
- `rename_packages.py --check` over the repo: fails before the rename.

### Work

- `docs/reference/core-public-api.md` is skipped by the script; `core_public_api.py` is renamed by it and the document regenerated.
- `python scripts/rename_packages.py --apply`; `publishConfig` on the 11; `npm install --package-lock-only` then `npm install`; rebuild; fix what the script cannot reach (generated files, snapshots), recording each in the Realization.
- `--check` in the AGENTS.md pre-push gate and `.github/workflows/pr-checks.yml`.
- Rename `test_library_stays_private_until_the_rename` to the publish item (D6).
- Docs: AGENTS.md package list and commands, `docs/reference/release-process.md` (a short §10d on the rename and `--apply` for open branches), epic plan I6 rows.

### Validation

```bash
python scripts/rename_packages.py --check
./build-all.sh
# pre-push gate (AGENTS.md)
npm run nonreg:filesystem
```

---

## Acceptance criteria → proof

| Issue criterion | Proof |
|---|---|
| Published set has its new names, checked | manifest name rule (Slice 3) |
| No old name outside the map and history | `--check` in the gate (Slice 3) |
| Script tested on a fixture tree, idempotent | `test_rename_packages.py` (Slice 1) |
| Lockfile regenerated; build, lint, gate, nonreg | Slice 3 validation |
| Docs give the new names | Slice 3 docs |

Deviations from the issue (also commented on #650): the 3 folders bundled by #652 keep their names; logger `packageName` strings are kept (log-preset identifiers). The stores are private today too (`private: true`); D6 leaves every `private` flag as it is.

## Revision history

- v1 (2026-11-01): first version.
- v2 (2026-11-01): adversarial plan review, 11 findings applied (see resume note).
