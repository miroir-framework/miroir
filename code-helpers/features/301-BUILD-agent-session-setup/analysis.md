# 301 — Agent session setup for Miroir development

> Analysis of how coding-agent sessions (cloud and local; Claude first, agent-neutral where possible) are set up in this repo, and the target structure. Decisions D1–D5 confirmed with the maintainer on 2026-09-26.

Document role: analysis **and** decision record. Issue: https://github.com/miroir-framework/miroir/issues/301

## Related

- [AGENTS.md](../../../AGENTS.md), [.github/copilot-instructions.md](../../../.github/copilot-instructions.md), [.github/skills/README.md](../../../.github/skills/README.md)
- [skills-lock.json](../../../skills-lock.json), [.agents/skills/](../../../.agents/skills/), [.claude/skills/](../../../.claude/skills/), [.cursor/rules/](../../../.cursor/rules/)
- [.github/workflows/pr-checks.yml](../../../.github/workflows/pr-checks.yml) (#299), [scripts/run-nonreg.py](../../../scripts/run-nonreg.py)
- [docs/contributing/development-setup.md](../../../docs/contributing/development-setup.md) (placeholder), [docs/contributing/testing.md](../../../docs/contributing/testing.md), [docs/reference/testing.md](../../../docs/reference/testing.md)

## Current state (surveyed on `aba` @ 256e625)

### Instructions

| File | Size | Loaded by | Notes |
|---|---|---|---|
| `AGENTS.md` | 21.6 KB, ~330 lines | Cursor, Copilot (via `@AGENTS.md`), Codex, Claude Code cloud sessions | Single source of truth. Mixes always-needed rules (layering, build order, test commands, React rules) with reference material (PK helper list, store list, library data folders). |
| `CLAUDE.md` | absent | — | Local Claude Code reads `CLAUDE.md`; whether it falls back to `AGENTS.md` depends on the version (to verify). Cloud sessions did load `AGENTS.md`. |
| `.cursor/rules/prefer-python-scripts.mdc` | 1 rule | Cursor only | "Prefer Python for ad-hoc scripts": an agent-neutral rule that other agents never see. |

`AGENTS.md` opens with a mandatory **graphify** section ("first run `graphify query`…", "after modifying code, run `graphify update .`"). `graphify-out*/` is gitignored and the `graphify` CLI is not installed in cloud sessions, so every cloud session starts with a rule it cannot follow.

### Skills

| Location | Count | Tracked | Read by |
|---|---|---|---|
| `.agents/skills/` | 43 | yes | Codex, Cursor, Copilot (agent-neutral convention used by the `skills` CLI that writes `skills-lock.json`) |
| `.claude/skills/` | 16 | yes (copies, not symlinks) | Claude Code |
| `.github/skills/` | index only | yes | humans; points to `.agents/skills/` |

`.agents/skills/` by origin (from `skills-lock.json` + directory listing):

| Origin | Count | Skills |
|---|---|---|
| Miroir-owned | 7 | `miroir-feature-analysis`, `miroir-analysis-to-tdd-plan`, `miroir-edit-transformers`, `miroir-edit-composite-transformers`, `miroir-edit-queries`, `query-editor` (older twin of `miroir-edit-queries`), `assess-evolution-quality` |
| Local, generic | 1 | `create-skill` |
| mattpocock/skills | 25 | `grilling`, `grill-me`, `grill-with-docs`, `tdd`, `writing-for-agents`, `handoff`, `code-review`, `diagnosing-bugs`, `domain-modeling`, `codebase-design`, `improve-codebase-architecture`, `implement`, `prototype`, `research`, `resolving-merge-conflicts`, `setup-matt-pocock-skills`, `teach`, `to-questionnaire`, `to-spec`, `to-tickets`, `triage`, `wait-what`, `wayfinder`, `wizard`, `ask-matt` |
| cursor/plugins | 1 | `unslop` |
| CopilotKit/CopilotKit | 8 | `copilotkit-*` (6), `a2ui-renderer`, `react-core` |
| graphify-labs/graphify | 1 | `graphify` (228 files: a vendored Python package) |

Observed consequences:

1. **No Miroir skill reaches Claude Code.** `.claude/skills/` holds 16 third-party skills and none of the `miroir-*` ones. A cloud Claude session on this repo lists `grilling`, `tdd`, `copilotkit-*`… but not `miroir-feature-analysis`.
2. **Duplication**: 681 tracked files, ~12 MB, mostly `graphify` twice.
3. **No ownership boundary**: Miroir skills sit alphabetically among third-party ones; nothing marks which are maintained here and which are upstream snapshots.
4. **"Just in case" installs**: many skills are personal workflow preferences (ask-matt, wizard, teach, wayfinder…), imposed on every contributor and every agent's skill list (which costs context on each session).

### Environment and testing

- No `.claude/settings.json`, no SessionStart hook. Cloud environment preparation lives only in the claude.ai environment config (outside the repo), so an agent cannot tell what is already built; in this session `node_modules` and `miroir-core/dist` happened to exist.
- The fast pre-push check a contributor should run is exactly `pr-checks.yml` (install, rollup Linux binary fix, build deployment-miroir/admin → core → store-bundled/postgres/library, typecheck core, core unit tests). It is not written down for agents anywhere; `AGENTS.md` lists many commands without saying which is the pre-push gate.
- Non-regression tiers (`nonreg:unit`, `nonreg:default`, `nonreg:filesystem`) exist in root `package.json`; their cost and prerequisites (Postgres? built server?) are only in `docs/reference/testing.md` (1590 lines).
- `docs/contributing/development-setup.md` is a placeholder.
- The integration branch (`aba`, PRs target it) is not stated in the repo.

## Goals (draft user stories)

1. **Miroir skills everywhere** — In order to follow Miroir conventions without being told, as a coding agent of any supported kind, I can see every `miroir-*` skill in my skill list.
2. **Clear ownership** — In order to maintain Miroir skills with confidence, as a Miroir maintainer, I can tell at a glance which skills are ours and which are upstream.
3. **Lean shared baseline** — In order not to pay context for skills I never use, as a contributor, I get only Miroir skills plus a small agreed core set by default, and install the rest per my own taste.
4. **Ready-to-work session** — In order to start real work immediately, as a cloud agent, I find dependencies installed and core packages built (or am told in one line what is missing and how to fix it).
5. **One place for "how do I verify"** — In order to push only green changes, as an agent, I can find the pre-push gate and the nonreg tiers (with cost and prerequisites) in one short section.
6. **Agent choice** — In order to use my preferred agent, as a contributor, I get the same instructions and Miroir skills whether I use Claude Code, Cursor, Copilot or Codex.

## Non-goals

- Changing the content of existing Miroir skills (beyond merging `query-editor` into `miroir-edit-queries`, if accepted).
- The in-app AI assistant (`docs/guides/using-ai.md`), which is a product feature, not dev tooling.
- Reorganising `docs/` beyond adding the agent/dev-setup page and filling `development-setup.md`.

## Decision record (confirmed 2026-09-26)

### D1 — Where Miroir skills live

| Option | Pros | Cons |
|---|---|---|
| A. Keep `.agents/skills/miroir-*` canonical; **tracked copies** in `.claude/skills/miroir-*`, regenerated by `scripts/sync-agent-skills.py`, with a CI check that they match | Works on Windows (no symlinks), works in cloud with zero setup, agent-neutral source | Two copies in git (small once third-party skills leave) |
| B. Same, but `.claude/skills/*` are **git symlinks** | Single copy | Windows checkouts without `core.symlinks` get text files; A develops on Windows/git-bash |
| C. Canonical in `.claude/skills/` only | One copy; Copilot and Cursor also read `.claude/skills` (to verify per agent) | Codex and `.agents`-only tools miss them |
| D. Package as a Claude plugin / marketplace in the repo | Versioned, installable | Claude-only; extra install step for each dev |

**Accepted: A.** Names keep the `miroir-` prefix, which is the ownership marker (`assess-evolution-quality` → `miroir-assess-evolution-quality`, `query-editor` merged into `miroir-edit-queries` or removed).

### D2 — Third-party skills

| Option | Effect |
|---|---|
| A. **Core set tracked**, the rest per developer | Track a small core (proposal: `grilling`, `tdd`, `unslop`, `writing-for-agents`, `handoff`, `diagnosing-bugs`) in both folders; untrack everything else; document recommended optional installs (`npx skills add … -g`, user-level) in the dev-setup page |
| B. Nothing third-party tracked | Cleanest ownership; each dev installs even the fundamentals |
| C. Status quo | — |

**Accepted: A.** `skills-lock.json` is kept, reduced to the core set. CopilotKit skills become optional (only useful when touching the in-app assistant). `graphify` becomes optional.

### D3 — graphify

**Accepted:** move the graphify section out of the top of `AGENTS.md` into a short conditional paragraph ("if `graphify-out/graph.json` exists and `graphify` is on PATH, prefer `graphify query`…"), and drop the "run `graphify update .` after every change" rule for sessions without it. The skill becomes an optional per-developer install.

Measured in a cloud session (2026-09-26): `pip install graphifyy` works through the proxy; `graphify update .` (AST only, no LLM) takes ~60 s on 4 cores, extracts 3006 files into 31 158 nodes / 65 005 edges and writes 83 MB to `graphify-out/`; `graphify query` answers in ~3 s. Without a `.graphifyignore` the graph also indexes the vendored `.agents/skills/graphify/` package and `dist/` output, which pollutes query results (e.g. `dispatch_command()` from graphify's own CLI surfaced for a DomainController question). Useful as a symbol/neighbourhood index for broad questions; for focused tasks `rg` is as fast. Cloud availability is decided separately (D6).

### D4 — Instruction files (Accepted)

- `AGENTS.md` stays the single source of truth, slimmed to what every session needs (target ≲ 12 KB); reference material moves to `docs/` with one-line pointers.
- Add `CLAUDE.md` containing only `@AGENTS.md` (same pattern as `copilot-instructions.md`), so local Claude Code loads it regardless of version.
- Fold the Cursor "prefer Python for ad-hoc scripts" rule into `AGENTS.md`; delete `.cursor/rules/` (or keep it as a one-line pointer).
- Add a short **"Working in this repo as an agent"** section to `AGENTS.md`: integration branch, pre-push gate (= `pr-checks.yml`), nonreg tiers with cost and prerequisites, where skills live.

### D5 — Session environment

| Option | Pros | Cons |
|---|---|---|
| A. Agent-neutral `scripts/agent-session-setup.py` (idempotent: `npm ci` if needed, rollup Linux binary fix, build the `pr-checks.yml` package set if `dist` is missing, print a 5-line status), wired to a Claude **SessionStart hook** in `.claude/settings.json`; other agents call the same script from their own hooks | In-repo, versioned, same steps as CI; agents know what is built | Hook adds startup time on cold containers |
| B. Keep setup only in the claude.ai environment config | No repo change | Invisible to agents and to other contributors; drifts from CI |

**Accepted: A**, hook enabled for cloud sessions only by default (local devs opt in), so local sessions are not slowed.

## Proposed target layout

```
AGENTS.md                      # slim, agent-neutral, single source of truth
CLAUDE.md                      # "@AGENTS.md"
.agents/skills/
  miroir-*/                    # canonical Miroir skills (tracked)
  grilling/ tdd/ unslop/ …     # core third-party set (tracked, pinned in skills-lock.json)
.claude/
  settings.json                # SessionStart hook → scripts/agent-session-setup.py
  skills/                      # generated copies of .agents/skills (tracked, CI-checked)
.github/skills/README.md       # index of Miroir skills (kept, updated)
scripts/
  sync-agent-skills.py         # .agents/skills → .claude/skills
  agent-session-setup.py       # idempotent env prep + status
docs/contributing/
  development-setup.md         # filled: human setup + agent setup + optional skills
```

`.gitignore` gains rules so that personally installed skills in `.agents/skills/` and `.claude/skills/` are not committed by accident (allow-list of tracked names).

### D6 — graphify in cloud sessions (confirmed 2026-09-26: **Accepted: A, on demand**)

| Option | Effect |
|---|---|
| A. On demand | `scripts/agent-session-setup.py --graphify` installs `graphifyy` and builds the graph; agents run it when a task needs a broad architecture view |
| B. Background at session start | SessionStart hook launches the build in the background (~60 s CPU, no wait); graph ready for most of the session |
| C. Not in cloud | Local only |

All options add a `.graphifyignore` (exclude `.agents/`, `.claude/`, `dist/`, `node_modules/`, generated files).
