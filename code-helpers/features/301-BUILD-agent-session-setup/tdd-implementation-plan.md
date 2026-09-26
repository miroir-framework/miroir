# Issue #301 — TDD Implementation Plan

> Testing posture: the behaviours here are repo tooling (Python scripts, instruction files, CI), not Miroir model behaviour, so MiroirTest does not apply. Scripts are proven with **pytest against real temp directory trees and real `git`** (precedent: `scripts/tests/` for #223), no mocks. Instruction-file slices are proven by a pytest structure check plus a fresh cloud session.

**Resume note:** update the progress table and append a *Realization* to each slice as it lands.

## Scope

In: skill layout and sync (D1), third-party reduction (D2), graphify on demand (D3, D6), instruction files (D4), session setup script + Claude SessionStart hook (D5), dev-setup docs.

Out (non-goals, from analysis): content changes to Miroir skills beyond the `query-editor` merge; the in-app AI assistant; wider `docs/` reorganisation.

## Related

- Issue: https://github.com/miroir-framework/miroir/issues/301
- Analysis: [./analysis.md](./analysis.md)
- CI gate: [../../../.github/workflows/pr-checks.yml](../../../.github/workflows/pr-checks.yml)
- Branch: `claude/project-thread-k0ox0g` → PR into `aba`

## Progress summary

| Slice | Title | Status | Primary proof |
|---|---|---|---|
| 0 | Characterize current layout | ⬜ pending | `scripts/tests/test_agent_skills_layout.py` |
| 1 | Miroir skills visible to Claude (sync + check) | ⬜ pending | `test_sync_agent_skills.py`, CI step |
| 2 | Miroir skill naming cleanup | ⬜ pending | layout test, sync `--check` |
| 3 | Lean third-party baseline | ⬜ pending | layout test, `.gitignore` test |
| 4 | Instruction files (AGENTS.md, CLAUDE.md) | ⬜ pending | `test_agent_instructions.py` |
| 5 | Session setup script + SessionStart hook | ⬜ pending | `test_agent_session_setup.py`, fresh cloud session |
| 6 | graphify on demand | ⬜ pending | `--graphify` run, `.graphifyignore` test |
| 7 | Docs, nonreg, AC checklist | ⬜ pending | `npm run nonreg:unit` |

## Locked implementation defaults

| Decision | Binding default |
|---|---|
| D1 | Canonical skills in `.agents/skills/`; `.claude/skills/` is a tracked, generated, byte-identical copy (no symlinks). Generator: `scripts/sync_agent_skills.py`; `--check` exits non-zero on drift. |
| D1 allow-list | Tracked skills = `miroir-*` directories + keys of `skills-lock.json`. No extra manifest. |
| D2 | Core third-party set: `grilling`, `tdd`, `unslop`, `writing-for-agents`, `handoff`, `diagnosing-bugs`. Everything else untracked; `skills-lock.json` reduced to the core set. |
| D3 / D6 | graphify: conditional paragraph in `AGENTS.md`; cloud build only on demand via `agent_session_setup.py --graphify`; `.graphifyignore` added. |
| D4 | `AGENTS.md` ≤ 12 KB, reference material moved to `docs/` with pointers; `CLAUDE.md` = `@AGENTS.md`; Cursor Python rule folded in, `.cursor/rules/` removed. |
| D5 | `scripts/agent_session_setup.py`, idempotent, same package set as `pr-checks.yml`; `.claude/settings.json` SessionStart hook runs it only when `CLAUDE_CODE_REMOTE=true`. |
| Language | Python for all scripts (repo preference). |
| Test runner | `python3 -m pytest scripts/tests -k <name>`; pytest is installed by the setup script if missing (it is absent in the cloud image today). |
| File moves | `git mv` only. |

## Test execution conventions

| Purpose | Command |
|---|---|
| Script tests | `python3 -m pytest scripts/tests -k agent -v` |
| Skill copy drift | `python3 scripts/sync_agent_skills.py --check` |
| Session setup (dry) | `python3 scripts/agent_session_setup.py --dry-run` |
| CI gate (unchanged) | steps of `pr-checks.yml` |
| Safety net | `npm run nonreg:unit` |

## Slice 0 — Characterize current layout

**Status:** ⬜ pending

Goal: lock today's facts so later slices change them deliberately.

- RED/GREEN: `scripts/tests/test_agent_skills_layout.py` asserts on the real repo: the 7 Miroir-owned skills exist in `.agents/skills/`; `.claude/skills/` contains no `miroir-*`; every `skills-lock.json` key has a directory in `.agents/skills/`. (Characterization, passes immediately; the `.claude` assertion is inverted in Slice 1.)

**Validation:** `python3 -m pytest scripts/tests -k agent_skills_layout -v`

### Realization
_(pending)_

## Slice 1 — Miroir skills visible to Claude (tracer bullet)

**Status:** ⬜ pending

Goal: a Claude session on this repo lists every `miroir-*` skill.

- RED: `scripts/tests/test_sync_agent_skills.py`, on a temp tree: (a) sync copies allow-listed skill dirs from `.agents/skills` to `.claude/skills` byte-identically; (b) sync removes a `.claude/skills` dir no longer allow-listed; (c) `--check` exits 1 and names the drifting skill when a copied file differs; (d) non-allow-listed dirs in `.agents/skills` (personal installs) are ignored.
- GREEN: `scripts/sync_agent_skills.py` (`sync(root)`, `check(root) -> list[str]`, CLI). Run it on the repo. Invert the Slice 0 assertion. Add a `sync_agent_skills.py --check` step to `pr-checks.yml` (before `npm ci`, it needs only Python).
- Refactor checkpoint: single allow-list function shared by sync and check.

**Validation:** pytest as above; `python3 scripts/sync_agent_skills.py --check`; start a fresh cloud session on the branch and confirm `miroir-feature-analysis` is listed.

### Realization
_(pending)_

## Slice 2 — Miroir skill naming cleanup

**Status:** ⬜ pending

Goal: every Miroir-owned skill carries the `miroir-` prefix; no duplicate query skill.

- `git mv .agents/skills/assess-evolution-quality .agents/skills/miroir-assess-evolution-quality`; update its `name:` frontmatter.
- `query-editor` vs `miroir-edit-queries`: they differ (query-editor has a pre-flight test-state check). Fold the unique parts into `miroir-edit-queries/SKILL.md`, then `git rm` `query-editor`.
- Move `create-skill` decision: it is generic and superseded by `writing-for-agents`; remove unless A wants it kept.
- Update `.github/skills/README.md` index. Re-run sync.
- RED/GREEN: layout test asserts every non-lock skill starts with `miroir-` and every Miroir SKILL.md `name:` equals its folder name.

**Validation:** pytest; `sync_agent_skills.py --check`.

### Realization
_(pending)_

## Slice 3 — Lean third-party baseline

**Status:** ⬜ pending

Goal: contributors and agents get only Miroir skills + the core set; personal installs never get committed.

- `git rm -r` non-core third-party skills from `.agents/skills/` (and their copies via sync). Reduce `skills-lock.json` to the core set.
- `.gitignore`: ignore `.agents/skills/*` and `.claude/skills/*`, re-include `miroir-*/` and each core skill.
- RED/GREEN: layout test asserts tracked skills == `miroir-*` ∪ lock keys (via `git ls-files`); a test in a temp git repo asserts that a new dir `.agents/skills/foo/` is ignored and `.agents/skills/miroir-foo/` is not.

**Validation:** pytest; `git ls-files .agents .claude | wc -l` recorded in Realization (expected well under 100).

### Realization
_(pending)_

## Slice 4 — Instruction files

**Status:** ⬜ pending

Goal: an agent reads a short `AGENTS.md` that tells it where it works and how to verify, whatever the agent.

- Add `CLAUDE.md` (`@AGENTS.md`).
- `AGENTS.md`: remove the leading graphify block, add a conditional graphify paragraph; add **Working here as an agent** (integration branch `aba`, pre-push gate = `pr-checks.yml` steps, nonreg tiers with cost and prerequisites, where skills live and how to sync them, prefer Python for ad-hoc scripts); move PK helper list, store list, library data folders and similar reference material to the matching `docs/reference/*` pages with one-line pointers. `git rm .cursor/rules/prefer-python-scripts.mdc`.
- RED/GREEN: `scripts/tests/test_agent_instructions.py`: `AGENTS.md` ≤ 12 KB; every relative link and backticked repo path in `AGENTS.md` exists; `CLAUDE.md` and `.github/copilot-instructions.md` both include `@AGENTS.md`; no unconditional `graphify` instruction.

**Validation:** pytest; manual read-through of the moved sections in `docs/`.

### Realization
_(pending)_

## Slice 5 — Session setup script + SessionStart hook

**Status:** ⬜ pending

Goal: a cloud session starts with dependencies installed and core packages built, and prints what state it is in.

- RED: `scripts/tests/test_agent_session_setup.py` on temp trees: `plan_steps(root)` returns `npm ci` when `node_modules` is missing, build steps only for packages whose `dist/` is missing, nothing when all is present; `--dry-run` executes nothing; the status summary names branch, integration branch and built packages.
- GREEN: `scripts/agent_session_setup.py` with the `pr-checks.yml` package set (including the Linux rollup binary fix) and pytest install. `.claude/settings.json` SessionStart hook: run the script when `CLAUDE_CODE_REMOTE=true`, otherwise exit 0.
- Refactor checkpoint: consider having `pr-checks.yml` call the script so CI and sessions share one definition (only if it keeps CI readable).

**Validation:** pytest; `python3 scripts/agent_session_setup.py --dry-run` in this container; fresh cloud session on the branch shows the status lines and a working `npm run test -w miroir-core -- ''`.

### Realization
_(pending)_

## Slice 6 — graphify on demand

**Status:** ⬜ pending

Goal: an agent that needs a broad architecture view builds the graph with one command.

- `agent_session_setup.py --graphify`: install `graphifyy` if absent, run `graphify update .`.
- `.graphifyignore` excluding `.agents/`, `.claude/`, `**/dist/`, `node_modules/`, `graphify-out/`, generated `preprocessor-generated/`.
- RED/GREEN: pytest asserts `.graphifyignore` covers those paths; `plan_steps(root, graphify=True)` includes install only when `graphify` is not on PATH.

**Validation:** run `--graphify` in the cloud; record build time, node count, and that a DomainController query no longer surfaces graphify's own code.

### Realization
_(pending)_

## Slice 7 — Docs, nonreg, acceptance

**Status:** ⬜ pending

- Fill `docs/contributing/development-setup.md`: human setup, agent setup (cloud and local, per agent), optional skills with install commands, graphify.
- Add the agent script tests to `scripts/nonreg-manifest.json` (unit tier).
- Tracer narrative: fresh cloud session → Miroir skills listed → setup status printed → `pr-checks.yml` steps pass.

**Validation:** `npm run nonreg:unit`.

### AC checklist

| Goal (analysis) | Proof |
|---|---|
| 1 Miroir skills everywhere | Slice 1 sync tests + fresh session |
| 2 Clear ownership | Slice 2 layout test |
| 3 Lean baseline | Slice 3 layout + `.gitignore` tests |
| 4 Ready-to-work session | Slice 5 tests + fresh session |
| 5 One place for verification | Slice 4 instructions test |
| 6 Agent choice | `CLAUDE.md` / `copilot-instructions.md` include check; `.agents/skills` canonical |

### Realization
_(pending)_
