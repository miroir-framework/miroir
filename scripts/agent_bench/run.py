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
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agent_bench import miroir_server, task, transcript  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_RUNS_DIR = Path("/mnt/project-files/issue-550/runs")

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


def prepare_workspace(arm: str) -> Path:
    workspace = Path(tempfile.mkdtemp(prefix=f"agent-bench-{arm}-", dir="/tmp"))
    if REPO_ROOT in workspace.resolve().parents:
        raise RuntimeError(f"workspace {workspace} is inside the repository")
    (workspace / "AGENTS.md").write_text(task.agents_md(arm), encoding="utf-8")
    if arm != "miroir-mcp":
        raise NotImplementedError(f"workspace preparation of arm {arm} comes in a later slice (#550 plan)")
    return workspace


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
    workspace = prepare_workspace(args.arm)
    transcript_path = run_dir / "transcript.jsonl"

    miroir_server.reset_state()
    server = miroir_server.MiroirServer(run_dir / "server.log")
    try:
        if args.arm.startswith("miroir"):
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

    result = summary(
        transcript_path, arm=args.arm, feature=args.feature, index=args.run_index, pilot=args.pilot, started=started, rid=rid
    )
    result["workspace"] = str(workspace)
    (run_dir / "run.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: result[k] for k in ("runId", "valid", "invalidReason", "stopReason", "turns", "costUsd", "result")}, indent=2))
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    sys.exit(main())
