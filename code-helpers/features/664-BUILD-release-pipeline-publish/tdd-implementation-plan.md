# Issue #664 — TDD Implementation Plan

> Vertical TDD slices (RED → GREEN each), integration-first per `docs/contributing/testing.md`.
> Nothing here is reachable through the ML (package manifests, a release script, a workflow), so the
> vehicles are pytest (`scripts/tests`, which PR CI runs, and `ci/release/tests`). No mocks: the tests
> run the real `npm` (`npm pack`, `npm publish --dry-run`), a real local registry (Verdaccio, started by the
> test, for the publish itself), real `git` repositories with a bare remote, and the real npmjs.org for
> read-only `npm view` checks (skipped when the registry is unreachable).
>
> **Execution model:** human-in-the-loop. No slice contains a commit step. Each slice ends with its
> Validation commands; on success its Realization summary is appended and its Status flips to ✅ DONE.

Analysis: [`./analysis.md`](./analysis.md) · Issue: https://github.com/miroir-framework/miroir/issues/664
Parent: [`../621-FEATURE-npm-packages/tdd-implementation-plan.md`](../621-FEATURE-npm-packages/tdd-implementation-plan.md) (I8, replaces its two slices)
Working branch: `claude/664-release-pipeline-publish` (from `origin/aba`)

**Resume note:** slices 0 to 6 done (2026-11-02). D9 confirmed as recommended. Slice 4 uses a Python local registry instead of Verdaccio (see its Realization).

**Open point for review (resolved in slice 4: Python registry):** slice 4 needs Verdaccio, an external npm package, run by the test. Recommended: a pinned `verdaccio` devDependency of the root workspace (checked by `check_dependency_policy.py`). Fallback if you would rather not add it: a ~100-line Python registry in `ci/release/tests/` that serves the two npm calls the test makes (`PUT` and `GET` of a packument), less faithful to npmjs.org.

---

## Scope

- G1 Publish a release from one click: `publish-npm.yml` → `--apply` → `publish.py`.
- G2 Nothing goes public by accident: `private` follows the published set; `npm publish` only in `publish.py`, only with `--yes`; workflow dry run by default.
- G3 Know before publishing: the five checks of D4.
- G4 Stable by default: dist-tag from the version.
- G5 Publish without CI: `publish-commands.sh`.

Not in this plan (analysis §2): packages outside the set, #224 artefacts, npm account setup, changelogs, unpublish.

---

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize: plan classification, handoff keys, commit staging | ✅ | `ci/release/tests/test_release_version.py` characterization cases; findings |
| 1 | The published set decides `private` and what a release packs | ✅ | `scripts/tests/test_package_manifests.py`; `test_release_version.py` |
| 2 | A release takes an exact version | ✅ | `test_release_version.py` |
| 3 | `--apply` refuses a tarball the registry would refuse, or a version already taken | ✅ | `ci/release/tests/test_publish_checks.py` |
| 4 | Tracer: `publish.py` publishes a handoff in layer order to a registry, and a rerun finishes a partial publish | ✅ | `ci/release/tests/test_publish.py` (local registry) |
| 5 | The release commit holds no tarball and goes to a release branch with its tag | ✅ | `test_release_version.py` git cases (bare remote) |
| 6 | The workflow, the guards, the docs, the epic's acceptance | ✅ | `scripts/tests/test_release_workflow.py`; dry-run workflow run; full nonreg |

---

## Locked implementation defaults

| Decision | Choice | Serves |
|---|---|---|
| D1 Publishable | the 12 published names; `private` false exactly for them; bundled folders and everything else `private: true` | G2 |
| D2 Selection | published names always added to the plan's initial selection, before the closure; `distributeable` = selected ∩ published names | G1, G3 |
| D3 Publish | `.github/workflows/publish-npm.yml` (`workflow_dispatch`), `ci/release/publish.py --handoff … [--yes] [--provenance] [--registry …]`; `release-handoff.json` gains `publish` entries; `--apply` writes `publish-commands.sh` | G1, G2, G5 |
| D4 Checks | in `--apply`: `npm publish --dry-run` per distributeable tarball, version 404 on the registry, consumer check on all 12, #658 consumer test; external dependencies proven by the consumer install | G3 |
| D5 dist-tag | `next` when the version has a `-`, else `latest` | G4 |
| D6 Auth | `NPM_TOKEN` secret if set, OIDC trusted publishing otherwise; npm ≥ 11.5.1 in the workflow | G1 |
| D7 Version | `--version <exact>` exclusive with `--bump` | G1 |
| D8 Existing version | `publish.py`: registry integrity equal → skip, different → stop | G1, G3 |
| D9 Record | after every publish succeeded: push the tag and `release/<version>`; never stage `release-tarballs/` | G1 |
| D10 Workflow safety | `publish` input default false, `environment: npm-publish`, `concurrency: npm-publish`, minimal permissions | G2 |

