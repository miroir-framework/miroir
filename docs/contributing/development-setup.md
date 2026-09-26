# Development Setup

How to get a working Miroir checkout, for a person and for a coding agent. Platform-specific build friction (Windows toolchain, line endings, memory) is covered in [Build it yourself](../guides/build-it-yourself.md).

## Prerequisites

- Node.js (version in [`.nvmrc`](../../.nvmrc)) and npm
- Git (Git Bash on Windows)
- Python 3 with pytest (`python -m pip install pytest`): repo scripts and their tests (non-regression, release tagging, agent tooling); `npm run nonreg:unit` runs pytest
- Optional: PostgreSQL (only for `sql` test profiles and `npm run nonreg:default`)

## Install and build

```bash
git clone https://github.com/miroir-framework/miroir.git
cd miroir
git checkout _integration          # integration branch: branch from it, open PRs against it
npm ci
./build-all.sh                     # ordered build of all packages
```

For the minimum needed by `miroir-core` tests, `python scripts/agent_session_setup.py` builds the same package set as the PR checks and skips what is already built.

## Verify

The PR checks and non-regression tiers are listed in [AGENTS.md, "Working here as an agent"](../../AGENTS.md#working-here-as-an-agent). Testing guide: [testing.md](testing.md).

## Run the application

See [AGENTS.md, "Running the application"](../../AGENTS.md#running-the-application) and [Build it yourself](../guides/build-it-yourself.md).

## Coding agents

### Instructions

[`AGENTS.md`](../../AGENTS.md) is the single source of agent instructions. `CLAUDE.md` (Claude Code) and `.github/copilot-instructions.md` (Copilot) only include it; Cursor and Codex read it directly.

### Skills

| Location | Content | Tracked |
|---|---|---|
| `.agents/skills/miroir-*` | Miroir skills (feature analysis, TDD plan, queries, transformers, …) | yes, canonical |
| `.agents/skills/<core>` | Shared core from [`skills-lock.json`](../../skills-lock.json): `grilling`, `tdd`, `unslop`, `writing-for-agents`, `handoff`, `diagnosing-bugs`, `codebase-design` (vocabulary the `tdd` skill relies on) | yes |
| `.claude/skills/` | Copies of the two rows above, for Claude Code | yes, generated |
| anything else in `.agents/skills/` or `.claude/skills/` | Your personal installs | no (gitignored) |

- After editing a Miroir skill, run `python scripts/sync_agent_skills.py`. The PR checks fail when `.claude/skills/` differs from `.agents/skills/`.
- A new Miroir skill is a folder `.agents/skills/miroir-<topic>/` whose `SKILL.md` has `name: miroir-<topic>`; index it in [`.github/skills/README.md`](../../.github/skills/README.md).
- Personal skills are best installed at user level so they follow you across repositories, e.g. with the `skills` CLI:
  ```bash
  npx skills add mattpocock/skills -s domain-modeling -g
  npx skills add CopilotKit/CopilotKit -s copilotkit-develop -g   # when working on the in-app assistant
  ```
  Project-level installs (without `-g`) also work: they land in the gitignored part of the skill folders, but the CLI records them in `skills-lock.json`; do not commit that change unless the skill should join the shared core.
- To refresh the shared core from upstream: `npx skills update -p`, then `python scripts/sync_agent_skills.py`, and review the diff.

### Session environment

`python scripts/agent_session_setup.py` prepares a session (dependencies, core package builds, pytest) and prints its state: branch, missing builds, PostgreSQL, code graph.

- **Claude Code cloud sessions** run it automatically at start through the SessionStart hook in [`.claude/settings.json`](../../.claude/settings.json) (only when `CLAUDE_CODE_REMOTE=true`, so local sessions are not slowed).
- **Other agents** (Codex, Cursor background agents, …) can call the same script from their own environment setup.

### Code graph (graphify, optional)

[graphify](https://pypi.org/project/graphifyy/) builds a code graph that answers broad cross-package questions (`graphify query "…"`). It is not built by default: `python scripts/agent_session_setup.py --graphify` installs it and builds `graphify-out/` (about 40 s, gitignored because it holds absolute paths). [`.graphifyignore`](../../.graphifyignore) keeps agent tooling out of the graph. The graphify agent skill is a personal install: `npx skills add graphify-labs/graphify -g`.
