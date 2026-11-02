# 664 — Release pipeline ready to publish the `@miroir-framework/*` set

> The release pipeline (`ci/release/`) packs, checks and, only when the maintainer starts it, publishes the 12 packages of the published set to npmjs.org. This analysis settles which packages can be published, what a release packs, how the publish runs (with provenance), what is checked before, and what happens to the release commit after.

Related issue: https://github.com/miroir-framework/miroir/issues/664
Parent issue: [#621](https://github.com/miroir-framework/miroir/issues/621) (plan item I8, the last one) · Prerequisites: #643 ✅, #645 ✅, #649 ✅, #650 ✅, #652 ✅, #656 ✅, #658 ✅
Related analyses: [`../621-FEATURE-npm-packages/analysis.md`](../621-FEATURE-npm-packages/analysis.md) (W10, D2, D4), [`../658-FEATURE-create-app-consumer-test/analysis.md`](../658-FEATURE-create-app-consumer-test/analysis.md) (D7, D9: the flag flip left to this item)
Key sources: [`ci/release/release_version.py`](../../../ci/release/release_version.py), [`ci/release/release_lib/plan.py`](../../../ci/release/release_lib/plan.py), [`ci/release/release_lib/tarballs.py`](../../../ci/release/release_lib/tarballs.py), [`ci/release/release_lib/lerna_ops.py`](../../../ci/release/release_lib/lerna_ops.py), [`ci/release/release_lib/handoff.py`](../../../ci/release/release_lib/handoff.py), [`scripts/published-packages.json`](../../../scripts/published-packages.json), [`.github/workflows/release-tree.yml`](../../../.github/workflows/release-tree.yml)

**Status:** analysis, for review. Decisions D1 to D6 confirmed in grilling round 1 (all as recommended). D9 is waiting for your answer (recommendation used in the meantime). D7, D8 and D10 are new: they came out of reading the code and are proposed here.

**Document history.** This item revises #621 D4 ("the pipeline stops at validated tarballs, the maintainer runs `npm publish`"). Provenance can only be produced from CI, so the publish runs in a workflow that the maintainer starts by hand (round 1, Q3-c). The pipeline still never publishes on its own: no push, tag or schedule starts it. The written commands remain, as the fallback without provenance.

---

## 1. Goals

- **G1 — Publish a release from one click.** To put a Miroir version on npmjs.org with provenance, as the maintainer, I start one workflow with the version, and it publishes every package of the set in dependency order, or nothing when a check fails.
- **G2 — Nothing goes public by accident.** To keep control of what is public, as the maintainer, I can publish only the packages listed in the published set, and only by starting the workflow (or by running the written commands myself).
- **G3 — Know before publishing.** To avoid a broken or half-published release, as the maintainer, I am stopped before the first `npm publish` when a tarball would be refused by the registry, a version already exists, a dependency is missing from the registry, or the packed set does not install and run outside the workspace.
- **G4 — Users get stable versions by default.** To start projects on a stable version, as an application developer, `npm install @miroir-framework/core` and `npm create @miroir-framework/app` give me the latest release, not a release candidate.
- **G5 — Publish without CI.** To release when GitHub Actions is not available, as the maintainer, I get the exact publish commands, in order, for my own machine (without provenance).

## 2. Non-goals

- Publishing packages outside the set (`miroir-ai`, the server binary, the standalone app, Electron, examples, fixtures). Each joins later, with its own issue, by an entry in `scripts/published-packages.json` (D1).
- Platform artefacts (server zip, Electron, Docker) and the GitHub Release: #224, unchanged.
- Setting up the npm organisation, its tokens or trusted publishers on npmjs.org: the maintainer's account, documented here, not done by this item (D6).
- Changelogs, release notes, a `CHANGELOG.md`.
- Unpublishing or deprecating versions.
- A browser check of the generated project (#658 non-goal, unchanged).
- Running `ci/release/tests` in PR CI. The guards this item adds live in `scripts/tests`, which PR CI runs.

## 3. Decision record

| # | Decision | Choice | Serves | Status |
|---|---|---|---|---|
| D1 | Publishable packages | **exactly the 12 published names of `scripts/published-packages.json`**; `private` comes off the 8 that still carry it; `miroir-ai`, `miroir-server`, `miroir-standalone-app` become `private: true`; a guard keeps `private` equal to "not in the set" | G2 | Accepted (round 1, Q1-a) |
| D2 | What a release packs | **always the whole set at one version**, plus Lerna's change detection for the rest | G1, G3 | Accepted (Q2-a) |
| D3 | How the publish runs | **`publish-npm.yml`, `workflow_dispatch` only, `npm publish --provenance` per tarball in layer order; the pipeline also writes `publish-commands.sh`, without provenance** | G1, G2, G5 | Accepted (Q3-c) |
| D4 | Checks before publishing | **`npm publish --dry-run` per tarball; version not on the registry; external dependencies on the registry; clean-consumer check on all 12; #658 consumer test** | G3 | Accepted (Q4) |
| D5 | dist-tag | **prerelease → `next`, release → `latest`** | G4 | Accepted (Q5) |
| D6 | Registry credentials | **trusted publishing (OIDC) once each package exists; a granular `NPM_TOKEN` secret for the first publish** | G1 | Accepted (Q6) |
| D7 | Product version of a release | **new `--version <exact>`, exclusive with `--bump`** | G1 | Proposed |
| D8 | What a publish run does on a version that already exists | **skip a package whose registry integrity equals the tarball's, stop on any other** | G1, G3 | Proposed |
| D9 | Release commit and tag after publishing | **push the tag and a `release/<version>` branch, only after every package is published** (recommended; waiting for your answer) | G1 | Pending |
| D10 | Safety of the workflow itself | **`publish` input off by default (dry run), a GitHub environment `npm-publish`, one run at a time** | G2 | Proposed |

### D1 — Publishable packages

`private` was set on every package at the start of the project, to prevent a stray `npm publish`, not to mark what stays closed. Other packages will join the set, under MIT. So the published set decides, and `private` follows it:

| Package kind | `private` after this item |
|---|---|
| a `publishedName` of `scripts/published-packages.json` (12) | absent (false) |
| a folder bundled into another (`miroir-app-miroir`, `miroir-app-admin`, `miroir-localcache-redux`, `miroir-localcache-zustand`) | true (they reach users inside core and react) |
| anything else (14 packages: examples, fixture, `miroir-ai`, `miroir-server`, `miroir-standalone-app`, Electron, sandbox, homepage, diagram, `miroir-localcache`) | true |

The guard is one rule over every workspace package: `private` is false exactly when the name is a published name. Adding a package to the set is then one JSON entry and one flag, both reviewed in the same PR.

| Option | Pros | Cons |
|---|---|---|
| **D1-a. the 12, the rest private** ★ | nothing outside the set can be published, even by hand; one source of truth | three packages become `private` that were not |
| D1-b. the 12, plus the three non-private ones as they are | no change to those three | Lerna versions them and nothing stops their publish; they have no scoped name |
| D1-c. everything not bundled | — | examples and fixtures have no scoped names, manifests or consumer test |

### D2 — What a release packs

`build_plan` today selects Lerna's candidates since `--since` plus their runtime closure. With exact internal pins, an unchanged package must still be republished at the new version, or the pins of its dependents point at a version that does not exist. The plan therefore adds every published name to the selection, before the closure. Lerna still decides for the other packages (examples, the server binary, Electron), as #224 needs. Side effect: the #658 consumer test (which skips when a set package was not packed) always runs.

| Option | Pros | Cons |
|---|---|---|
| **D2-a. whole set, always** ★ | pins always resolve; consumer test always runs | an unchanged package gets a new version |
| D2-b. changed packages only | fewer versions | a dependent's exact pin can name an unpublished version |

### D3 — How the publish runs

npm's provenance needs an OIDC token from the CI provider, so `--provenance` fails on a laptop. The workflow `publish-npm.yml`:

| Step | What it does |
|---|---|
| trigger | `workflow_dispatch` only, inputs `version`, `since`, `publish` (D10) |
| setup | checkout with history, Node 24, npm upgraded to a pinned 11.x ≥ 11.5.1 (trusted publishing needs it; Node 22 ships npm 10), Python + pytest, `npm ci` |
| tests | `python -m pytest ci/release/tests -q` |
| apply | `release_version.py --version <v> --since <ref> --apply --worktree --keep-worktree --commit --tag` (all checks of D4) |
| publish | `ci/release/publish.py --handoff <worktree>/release-handoff.json --provenance [--yes]`, layer by layer |
| record | D9, only when `publish` is on and every package succeeded |

`publish.py` is the only code that may run `npm publish` without `--dry-run`, and only with `--yes`. Without `--yes` it runs every command with `--dry-run`. `release_version.py --apply` also writes `publish-commands.sh` next to the handoff: the same commands, without `--provenance`, for D3's fallback and for review before starting the workflow.

| Option | Pros | Cons |
|---|---|---|
| D3-a. workflow only | provenance | no way to release when Actions is down |
| D3-b. written commands only | maintainer runs every command | no provenance, which the epic asks for |
| **D3-c. both** ★ | provenance normally, a fallback otherwise | two paths to document |

### D4 — Checks before anything is published

| # | Check | Where | State today |
|---|---|---|---|
| 1 | `npm publish --dry-run --tag <t> --access public` on each tarball (registry manifest rules, no credentials needed: checked on a create-app tarball, npm 10.9.9) | `--apply`, after packing | missing |
| 2 | `npm view <name>@<version>` returns 404 for each package of the set | `--apply` and `publish.py` (D8) | missing |
| 3 | every external dependency resolves from the registry | the clean consumer (check 4) installs the tarballs with `npm install`, which fetches every external dependency of the set from npmjs.org; it fails when one is missing | covered once check 4 runs on all 12 |
| 4 | clean-consumer install of each layer covers all 12 | `validate_layer_consumer` | skips the 8 private packages (`classify_packages`) |
| 5 | #658 consumer test | `run_consumer_test` | skips when a set package was not packed (D2 fixes) |

Check 3 adds no code: a separate `npm view` per external dependency would repeat what the consumer install already proves. `publint` and `are-the-types-wrong` were not proposed: #643 and #649 already check exports and declarations.

### D5 — dist-tag

npm moves `latest` to whatever is published without `--tag`, so a `0.5.0-rc.2` published plainly becomes what `npm create @miroir-framework/app` installs. The tag is derived from the version: a `-` in it means prerelease, as in `docs/contributing/release-process.md`. While nothing is published yet, the first `0.5.0-rc.x` is the only version, and npm installs it either way.

### D6 — Registry credentials

| Situation | How the workflow authenticates |
|---|---|
| first publish of a package (not on npmjs.org yet) | `NPM_TOKEN` repository secret (a granular token with publish rights on the scope), `--provenance` with the job's OIDC token |
| later publishes | npm trusted publishing: the maintainer registers `miroir-framework/miroir`, `publish-npm.yml` and the `npm-publish` environment as trusted publisher of each package on npmjs.org; the token can then be deleted |

A trusted publisher can only be attached to a package that exists (npm has no pending publisher), and it needs npm ≥ 11.5.1. Source: npm's trusted-publishers docs and third-party write-ups, read through a web search: `docs.npmjs.com` is not reachable from this session, so the maintainer should confirm the steps on that page. The workflow uses `NPM_TOKEN` when the secret is set and OIDC otherwise.

### D7 — Product version of a release (proposed)

`release_version.py` only takes `--bump major|minor|patch` (`semver.increment`). From `0.5.0-rc.1`, `patch` gives `0.5.0` and nothing gives `0.5.0-rc.2`. The legacy `scripts/release_tag.py` takes `--version`. Proposal: `--version <exact>` (validated by `parse_semver`, must differ from the current version and have no tag yet), exclusive with `--bump`. The workflow asks for a version, not a bump: the maintainer types what will appear on npmjs.org.

### D8 — A version that already exists (proposed)

npm versions are immutable. If the publish of layer P3 fails after P0 to P2 went out, a rerun of `publish.py` on the same release worktree must not stop at P0. For each package, `publish.py` compares `npm view <name>@<version> dist.integrity` with the tarball's own `sha512` integrity: equal means already published by this release, skipped; different means another build took the version, stop. A CI rerun builds new tarballs, so after a partial publish in CI the way forward is the next version (documented).

| Option | Pros | Cons |
|---|---|---|
| D8-a. stop on any existing version | simplest | a local rerun after a network error cannot finish |
| **D8-b. skip identical, stop on different** ★ | a local rerun finishes the release | one `npm view` per package |
| D8-c. `--skip-existing` flag | explicit | can hide a different build behind the same version |

### D9 — Release commit and tag (pending your answer)

The release worktree is created with `git worktree add --detach` (`worktree.py`). `commit_tag_push` then runs `git push`, which fails on a detached HEAD, and `git push --tags`, which pushes every local tag. It also stages `release-tarballs/`, which `.gitignore` does not exclude, so a `--commit` puts megabytes of tarballs into the release commit. Whatever D9's answer, those three get fixed: no tarballs in the commit, push only the release tag, push the commit to an explicit branch.

| Option | Pros | Cons |
|---|---|---|
| **D9-a. push the tag and `release/<version>`, after every package is published** ★ | the tag records what was published; the version bump comes back through a reviewed PR into `_integration` | one branch per release to merge |
| D9-b. push the tag only | nothing to merge | the version bump is on no branch; the next release starts from the old versions |
| D9-c. push nothing; the commit is a workflow artifact | CI never writes to the repository | the maintainer tags and pushes by hand |

### D10 — Safety of the workflow (proposed)

| Measure | Effect |
|---|---|
| input `publish`, boolean, default `false` | a run that is not explicitly asked to publish runs everything with `--dry-run` |
| `environment: npm-publish` on the publish job | the maintainer can add required reviewers in the repository settings; trusted publishing can be bound to it |
| `concurrency: npm-publish`, no cancel | two runs never publish at once |
| `permissions: contents: write, id-token: write` only on the publish job | the token can push the tag (D9) and sign provenance, nothing else |

## 4. Current state

### 4.1 Packages and `private` (enumerated from `packages/*/package.json`)

| Group | Packages | `private` today | After D1 |
|---|---|---|---|
| set, already public | `@miroir-framework/env`, `/mcp`, `/cli`, `/create-app` | false | false |
| set, still private | `@miroir-framework/core`, `/react`, `/server`, `/store-bundled`, `/store-filesystem`, `/store-indexeddb`, `/store-mongodb`, `/store-postgres` | true | **false** |
| bundled into another | `miroir-app-miroir`, `miroir-app-admin`, `miroir-localcache-redux`, `miroir-localcache-zustand` | true | true |
| outside the set, not private | `miroir-ai`, `miroir-server`, `miroir-standalone-app` | false | **true** |
| outside the set, private | the 11 others: `miroir-example-{designer,github,library,postgres,spotify}`, `miroir-fixture-appForTest`, `miroir-homepage`, `miroir-diagram-class`, `miroir-localcache`, `miroir-sandbox`, `miroir-standalone-app-electron` | true | true |

All 12 set packages already have `publishConfig.access: public` and `license: MIT` (#643, #650). Their runtime dependencies inside the workspace are all set packages (checked: core is the only internal dependency of env, mcp, react, the stores; server adds mcp; cli adds env, server and three stores as peers; create-app has none), so the set is closed under runtime dependencies.

Two tests assert the old flags and change with D1: `scripts/tests/test_server_library_boundaries.py::test_library_stays_private_until_the_publish_item` and the plan fixture of `ci/release/tests/test_release_version.py` (its `private` flags drive `distributeable`).

### 4.2 Release plan (`plan.py`)

```python
# ci/release/release_lib/plan.py, classify_packages
distributeable = tuple(sorted(name for name in selected if not packages[name].private))
bundle_only = tuple(sorted(name for name in selected if packages[name].private))
```

`build_plan` selects `(lerna candidates | --force) - --disable`, then `release_closure`. Nothing reads `scripts/published-packages.json`. `product_version = increment(root_version, bump)`.

### 4.3 Build, pack, validate (`tarballs.py`)

`build_pack_and_validate` builds each layer, `pack_layer` writes `release-tarballs/Pn/*.tgz` and `manifest.json`, `validate_layer_consumer` installs P0…Pn in a temporary consumer but returns early when no `distributeable` package is in the layers (today: P0 with core). `run_consumer_test` (#658) runs the generated project and skips when `missing_tarballs` is not empty. No `npm publish` in any form.

### 4.4 Handoff (`handoff.py`)

`release-handoff.json` (schema 1) lists layers, selected, distributeable, bundleOnly, tarballs (package, layer, path, sha256, distributeable). No publish entry. #224 reads it; new keys are additive.

### 4.5 Commit and push (`lerna_ops.commit_tag_push`)

Stages `package.json package-lock.json lerna.json packages release-plan.json release-tarballs` (`check=False`), commits `release: <v>`, tags `<v>` annotated, `git push` + `git push --tags`. See D9 for its three defects.

### 4.6 Versions

Root `package.json` `0.5.0-rc.1`, every package `0.5.0-rc.1`, `lerna.json` `0.5.0-rc.2` (out of step, harmless: `set_root_and_lerna_version` rewrites both). Remote tag: `0.5.0-rc.1` only. On npmjs.org: `@miroir-framework/jzod` and `jzod-ts` 1.0.0 (core's dependencies); no `@miroir-framework/core`.

### 4.7 Workflows

`release-tree.yml` (`workflow_dispatch`) runs `ci/release/tests` and a dry-run plan. No workflow has `id-token: write`. `pr-checks.yml` runs `scripts/tests`, not `ci/release/tests`.

## 5. Key reuse

| Piece | Location |
|---|---|
| published set, bundled folders | `scripts/published-packages.json`, `BUNDLED_INTO_ANOTHER` in `scripts/tests/test_package_manifests.py` |
| plan, layers, closure | `ci/release/release_lib/plan.py`, `workspace.py` |
| pack + consumer check + consumer test | `ci/release/release_lib/tarballs.py`, `consumer_project.py` |
| handoff writer and `--verify` | `ci/release/release_lib/handoff.py`, `release_version.py verify_handoff` |
| SemVer parse | `ci/release/release_lib/semver.py parse_semver` |
| prerelease rule (`-` in the version) | `docs/contributing/release-process.md` |
| workflow skeleton (pinned actions, Node, Python, `npm ci`) | `.github/workflows/release-tree.yml` |

## 6. Next

Implementation phasing: [`tdd-implementation-plan.md`](./tdd-implementation-plan.md).