---

## Test vehicles

| Vehicle | Why not MiroirTest |
|---|---|
| `scripts/tests/test_package_manifests.py` (pytest, PR CI) | package manifests are not model data |
| `ci/release/tests/*.py` (pytest) | the release pipeline is Python outside the framework |
| Verdaccio in `test_publish.py` (slow, `MIROIR_PUBLISH_TEST=1`) | a real registry is the only honest proof of a publish; npmjs.org cannot be written by a test |
| `scripts/tests/test_release_workflow.py` (pytest + PyYAML, PR CI) | a workflow file is checked as data; it cannot run outside Actions |

---

## Slice 0 — Characterize the plan, the handoff and the commit

**Status:** ✅ DONE

Lock what later slices change, so each change shows as a diff of an expectation:

- `classify_packages` on today's workspace: `distributeable` holds env, mcp, cli, create-app, `miroir-ai`, `miroir-server`, `miroir-standalone-app` when selected; core is bundle-only.
- `build_plan` with an empty candidate list selects nothing.
- `release-handoff.json` keys (schema 1), so slice 4's additions are additive.
- `commit_tag_push(commit=True)` in a throwaway git repo with a `release-tarballs/P0/x.tgz` stages that tarball (analysis D9 defect), and `push` on a detached HEAD fails.

### Validation

```bash
python -m pytest ci/release/tests -q
```

### Realization

Done as findings rather than tests that later slices would immediately flip (the plan classification was already locked by `test_plan_layers_runtime_closure`, whose expectations slice 1 changed):

- `classify_packages` read `private`: `distributeable` held env, mcp, cli, create-app plus `miroir-ai`, `miroir-server`, `miroir-standalone-app`; core, react, server and the stores were bundle-only.
- `commit_tag_push` staged `release-tarballs/` (reproduced in a scratch repository: `A release-tarballs/P0/a.tgz`), and `git push` on the detached worktree fails (`fatal: You are not currently on a branch`).
- `ci/release/tests` were not run by PR CI; the new guards went to `scripts/tests` (slices 1 and 6).


---

## Slice 1 — The published set decides `private` and what a release packs

**Status:** ✅ DONE

**RED:**
1. `test_package_manifests.py::test_private_is_false_exactly_for_published_names`: over every `packages/*/package.json`, `private` is false iff `name` is a `publishedName` (fails on the 8 private set packages and the 3 public outsiders).
2. `test_release_version.py::test_a_plan_with_no_change_still_selects_the_whole_published_set` (temporary workspace with a `scripts/published-packages.json`) and `…_distributeable_is_the_published_set` (a non-private package outside the set is bundle-only; a set package marked private is still distributeable, so the plan no longer reads the flag).

**GREEN:** `plan.py` reads `scripts/published-packages.json` (one helper, also used by the guards); `build_plan` adds the published names to `initial`; `classify_packages` uses them. Flip `private` on the 11 manifests. `test_server_library_boundaries.py::test_library_stays_private_until_the_publish_item` becomes `…_is_publishable` (asserts `private` absent). `validate_layer_consumer` now checks P0 (core) onward: run it once on the built workspace to see the 8 install cleanly.

**Refactor checkpoint:** `published_set()` exists in `scripts/tests/test_package_manifests.py` and `ci/release/release_lib/consumer_project.py` (`required_packages`): one reader, in `release_lib`, imported by both, if the import path stays simple; otherwise note the duplication.

### Validation

