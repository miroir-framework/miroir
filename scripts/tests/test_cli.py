"""Phase 7 — CLI for release_tag.py (#223)."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

from release_tag_lib.allowlist import BPLUS_PACKAGE_NAMES
from release_tag_lib.bump import read_package_version
from release_tag import main


def _git(cwd: Path, *args: str) -> str:
    return subprocess.run(
        ["git", *args],
        cwd=cwd,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()


def _init_workspace(root: Path) -> None:
    _git(root, "init")
    _git(root, "config", "user.email", "spike@example.com")
    _git(root, "config", "user.name", "Spike")
    (root / "package.json").write_text(
        json.dumps({"name": "miroir-framework", "version": "0.5.0-rc.1"}, indent=2)
        + "\n",
        encoding="utf-8",
    )
    for name in sorted(BPLUS_PACKAGE_NAMES):
        pkg = root / "packages" / name / "package.json"
        pkg.parent.mkdir(parents=True, exist_ok=True)
        pkg.write_text(
            json.dumps({"name": name, "version": "1.0.0"}, indent=2) + "\n",
            encoding="utf-8",
        )
    _git(root, "add", "-A")
    _git(root, "commit", "-m", "initial")


def test_dry_run_prints_plan_without_writes(tmp_path: Path, capsys) -> None:
    _init_workspace(tmp_path)
    before = read_package_version(tmp_path / "package.json")

    code = main(
        ["--version", "0.5.0-rc.2", "--dry-run"],
        repo_root=tmp_path,
    )

    assert code == 0
    out = capsys.readouterr().out
    assert "0.5.0-rc.2" in out
    assert "prerelease: yes" in out.lower() or "prerelease: true" in out.lower()
    assert "package.json" in out
    assert read_package_version(tmp_path / "package.json") == before


def test_commit_and_tag_on_temp_repo(tmp_path: Path) -> None:
    _init_workspace(tmp_path)
    code = main(
        ["--version", "0.5.0-rc.2", "--commit", "--tag"],
        repo_root=tmp_path,
    )
    assert code == 0
    assert read_package_version(tmp_path / "package.json") == "0.5.0-rc.2"
    assert _git(tmp_path, "log", "-1", "--pretty=%s") == "chore: release 0.5.0-rc.2"
    assert _git(tmp_path, "tag", "-l", "0.5.0-rc.2") == "0.5.0-rc.2"
    assert _git(tmp_path, "cat-file", "-t", "0.5.0-rc.2") == "tag"


def test_without_push_does_not_invoke_git_push(tmp_path: Path) -> None:
    _init_workspace(tmp_path)
    calls: list[tuple[str, ...]] = []

    def runner(args, **kwargs):  # type: ignore[no-untyped-def]
        calls.append(tuple(args))
        return subprocess.run(args, **kwargs)

    code = main(
        ["--version", "0.5.0-rc.2", "--commit", "--tag"],
        repo_root=tmp_path,
        git_runner=runner,
    )
    assert code == 0
    assert not any(len(c) >= 2 and c[1] == "push" for c in calls)
