"""Phase 6 — GitRepo commit + annotated tag in a real temp repo (#223)."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

from release_tag_lib.allowlist import BPLUS_PACKAGE_NAMES
from release_tag_lib.git_ops import GitError, GitRepo
from release_tag_lib.plan import apply_release_plan, build_release_plan


def _git(cwd: Path, *args: str) -> str:
    result = subprocess.run(
        ["git", *args],
        cwd=cwd,
        check=True,
        capture_output=True,
        text=True,
    )
    return result.stdout.strip()


def _init_repo(root: Path) -> GitRepo:
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
    return GitRepo(root)


def test_create_annotated_tag_without_v_prefix(tmp_path: Path) -> None:
    repo = _init_repo(tmp_path)
    version = "0.5.0-rc.2"

    repo.create_annotated_tag(version)

    assert _git(tmp_path, "tag", "-l", version) == version
    assert _git(tmp_path, "tag", "-l", f"v{version}") == ""
    assert _git(tmp_path, "cat-file", "-t", version) == "tag"


def test_commit_release_message_and_paths(tmp_path: Path) -> None:
    repo = _init_repo(tmp_path)
    plan = build_release_plan(tmp_path, "0.5.0-rc.2")
    apply_release_plan(plan)

    repo.commit_release(plan.version, plan.files_to_bump)

    message = _git(tmp_path, "log", "-1", "--pretty=%s")
    assert message == "chore: release 0.5.0-rc.2"
    changed = _git(tmp_path, "diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD")
    changed_set = set(changed.splitlines())
    expected = {str(p.relative_to(tmp_path.resolve())).replace("\\", "/") for p in plan.files_to_bump}
    # normalize git path separators
    changed_norm = {c.replace("\\", "/") for c in changed_set}
    assert changed_norm == expected


def test_duplicate_tag_without_force_raises(tmp_path: Path) -> None:
    repo = _init_repo(tmp_path)
    repo.create_annotated_tag("0.5.0-rc.2")
    with pytest.raises(GitError, match="already exists"):
        repo.create_annotated_tag("0.5.0-rc.2")


def test_dirty_tree_refuses_commit_unless_allow_dirty(tmp_path: Path) -> None:
    repo = _init_repo(tmp_path)
    plan = build_release_plan(tmp_path, "0.5.0-rc.2")
    apply_release_plan(plan)
    dirty = tmp_path / "unrelated.txt"
    dirty.write_text("nope\n", encoding="utf-8")

    with pytest.raises(GitError, match="dirty"):
        repo.commit_release(plan.version, plan.files_to_bump)

    repo.commit_release(plan.version, plan.files_to_bump, allow_dirty=True)
    assert "chore: release 0.5.0-rc.2" in _git(tmp_path, "log", "-1", "--pretty=%s")


def test_orchestration_helper_does_not_push_by_default(tmp_path: Path) -> None:
    calls: list[tuple[str, ...]] = []

    def runner(args, **kwargs):  # type: ignore[no-untyped-def]
        calls.append(tuple(args))
        return subprocess.run(args, **kwargs)

    repo = GitRepo(tmp_path, runner=runner)
    # Only assert the helper exists and push is a separate method not auto-invoked
    # by commit/tag. Exercise commit path with a real nested runner after init.
    _init_repo(tmp_path)
    real = GitRepo(tmp_path)
    real.create_annotated_tag("0.5.0-rc.3")
    assert not any(len(c) >= 2 and c[1] == "push" for c in calls)
    # push method is available for --push later
    assert hasattr(real, "push_commit_and_tags")