```bash
python -m pytest scripts/tests/test_package_manifests.py scripts/tests/test_server_library_boundaries.py ci/release/tests -q
python ci/release/release_version.py --version 0.5.0-rc.2 --since 0.5.0-rc.1   # after slice 2; here: --bump patch
python scripts/check_dependency_policy.py
```

### Realization

- `plan.published_names()` reads `scripts/published-packages.json` (a missing or malformed file aborts the plan); `build_plan` adds the names to `initial`, refuses to `--disable` one, and `classify_packages(published, selected)` no longer reads `private`.
- The `repo` fixture gained a published set (`lib`); three expectations changed accordingly (`closure_added`, `distributeable`/`bundle_only`, the force/disable selection). Four new tests.
- `private` flipped on 11 manifests; `test_private_is_false_exactly_for_published_names` guards it. `test_library_stays_private_until_the_publish_item` became `test_library_is_publishable`. No lockfile change.
- Real run: the plan selects the 12 packages in 4 layers (P0 core + create-app; P1 env, mcp, react, 5 stores; P2 server; P3 cli), 12 distributeable. `validate_layer_consumer` on the 12 tarballs packed from the built workspace: all four layers install (7 s, 36 s, 13 s, 13 s).
- Found: `lerna ls` lists only non-private packages, so after the flip Lerna's candidates are always inside the set. `miroir-server` and the standalone app (#224 artefacts) now join a release only with `--force`. Documented in the reference §7.
- Refactor checkpoint: `scripts/tests` reads the set itself (it cannot import `ci/release` simply); left as is.


---

## Slice 2 — A release takes an exact version

**Status:** ✅ DONE

**RED:** `test_release_version.py`: `--version 0.5.0-rc.2` gives `product_version == "0.5.0-rc.2"`; `--version` with `--bump` is refused; an invalid SemVer, the current version, or a version with an existing tag is refused.

**GREEN:** `parse_args` makes `--bump` and `--version` a required mutually exclusive group; `build_plan(version=…)`; the plan records `bump: "exact"`.

**Refactor checkpoint:** `--bump` help and README examples name both forms.

### Validation

```bash
python -m pytest ci/release/tests/test_release_version.py -q
python ci/release/release_version.py --version 0.5.0-rc.2 --since 0.5.0-rc.1
```

### Realization

`--bump` and `--version` are a mutually exclusive argparse group; `build_plan(version=…)` validates SemVer and refuses the current version; `assert_version_untagged` refuses a local tag. `bump` is recorded as `"exact"`. Real dry run: `--version 0.5.0-rc.2 --since 0.5.0-rc.1` plans 12 packages; `--version 0.5.0-rc.1` is refused (tag exists). The tag of `--since` must be fetched locally (`git fetch origin tag 0.5.0-rc.1`).


---

## Slice 3 — `--apply` refuses a tarball the registry would refuse, or a version already taken

**Status:** ✅ DONE

**RED:** `ci/release/tests/test_publish_checks.py`, on real tarballs packed by the test from tiny packages in a temporary folder:
1. a tarball with a valid scoped manifest passes `npm publish --dry-run --tag next --access public`; one whose manifest npm refuses fails the check with npm's message;
2. the dist-tag of `1.2.3-rc.1` is `next`, of `1.2.3` is `latest`;
3. against npmjs.org (skipped when unreachable): `@miroir-framework/jzod@1.0.0` is reported taken, `@miroir-framework/core@0.0.0-never-published` is free.

**GREEN:** `release_lib/publish.py` with `dist_tag(version)`, `check_publishable(tarball, tag)`, `version_taken(name, version, registry)` (`npm view … version --json`, 404 = free, other errors raise). `build_pack_and_validate` runs both checks on every distributeable tarball after packing, before the consumer checks; one failure aborts with the package name.

**Refactor checkpoint:** one `npm` runner with the registry option instead of `run([executable("npm"), …])` repeated across `tarballs.py` and `publish.py`.

### Validation

```bash
python -m pytest ci/release/tests/test_publish_checks.py -q
```

### Realization

