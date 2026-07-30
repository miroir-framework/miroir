"""Rewrite package.json version fields without touching dependency ranges (#223)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _dump(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def read_package_version(path: Path) -> str:
    data = _load(path)
    version = data.get("version")
    if not isinstance(version, str):
        raise ValueError(f"{path}: missing string 'version' field")
    return version


def bump_package_version(path: Path, version: str) -> bool:
    """Set ``version`` on ``path``. Leave dependency maps unchanged.

    Returns True if the file content changed.
    """
    data = _load(path)
    if data.get("version") == version:
        return False
    data["version"] = version
    _dump(path, data)
    return True
