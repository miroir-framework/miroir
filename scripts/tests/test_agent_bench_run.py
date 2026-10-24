"""Runner of the agent cost benchmark (#550, Slice 1): command line per arm, child environment, run summary.

No test calls the paid agent: the summary is built from a recorded transcript (`fixtures/agent_bench/`).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

from agent_bench import run, transcript

FIXTURES = Path(__file__).parent / "fixtures" / "agent_bench"
PROBE = FIXTURES / "probe-miroir-mcp.jsonl"
MCP_URL = "http://localhost:4080/mcp"


def option(command: list[str], name: str) -> str:
    return command[command.index(name) + 1]


def test_mcp_arm_gets_only_the_miroir_server_and_tool_search():
    """ToolSearch keeps the Miroir tool schemas (about 620k characters for 47 tools) out of the prompt until used."""
    command = run.claude_command("miroir-mcp", "prompt", MCP_URL)
    assert option(command, "--tools") == "ToolSearch"
    assert option(command, "--allowedTools") == "ToolSearch,mcp__miroir"
    assert json.loads(option(command, "--mcp-config")) == {"mcpServers": {"miroir": {"type": "http", "url": MCP_URL}}}
    assert "--strict-mcp-config" in command


@pytest.mark.parametrize("arm", ["miroir-files", "conventional"])
def test_file_arms_get_file_tools_and_no_mcp(arm):
    command = run.claude_command(arm, "prompt")
    assert option(command, "--tools") == "Read,Edit,Write,Glob,Grep,Bash"
    assert "--mcp-config" not in command and "--strict-mcp-config" in command


@pytest.mark.parametrize("arm", ["miroir-mcp", "miroir-files", "conventional"])
def test_every_arm_has_the_same_limits(arm):
    command = run.claude_command(arm, "prompt", MCP_URL)
    assert [option(command, name) for name in ("--model", "--effort", "--max-turns", "--max-budget-usd")] == [
        "claude-sonnet-5-5",
        "medium",
        "80",
        "5",
    ]
    assert {"--disable-slash-commands", "--no-session-persistence"} <= set(command)
    assert option(command, "--setting-sources") == "project,local"


def test_child_environment_keeps_api_access_and_drops_the_session():
    env = run.child_env({"PATH": "/bin", "ANTHROPIC_BASE_URL": "u", "CLAUDE_CODE_REMOTE": "true", "CLAUDE_EFFORT": "max"})
    assert env == {"PATH": "/bin", "ANTHROPIC_BASE_URL": "u", "CLAUDE_CODE_DISABLE_AUTO_MEMORY": "1", "ENABLE_TOOL_SEARCH": "true"}


def test_workspace_is_outside_the_repository_and_holds_the_arm_page():
    workspace = run.prepare_workspace("miroir-mcp")
    assert run.REPO_ROOT not in workspace.parents
    assert (workspace / "AGENTS.md").read_text(encoding="utf-8").startswith("# Working on the Library application through Miroir's MCP tools")


def test_summary_of_a_recorded_probe(tmp_path):
    started = datetime(2026, 10, 24, tzinfo=timezone.utc)
    summary = run.summary(PROBE, arm="miroir-mcp", feature="probe", index=0, pilot=False, started=started, rid="r")
    assert summary["valid"] is True and summary["stopReason"] == "success"
    assert summary["model"] == "claude-sonnet-5-5"
    assert all(isinstance(summary[k], int) for k in ("inputTokens", "outputTokens", "cacheReadTokens", "cacheCreationTokens", "turns", "durationMs"))
    assert summary["costUsd"] > 0 and "48" in summary["result"]


def test_a_tool_outside_the_arm_makes_the_run_invalid():
    lines = PROBE.read_text(encoding="utf-8").splitlines()
    events = [json.loads(line) for line in lines]
    init = next(e for e in events if e.get("subtype") == "init")
    init["tools"] = [*init["tools"], "Bash"]
    init["skills"] = ["unslop"]
    problems = transcript.isolation_problems(transcript.Transcript(events), ["ToolSearch"], mcp=True)
    assert problems == ["tool Bash", "skill unslop"]


def test_a_missing_mcp_server_makes_the_run_invalid():
    events = [{"type": "system", "subtype": "init", "tools": [], "mcp_servers": []}]
    assert transcript.isolation_problems(transcript.Transcript(events), [], mcp=True) == ["MCP server miroir missing"]


def test_a_run_that_hits_the_turn_limit_says_so():
    result = {"type": "result", "subtype": "error_max_turns", "is_error": True, "usage": {}}
    assert transcript.measures(transcript.Transcript([result]))["stopReason"] == "error_max_turns"