- Deviation: `npm publish <tarball> --dry-run` does **not** apply `private` (a private tarball "publishes" in dry run; checked with npm 10.9.9). So `check_publishable` first reads the tarball's own `package.json` and refuses: `private`, a name outside `@miroir-framework/`, another version, `publishConfig.access` not public, an internal dependency not pinned to the exact version. Then the npm dry run.
- `published_integrity` parses `npm view name@version dist.integrity --json`: a JSON `E404` (unknown package or unknown version) means free, any other failure raises.
- `check_release_tarballs` runs in `build_pack_and_validate` after packing, before the consumer checks.
- Tests: 12 in `test_publish_checks.py` (tarballs packed with `--pack-destination`, so a second pack does not include the first). The 12 real tarballs of the workspace pass the manifest rules and the dry run, and none of their versions is on npmjs.org.


---

## Slice 4 — Tracer: `publish.py` publishes a handoff in layer order, and a rerun finishes a partial publish

**Status:** ✅ DONE

**RED:** `ci/release/tests/test_publish.py` (slow, `MIROIR_PUBLISH_TEST=1`). The test starts Verdaccio on a free port with a temporary storage and a config that allows anonymous publish, packs two tiny packages (`@t/a`, `@t/b` depending on `@t/a` exactly) and writes a handoff with two layers:
1. `publish.py --handoff h.json --registry <verdaccio>` without `--yes` publishes nothing (`npm view` 404) and prints the commands with `--dry-run`;
2. with `--yes`, both versions are on the registry, `@t/a` first (its publish time is earlier), with the dist-tag of the version;
3. rerun with `--yes`: both reported "already published, identical", exit 0;
4. a rebuilt `@t/b` tarball with other content at the same version: stops before publishing, names the package.

Also fast: the handoff written by `--apply` has a `publish` list (layer, package, tarball, tag, command) and `publish-commands.sh` holds the same commands, without `--provenance`, in layer order.

**GREEN:** `ci/release/publish.py` CLI over `release_lib/publish.py`: reads the handoff, keeps distributeable entries in layer order, for each: integrity compare (D8), then `npm publish <tgz> --access public --tag <t> [--provenance] [--registry r] [--dry-run unless --yes]`. `handoff.py` writes `publish` entries and `publish-commands.sh`. Verdaccio is installed by the test with `npm exec --yes --package=verdaccio@<pinned>`.

**Refactor checkpoint:** `--verify` also checks that every `publish` entry's tarball exists and that its sha256 matches `tarballs`.

### Validation

```bash
python -m pytest ci/release/tests -q
MIROIR_PUBLISH_TEST=1 python -m pytest ci/release/tests/test_publish.py -q
```

### Realization

- Deviation: Verdaccio 6.10.5 as a devDependency failed the dependency-policy audit gate (critical handlebars advisories through `@verdaccio/hooks`, high `compression`; an `overrides` entry fixed compression but not the nested handlebars pin) and added ~2,900 lockfile lines. Reverted. `ci/release/tests/local_registry.py` (a `ThreadingHTTPServer`, ~100 lines) serves `PUT` and `GET` of a packument: 403 on an existing version, 404 on an unknown package, 401 without a token, `dist.integrity` computed from the stored tarball. The real `npm publish` and `npm view` talk to it through a temporary `.npmrc`.
- `release_lib/publish.py`: `publish_entries`, `publish_script`, `publish_handoff` (D8 skip-identical / stop-different); `ci/release/publish.py` CLI. `handoff.py` writes the `publish` entries and `publish-commands.sh` (chmod 755).
- `--verify` refuses a publish entry whose tarball is missing or whose SHA-256 differs from `tarballs`.
- 8 tests in `test_publish.py`, not gated (11 s): fast enough for every run.


---

## Slice 5 — The release commit holds no tarball and goes to a release branch with its tag

**Status:** ✅ DONE

