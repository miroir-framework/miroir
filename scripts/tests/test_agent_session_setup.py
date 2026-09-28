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
    for pkg in ALL_PACKAGES:
        package_dir = root / "packages" / pkg
        package_dir.mkdir(parents=True)
        manifest = {"main": "dist/index.js", "types": "dist/index.d.ts"}
        (package_dir / "package.json").write_text(json.dumps(manifest), encoding="utf-8")
    for pkg in ALL_PACKAGES if built is None else built:
        dist = root / "packages" / pkg / "dist"
        dist.mkdir()
        for name in ("index.js", "index.d.ts"):
            (dist / name).write_text("", encoding="utf-8")
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


def test_partial_build_is_rebuilt(tmp_path: Path) -> None:
    root = _tree(tmp_path)
    (root / "packages" / "miroir-core" / "dist" / "index.d.ts").unlink()
    assert _names(plan_steps(root, _env())) == ["build miroir-core"]


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


# #321 Slice 9: a cloud session selects the cloud-agent environment through environments/local.json


def _with_environments(root: Path, local: str | None = None) -> Path:
    (root / "environments").mkdir()
    (root / "environments" / "dev.json").write_text("{}", encoding="utf-8")
    if local is not None:
        (root / "environments" / "local.json").write_text(local, encoding="utf-8")
    return root


def _run(root: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), "--root", str(root), *args],
        capture_output=True,
        text=True,
    )


def test_cloud_agent_session_writes_local_environment_when_absent(tmp_path: Path) -> None:
    root = _with_environments(_tree(tmp_path))
    result = _run(root, "--cloud-agent")
    assert result.returncode == 0, result.stdout + result.stderr
    local = json.loads((root / "environments" / "local.json").read_text(encoding="utf-8"))
    assert local == {"extends": "cloud-agent"}
    assert "environment: local (extends cloud-agent, environments/local.json)" in result.stdout


def test_existing_local_environment_is_left_alone(tmp_path: Path) -> None:
    root = _with_environments(_tree(tmp_path), local='{ "extends": "dev" }\n')
    assert "personal environment" not in _names(plan_steps(root, _env(), cloud_agent=True))
    assert (root / "environments" / "local.json").read_text(encoding="utf-8") == '{ "extends": "dev" }\n'


def test_local_environment_only_for_cloud_agent_sessions(tmp_path: Path) -> None:
    root = _with_environments(_tree(tmp_path))
    assert plan_steps(root, _env()) == []
    result = _run(root)
    assert not (root / "environments" / "local.json").exists()
    assert "environment: dev (default)" in result.stdout


def test_dry_run_reports_the_local_environment_without_writing_it(tmp_path: Path) -> None:
    root = _with_environments(_tree(tmp_path))
    result = _run(root, "--cloud-agent", "--dry-run")
    assert "environments/local.json" in result.stdout
    assert not (root / "environments" / "local.json").exists()


def test_session_start_hook_selects_cloud_agent() -> None:
    settings = json.loads((SCRIPT.parents[1] / ".claude" / "settings.json").read_text(encoding="utf-8"))
    commands = [h["command"] for entry in settings["hooks"]["SessionStart"] for h in entry["hooks"]]
    assert any("scripts/agent_session_setup.py" in c and "--cloud-agent" in c for c in commands)


def test_pr_checks_build_miroir_env_and_check_environments() -> None:
    packages = [p for group in BUILD_GROUPS for p in group]
    assert packages.index("miroir-env") > packages.index("miroir-core")
    workflow = (SCRIPT.parents[1] / ".github" / "workflows" / "pr-checks.yml").read_text(encoding="utf-8")
    assert "-w miroir-env" in workflow
    assert "npm run miroir-env -- check --strict --tracked-clean" in workflow
