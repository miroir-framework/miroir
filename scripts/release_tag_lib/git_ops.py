"""Git operations for product release tagging (#223 D3)."""

from __future__ import annotations

import subprocess
from collections.abc import Callable, Sequence
from pathlib import Path
from typing import Any


class GitError(RuntimeError):
    """Git precondition or command failure for release tagging."""


Runner = Callable[..., subprocess.CompletedProcess[str]]


class GitRepo:
    def __init__(
        self,
        root: Path,
        runner: Runner | None = None,
    ) -> None:
        self.root = root.resolve()
        self._runner: Runner = runner or subprocess.run

    def _run(self, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
        return self._runner(
            ["git", *args],
            cwd=self.root,
            check=check,
            capture_output=True,
            text=True,
        )

    def status_porcelain(self) -> str:
        return self._run("status", "--porcelain").stdout

    def tag_exists(self, name: str) -> bool:
        result = self._run("tag", "-l", name)
        return result.stdout.strip() == name

    def _assert_clean_enough(
        self,
        *,
        allow_dirty: bool,
        allowed_paths: Sequence[Path] | None = None,
    ) -> None:
        if allow_dirty:
            return
        porcelain = self.status_porcelain()
        if not porcelain.strip():
            return
        if allowed_paths is None:
            raise GitError("working tree is dirty; commit/stash or pass allow_dirty")
        allowed = {
            str(p.resolve().relative_to(self.root)).replace("\\", "/")
            for p in allowed_paths
        }
        dirty_paths: set[str] = set()
        for line in porcelain.splitlines():
            if not line.strip():
                continue
            # porcelain: XY PATH or XY PATH -> PATH2
            path_part = line[3:]
            if " -> " in path_part:
                path_part = path_part.split(" -> ", 1)[1]
            dirty_paths.add(path_part.replace("\\", "/"))
        unexpected = dirty_paths - allowed
        if unexpected:
            raise GitError(
                "working tree is dirty with unrelated paths: "
                + ", ".join(sorted(unexpected))
            )

    def commit_release(
        self,
        version: str,
        paths: Sequence[Path],
        *,
        allow_dirty: bool = False,
    ) -> None:
        self._assert_clean_enough(allow_dirty=allow_dirty, allowed_paths=paths)
        rels = [str(p.resolve().relative_to(self.root)) for p in paths]
        self._run("add", "--", *rels)
        message = f"chore: release {version}"
        self._run("commit", "-m", message)

    def create_annotated_tag(
        self,
        version: str,
        *,
        force: bool = False,
        allow_dirty: bool = False,
    ) -> None:
        self._assert_clean_enough(allow_dirty=allow_dirty, allowed_paths=None)
        if self.tag_exists(version) and not force:
            raise GitError(f"tag already exists: {version}")
        args = ["tag", "-a", version, "-m", f"release {version}"]
        if force:
            args.insert(1, "-f")
        self._run(*args)

    def push_commit_and_tags(self) -> None:
        self._run("push")
        self._run("push", "--tags")
