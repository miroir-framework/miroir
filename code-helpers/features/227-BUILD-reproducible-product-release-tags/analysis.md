# 227 — Lerna-managed release production

> Analysis for [#227](https://github.com/miroir-framework/miroir/issues/227). This is a new CI-folder release producer. It does not reuse, extend, depend on, or preserve the policy of issue #223.

## 1. Objective

Produce a release from a Git worktree with a single target bump (`major`, `minor`, or `patch`) and a human-refined set of packages.

Unlike normal workspace development, release production must rewrite internal `"*"` dependency ranges to releaseable version ranges. The produced package manifests and lockfile describe a distributable release graph; the source-worktree `"*"` ranges remain a development convenience before the release process runs.

The implementation lives under `ci/release/`:

```text
ci/release/
  release_version.py       # CLI entrypoint
  release_lib/             # plan, layers, Lerna ops, tarballs, handoff
  HANDOFF.md               # #227 → #224 contract
  lerna-spike.md           # encoded Lerna version invocation
  README.md
  tests/
```

#227 must not modify `scripts/release_tag.py` or its support modules. Platform
artefact assembly remains #224 and consumes `release-handoff.json`.


## 2. Primary release use case

**Actor:** release manager  
**Inputs:** a bump target (`major` / `minor` / `patch`), optionally a base ref, and optional selection overrides.

1. Find the previous reachable release tag, or use `--since <ref>`.
2. Ask Lerna for packages changed since that base:

   ```bash
   npx lerna ls --since <ref> --json
   ```

3. Show the raw Lerna candidates to the release manager.
4. Refine the candidate set:
   - `--force <package>` adds a package Lerna did not identify;
   - `--disable <package>` removes a Lerna candidate.
5. Calculate the next product version from root `package.json` and the requested target.
6. Version the final selected package graph with Lerna, including internal dependency-range rewrites and the root lockfile update.
7. Synchronize root `package.json` to the chosen product version.
8. Validate the produced release tree.
9. On explicit confirmation, create a release commit/tag and optionally push.

Example intended command:

```bash
ci/release/release-version.sh \
  --bump minor \
  --since 0.5.0-rc.1 \
  --force miroir-cli \
  --disable miroir-ai \
  --dry-run
```

## 3. Version model

The release target is one **product SemVer**. Its next value is obtained by incrementing the root package's current version:

| Root before | Target | Product version |
|---|---|---|
| `0.5.0` | `patch` | `0.5.1` |
| `0.5.0` | `minor` | `0.6.0` |
| `0.5.0` | `major` | `1.0.0` |

The selected packages receive the product version generated for that release. Lerna then rewrites internal dependencies in the release graph to the corresponding selected-package version/range according to its configured policy. This is intentional: a packed or published package must not retain a floating `"*"` dependency.

Unselected packages require an explicit policy that the spike must settle:

1. **Include closure:** automatically add any required internal dependency of a selected package to the release set, so it receives the product version too.
2. **Previous-release edge:** leave an unselected dependency at its existing released version and rewrite the selected dependent to that concrete range.
3. **Bundle-only edge:** allow the dependency only if the release artefact bundles it and no external npm installation contract exists.

V1 should choose **include closure** unless an artefact has a clearly tested bundle-only contract. It yields a coherent release graph and avoids emitting a dependency range for a local package version that was never released.

## 4. Lerna responsibilities and observed behaviour

Lerna is the release engine for this issue:

| Concern | Lerna responsibility |
|---|---|
| Candidate discovery | `lerna ls --since <ref> --json` maps Git changes to workspace packages. |
| Selected package versioning | `lerna version <target>` applies the product target to changed/forced packages. |
| Internal dependency release ranges | Lerna updates local dependency ranges as part of versioning. |
| Lockfile synchronization | Lerna updates the root lockfile through npm. |
| Git release artefacts | Lerna can create a commit/tag; the wrapper controls whether those effects are enabled. |

Observed against the installed Lerna 9.0.5:

- `npx lerna ls --since 0.5.0-rc.1 --json` returns machine-readable changed-package candidates.
- `npx lerna changed --since …` is not supported; use `lerna ls --since`.
- Lerna's version command exposes `--force-publish`, `--no-git-tag-version`, `--no-push`, `--exact`, and `--ignore-scripts`.

### 4.1 Critical selection spike

Lerna's documented `--force-publish=<packages>` adds packages to the version operation; it does not by itself prove that an operator can remove a changed package. Its `--ignore-changes` option filters **file globs**, not an arbitrary final package set.

Before implementation, run a disposable-worktree spike that proves one of these designs:

1. Lerna supports a command/configuration combination that versions exactly the refined set; or
2. the wrapper materializes an approved temporary release configuration that makes the refined set Lerna's effective graph; or
3. the workflow refuses a disable when it would cause Lerna to version an excluded package, with a clear reason.

The spike must compare every changed manifest and lockfile entry with the reviewed plan. If Lerna cannot honor the refined set, this issue cannot claim `--disable`; either add a Lerna-compatible selection mechanism or narrow the use case honestly.

## 5. Interface and selection semantics

```text
--bump major|minor|patch         Required product target
--since <tag-or-ref>             Defaults to previous reachable release tag
--force <workspace>              Repeatable: add to Lerna candidates
--disable <workspace>            Repeatable: remove from Lerna candidates
--dry-run                        Print plan; no manifest, lockfile, Git, or remote changes
--commit                         Create one release commit
--tag                            Create one annotated product tag
--push                           Push only with --commit and --tag
--allow-dirty                    Explicitly relax clean-worktree protection
```

The dry-run must show:

- selected base ref and product version;
- raw Lerna candidates;
- forced additions and disabled removals;
- dependency-closure additions;
- every package version and rewritten internal dependency range;
- files expected to change;
- intended release tag, commit, and push state.

Validation:

- Workspace names must exist; duplicate names and `--force`/`--disable` conflicts fail.
- The root is always part of the product release and is not selectable.
- Follow SemVer's normal increment semantics: a `patch` target promotes
  `X.Y.Z-rc.N` to `X.Y.Z`; `minor` and `major` advance their respective core
  components. A later pre-release command family can create/advance `rc` values.
- A dirty tree, missing base ref, existing tag, invalid SemVer, or unresolved dependency closure fails before mutation.

## 6. Release-tree validation

After Lerna versioning, verify the dedicated clean release worktree—not a
developer's normal worktree:

1. Every selected package has the planned product version.
2. Every internal runtime/peer dependency is a concrete release range, not `"*"` or a local file/link reference.
3. The selected package graph is closed under the chosen policy.
4. Root `package.json`, `lerna.json`, and `package-lock.json` agree with the target version and pass `npm ci`.
5. `npm pack --dry-run` for each externally distributed package contains no unexpected local-worktree links.
6. A small temporary consumer can install and load each package that is intended for npm distribution.

This validates that rewriting `"*"` is useful release work rather than merely broad churn.

## 7. Other relevant use cases

| Priority | Use case | Purpose |
|---|---|---|
| P1 | Root-only release | Release the product version with an empty package selection. |
| P1 | First release / release branch | Supply `--since <ref>` when there is no suitable prior reachable tag. |
| P1 | Forced hotfix package | Add an unchanged package with `--force`. |
| P1 | Disabled non-release change | Remove a docs/tests-only candidate, subject to the Lerna selection spike. |
| P2 | Explicit package-set release | Skip Lerna discovery but still use Lerna for release graph production. |
| P2 | Pre-release lifecycle | `premajor`, `preminor`, `prepatch`, `prerelease`, promotion, and a required preid. |
| P2 | Changelog / release notes | Let Lerna conventional-commit support or a dedicated tool generate notes after package selection is sound. |
| P3 | CI invocation | Run the same `ci/release/` entrypoint in CI, never a separate CI-only implementation. |
| P3 | Registry publish / GitHub release upload | Explicit later phase after the release tree and package-consumer checks pass. |

## 8. Implementation phases

1. Create `ci/release/` with a read-only discovery/plan command using Lerna JSON.
2. Implement force/disable validation and dependency-closure calculation.
3. Execute and record the Lerna selection/versioning spike in a disposable worktree.
4. Encode the proven Lerna invocation and root-version synchronization.
5. Add release-tree validation (`npm ci`, package range checks, `npm pack --dry-run`, consumer smoke).
6. Add optional commit/tag/push with a dry-run and explicit confirmation gate.
7. Run the same entrypoint in CI after the local workflow is stable. Existing
   workflows that delete `package-lock.json` and run `npm install` cannot be
   release validation until they stop regenerating the release lockfile.

## 9. Completion criteria

#227 is complete when a release manager can choose a SemVer target, review Lerna's changed-package candidates since a prior tag, force or disable packages within a proven Lerna-compatible selection mechanism, and produce a validated release tree whose internal `"*"` ranges have been rewritten for distribution.
