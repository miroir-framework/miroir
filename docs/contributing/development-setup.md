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

`npm ci` installs exactly `package-lock.json`; to add or update a dependency, see [Dependency policy](#dependency-policy).

For the minimum needed by `miroir-core` tests, `python scripts/agent_session_setup.py` builds the same package set as the PR checks and skips what is already built.

## Verify

The PR checks and non-regression tiers are listed in [AGENTS.md, "Working here as an agent"](../../AGENTS.md#working-here-as-an-agent). Testing guide: [testing.md](testing.md).

## Dependency policy

A package version enters the build only when someone chose it ([#326](https://github.com/miroir-framework/miroir/issues/326)). [`scripts/check_dependency_policy.py`](../../scripts/check_dependency_policy.py) checks the rules below. PR checks run it, and so does `npm run nonreg:unit`, without the `audit` rule, which needs the network.

| Rule | Fails when |
|---|---|
| `specs` | a dependency or root override is not an exact version (`^1.2.3`, `~1.2.3`, `latest`), an internal `miroir-*` dependency is not `*`, or the root `.npmrc` lacks `save-exact=true`. Peer dependencies keep their ranges. |
| `classification` | a build or test tool (Electron, electron-builder, Vite and its plugins, Vitest, happy-dom) is in `dependencies` rather than `devDependencies` |
| `lockfile` | `package-lock.json` installs another version than a manifest pins, misses a package (often another platform's binary, npm/cli#4828), or has no integrity hash for a package |
| `workflows` | a GitHub workflow or composite action runs `npm install` rather than `npm ci` |
| `actions` | a GitHub workflow or composite action uses an action by tag or branch rather than by commit SHA (`actions/checkout@<sha> # v6`) |
| `audit` | `npm audit` reports a high or critical advisory (`--level critical` for critical only) that no live exception covers, or an exception has expired |

```bash
python scripts/check_dependency_policy.py                  # every rule
python scripts/check_dependency_policy.py --rule lockfile  # one rule (repeatable)
```

### Installing

`npm ci` installs exactly what `package-lock.json` lists, on every OS; use it unless you are changing dependencies.

### Adding or updating a dependency

1. Pick a version at least 7 days old (`npm view <package> time`): a compromised release is usually found and pulled within days.
2. `npm install <package>@<version> -w <workspace>` (`-D` for a build or test tool). The root `.npmrc` makes npm write the exact version.
3. `python scripts/check_dependency_policy.py`, then commit the manifest and `package-lock.json` together.

### Regenerating the lockfile

Relock with npm 11, which keeps the `libc` fields that npm 10 drops, and with `--before` set 7 days back:

```bash
npx npm@11 install --package-lock-only --before=2026-09-20T00:00:00Z               # after editing a manifest
npx npm@11 update <package> --package-lock-only --before=2026-09-20T00:00:00Z      # re-resolve a package and all its platform binaries
python scripts/fill_lockfile_integrity.py                                          # add the hashes the lockfile rule reports missing
```

- An `npm install` in a checkout that already has `node_modules` can drop the other platforms' binaries from the lockfile (npm/cli#4828); the `lockfile` rule names the entry. `npm update <package>` re-adds them.
- A package pinned exactly in a manifest (such as `electron-builder`) is not re-resolved by `npm update`: remove its entries from `package-lock.json`, then run `npm install --package-lock-only`.
- An override that npm ignores on relock (the lockfile keeps the old nested version): remove that nested entry from `package-lock.json`, then relock.

### Overrides and vendored packages

[`dependency-policy/README.md`](../../dependency-policy/README.md) lists each root `overrides` entry (why, when it was added, when to remove it) and each vendored tarball with its SHA-512. Add a row there whenever you add an override or a vendored package.

### Advisories

PR checks fail on a high or critical advisory. Fix it with an exact bump, or an override when a parent pins the vulnerable version. When no fixed version exists, add a dated exception to `dependency-policy/audit-exceptions.json`:

```json
{
  "exceptions": [
    {"package": "xlsx", "advisory": "GHSA-5pgg-2g8v-p4x9", "reason": "no fixed version; input files are trusted", "expires": "2026-12-31"}
  ]
}
```

The check prints accepted advisories, fails once an exception has expired, and asks to remove an exception that no advisory uses any more.

### Updates

[`.github/dependabot.yml`](../../.github/dependabot.yml) opens grouped weekly PRs against `_integration` for npm packages and GitHub Actions, for versions at least 7 days old (`cooldown`). Security update PRs are the exception: Dependabot opens them against `main`, the default branch, whatever `target-branch` says, and without the cooldown. Retarget such a PR to `_integration` before merging it.

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
