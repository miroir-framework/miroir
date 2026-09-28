#!/usr/bin/env python3
"""Prepare a coding-agent session on this repo, then print its state (#301).

Idempotent: installs dependencies only when node_modules is missing and builds
only the packages whose dist/ is missing, in dependency order. The package set
is the one .github/workflows/pr-checks.yml builds, so the pre-push gate in
AGENTS.md runs right after. Existing dist/ output is not rebuilt: after pulling
schema or source changes, rebuild the affected packages yourself.

Agent-neutral: Claude Code cloud sessions run it from a SessionStart hook
(.claude/settings.json); other agents can call it from their own setup.

A cloud session (--cloud-agent) selects the cloud-agent environment (#321):
the script writes environments/local.json = { "extends": "cloud-agent" } when
the file is absent, and never touches an existing one.

Examples:
  python scripts/agent_session_setup.py               # prepare + status
  python scripts/agent_session_setup.py --dry-run     # show the plan only
  python scripts/agent_session_setup.py --cloud-agent # also select the cloud-agent environment
  python scripts/agent_session_setup.py --graphify    # also build the graphify code graph
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import platform
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INTEGRATION_BRANCH = "_integration"

# Same packages and order as pr-checks.yml; each group builds in one npm call.
BUILD_GROUPS: list[list[str]] = [
    ["miroir-app-miroir", "miroir-app-admin"],
    ["miroir-core"],
    ["miroir-env", "miroir-store-bundled", "miroir-store-postgres", "miroir-example-library"],
]

# #321: the personal environment of a cloud session (gitignored, see environments/cloud-agent.json)
LOCAL_ENVIRONMENT = "environments/local.json"
CLOUD_AGENT_LOCAL_ENVIRONMENT = '{ "extends": "cloud-agent" }\n'

# package-lock.json lists it since #326; a node_modules installed from an older lockfile lacks it, and tsup/vite fail.
ROLLUP_LINUX = "@rollup/rollup-linux-x64-gnu"


@dataclass(frozen=True)
class Environment:
    linux_x64: bool
    has_pytest: bool
    has_graphify: bool

    @staticmethod
    def detect() -> "Environment":
        return Environment(
            linux_x64=platform.system() == "Linux" and platform.machine() in ("x86_64", "AMD64"),
            has_pytest=importlib.util.find_spec("pytest") is not None,
            has_graphify=shutil.which("graphify") is not None,
        )


@dataclass(frozen=True)
class Step:
    name: str
    command: str  # run through the shell, from the repo root
    # (path, content): the step writes this file under the repo root instead of running a command
    write: tuple[str, str] | None = None


def _is_built(root: Path, package: str) -> bool:
    """Every entry point package.json declares under dist/ (main, module, types) exists.

    An interrupted build can leave dist/ partly filled, so a non-empty dist/ is not enough.
    """
    package_dir = root / "packages" / package
    manifest_path = package_dir / "package.json"
    if not manifest_path.is_file():
        return False
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    outputs = [
        manifest[key]
        for key in ("main", "module", "types")
        if isinstance(manifest.get(key), str) and manifest[key].lstrip("./").startswith("dist/")
    ]
    return bool(outputs) and all((package_dir / out).is_file() for out in outputs)


def plan_steps(root: Path, env: Environment, *, graphify: bool = False, cloud_agent: bool = False) -> list[Step]:
    steps: list[Step] = []
    if cloud_agent and (root / "environments").is_dir() and not (root / LOCAL_ENVIRONMENT).exists():
        steps.append(
            Step(
                "personal environment",
                f"write {LOCAL_ENVIRONMENT}: {CLOUD_AGENT_LOCAL_ENVIRONMENT.strip()}",
                write=(LOCAL_ENVIRONMENT, CLOUD_AGENT_LOCAL_ENVIRONMENT),
            )
        )
    stale_install = env.linux_x64 and not (root / "node_modules" / ROLLUP_LINUX).is_dir()
    if not (root / "node_modules").is_dir() or stale_install:
        steps.append(Step("npm ci", "npm ci"))
    for group in BUILD_GROUPS:
        missing = [p for p in group if not _is_built(root, p)]
        if missing:
            workspaces = " ".join(f"-w {p}" for p in missing)
            steps.append(Step(f"build {' '.join(missing)}", f"npm run build {workspaces}"))
    if not env.has_pytest:
        steps.append(Step("install pytest", f"{sys.executable} -m pip install --quiet pytest"))
    if graphify:
        if not env.has_graphify:
            steps.append(Step("install graphify", f"{sys.executable} -m pip install --quiet graphifyy"))
        steps.append(Step("build code graph", "graphify update ."))
    return steps


def _git(root: Path, *args: str) -> str:
    result = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else "?"


def _postgres_state() -> str:
    if shutil.which("pg_isready") is None:
        return "not installed"
    result = subprocess.run(["pg_isready", "-q"], capture_output=True)
    return "running" if result.returncode == 0 else "installed, not running"


def selected_environment(root: Path, environ: dict[str, str] | None = None) -> str:
    """The environment miroir-env selects: MIROIR_ENV, then environments/local.json, then dev."""
    name = (os.environ if environ is None else environ).get("MIROIR_ENV")
    if name:
        return f"{name} (MIROIR_ENV)"
    local = root / LOCAL_ENVIRONMENT
    if not local.is_file():
        return "dev (default)"
    try:
        extends = json.loads(local.read_text(encoding="utf-8")).get("extends")
    except (ValueError, AttributeError):
        return f"local ({LOCAL_ENVIRONMENT}, not valid JSON)"
    return f"local (extends {extends}, {LOCAL_ENVIRONMENT})" if extends else f"local ({LOCAL_ENVIRONMENT})"


def status_lines(root: Path, env: Environment) -> list[str]:
    packages = [p for group in BUILD_GROUPS for p in group]
    missing = [p for p in packages if not _is_built(root, p)]
    graph = "built" if (root / "graphify-out" / "graph.json").exists() else "not built (--graphify)"
    return [
        f"branch: {_git(root, 'rev-parse', '--abbrev-ref', 'HEAD')} (integration branch: {INTEGRATION_BRANCH})",
        f"environment: {selected_environment(root)}; npm run miroir-env -- show",
        "packages: all built" if not missing else f"packages not built: {', '.join(missing)}",
        f"postgresql: {_postgres_state()} (needed by nonreg:default only)",
        f"graphify code graph: {graph}",
        "pre-push gate and nonreg tiers: AGENTS.md, 'Working here as an agent'",
    ]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="print the plan, run nothing")
    parser.add_argument("--graphify", action="store_true", help="install graphify if needed and build the code graph")
    parser.add_argument(
        "--cloud-agent",
        action="store_true",
        help=f"select the cloud-agent environment: write {LOCAL_ENVIRONMENT} when absent",
    )
    parser.add_argument("--root", type=Path, default=ROOT, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)

    env = Environment.detect()
    steps = plan_steps(args.root, env, graphify=args.graphify, cloud_agent=args.cloud_agent)
    failed: list[str] = []
    for step in steps:
        print(f"[agent-setup] {step.name}: {step.command}", flush=True)
        if args.dry_run:
            continue
        if step.write:
            path, content = step.write
            (args.root / path).write_text(content, encoding="utf-8")
            continue
        # Step output goes to stderr so stdout stays a short status (a SessionStart hook feeds stdout to the agent).
        if subprocess.run(step.command, shell=True, cwd=args.root, stdout=sys.stderr).returncode != 0:
            failed.append(step.name)
            break

    print("[agent-setup] " + ("dry run, nothing executed" if args.dry_run else "session state:"))
    for line in status_lines(args.root, Environment.detect()):
        print(f"  {line}")
    if failed:
        print(f"[agent-setup] FAILED: {failed[0]} (later steps skipped)")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
