"""One run of the agent cost benchmark (#550).

    python scripts/agent_bench/run.py --arm miroir-mcp --feature overdue-loans [--pilot] [--run-index N]
    python scripts/agent_bench/run.py --arm miroir-mcp --feature probe --dry-run

Prepares a fresh workspace outside the repository with the arm's AGENTS.md, resets the `bench-agent` store, starts
`miroir-server` for the Miroir arms, runs headless Claude Code with the arm's tools and the limits of analysis
D15, saves the transcript in the runs folder, and writes `run.json` with the measures. Claude Code gets a clean
environment (no variable of the calling session but those it needs to reach the API), so it loads none of this
session's settings, plugins or skills.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agent_bench import miroir_server, task, transcript  # noqa: E402
from agent_bench.acceptance import adapter_conventional, adapter_miroir  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RUNS_DIR = Path("/mnt/project-files/issue-550/runs")
WORKSPACES_DIR = Path("/tmp")
META_MODEL = REPO_ROOT / "packages" / "miroir-app-miroir" / "assets" / "miroir_model"
VALIDATOR = Path(__file__).resolve().parent / "acceptance" / "validate_store.mjs"

MODEL = "claude-sonnet-5-5"
EFFORT = "medium"
MAX_TURNS = 80
MAX_BUDGET_USD = 5

# Variables Claude Code needs to reach the API from a cloud container; nothing else of the calling session leaks.
CHILD_ENV_KEYS = (
    "PATH",
    "HOME",
    "LANG",
    "ANTHROPIC_BASE_URL",
    "ANTHROPIC_API_KEY",
    "HTTPS_PROXY",
    "HTTP_PROXY",
    "NO_PROXY",
    "https_proxy",
    "http_proxy",
    "no_proxy",
    "NODE_EXTRA_CA_CERTS",
    "SSL_CERT_FILE",
    "CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST",
    "CLAUDE_SESSION_INGRESS_TOKEN_FILE",
    "CLAUDE_CODE_ORGANIZATION_UUID",
    "CLAUDE_CODE_ACCOUNT_UUID",
)


def arm_settings(arm: str) -> dict:
    return json.loads((task.ARMS_DIR / arm / "settings.json").read_text(encoding="utf-8"))


def child_env(source: dict[str, str] | None = None) -> dict[str, str]:
    source = os.environ if source is None else source
    env = {key: source[key] for key in CHILD_ENV_KEYS if key in source}
    env["CLAUDE_CODE_DISABLE_AUTO_MEMORY"] = "1"
    env["ENABLE_TOOL_SEARCH"] = "true"
    return env


def claude_command(arm: str, prompt: str, mcp_url: str | None = None) -> list[str]:
    settings = arm_settings(arm)
    tools = settings["tools"]
    command = [
        "claude", "-p", prompt,
        "--output-format", "stream-json", "--verbose",
        "--model", MODEL,
        "--effort", EFFORT,
        "--max-turns", str(MAX_TURNS),
        "--max-budget-usd", str(MAX_BUDGET_USD),
        "--setting-sources", "project,local",
        "--disable-slash-commands",
        "--no-session-persistence",
        "--strict-mcp-config",
        "--tools", ",".join(tools),
    ]
    allowed = list(tools)
    if settings["mcp"]:
        if mcp_url is None:
            raise ValueError(f"arm {arm} needs the MCP URL")
        config = {"mcpServers": {transcript.MCP_SERVER: {"type": "http", "url": mcp_url}}}
        command += ["--mcp-config", json.dumps(config)]
        allowed.append(f"mcp__{transcript.MCP_SERVER}")
    if allowed:
        command += ["--allowedTools", ",".join(allowed)]
    return command


def prepare_workspace(arm: str, library_store: Path | None = None) -> Path:
    """A fresh folder outside the repository with the arm's AGENTS.md, and what the arm starts from: nothing more
    for `miroir-mcp`, the Library's files for `miroir-files`, the baseline app with its database for `conventional`.

    `library_store` is the store the files arm starts from (a freshly materialized `bench-agent` Library).
    """
    workspace = Path(tempfile.mkdtemp(prefix=f"agent-bench-{arm}-", dir=WORKSPACES_DIR))
    if REPO_ROOT in workspace.resolve().parents:
        raise RuntimeError(f"workspace {workspace} is inside the repository")
    if arm == "conventional":
        workspace.rmdir()  # the app is copied in its place
        prepare_conventional(workspace)
    (workspace / "AGENTS.md").write_text(task.agents_md(arm), encoding="utf-8")
    if arm in ("miroir-mcp", "conventional"):
        return workspace
    if library_store is None:
        raise ValueError("the miroir-files workspace needs the Library store it starts from")
    for section in adapter_miroir.LIBRARY_SECTIONS:
        shutil.copytree(library_store / section, workspace / "library" / section)
    shutil.copytree(META_MODEL, workspace / "meta-model")
    for path in sorted((workspace / "meta-model").rglob("*"), reverse=True):
        path.chmod(0o555 if path.is_dir() else 0o444)
    (workspace / "meta-model").chmod(0o555)
    write_check_command(workspace)
    return workspace


def prepare_conventional(target: Path) -> None:
    """The baseline app with its own copy of the Library data and a fresh database."""
    if not (adapter_conventional.BASELINE_APP / "node_modules").exists():
        raise FileNotFoundError(f"run `npm ci` in {adapter_conventional.BASELINE_APP} first")
    adapter_conventional.copy_app(adapter_conventional.BASELINE_APP, target)
    subprocess.run(["npm", "run", "db:reset"], cwd=target, check=True, capture_output=True)


def write_check_command(workspace: Path) -> None:
    """`./check`: the store validator, copied with its imports pointing at the repository's built packages.

    The copy keeps the agent off the harness folder: the command names no harness path.
    """
    modules = REPO_ROOT / "node_modules"
    lines = VALIDATOR.read_text(encoding="utf-8").splitlines(keepends=True)
    source = "".join(lines[next(i for i, line in enumerate(lines) if not line.startswith("//")):])
    for package, entry in (
        ('"@miroir-framework/core/model-validation-fs"', modules / "@miroir-framework/core" / "dist" / "model-validation-fs.js"),
        ('"@miroir-framework/core"', modules / "@miroir-framework/core" / "dist" / "index.js"),
        ('"miroir-app-miroir"', modules / "miroir-app-miroir" / "dist" / "index.js"),
    ):
        source = source.replace(f"from {package};", f'from "{entry.resolve().as_uri()}";')
    (workspace / ".check.mjs").write_text(source, encoding="utf-8")
    check = workspace / "check"
    check.write_text(
        '#!/bin/sh\n'
        '# Validates library/ against the schemas of its Entities; prints {"checked": n, "errors": [...]}.\n'
        'here="$(cd "$(dirname "$0")" && pwd)"\n'
        'node "$here/.check.mjs" "$here/library/model" "$here/library/data" 2>/dev/null\n',
        encoding="utf-8",
    )
    check.chmod(0o755)


# what a conventional run keeps of the agent's app, besides the copy's own exclusions
KEPT_APP_IGNORED = (*adapter_conventional.COPY_IGNORED, "generated", "next-env.d.ts")


def keep_conventional_app(workspace: Path, run_dir: Path, baseline: Path = adapter_conventional.BASELINE_APP) -> None:
    """What the conventional agent left, to review or run again: its app without dependencies, build or database
    (`app/`), and its changes to the baseline app (`changes.diff`)."""
    shutil.copytree(workspace, run_dir / "app", ignore=shutil.ignore_patterns(*KEPT_APP_IGNORED), symlinks=True)
    excluded = [f"--exclude={pattern}" for pattern in (*KEPT_APP_IGNORED, "library-data", "AGENTS.md")]
    diff = subprocess.run(
        ["diff", "-ruN", *excluded, str(baseline), str(workspace)], capture_output=True, text=True, check=False
    )
    (run_dir / "changes.diff").write_text(
        diff.stdout.replace(f"{baseline}/", "baseline/").replace(f"{workspace}/", "agent/"), encoding="utf-8"
    )


def run_id(feature: str, arm: str, index: int, now: datetime) -> str:
    return f"{now.strftime('%Y%m%dT%H%M%SZ')}-{feature}-{arm}-{index}"


def summary(
    transcript_path: Path, *, arm: str, feature: str, index: int, pilot: bool, started: datetime, rid: str
) -> dict:
    record = transcript.Transcript.read(transcript_path)
    settings = arm_settings(arm)
    problems = transcript.isolation_problems(record, settings["tools"], settings["mcp"])
    problems += [f"read {read}" for read in transcript.hidden_path_reads(record)]
    return {
        "runId": rid,
        "arm": arm,
        "feature": feature,
        "runIndex": index,
        "pilot": pilot,
        "startedAt": started.isoformat().replace("+00:00", "Z"),
        "effort": EFFORT,
        "maxTurns": MAX_TURNS,
        "maxBudgetUsd": MAX_BUDGET_USD,
        "taskHash": task.task_hash(feature, arm),
        **transcript.measures(record),
        "toolCalls": sum(transcript.tool_call_counts(record).values()),
        "toolCallsByName": dict(transcript.tool_call_counts(record)),
        "uuidCharShare": transcript.uuid_char_share(record),
        "valid": not problems,
        "invalidReason": "; ".join(problems) or None,
        "transcript": str(transcript_path),
        "acceptance": None,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--arm", required=True, choices=task.ARMS)
    parser.add_argument("--feature", required=True, help="overdue-loans, lending-limit, or probe")
    parser.add_argument("--run-index", type=int, default=0)
    parser.add_argument("--pilot", action="store_true")
    parser.add_argument("--runs-dir", type=Path, default=DEFAULT_RUNS_DIR)
    parser.add_argument("--dry-run", action="store_true", help="print the command, run nothing")
    args = parser.parse_args(argv)

    prompt = task.task_prompt(args.feature, args.arm)
    settings = arm_settings(args.arm)
    url = miroir_server.mcp_url() if settings["mcp"] else None
    if args.dry_run:
        print(json.dumps(claude_command(args.arm, prompt, url), indent=2))
        return 0

    started = datetime.now(timezone.utc)
    rid = run_id(args.feature, args.arm, args.run_index, started)
    run_dir = args.runs_dir / rid
    run_dir.mkdir(parents=True)
    transcript_path = run_dir / "transcript.jsonl"

    miroir_server.reset_state()
    if args.arm == "miroir-files":
        adapter_miroir.materialize_store(run_dir / "materialize.log")
    workspace = prepare_workspace(args.arm, adapter_miroir.LIBRARY_STORE if args.arm == "miroir-files" else None)
    server = miroir_server.MiroirServer(run_dir / "server.log")
    try:
        if args.arm == "miroir-mcp":
            server.start()
        with transcript_path.open("w", encoding="utf-8") as out, (run_dir / "claude.stderr").open("w") as err:
            subprocess.run(
                claude_command(args.arm, prompt, url),
                cwd=workspace,
                env=child_env(),
                stdin=subprocess.DEVNULL,
                stdout=out,
                stderr=err,
                check=False,
            )
    finally:
        server.stop()
        # what the agent left, for the acceptance command (`--store`)
        if args.arm == "miroir-mcp" and adapter_miroir.LIBRARY_STORE.exists():
            shutil.copytree(adapter_miroir.LIBRARY_STORE, run_dir / "store")
        if args.arm == "miroir-files":
            adapter_miroir.store_from_workspace(workspace / "library", adapter_miroir.LIBRARY_STORE, run_dir / "store")
        if args.arm == "conventional":
            keep_conventional_app(workspace, run_dir)

    result = summary(
        transcript_path, arm=args.arm, feature=args.feature, index=args.run_index, pilot=args.pilot, started=started, rid=rid
    )
    result["workspace"] = str(workspace)
    (run_dir / "run.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    # a run Claude Code ended without a result event has no turns, cost or result
    print(json.dumps({k: result.get(k) for k in ("runId", "valid", "invalidReason", "stopReason", "turns", "costUsd", "result")}, indent=2))
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    sys.exit(main())
