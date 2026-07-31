"""Shared errors and process helpers for the release producer."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from typing import Any


class ReleaseError(ValueError):
    """A release plan cannot be produced or safely applied."""


def executable(name: str) -> str:
    """Return the Windows command shim when the producer runs under Python."""
    return f"{name}.cmd" if sys.platform == "win32" else name


def run(
    args: list[str],
    *,
    cwd: Path,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        args,
        cwd=cwd,
        check=check,
        capture_output=True,
        text=True,
    )


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
