"""Disposable Git worktree helpers for mutating release operations."""

from __future__ import annotations

import shutil
import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

from release_lib.common import ReleaseError, log_step, run


def assert_clean(repo_root: Path, *, allow_dirty: bool = False) -> None:
    if allow_dirty:
        return
    result = run(["git", "status", "--porcelain"], cwd=repo_root)
    if result.stdout.strip():
        raise ReleaseError(
            "working tree is dirty; use a clean release worktree or --allow-dirty"
        )


def create_release_worktree(repo_root: Path, *, branch_name: str | None = None) -> Path:
    """Create a disposable worktree at HEAD for release mutation."""
    assert_clean(repo_root)
    parent = Path(tempfile.mkdtemp(prefix="miroir-release-worktree-"))
    worktree = parent / "tree"
    branch = branch_name or f"release-worktree-{parent.name}"
    run(
        ["git", "worktree", "add", "--detach", str(worktree), "HEAD"],
        cwd=repo_root,
    )
    # Record the intended branch name for optional later commit/tag in the worktree.
    (parent / "branch-name.txt").write_text(branch, encoding="utf-8")
    log_step(f"created disposable release worktree at {worktree} (branch: {branch})")
    return worktree


def remove_release_worktree(repo_root: Path, worktree: Path) -> None:
    log_step(f"removing disposable release worktree at {worktree}")
    run(
        ["git", "worktree", "remove", "--force", str(worktree)],
        cwd=repo_root,
        check=False,
    )
    parent = worktree.parent
    if parent.exists() and parent.name.startswith("miroir-release-worktree-"):
        shutil.rmtree(parent, ignore_errors=True)
    run(["git", "worktree", "prune"], cwd=repo_root, check=False)


@contextmanager
def temporary_release_worktree(
    repo_root: Path,
    *,
    keep: bool = False,
) -> Iterator[Path]:
    worktree = create_release_worktree(repo_root)
    try:
        yield worktree
    finally:
        if not keep:
            remove_release_worktree(repo_root, worktree)
