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


def log_step(message: str) -> None:
    """Print a human-readable progress line to stderr.

    Kept off stdout deliberately: every ``print(json.dumps(...))`` call in this
    package is meant to stay machine-parseable. Progress/diagnostic narration
    always goes to stderr so a caller can safely treat stdout as data-only.
    """
    print(f"[release] {message}", file=sys.stderr, flush=True)


def run(
    args: list[str],
    *,
    cwd: Path,
    check: bool = True,
    announce: bool = True,
) -> subprocess.CompletedProcess[str]:
    if announce:
        log_step(f"$ {' '.join(args)}  (cwd={cwd})")
    return subprocess.run(
        args,
        cwd=cwd,
        check=check,
        capture_output=True,
        text=True,
        # npm/tsup/lerna emit UTF-8 (e.g. tsup's "\u26a1\ufe0f Build success" emoji).
        # Without an explicit encoding, Python falls back to
        # locale.getpreferredencoding() for a captured pipe, which on a
        # non-UTF-8 Windows console (cp1252 here) cannot decode those bytes.
        # That raises UnicodeDecodeError inside subprocess's internal
        # _readerthread — a background thread whose exception can only print
        # a traceback and be swallowed, it can never fail this call or the
        # child process, so the build result is unaffected either way, but it
        # is confusing noise in the CLI output.
        encoding="utf-8",
        errors="replace",
    )


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def dump_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
