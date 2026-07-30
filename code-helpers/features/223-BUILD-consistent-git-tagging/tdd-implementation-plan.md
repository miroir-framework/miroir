# Issue #223 — TDD Implementation Plan

## Scope

Local-first **product (pre-)release tagging**: bump root + B+ package `version` fields to one SemVer, guard mutual-dependency rules (D6), optionally commit + create an annotated git tag **without** `v` prefix. No GitHub Release automation. No Lerna `version`.

Converts analysis ADRs **D2–D6** (+ **D1-a** as plan default) into vertical red→green slices for a Python CLI.

Related:

- Issue: https://github.com/miroir-framework/miroir/issues/223
- Analysis / ADR: [`./analysis.md`](./analysis.md)
- Spike (D5): [`./d5-spike-results.md`](./d5-spike-results.md)
- Soft consumer: https://github.com/miroir-framework/miroir/issues/224

**Out of scope:** artefact builds (#224), `nonreg` gating, `gh release create`, changing `"private"` flags, npm publish.

**Prerequisite (done before Phase 0):** root `package.json` `"name"` renamed `"Miroir Framework"` → `miroir-framework` (unblocks Lerna; spike L0).

---

## Progress summary

| Phase | Title | Status | Notes |
|---|---|---|---|
| 0 | Lock defaults, module layout, test harness | ✅ DONE | pytest harness green |
| 1 | SemVer validate + pre-release classify | ✅ DONE | `semver_util.py` |
| 2 | Allow-list + bump `version` only (preserve deps) | ✅ DONE | `allowlist.py`, `bump.py` |
| 3 | Runtime cycle abort / dev cycle allow (D6) | ✅ DONE | `dep_graph.py`, cycle gate in `plan.py` |
| 4 | Dry-run plan (no filesystem/git mutation) | ⬜ TODO | |
| 5 | Apply bump to a real directory tree | ⬜ TODO | |
| 6 | Git commit + annotated tag (temp repo) | ⬜ TODO | |
| 7 | CLI flags + push opt-in / docs | ⬜ TODO | |

---

## Locked implementation defaults (for this plan)

Unresolved analysis §8 items are locked here so TDD does not stall. Revisit only with an ADR note in `analysis.md`.

| Open item | Choice for this plan |
|---|---|
| D1 SoT | **D1-a** — root `package.json` `version` is canonical; B+ synced to the same string |
| Commit policy | With `--commit`: always create a new commit `chore: release <version>` containing only the allow-listed `package.json` edits (and nothing else). Without `--commit`: write files only; caller commits |
| Tag style | **Annotated** tag; message `release <version>`; name = SemVer string (**no** `v` prefix) |
| Allowed branches | **Any branch** in v1 (document; no `allowBranch` enforcement). Optional `--require-branch` later |
| `lerna.json` | **Do not modify** |
| Dirty tree | Refuse apply/tag unless `--allow-dirty` or `--dry-run` |
| Duplicate tag | Refuse unless `--force` (documented dangerous; overwrites local tag only, never push-by-default) |
| Push | Only with explicit `--push` (implies tag+commit already done); default off |
| Test runner | **`pytest`** (`python -m pytest scripts/tests -v`) |
| Git in tests | Prefer **real `git` in temp dirs** for Phase 6+; fake runners only for “push was/wasn’t invoked” |

---

## Target public interface

Deep module, small CLI surface. Pure library callable without git for most phases.

### Package layout

```text
scripts/
  release_tag.py              # CLI entry (thin)
  release_tag_lib/
    __init__.py
    allowlist.py              # B+ paths / names
    semver_util.py
    bump.py                   # read/write version fields
    dep_graph.py              # runtime vs dev edges, cycle detect
    plan.py                   # ReleasePlan dataclass + build_plan / apply_plan
    git_ops.py                # GitRepo port + real subprocess impl
  tests/
    test_semver_util.py
    test_bump.py
    test_dep_graph.py
    test_plan_dry_run.py
    test_plan_apply.py
    test_git_ops.py
    test_cli.py               # optional end of Phase 7
```

### Library API (behaviors to test)

```python
# allowlist.py
BPLUS_PACKAGE_NAMES: frozenset[str]
def release_manifest_paths(repo_root: Path) -> list[Path]:  # root + B+ package.json

# semver_util.py
def parse_product_version(s: str) -> str:  # normalize/validate; raise ValueError
def is_prerelease(version: str) -> bool     # True iff '-' in version (D4)

# bump.py
def read_package_version(path: Path) -> str
def bump_package_version(path: Path, version: str) -> bool
# returns True if file changed; MUST leave dependencies/devDependencies/peerDependencies byte-stable
# (or JSON-equal for those keys)

# dep_graph.py
@dataclass(frozen=True)
class Cycle:
    nodes: tuple[str, ...]   # package names

def workspace_package_jsons(repo_root: Path) -> dict[str, Path]
def find_runtime_cycles(repo_root: Path) -> list[Cycle]
def find_dev_involving_cycles(repo_root: Path) -> list[Cycle]  # optional warn path

# plan.py
@dataclass
class ReleasePlan:
    version: str
    files_to_bump: list[Path]
    is_prerelease: bool
    runtime_cycles: list[Cycle]
    # ...

def build_release_plan(repo_root: Path, version: str) -> ReleasePlan
# raises if version invalid OR runtime_cycles non-empty

def apply_release_plan(plan: ReleasePlan) -> None  # writes version fields only

# git_ops.py
class GitError(Exception): ...
class GitRepo:
    def __init__(self, root: Path, runner=subprocess.run): ...
    def status_porcelain(self) -> str
    def tag_exists(self, name: str) -> bool
    def commit_release(self, version: str, paths: list[Path]) -> None
    def create_annotated_tag(self, version: str, *, force: bool = False) -> None
    def push_commit_and_tags(self) -> None  # only called when CLI --push
```

### CLI (`release_tag.py`)

```bash
python scripts/release_tag.py --version 0.5.0-rc.2 --dry-run
python scripts/release_tag.py --version 0.5.0-rc.2                 # write files only
python scripts/release_tag.py --version 0.5.0-rc.2 --commit --tag
python scripts/release_tag.py --version 0.5.0-rc.2 --commit --tag --push
# flags: --allow-dirty, --force (tag)
```

Exit non-zero on validation / runtime-cycle / dirty / duplicate-tag failures.

### Root npm script (optional Phase 7)

```json
"release:tag": "python scripts/release_tag.py"
```

---

## Test execution conventions

```bash
# from repo root
python -m pytest scripts/tests -v

# single module while iterating
python -m pytest scripts/tests/test_bump.py -v
```

`scripts/tests/conftest.py` prepends `scripts/` to `sys.path` so `import release_tag_lib` works without setting `PYTHONPATH`.

Fixtures: build tiny synthetic workspace trees under `tempfile.TemporaryDirectory` — do **not** mutate the real monorepo in unit tests. One optional Phase 7 dry-run against the real repo is manual smoke, not a pytest case.

---

## Phase 0 — Lock defaults, layout, harness

**Goal:** empty-passing harness + documented defaults; no product behavior yet.

### Behaviors

| ID | Behavior |
|---|---|
| 0.1 | `python -m pytest scripts/tests -v` runs and collects tests |
| 0.2 | Package `release_tag_lib` importable |

### RED → GREEN

1. Add `scripts/tests/test_harness.py` asserting `import release_tag_lib` → fail if package missing
2. Add `scripts/release_tag_lib/__init__.py` + `scripts/tests/conftest.py` (path bootstrap) → pass

### Done when

- [x] Pytest command documented and green (`1 passed`)
- [x] Analysis §10 points at this plan
- [x] Root package renamed to `miroir-framework`

---

## Phase 1 — SemVer validate + pre-release classify

**Goal:** D4 naming rules as pure functions.

### Behaviors (one test at a time)

| ID | Behavior | Example |
|---|---|---|
| 1.1 | Accept `X.Y.Z` | `0.5.0` |
| 1.2 | Accept pre-release `X.Y.Z-rc.N` | `0.5.0-rc.2` |
| 1.3 | Reject empty / garbage | `""`, `v0.5.0`, `0.5`, `rc.1` |
| 1.4 | Reject leading `v` | `v0.5.0-rc.1` → error message mentions no `v` prefix |
| 1.5 | `is_prerelease` true iff `-` present | `0.5.0-rc.1` true; `0.5.0` false |

### Tracer bullet

`test_accepts_rc_prerelease_version` → implement `parse_product_version` minimally → then add reject/`is_prerelease` tests one by one.

### Done when

- [x] All 1.x green
- [x] No filesystem or git code yet

---

## Phase 2 — Allow-list + bump `version` only

**Goal:** D2 + D6.3.2 (never rewrite dependency ranges).

### Behaviors

| ID | Behavior |
|---|---|
| 2.1 | `release_manifest_paths` returns root `package.json` + exactly the five B+ package paths when tree matches names |
| 2.2 | Missing B+ package → clear error (fail closed) |
| 2.3 | `bump_package_version` sets `version` field |
| 2.4 | After bump, `dependencies` / `devDependencies` / `peerDependencies` JSON values **unchanged** (including `"*"`) |
| 2.5 | Internal package path not in allow-list is not returned by `release_manifest_paths` |
| 2.6 | Idempotent bump (already at target) returns `False` / no rewrite churn if possible |

### Fixture shape

```text
tmp/
  package.json                    # name: miroir-framework or "Miroir Framework" — version only matters
  packages/
    miroir-server/package.json
    miroir-cli/package.json
    miroir-mcp/package.json
    miroir-standalone-app/package.json
    miroir-standalone-app-electron/package.json
    miroir-core/package.json      # internal, "0.0.0", deps with "*"
```

Match real B+ **names** from analysis D2.

### Done when

- [x] Bump never alters dep maps (assert deep equality of those keys before/after)
- [x] Allow-list constant single-sourced in `allowlist.py`

---

## Phase 3 — Dependency cycles (D6)

**Goal:** runtime cycle = hard fail; dev cycle = allowed.

### Behaviors

| ID | Behavior |
|---|---|
| 3.1 | Acyclic runtime graph → `find_runtime_cycles` empty |
| 3.2 | A `dependencies` B and B `dependencies` A → one runtime cycle reported |
| 3.3 | A `devDependencies` B and B `dependencies` A → **not** a runtime cycle; may appear in `find_dev_involving_cycles` |
| 3.4 | `peerDependencies` count as **runtime** edges (same as `dependencies`) |
| 3.5 | `build_release_plan` raises when runtime cycles non-empty (message includes package names) |
| 3.6 | `build_release_plan` succeeds when only dev cycles exist |

### Tracer bullet

3.2 (fail on mutual runtime deps) first — highest value D6 guard — then 3.3 to prove dev cycles are OK.

### Done when

- [x] Present-repo policy encoded: N1/N2 abort, OK1 allow
- [x] No need to mirror every historical Lerna ECYCLE path — only the D6 definitions

---

## Phase 4 — Dry-run plan

**Goal:** HITL preflight without mutation (analysis §5).

### Behaviors

| ID | Behavior |
|---|---|
| 4.1 | `build_release_plan` lists exactly allow-listed files and target version |
| 4.2 | `is_prerelease` flag on plan matches D4 |
| 4.3 | Building a plan does not modify any file (compare mtimes or content hashes) |
| 4.4 | Invalid version → plan build fails before any file touch |

### Done when

- [ ] CLI can later print plan from `--dry-run` using this object only

---

## Phase 5 — Apply plan (filesystem)

**Goal:** durable version writes; still no git.

### Behaviors

| ID | Behavior |
|---|---|
| 5.1 | `apply_release_plan` updates all allow-listed `version` fields to plan.version |
| 5.2 | Internal package versions unchanged |
| 5.3 | Dependency ranges still unchanged after apply |
| 5.4 | Applying twice is safe (still correct versions) |

### Done when

- [ ] Apply is the only writer of package.json in the library (CLI does not hand-roll JSON)

---

## Phase 6 — Git commit + annotated tag

**Goal:** D3 tag path with real git in temp repos.

### Behaviors

| ID | Behavior |
|---|---|
| 6.1 | Clean repo + apply + `commit_release` creates commit whose message contains `chore: release <version>` and only allow-listed paths |
| 6.2 | `create_annotated_tag` creates tag named exactly `<version>` (not `v<version>`) |
| 6.3 | Tag is annotated (e.g. `git cat-file -t` → `tag`) |
| 6.4 | Duplicate tag without `--force` raises |
| 6.5 | Dirty unrelated file → refuse commit/tag unless `allow_dirty` |
| 6.6 | `push_commit_and_tags` not called by default orchestration helper |

### Fixture

`git init`, one initial commit, synthetic workspace from Phase 2, then exercise `GitRepo`.

### Done when

- [ ] No network; no `gh`
- [ ] Push method exists but is untested for remote success — only “orchestration does not call it without flag” (Phase 7)

---

## Phase 7 — CLI + docs + smoke

**Goal:** Wire `scripts/release_tag.py`, document, manual smoke against real repo (dry-run).

### Behaviors / deliverables

| ID | Behavior |
|---|---|
| 7.1 | `--dry-run` prints version, files, prerelease yes/no, exits 0 without writes |
| 7.2 | `--version X --commit --tag` on temp repo (CLI integ test) matches Phase 6 |
| 7.3 | Without `--push`, no `git push` invocation (inject runner / assert) |
| 7.4 | Update `docs/contributing/release-process.md` (analysis §7 checklist) |
| 7.5 | Manual smoke: `python scripts/release_tag.py --version 0.5.0-rc.2 --dry-run` on real monorepo (human); expect runtime cycles empty |

### Done when

- [ ] Issue #223 acceptance criteria checkboxes can be closed (except human GitHub release process, which stays manual)
- [ ] Analysis §10 marked complete / progress table updated

---

## Vertical-slice order (strict)

Do **not** write all tests first. Order:

```text
0 harness
→ 1.2 parse rc (tracer)
→ 1.3/1.4 rejects
→ 1.5 is_prerelease
→ 2.3+2.4 bump preserves "*"   (high-value vs Lerna spike)
→ 2.1 allow-list paths
→ 3.2 runtime cycle fail
→ 3.3 dev cycle allow
→ 3.5 plan refuses runtime cycle
→ 4.1–4.3 dry-run plan
→ 5.1–5.3 apply
→ 6.2 tag without v (tracer for git)
→ 6.1 commit
→ 6.4–6.5 guards
→ 7 CLI + docs
```

---

## Refactor checkpoints

After Phases 2, 3, and 6 (while green):

- [ ] Single JSON load/dump helper (preserve key order / trailing newline if easy; don’t fight prettier)
- [ ] Cycle detection shared graph builder (runtime vs runtime∪dev)
- [ ] CLI only parses args and calls `build_release_plan` / `apply_release_plan` / `GitRepo`

Never refactor while RED.

---

## Mapping to #223 acceptance criteria

| Criterion | Phase |
|---|---|
| Versioning + tag naming documented | 7.4 (+ D4 in code Phase 1) |
| Which packages track the tag | 2 |
| Mutual deps / cycles | 3 |
| Local repeatable bump+tag command | 5–7 |
| Pre-release vs release distinguishable | 1, 4 |
| Local / dry-run without CI | 4, 7.1 |

---

## Explicit non-goals (do not TDD)

- Teaching Lerna to respect B+
- Artefact filename stamping (#224)
- Auto `gh release create`
- Branch allowlist enforcement
- Lockfile updates beyond root `name` sync

~~Renaming root `"Miroir Framework"` → `miroir-framework`~~ **Done** (pre–Phase 0).

---

## Approval gate

**Settled (2026-07-30):**

1. **pytest** (not unittest)  
2. Commit message / any-branch / D1-a defaults OK  
3. Layout `scripts/release_tag_lib/` OK  
4. Root rename done before Phase 0  

Start Phase 0 → Phase 1 tracer bullet.
