"""Runner of the agent cost benchmark (#550, Slice 1): command line per arm, child environment, run summary.

No test calls the paid agent: the summary is built from a recorded transcript (`fixtures/agent_bench/`).
"""

from __future__ import annotations

import json
import shutil
import stat
from datetime import datetime, timezone
from pathlib import Path

import pytest

from agent_bench import run, transcript


@pytest.fixture(autouse=True)
def _workspaces_in_tmp_path(tmp_path, monkeypatch):
    monkeypatch.setattr(run, "WORKSPACES_DIR", tmp_path)

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


def _fake_store(root: Path) -> Path:
    store = root / "store"
    query = store / "model" / "e4320b9e-ab45-4abe-85d8-359604b3c62f"
    query.mkdir(parents=True)
    (query / "q.json").write_text("{}", encoding="utf-8")
    (store / "data" / "e81078f3-2de7-4301-bd79-d3a156aec149").mkdir(parents=True)
    (store / "modelVersion").mkdir()
    return store


def test_files_workspace_holds_the_library_the_meta_model_and_check(tmp_path):
    workspace = run.prepare_workspace("miroir-files", _fake_store(tmp_path))
    assert sorted(p.name for p in workspace.iterdir()) == [".check.mjs", "AGENTS.md", "check", "library", "meta-model"]
    assert sorted(p.name for p in (workspace / "library").iterdir()) == ["data", "model"]
    assert (workspace / "library" / "model" / "e4320b9e-ab45-4abe-85d8-359604b3c62f" / "q.json").exists()
    assert (workspace / "meta-model" / "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad").is_dir()
    assert all(stat.S_IMODE(p.stat().st_mode) & 0o222 == 0 for p in (workspace / "meta-model").rglob("*")), "meta-model is read only"


def test_files_workspace_names_no_harness_path(tmp_path):
    workspace = run.prepare_workspace("miroir-files", _fake_store(tmp_path))
    for name in ("check", ".check.mjs", "AGENTS.md"):
        text = (workspace / name).read_text(encoding="utf-8")
        assert not [hidden for hidden in transcript.HIDDEN_PATHS if hidden in text], name


def test_store_from_workspace_keeps_the_baseline_and_takes_the_workspace_library(tmp_path):
    from agent_bench.acceptance import adapter_miroir

    baseline = _fake_store(tmp_path)
    library = tmp_path / "ws" / "library"
    (library / "model" / "new").mkdir(parents=True)
    (library / "model" / "new" / "x.json").write_text("{}", encoding="utf-8")
    (library / "data").mkdir()
    target = tmp_path / "out"
    adapter_miroir.store_from_workspace(library, baseline, target)
    assert (target / "model" / "new" / "x.json").exists()
    assert not (target / "model" / "e4320b9e-ab45-4abe-85d8-359604b3c62f").exists()
    assert (target / "modelVersion").is_dir()


@pytest.mark.skipif(not (run.REPO_ROOT / "benchmarks" / "conventional-library" / "node_modules").exists(), reason="needs npm ci in benchmarks/conventional-library")
def test_conventional_workspace_is_the_app_with_data_and_a_database():
    workspace = run.prepare_workspace("conventional")
    assert (workspace / "AGENTS.md").read_text(encoding="utf-8").startswith("# Working on the Library application")
    assert (workspace / "app" / "api" / "loans" / "route.ts").exists()
    assert len(list((workspace / "prisma" / "library-data" / "e81078f3-2de7-4301-bd79-d3a156aec149").glob("*.json"))) == 60
    assert (workspace / "prisma" / "dev.db").stat().st_size > 0
    assert not (workspace / ".next").exists()


def test_a_conventional_run_keeps_the_agent_app_and_its_changes(tmp_path):
    baseline = tmp_path / "baseline"
    (baseline / "app").mkdir(parents=True)
    (baseline / "app" / "page.tsx").write_text("old\n")
    workspace = tmp_path / "workspace"
    shutil.copytree(baseline, workspace)
    (workspace / "app" / "page.tsx").write_text("new\n")
    (workspace / "tests").mkdir()
    (workspace / "tests" / "added.test.ts").write_text("test\n")
    for ignored in ("node_modules/pkg/index.js", ".next/build.js", "prisma/dev.db", "generated/client.js"):
        (workspace / ignored).parent.mkdir(parents=True, exist_ok=True)
        (workspace / ignored).write_text("x")
    run_dir = tmp_path / "run"
    run_dir.mkdir()

    run.keep_conventional_app(workspace, run_dir, baseline)

    kept = sorted(str(path.relative_to(run_dir / "app")) for path in (run_dir / "app").rglob("*") if path.is_file())
    assert kept == ["app/page.tsx", "tests/added.test.ts"]
    diff = (run_dir / "changes.diff").read_text()
    assert "+++ agent/app/page.tsx" in diff and "+new" in diff
    assert "+++ agent/tests/added.test.ts" in diff
    assert str(tmp_path) not in diff
