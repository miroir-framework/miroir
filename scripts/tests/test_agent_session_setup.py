"""agent_session_setup: idempotent session preparation (#301)."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

from agent_session_setup import BUILD_GROUPS, Environment, plan_steps, status_lines

SCRIPT = Path(__file__).resolve().parents[1] / "agent_session_setup.py"
ALL_PACKAGES = [p for group in BUILD_GROUPS for p in group]


def _tree(root: Path, *, node_modules: bool = True, built: list[str] | None = None) -> Path:
    if node_modules:
        (root / "node_modules" / "@rollup" / "rollup-linux-x64-gnu").mkdir(parents=True)
    for pkg in ALL_PACKAGES if built is None else built:
        (root / "packages" / pkg / "dist").mkdir(parents=True)
        (root / "packages" / pkg / "dist" / "index.js").write_text("", encoding="utf-8")
    return root


def _env(**overrides: object) -> Environment:
    base = dict(linux_x64=True, has_pytest=True, has_graphify=True)
    base.update(overrides)
    return Environment(**base)  # type: ignore[arg-type]


def _names(steps) -> list[str]:
    return [s.name for s in steps]


def test_nothing_to_do_when_everything_is_present(tmp_path: Path) -> None:
    assert plan_steps(_tree(tmp_path), _env()) == []


def test_installs_dependencies_when_node_modules_is_missing(tmp_path: Path) -> None:
    steps = plan_steps(_tree(tmp_path, node_modules=False), _env())
    assert _names(steps)[:2] == ["npm ci", "rollup linux binary"]


def test_rollup_binary_only_on_linux_x64(tmp_path: Path) -> None:
    steps = plan_steps(_tree(tmp_path, node_modules=False), _env(linux_x64=False))
    assert "rollup linux binary" not in _names(steps)


def test_builds_only_packages_without_dist(tmp_path: Path) -> None:
    built = [p for p in ALL_PACKAGES if p != "miroir-core"]
    steps = plan_steps(_tree(tmp_path, built=built), _env())
    assert _names(steps) == ["build miroir-core"]


def test_builds_follow_dependency_order(tmp_path: Path) -> None:
    steps = plan_steps(_tree(tmp_path, built=[]), _env())
    assert _names(steps) == [f"build {' '.join(group)}" for group in BUILD_GROUPS]


def test_installs_pytest_when_missing(tmp_path: Path) -> None:
    assert _names(plan_steps(_tree(tmp_path), _env(has_pytest=False))) == ["install pytest"]


def test_graphify_only_on_request(tmp_path: Path) -> None:
    root = _tree(tmp_path)
    assert plan_steps(root, _env(has_graphify=False)) == []
    assert _names(plan_steps(root, _env(has_graphify=False), graphify=True)) == [
        "install graphify",
        "build code graph",
    ]
    assert _names(plan_steps(root, _env(), graphify=True)) == ["build code graph"]


def test_status_names_integration_branch_and_missing_builds(tmp_path: Path) -> None:
    lines = "\n".join(status_lines(_tree(tmp_path, built=["miroir-core"]), _env()))
    assert "_integration" in lines
    assert "not built" in lines and "miroir-test-app_deployment-miroir" in lines


def test_dry_run_executes_nothing(tmp_path: Path) -> None:
    root = _tree(tmp_path, node_modules=False, built=[])
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--dry-run", "--root", str(root)],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0
    assert "npm ci" in result.stdout
    assert not (root / "node_modules").exists()


def test_claude_session_start_hook_runs_the_script_in_cloud_only() -> None:
    settings = json.loads((SCRIPT.parents[1] / ".claude" / "settings.json").read_text(encoding="utf-8"))
    commands = [h["command"] for entry in settings["hooks"]["SessionStart"] for h in entry["hooks"]]
    assert any("scripts/agent_session_setup.py" in c and "CLAUDE_CODE_REMOTE" in c for c in commands)


def test_graphify_ignores_agent_tooling() -> None:
    ignored = (SCRIPT.parents[1] / ".graphifyignore").read_text(encoding="utf-8").split()
    assert {".agents/", ".claude/"} <= set(ignored)