**RED:** `test_release_version.py`, in a real git repository with a bare remote and a detached worktree: after `commit_tag_push(commit, tag, push)`, the commit has no `release-tarballs/` path; the remote has the tag and `refs/heads/release/<version>` pointing at the release commit; other local tags are not pushed. (Slice 0's characterization flips.)

**GREEN:** stage only manifests, lockfile, `lerna.json`, `release-plan.json`; push `HEAD:refs/heads/release/<v>` and `refs/tags/<v>`; refuse when the branch exists on the remote. The push leaves `--apply`: `release_version.py --record <handoff>` pushes the release worktree's tag and branch, and the workflow calls it in its own step after `publish.py` succeeds, so local and CI pushes share one code path. `--push` is kept as a refusal that names `--record`.

**Refactor checkpoint:** `commit_tag_push` split into `commit_and_tag` (in `--apply`) and `push_release` (after publish).

### Validation

```bash
python -m pytest ci/release/tests/test_release_version.py -q
```

### Realization

`commit_tag_push` split into `commit_and_tag` (stages `RELEASE_COMMIT_PATHS`, existing ones only, so a missing lockfile no longer makes the whole `git add` fail silently) and `push_release` (checks the tag points at HEAD, refuses when the remote has the branch or tag, pushes `HEAD:refs/heads/release/<v>` and `refs/tags/<v>` only). `release_version.py --record <handoff>` calls it; `--push` is refused with a message naming `--record`. 5 tests on a real repository, bare remote and detached worktree.


---

## Slice 6 — The workflow, the guards, the docs, the epic's acceptance

**Status:** ✅ DONE

**RED:**
1. `scripts/tests/test_release_workflow.py` (PR CI) on `publish-npm.yml`: the only trigger is `workflow_dispatch`; input `publish` is a boolean defaulting to false; the publish job has `environment: npm-publish`, `concurrency` without cancel, `permissions` exactly `contents: write` and `id-token: write`; npm is upgraded to a pinned version ≥ 11.5.1; `publish.py` gets `--yes` only behind `inputs.publish`; the record step runs only after the publish step and only when `publish` is true.
2. Same file: across `ci/`, `scripts/` and `.github/`, no `npm publish` outside `ci/release/release_lib/publish.py` and the workflow's call of `publish.py`.

**GREEN:** the workflow (actions pinned by SHA like `release-tree.yml`); `NPM_TOKEN` passed as `NODE_AUTH_TOKEN` when set. Docs: `ci/release/README.md` (publish section: workflow, fallback commands, first publish with a token then trusted publishers, recovery after a partial publish), `ci/release/HANDOFF.md` (the `publish` key), `docs/reference/release-process.md` (§ publish, checks, dist-tags), `docs/contributing/release-process.md` (points at the workflow), #621 analysis and plan (D4 revision, I8 ✅), this analysis's status.

**Epic tracer:** one real `release_version.py --version 0.5.0-rc.2 --since 0.5.0-rc.1 --apply --worktree --keep-worktree` on this branch, then `publish.py --handoff …` without `--yes`: every check passes, the 12 dry-run publishes print, nothing is published. Then, with the maintainer's go, a dispatch of the workflow with `publish: false` on GitHub.

**AC of #621:** package set (I6), MCP and CLI for deployed applications (I1), shell (I2), server library (I3), startup calls (I4), manifests and guards (I5), template and consumer test (I7), publish-ready pipeline (I8).

### Validation

```bash
python -m pytest scripts/tests -q
python -m pytest ci/release/tests -q
MIROIR_CONSUMER_TEST=1 MIROIR_PUBLISH_TEST=1 python -m pytest ci/release/tests -q
npm run nonreg:filesystem -- --runner shared
```

### Realization

- `publish-npm.yml` as planned, with one change: instead of `npm install -g npm@…` (refused by the `workflows` rule of `check_dependency_policy.py`), a step asserts that Node 24's npm is 11.5.1 or later. The release worktree is found by its `miroir-release-worktree-` prefix and exported as `RELEASE_WORKTREE`/`HANDOFF`; handoff, plan and `publish-commands.sh` are uploaded as an artifact.
- `scripts/tests/test_release_workflow.py`: 7 tests (triggers, dry-run default, permissions/environment/concurrency, `--yes` and `--record` only behind `inputs.publish`, provenance, the token only in the publish step, no other `npm publish`). The last one was checked against two planted calls.
- Docs: `ci/release/README.md` (Publish), `HANDOFF.md`, reference §1, §6, §6b, §7, §8, §8a, §9, §10e, §11, §12, the contributing page; #621 analysis (D4 revised) and plan (I8 ✅).

