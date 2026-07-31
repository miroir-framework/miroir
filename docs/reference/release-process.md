# Release Process Internals (#227)

This page is the authoritative technical reference for the **layered Lerna release-tree
producer** implemented under [`ci/release/`](../../ci/release/) for
[#227](https://github.com/miroir-framework/miroir/issues/227). It documents *how the
pipeline works internally*, not just how to invoke it. For step-by-step operator
instructions see [`ci/release/README.md`](../../ci/release/README.md).

> **Supersedes #223.** `docs/contributing/release-process.md` describes the earlier
> `scripts/release_tag.py` approach (#223), which is obsolete / on the wrong track and
> is not reused, extended, or depended on here. `ci/release/` never touches
> `scripts/release_tag.py` or its support modules.
>
> **Feeds #224.** [#224](https://github.com/miroir-framework/miroir/issues/224)
> ("produce multi-platform release artefacts") is a downstream consumer: it builds
> server/Electron/Docker/library-JSON artefacts from the already-versioned,
> already-built, already-validated release worktree this pipeline produces. #224 has
> no implementation yet (`ci/artefacts/` is a placeholder) and, per the handoff
> contract below, must never choose package versions or rewrite dependency ranges
> itself.

## 1. Files

```text
ci/release/
  release_version.py       # CLI entrypoint (plan / --apply / --verify)
  release_lib/
    workspace.py            # Package inventory, runtime vs dev dependency graphs
    plan.py                 # Lerna candidate discovery, closure, layering
    lerna_ops.py             # `lerna version` invocation, range/selection verification
    tarballs.py              # Per-layer build, `npm pack`, hashing, consumer validation
    handoff.py                # release-plan.json / release-handoff.json emission
    worktree.py                # Disposable `git worktree` helpers
    semver.py                   # Product SemVer parsing/increment
    common.py                    # ReleaseError, subprocess/JSON helpers
  HANDOFF.md                # #227 → #224 contract (schema reference)
  lerna-spike.md             # Encoded/proven Lerna invocation from the selection spike
  README.md
  tests/                     # pytest suite (`test_release_version.py`, `test_tarballs.py`)
```

## 2. Why this exists: the dev-only bootstrap edge

`miroir-core` and the two lowest deployment packages have a **build-time circular
reference** that is intentional in normal development:

- `miroir-core`'s `devBuild` (`generate-ts-types`) does a real value-level `import`
  from the *built* `miroir-test-app_deployment-miroir` and
  `miroir-test-app_deployment-admin` packages, to regenerate TypeScript types from
  their Jzod schema assets.
- Conversely, `miroir-test-app_deployment-miroir`'s `src/Model.ts` /
  `runnerMiroirEntityTestRegistry.ts` `import type { ... } from "miroir-core"`.

In every package's manifest, this pair of edges is declared with two **different
dependency kinds**, and that distinction is the crux of the whole release design:

| Edge | Kind | Package.json field |
|---|---|---|
| `miroir-core` → `deployment-miroir` / `deployment-admin` | **runtime** | `dependencies` |
| `deployment-miroir` / `deployment-admin` → `miroir-core` | **dev-only** | `devDependencies`, value `"*"` |

`"*"` is not an accident: it is the one static npm version specifier that npm's
workspace linker special-cases to always resolve to the local workspace package by
name, bypassing node-semver's normal rule that a pre-release version (e.g.
`0.5.0-rc.2`) only satisfies a range that itself carries a matching pre-release tag.
Any other spec (`^0.5.0`, or even the literal string `"0.5.0-rc.2"` used as a range)
would make `npm install`/`npm ci` fall back to the registry instead of the in-repo
build — 404ing on an unpublished pre-release, or worse, silently installing a stale
published version.

`ci/release/` operationalizes this exact distinction in code instead of leaving it as
convention.

## 3. Runtime vs dev dependency graphs (`release_lib/workspace.py`)

```12:13:ci/release/release_lib/workspace.py
RUNTIME_KINDS = ("dependencies", "peerDependencies")
DEV_KINDS = ("dependencies", "peerDependencies", "devDependencies")
```

`workspace_packages()` records both `runtime_dependencies` (RUNTIME_KINDS only) and
`all_dependencies` (DEV_KINDS) per package. Every downstream graph operation picks
one or the other deliberately:

| Operation | Uses | Effect on the bootstrap edge |
|---|---|---|
| `release_closure()` | runtime only | Selecting `miroir-core` auto-adds `deployment-miroir`/`-admin` to the release set (they're its runtime deps); their dev-only edge *back* to `miroir-core` never pulls anything in and is never required to "already be releaseable". |
| `topological_layers()` | runtime only | `deployment-miroir`/`-admin` have **no** runtime deps among selected packages → placed in the earliest layer (**P0**); `miroir-core` runtime-depends on them → placed in a later layer. This reproduces `build-all.sh`'s `STAGE_DEPLOY_BOOTSTRAP` → `STAGE_CORE` order, but derived automatically from dependency-kind classification instead of a hand-maintained stage list. |
| `find_cycles(..., runtime_only=True)` | runtime only | No cycle found (the dev-only back-edge is invisible here) → layering succeeds. |
| `find_cycles(..., runtime_only=False)` | all kinds | **Finds** the `miroir-core` ↔ `deployment-miroir`/`-admin` cycle, exposed as `dev_cycles` on the plan — reported for build context, never aborts the release. |

```110:116:ci/release/release_lib/plan.py
    runtime_cycles = tuple(
        find_cycles(packages, selected=selected, runtime_only=True)
    )
    if runtime_cycles:
        rendered = "; ".join(" <-> ".join(cycle) for cycle in runtime_cycles)
        raise ReleaseError(f"runtime dependency cycle: {rendered}")
    # Dev cycles are reported for build context; they do not abort release layering.
    dev_cycles = tuple(find_cycles(packages, selected=selected, runtime_only=False))
```

A genuine **runtime** cycle among selected packages is a hard error (`ReleaseError`);
a **dev-only** cycle is expected, tolerated, and simply surfaced in the plan.

## 4. Concrete-range verification exempts dev-only edges

After Lerna versions the selected closure, `verify_release_ranges()` checks that no
selected package still carries a `"*"` or `file:` internal range — but only for
`RUNTIME_KINDS`:

```64:81:ci/release/release_lib/lerna_ops.py
def verify_release_ranges(repo_root: Path, plan: ReleasePlan) -> None:
    packages = workspace_packages(repo_root)
    for name in plan.selected:
        manifest = load_json(packages[name].path)
        for kind in RUNTIME_KINDS:
            dependencies = manifest.get(kind, {})
            if not isinstance(dependencies, dict):
                continue
            for dependency in packages[name].runtime_dependencies:
                if dependency not in plan.selected or dependency not in dependencies:
                    continue
                value = dependencies[dependency]
                if value == "*" or (
                    isinstance(value, str) and value.startswith("file:")
                ):
                    raise ReleaseError(
                        f"{name} {kind} dependency {dependency} is not releaseable: {value!r}"
                    )
```

`deployment-miroir`'s `devDependencies["miroir-core"] = "*"` is never inspected by
this check and is explicitly allowed to survive, untouched, into the frozen release
tree. This is the direct enforcement of "never tighten the dev-only bootstrap edge to
a concrete range."

## 5. The disposable worktree still needs the same linking trick

`create_release_worktree()` (`worktree.py`) uses `git worktree add --detach <tmp> HEAD`.
Since `dist/` and `node_modules/` are both git-ignored, the fresh worktree starts with
**neither** — no pre-built `miroir-core`, no symlinks.

`apply_lerna_version()` (`lerna_ops.py`) runs, in order, inside that worktree:

1. Back up every package manifest + root `package.json` / `package-lock.json` / `lerna.json`.
2. `npx lerna version <product_version> --force-publish=<selected> --yes --no-git-tag-version --no-push --no-changelog --ignore-scripts`.
3. Restore the manifests of any package **outside** the selected closure (Lerna must
   not be allowed to permanently rewrite packages the release manager didn't approve).
4. Rewrite root `package.json` / `lerna.json` to the product version.
5. `npm install --package-lock-only --ignore-scripts` (lockfile sync).
6. `verify_selection_enforced()` — only selected packages changed version, nothing else.
7. `verify_release_ranges()` — see §4.
8. `npm ci --ignore-scripts`.

Step 8's `npm ci` must symlink `node_modules/miroir-core` to the worktree's own
(not-yet-built) `packages/miroir-core` — this is the exact `"*"`-bypasses-pre-release
-exclusion behavior from §2, now relied on a second time, inside a brand-new worktree,
for `npm ci` to succeed without hitting the registry.

Any failure at any step restores every backed-up file before raising.

## 6. Build → pack → validate, in runtime layer order

`build_pack_and_validate()` (`tarballs.py`) drives the rest of `--apply`:

```35:52:ci/release/release_lib/tarballs.py
def build_selected_packages(repo_root: Path, plan: ReleasePlan) -> None:
    """Build selected packages in P0…Pn runtime order."""
    packages = workspace_packages(repo_root)
    for layer_index, layer in enumerate(plan.layers):
        for name in layer:
            workspace = packages[name]
            if not workspace.has_build:
                continue
            result = run(
                [executable("npm"), "run", "build", "-w", name],
                cwd=repo_root,
                check=False,
            )
```

Layer **P0** (`deployment-miroir`, `deployment-admin`) builds first via
`npm run build -w <pkg>`, with `miroir-core` having no `dist/` yet in this worktree.
This still succeeds because `deployment-miroir/tsup.config.js` declares
`external: ['miroir-core']` and its only references to `miroir-core` are
`import type {...}` — fully erased by esbuild, so the JS build never resolves or
reads anything from `node_modules/miroir-core` at all. Layer **P1** then builds
`miroir-core` itself, which does genuine value-level imports of the now-built
`deployment-miroir`/`-admin` — by then they exist.

After building, `pack_layer()` runs `npm pack --json` for every selected package
(grouped under `release-tarballs/P<n>/`) and records `{package, layer, path, sha256,
distributeable}` into `release-tarballs/manifest.json`.

`validate_layer_consumer()` then, for each layer boundary, creates a throwaway
consumer project with `file:` dependencies on every tarball packed so far and runs
`npm install` there, asserting the installed `package.json` version matches the
product version — proof that resolution used the packed tarball, not a stray `"*"`
or registry hit. **Bundle-only layers are exempt**: if a layer contains no
`distributeable` package it returns immediately ("Bundle-only layers still pack, but
have no standalone consumer contract"). `deployment-miroir`/`-admin` are `"private":
true`, so `classify_packages()` marks them `bundle_only`, not `distributeable` — the
per-package clean-consumer check never applies to them, matching the "this
dependency is light / internal-only, no external contract" reasoning from §2.

## 7. Selection & versioning semantics

`build_plan()` (`plan.py`):

1. Resolve `base_ref` = `--since <ref>` or the latest reachable SemVer tag
   (`git tag --merged HEAD --sort=-version:refname`).
2. `lerna ls --since <base_ref> --json` → raw candidates.
3. `initial = (raw_candidates ∪ --force) − --disable` (validated: unknown names,
   force/disable overlap, duplicates, and disabling a non-candidate all fail fast).
4. `selected = release_closure(initial, packages)` — expands to the full runtime
   dependency closure (§3).
5. Reject if any `--disable`d package ended up back in the closure (a required
   runtime dependency cannot be disabled).
6. `topological_layers(packages, selected)` → `P0…Pn`; abort on a runtime cycle.
7. `product_version = increment(root_version, bump)` (`semver.py`):

   | Root before | `--bump` | Product version |
   |---|---|---|
   | `0.5.0` or `0.5.0-rc.N` | `patch` | `0.5.0` (a `patch` bump **promotes** an existing pre-release to the final version; only increments `Z` when the root has no pre-release suffix) |
   | `0.5.0` | `minor` | `0.6.0` |
   | `0.5.0` | `major` | `1.0.0` |

8. `classify_packages()` splits `selected` into `distributeable` (not `private`) and
   `bundle_only` (`private: true`).

The resulting `ReleasePlan` (dataclass) is printed as JSON on every invocation —
`--bump ... --since ...` **without** `--apply` is a pure, read-only dry run.

## 8. CLI reference (`release_version.py`)

```text
--bump major|minor|patch    Required unless --verify is used
--since <ref>                Base ref for `lerna ls --since`; defaults to latest reachable tag
--force <workspace>          Repeatable: add to Lerna candidates
--disable <workspace>        Repeatable: remove from Lerna candidates (must be a raw candidate; fails if a required runtime dependency)
--dry-run                     Explicit no-op: planning without --apply is always a dry run; rejected together with --apply
--apply                      Mutate: version, build, pack, validate (default is dry-run plan only)
--worktree                   Run --apply inside a disposable `git worktree` (recommended)
--keep-worktree               Do not delete the worktree after a successful --apply (a FAILED --apply always preserves it, regardless of this flag)
--skip-build                  Version + lockfile only; skip build/pack/consumer validation
--commit / --tag / --push     Explicit release commit / annotated product tag / push (push requires both)
--allow-dirty                  Allow --apply directly in a dirty tree without --worktree
--verify <release-handoff.json>  Validate an existing #227->#224 handoff descriptor and exit
```

### Transparency / safety behavior

- **stdout is data-only; stderr is narration.** Every `print(json.dumps(...))` call
  stays machine-parseable on stdout. All progress narration — including the exact
  command line of every subprocess invocation (`release_lib.common.run()` announces
  each one before executing it) — goes to stderr via `log_step()`, so a human watching
  the terminal is never staring at silence during a multi-minute `--apply`, and a
  script piping stdout to `jq`/`json.load` is never polluted by log lines.
- **`--apply` without `--worktree` prints an explicit warning** before mutating,
  since it changes the current working tree in place (including a real
  commit/tag/push if requested) rather than an isolated disposable copy.
- **A failed `--apply --worktree` always preserves the worktree** for post-mortem
  inspection, regardless of `--keep-worktree` — a failure is never auto-cleaned-up,
  and the error message prints the exact `git worktree remove --force <path>`
  command to clean it up once you're done.
- **`restore_files()` (the rollback used when `apply_lerna_version` fails) restores
  every backed-up file independently, with retries**, instead of aborting at the
  first failure. On Windows, a file Lerna/npm just wrote to can transiently refuse a
  follow-up write for a few hundred milliseconds; without per-file isolation, a
  single transient failure used to abort the whole rollback and leave *every
  subsequent* package manifest stuck at the failed release's version while the tool
  reported nothing beyond the original error. If any file still can't be restored
  after retries, the aggregated `ReleaseError` names every one of them explicitly.

```bash
# Dry run: show the plan only, no mutation
python ci/release/release_version.py --bump patch --since 0.5.0-rc.1

# Apply in a disposable worktree (recommended), keep it for inspection
python ci/release/release_version.py \
  --bump patch --since 0.5.0-rc.1 \
  --apply --worktree --keep-worktree

# Version + rewrite ranges only, skip the build/pack/validate stage
python ci/release/release_version.py --bump minor --since 0.5.0-rc.1 --apply --worktree --skip-build

# Verify a previously produced handoff
python ci/release/release_version.py --verify /path/to/release-worktree/release-handoff.json
```

## 9. Outputs and the #224 handoff contract

On a successful `--apply`, the release worktree contains:

| Artefact | Written by | Purpose |
|---|---|---|
| `release-plan.json` | `handoff.write_release_plan()` | Full selection, layers, versions, tarball metadata |
| `release-handoff.json` | `handoff.write_handoff_contract()` | Stable, versioned (`schemaVersion: 1`) contract for #224 |
| `release-tarballs/P<n>/*.tgz` | `tarballs.pack_layer()` | Packed packages per runtime layer |
| `release-tarballs/manifest.json` | `tarballs.pack_layer()` | Tarball paths + SHA-256 digests |
| Versioned `package.json` / `lerna.json` / `package-lock.json` | Lerna + `set_root_and_lerna_version()` | The release tree itself |

`release-handoff.json` embeds explicit constraints for the consumer:

```64:66:ci/release/release_lib/handoff.py
        "constraints": [
            "Do not choose package versions or rewrite dependency ranges in #224.",
            "Build platform artefacts only from this validated release worktree.",
```

i.e. by the time #224 (or any artefact pipeline) reads this file, the `miroir-core` ↔
`deployment-miroir`/`-admin` bootstrap question described in §2–§6 has already been
fully resolved and verified — #224 never needs to reason about it.

## 10. Relationship to normal `build-all.sh` development

| | Dev worktree (`build-all.sh`) | Release worktree (`ci/release/`) |
|---|---|---|
| Bootstrap edge value | Stays `"*"` forever | Stays `"*"` forever too (§4) — never rewritten |
| Runtime edges | Stay `"*"` during normal dev | Rewritten to the concrete product version by Lerna |
| Ordering mechanism | Hand-maintained `STAGE_*` arrays | Derived from `dependencies`/`peerDependencies` vs `devDependencies` classification (§3) |
| `node_modules` state | Long-lived, incrementally updated | Fresh per release, `npm ci`'d once versions/ranges are final |
| Validation | `npm run build` succeeding | + `npm pack` + isolated `file:` consumer install per distributeable layer (§6) |

## 11. Non-goals of the current implementation (v1)

Per the issue's acceptance criteria, explicitly **out of scope** until follow-up work:

- Pre-release lifecycle family (`premajor`/`preminor`/`prepatch`/`prerelease`,
  promotion) — `increment()` only supports `major`/`minor`/`patch`.
- Registry publish (`npm publish`) and GitHub Release upload — HITL/manual, and #224's
  responsibility at the earliest.
- A separate CI-only implementation — the same `ci/release/` entrypoint is meant to
  run locally and in CI.
- Changelog / release notes generation.

## 12. Tests

```bash
python -m pytest ci/release/tests -v
```

`ci/release/tests/test_release_version.py` and `test_tarballs.py` exercise plan
construction, layering/cycle detection, Lerna range verification, and the
build/pack/clean-consumer-validate pipeline.
