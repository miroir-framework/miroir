# 223 — Consistent git tagging for (pre-)releases

> Analysis of how Miroir should version and git-tag (pre-)releases as a local-first, HITL building block toward release CI. No implementation yet — decision framing + inventory.

Related issue: https://github.com/miroir-framework/miroir/issues/223  
Soft consumer: [#224 produce artefacts](https://github.com/miroir-framework/miroir/issues/224)  
Related epic (not parent): [#128 RELEASE 0.5.0](https://github.com/miroir-framework/miroir/issues/128)  
Placeholder docs: [`docs/contributing/release-process.md`](../../../docs/contributing/release-process.md)

**Status:** first analysis / design framing — **HITL** (human decides when to cut a tag).  
**Out of scope:** GitHub Release upload automation; artefact build (#224); artefact validation (`nonreg`).

---

## 1. Problem restatement

Cutting `0.5.0-rc.1` was manual: versions in the tree do not share one policy, git tagging is ad hoc, and artefact filenames embed a version string that must somehow agree with the git tag / GitHub Release.

| Observation | Evidence (current tree / history) |
|---|---|
| Only one release tag exists | `git tag` → `0.5.0-rc.1` (commit `2315aea`, May 2026) |
| Root + Electron carry the product version | `package.json` and `miroir-standalone-app-electron` = `0.5.0-rc.1` |
| Most packages ignore it | Many libs / stores / deployments = `0.0.0`; several apps / tools = `1.0.0` |
| Lerna independent version is stale | `lerna.json` → `"version": "0.0.0"` (not used as product version) |
| Docker tag is orthogonal | `ci/docker/build_miroir.sh` defaults to `miroir-framework/miroir:latest`; version must be passed explicitly |
| Release docs are empty | `docs/contributing/release-process.md` is a stub |
| No repo script for bump+tag | No `lerna version` / changeset / release script in root `package.json` |

**Goal of #223:** one documented convention + one local command that bumps the agreed files and creates the git tag (with dry-run / no-push), so later artefact production (#224) and manual GitHub Releases can consume a single version identity.

---

## 2. Place in the release workflow

```text
1. Tag (pre-)release packages     ← #223 (this issue)
2. Produce artefacts              ← #224 (soft dependency on version stamp)
3. Validate / test artefacts      ← existing nonreg (later CI building block)
4. Publish GitHub Release         ← manual this round (as 0.5.0-rc.1)
```

#223 must answer three questions before tooling lands:

1. **What is the canonical product version string?** (and how does it relate to the git tag)
2. **Which files must carry that string?** (vs may stay at `0.0.0` / independent)
3. **How do pre-release vs release tags differ?** (naming + GitHub `prerelease` flag — the latter remains manual)

---

## 3. Current version inventory

Snapshot of workspace `version` fields (private packages do not publish to npm today; several packages omit `"private": true` but are still workspace-internal).

| Location | Version | Role for product release |
|---|---|---|
| Root `package.json` | `0.5.0-rc.1` | **De facto product version** today |
| `miroir-standalone-app-electron` | `0.5.0-rc.1` | **Feeds electron-builder artefact names** (`${version}` in default patterns) |
| `lerna.json` | `0.0.0` | Unused / misleading for product tags |
| Stores, localcaches, deployments, core | `0.0.0` | Internal; workspace deps use `"*"` |
| `miroir-server`, `miroir-standalone-app`, `miroir-react`, `miroir-cli`, `miroir-ai`, `miroir-mcp`, … | `1.0.0` | Placeholder; **not** aligned with `0.5.0-rc.1` |
| Docker image tag | caller-supplied / `latest` | Not read from package.json |

**Implication for #224:** Electron (and any script that templates zip/tar names) already or will need a single stamp. Server zip names on the GitHub release (`miroir-server-nodejs-*-0.5.0-rc.1.zip`) were applied manually — they are not produced from `miroir-server`'s `1.0.0` today.

### 3.1 Existing git / GitHub release convention

| Aspect | `0.5.0-rc.1` practice |
|---|---|
| Git tag name | Same as SemVer string: `0.5.0-rc.1` (no `v` prefix) |
| GitHub Release name | `0.5.0-rc.1` |
| Pre-release flag | Yes (`isPrerelease: true`) |
| SemVer pre-release id | `rc.N` (dot form, not `rcN`) |

**Recommendation (baseline, open for confirmation):** keep **tag = SemVer string without `v`**, pre-releases use `X.Y.Z-rc.N`, final releases are plain `X.Y.Z`. Document that GitHub “Pre-release” checkbox is set manually when uploading.

---

## 4. Decision frame

| ID | Decision | Status | Choice |
|---|---|---|---|
| D1 | Source of truth for product version | Candidate | **D1-a** root `package.json` (pending confirm) |
| D2 | Which packages track the release version | **Accepted** | **B+** — root + release-facing binaries |
| D3 | Tag / commit / push / GitHub Release split | **Accepted** | bump+optional commit+tag locally; push opt-in; no `gh release` |
| D4 | Pre-release vs release distinction | **Accepted** | SemVer `-rc.N` (etc.) in tag/files; GitHub pre-release checkbox manual |
| D5 | Tooling (Lerna vs custom vs other) | **Accepted** | **D5-a** custom Python bump+tag — see spike results |
| D6 | Mutual deps / cycles at tag time | **Accepted** | Runtime cycles = no-go; dev cycles OK; never rewrite `"*"` |

### D1 — What is the source of truth for the product version?

| Option | Description | Pros | Cons |
|---|---|---|---|
| **D1-a. Root `package.json` only** ★ candidate | Root version is canonical; tagging flow reads/writes it; D2 allow-list packages are synced from root | Simple; matches current de facto practice | Root is **outside** Lerna’s package graph (see D5) |
| **D1-b. Lerna fixed mode as SoT** | `lerna.json` `version` is canonical; `lerna version` bumps packages | Matches Lerna’s native model; less custom code | Diverges from today’s root=`0.5.0-rc.1` practice; still need root sync for humans/CI that read root |
| **D1-c. External VERSION file** | Single `VERSION` or `release.json` consumed by scripts | Clear, language-agnostic | Yet another file; npm/electron/lerna still need sync |
| **D1-d. Independent package versions** | Only some binaries bumped; no single product SemVer | Minimal churn | Conflicts with one product tag / artefact naming (`0.5.0-rc.1`) |

**Suggested default for discussion:** **D1-a** — root canonical; B+ packages synced. Whether `lerna.json` is also updated is part of **D5** (Lerna path almost certainly wants it in sync).

### D2 — Which packages must track the release version?

**Status:** **Accepted — B+** (root + release-facing binaries).

Internal libraries stay off the allow-list and are **not** bumped per product release.

| Include in B+ allow-list? | Packages | Must match tag? |
|---|---|---|
| **Yes — root** | Root `package.json` | **Yes** |
| **Yes — release-facing binaries** | `miroir-standalone-app-electron`, `miroir-server`, `miroir-standalone-app`, `miroir-cli`, `miroir-mcp` | **Yes** — same SemVer as the git tag, in the same bump commit |
| **No — internal / non-product packages** | `miroir-core`, stores, localcaches, `miroir-react`, deployments, **`miroir-ai`**, … | **No** — keep `0.0.0` / placeholders |

**Clarification:** B+ does **not** mean every workspace package. It means every package that is itself a **shipped binary / entrypoint** (or the root stamp), not libraries consumed only inside the monorepo.

**Initial B+ allow-list (accepted):**

| Path | Include? |
|---|---|
| Root `package.json` | Yes |
| `packages/miroir-standalone-app-electron` | Yes |
| `packages/miroir-server` | Yes |
| `packages/miroir-standalone-app` | Yes |
| `packages/miroir-cli` | Yes |
| `packages/miroir-mcp` | Yes |
| `packages/miroir-ai` | **No** |

Further binaries can be added later by extending the same allow-list.

**Rejected for v1:** bumping binaries only when published to a registry — product SemVer is applied on each (pre-)release tag regardless of npm publish.

### D3 — Tag create vs push vs GitHub Release

**Status:** **Accepted.**

| Step | #223 scope? | Notes |
|---|---|---|
| Bump version files | Yes | Via chosen tooling (D5) |
| `git commit` (version bump) | Yes (optional flag) | Or leave commit to human |
| `git tag` (annotated preferred) | Yes | Local; dry-run mode |
| `git push` + `git push --tags` | Optional / explicit flag | Default **no push** for safety |
| `gh release create` | **No** | Manual this round |

### D4 — Pre-release vs release distinction

**Status:** **Accepted.**

| Mechanism | Role |
|---|---|
| SemVer pre-release suffix (`-rc.N`, later maybe `-beta.N`) | In git tag + version files — **#223** |
| GitHub Release “Pre-release” checkbox | Manual at upload time — **not automated** |
| Channel / branch policy (e.g. only tag from `main`) | Document only for v1 |

**Rule:** any version containing `-` is a pre-release tag; plain `X.Y.Z` is a release tag. Tooling may refuse to create a tag if working tree dirty / not on allowed branch (configurable; aligns with Lerna `allowBranch` if Lerna is chosen).

### D5 — Tooling stack (ADR): Lerna vs custom vs other

**Status:** **Accepted — D5-a** (custom Python bump+tag), after spike evidence.  
Full write-up: [`d5-spike-results.md`](./d5-spike-results.md) · plan: [`d5-lerna-spike-plan.md`](./d5-lerna-spike-plan.md).

Off-the-shelf Lerna was evaluated carefully (already a root dep; prefer not to re-own git tag machinery). The spike showed **hard misfit** with **D2 B+** and workspace `"*"` deps — not a preference for greenfield scripts.

#### D5 context — what “success” looks like

1. One explicit product SemVer (e.g. `0.5.0-rc.2`) written to **root + B+ packages**.
2. Internal packages left at `0.0.0` / placeholders (not rewritten).
3. One **repo-level** git tag equal to that SemVer (**no `v` prefix**, matching `0.5.0-rc.1`).
4. HITL: local dry-run; commit+tag yes; **no push by default**; **no** automated GitHub Release.
5. Repeatable by a human on Win/Mac/Linux (git-bash on Windows).

#### D5 options

| Option | Summary | Maintenance burden |
|---|---|---|
| **D5-b. Lerna `version` (fixed mode), possibly thin wrapper** | Configure existing Lerna; wrapper only for gaps | Low *if* config fits — **does not fit** (spike) |
| **D5-a. Custom Python bump+tag** ★ **Accepted** | Own JSON rewrite + git commit/tag for allow-list only | Owns bump/tag; avoids Lerna fixed-mode / dep-range damage |
| **D5-c. changesets / semantic-release** | Changelog-driven multi-package publish pipelines | New stack; poor fit for HITL product artefacts |

#### Spike evidence (2026-07-30) — why Lerna was ruled out

| Gate | Result | One-line evidence |
|---|---|---|
| L0 root name | Fail (blocker) | `"Miroir Framework"` invalid → misleading `ENOPKG` until renamed for the spike |
| L2 selective B+ | **Fail** | Scoped `--force-publish` still bumped **all 24** packages (`Assuming all packages changed`) |
| L10 `"*"` deps | **Fail** | Workspace `"*"` rewritten to `^0.0.0-spike.223`; lockfile ~229-line churn |
| L1 root SoT | Fail (expected) | Root version unchanged by `lerna version` |
| L5 / L8 tag+no-push | Pass | Annotated tag `0.0.0-spike.223`; push/releases skipped |

Mitigations (narrow `packages` glob, post-reset wrapper, independent mode) either break `lerna run`/`watch`, fight the lockfile, or wrong tag model — see spike results. **Lerna stays for run/watch; not for product version tagging.**

#### D5-a — Accepted implementation shape

Custom Python script (`scripts/release_tag.py` or equivalent):

- Allow-list = root + B+ (D2)
- Dry-run / preflight; refuse dirty tree / duplicate tag (configurable)
- Optional commit + annotated tag; **no `v` prefix**; push opt-in only
- Do **not** rewrite internal package versions or `"*"` workspace ranges
- Follow **§4 D6** (dependency / cycle rules) — fail closed on no-go graphs; do not research ad hoc

Optional hygiene (separate): rename root package to `miroir-framework` so everyday `lerna list` stops failing with ENOPKG.

### D6 — Mutual dependencies at tag / packaging time (implementer guideline)

**Status:** **Accepted** (policy). Present monorepo graph is **OK**. Implementers must enforce the checks below at tag time; they must **not** invent new versioning schemes mid-script.

#### D6.1 Snapshot of today’s graph (2026-07-30)

| Fact | Detail |
|---|---|
| Workspace protocol | Inter-package ranges are almost always `"*"` (link whatever is in the worktree) |
| Runtime cycles (`dependencies` only) | **None** among workspace packages |
| Dev cycles (`dependencies` + `devDependencies`) | **Yes**, among internals — e.g. `miroir-core` *dev→* `miroir-store-postgres` *dep→* `miroir-core`; core ↔ deployment packages via dev edges |
| B+ → B+ runtime edges | `miroir-server` → `miroir-mcp`; `miroir-standalone-app-electron` → `miroir-standalone-app` (acyclic) |
| B+ ↔ B+ mutual runtime cycle | **None** |

Lerna’s spike “ECYCLE” warnings match the **dev** cycles among internals; they are not product-tag blockers under this policy.

#### D6.2 Definitions (keep these sharp)

| Term | Meaning for #223 |
|---|---|
| **Runtime edge** | A in `dependencies` or `peerDependencies` of B (needed to *run* / *link* the shipped artefact) |
| **Dev edge** | A in `devDependencies` of B (build, test, or local tooling only) |
| **Same release cut** | All B+ + root stamped with the **same** product SemVer in one tag commit |
| **Previous release** | Any earlier git tag / delivered artefact SemVer (e.g. `0.5.0-rc.1` when cutting `0.5.0-rc.2`) |

#### D6.3 What the tag script must do (always)

1. **Bump versions only** on root + B+ `package.json` `version` fields (D2).  
2. **Leave all dependency range strings unchanged** — especially workspace `"*"`. Never rewrite `"*"` → `^<new-version>` (spike L10 showed why).  
3. **Preflight graph check** (can be a small Python helper):  
   - Build digraph of workspace packages using **runtime edges only**.  
   - If that digraph has a cycle → **abort** (no-go; see D6.4).  
   - Dev-only cycles → **warn at most**, do not abort.  
4. **Do not** try to topologically “publish order” packages for v1 — we are not npm-publishing the monorepo as independent versioned libs in this round. Artefacts are built from the tagged worktree (`"*"` resolves locally).

#### D6.4 No-go configurations (abort tag)

Refuse to create the product tag if any of these hold:

| # | No-go | Why | Present repo? |
|---|---|---|---|
| N1 | **Runtime cycle** among workspace packages (`dependencies` / `peerDependencies` only) | Two (or more) packages would need each other’s *new* version to install/run; `"*"` hides it in-workspace but any future registry publish or external consumer cannot resolve a coherent pair without a prior version | **No** — OK today |
| N2 | **Runtime cycle among B+ packages** (subset of N1) | Same-cut binaries mutually require each other’s new SemVer | **No** — OK today |
| N3 | Tag flow that **rewrites** workspace ranges to the new SemVer while a runtime cycle exists | Creates an uninstallable / undevelopable graph (Lerna spike behaviour) | Forbidden by D6.3.2 regardless |

**Not no-go (explicitly allowed):**

| # | OK pattern | Rationale |
|---|---|---|
| OK1 | **Dev cycles** (back-edge only in `devDependencies`) | Dev dependency **may** target a *previous* already-tagged release when consumed outside the workspace; inside the workspace `"*"` still links local sources. Present core ↔ store / deployment cycles are this class. |
| OK2 | **Acyclic B+ → B+** runtime deps (server→mcp, electron→standalone-app) | Same release cut: both get the new SemVer; `"*"` links both from the tagged tree. No chicken-and-egg. |
| OK3 | B+ → **internal** `"*"` deps while internals stay at `0.0.0` | Internals are not separately versioned products; they ship *inside* the B+ artefact build. Product SemVer lives on B+/root only. |
| OK4 | Future: a **devDependency** pinned to an explicit **previous** SemVer (e.g. `"0.5.0-rc.1"`) instead of `"*"` | Documents “tooling uses last delivered binary”; still OK. Do not pin a devDependency to the *new* version being tagged if that creates a publish-time cycle. |

#### D6.5 Choices locked for implementers (do not re-litigate in the PR)

| Choice | Decision |
|---|---|
| Dependency ranges at tag time | **Never modify** |
| Runtime cycle | **Hard fail** |
| Dev cycle | **Allow** (optional warn listing the cycle) |
| Same-cut B+ that depend on each other | **Allow** if the runtime graph stays acyclic; stamp **identical** SemVer |
| Internals version | **Do not bump** (D2) even if B+ depends on them |
| npm publish of workspace packages | **Out of scope** for #223; if added later, require acyclic runtime graph **or** pin cycle back-edges to a **previous** release — new ADR |
| What to do if someone adds a runtime cycle | Fix the package.json graph (move one edge to `devDependencies`, split packages, or pin back-edge to previous release) **before** tagging — do not special-case in the tag script |

#### D6.6 Minimal preflight pseudocode

```text
ALLOW = {root} ∪ B+
version := CLI --version

assert semver(version)
assert no git tag named version   # unless --force
assert worktree clean             # unless --allow-dirty / dry-run

G := digraph of workspace packages via dependencies ∪ peerDependencies
if G has a cycle:
    fail("runtime dependency cycle: " + cycle)
    # hint: move back-edge to devDependencies or pin to previous release

for each package.json:
    if package in ALLOW: set version field := version
    else: leave version field unchanged
    leave dependencies / devDependencies / peerDependencies unchanged

optional: commit + annotated git tag version (no "v" prefix); push only if --push
```

#### D6.7 When the graph changes (maintenance)

Re-run the runtime-cycle check whenever B+ membership or workspace dependency edges change. If a new **runtime** cycle appears, it is a **modelling bug** relative to this guideline — fix the graph, do not weaken N1.

---

## 5. Proposed local workflow (target UX)

Illustrative only — **D5-a** custom script:

```bash
# Dry-run / preflight: show version, B+ allow-list, tag name, push=no
python scripts/release_tag.py --version 0.5.0-rc.2 --dry-run

# Apply: bump root + B+ only, commit, annotated tag, no push
python scripts/release_tag.py --version 0.5.0-rc.2 --commit --tag

# Explicit push (off by default)
python scripts/release_tag.py --version 0.5.0-rc.2 --commit --tag --push
```

Behaviours to include for acceptance criteria:

- [ ] Dry-run / preflight prints planned version, files/packages, and tag name without mutating git (or clearly documents Lerna’s preview limitations)
- [ ] Refuse to tag if version already exists as a tag (unless `--force` documented as dangerous)
- [ ] Refuse dirty tree unless `--allow-dirty` (or only allow dirty for dry-run)
- [ ] Document pre-release vs release naming in `docs/contributing/release-process.md`
- [ ] Internal packages remain unbumped (D2)
- [ ] Dependency range strings (incl. `"*"`) are never rewritten (D6)
- [ ] Preflight aborts on **runtime** dependency cycles; dev cycles do not abort (D6)

Optional later (not required for #223 close):

- Auto-bump `rc.N` → next `rc.(N+1)` from current root version
- Sync Docker default tag suggestion for humans running `build-all.sh docker …`

---

## 6. Interaction with #224 (soft)

#224 needs a **stable version string** for artefact filenames (see `0.5.0-rc.1` asset list). Soft dependency means:

- #224 can define the artefact catalogue and build entry points without waiting for the script
- When stamping filenames / Electron `package.json` version / docker `--tag`, prefer reading **root (or Electron) version after #223 policy**, not inventing a second source

#223 should therefore export (document) one function or convention: *“product version = root `package.json` `version`; git tag = that string.”*

---

## 7. Documentation deliverable

Fill [`docs/contributing/release-process.md`](../../../docs/contributing/release-process.md) at least for:

1. Version numbering (SemVer + `rc.N`)
2. Git tag naming (no `v` prefix, aligned with `0.5.0-rc.1`)
3. Which packages are B+ vs internal (D2)
4. Dependency / cycle rules at tag time (D6 summary: runtime cycle = no-go; leave `"*"` alone; dev cycles OK)
5. Step-by-step: run script → (optional push) → build artefacts (#224) → `nonreg` → manual `gh release`
6. Explicit non-goals (no auto GitHub Release; no Lerna version for product tags)

---

## 8. Open questions (decision gate before implementation)

Settle these before writing the production workflow:

1. **Confirm D1-a?** Root canonical + sync of **D2 B+** (**D2 settled**). Spike confirmed root is **not** updated by Lerna (L1) — fits custom script writing root directly.
2. ~~Tier B optional?~~ **Settled:** B+ — root + release-facing binaries on every (pre-)release tag
3. ~~Initial B+ membership~~ **Settled:** root, electron, server, standalone-app, cli, **mcp**; **not** `miroir-ai`
4. ~~D3 / D4~~ **Settled** (no auto GitHub Release; SemVer pre-release suffix; push opt-in)
5. ~~D5~~ **Settled — D5-a** (custom Python); see [`d5-spike-results.md`](./d5-spike-results.md)
6. ~~Mutual deps / cycles~~ **Settled — D6** (runtime cycle = abort; dev cycles OK; never rewrite `"*"`)
7. **`lerna.json` role:** leave at `0.0.0` / ignore for product tags (do not drive releases from Lerna version)
8. **Commit policy:** always dedicated “chore: release X” commit vs retag already-bumped commit?
9. **Annotated vs lightweight tags?** Spike showed Lerna uses annotated — prefer annotated for custom script too
10. **Allowed branches** for non-dry-run tags? (`main` only vs any)
11. **Prefix `v`?** **Settled by practice + spike:** no `v`
12. ~~Optional hygiene: rename root `"name"`~~ **Done:** `miroir-framework`


---

## 9. Acceptance mapping

| Acceptance criterion (#223) | Analysis section |
|---|---|
| Versioning + git tag naming documented | §3.1, §7, D4 |
| Rule set for which packages track the tag | §4 D2 |
| Mutual deps / cycle handling at tag time | §4 D6 |
| Local repeatable bump+tag command | §5, D5-a (`scripts/release_tag.py`) |
| Pre-release vs release distinguishable | §4 D4 |
| Local / dry-run without CI | §5, D3 |

---

## 10. Suggested implementation slices (after decisions)

1. **Docs-first:** write convention into `release-process.md` (D2–D6; D1-a as plan default) — can land with TDD Phase 7 or earlier stub.
2. ~~D5 spike~~ **Done** — [`d5-spike-results.md`](./d5-spike-results.md); **D5-a** accepted.
3. **TDD implement** `scripts/release_tag.py` per [`tdd-implementation-plan.md`](./tdd-implementation-plan.md) (Phases 0–7).
4. **Smoke:** `--dry-run` on real repo; then optional local `--commit --tag` without `--push`.
