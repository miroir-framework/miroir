"""Phase 2 — B+ allow-list path resolution (#223 D2)."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from release_tag_lib.allowlist import release_manifest_paths
from release_tag_lib.bump import bump_package_version


BPLUS = (
    "miroir-standalone-app-electron",
    "miroir-server",
    "miroir-standalone-app",
    "miroir-cli",
    "miroir-mcp",
)


def _write_workspace(root: Path, *, include_bplus: bool = True, include_core: bool = True) -> None:
    (root / "package.json").write_text(
        json.dumps({"name": "miroir-framework", "version": "0.5.0-rc.1"}, indent=2) + "\n",
        encoding="utf-8",
    )
    if include_bplus:
        for name in BPLUS:
            pkg = root / "packages" / name / "package.json"
            pkg.parent.mkdir(parents=True, exist_ok=True)
            pkg.write_text(
                json.dumps(
                    {"name": name, "version": "1.0.0", "dependencies": {"miroir-core": "*"}},
                    indent=2,
                )
                + "\n",
                encoding="utf-8",
            )
    if include_core:
        core = root / "packages" / "miroir-core" / "package.json"
        core.parent.mkdir(parents=True, exist_ok=True)
        core.write_text(
            json.dumps({"name": "miroir-core", "version": "0.0.0"}, indent=2) + "\n",
            encoding="utf-8",
        )


def test_release_manifest_paths_returns_root_and_bplus(tmp_path: Path) -> None:
    _write_workspace(tmp_path)
    paths = release_manifest_paths(tmp_path)
    names = []
    for p in paths:
        data = json.loads(p.read_text(encoding="utf-8"))
        names.append(data["name"])
    assert names[0] == "miroir-framework"
    assert set(names[1:]) == set(BPLUS)
    assert len(paths) == 1 + len(BPLUS)


def test_release_manifest_paths_excludes_internal_packages(tmp_path: Path) -> None:
    _write_workspace(tmp_path)
    paths = release_manifest_paths(tmp_path)
    assert all(p.name == "package.json" for p in paths)
    assert not any("miroir-core" in p.parts for p in paths)


def test_release_manifest_paths_fails_when_bplus_missing(tmp_path: Path) -> None:
    _write_workspace(tmp_path, include_bplus=False)
    with pytest.raises(FileNotFoundError, match="miroir-server"):
        release_manifest_paths(tmp_path)


def test_bump_idempotent_when_already_at_target(tmp_path: Path) -> None:
    pkg = tmp_path / "package.json"
    pkg.write_text(
        json.dumps({"name": "miroir-cli", "version": "0.5.0-rc.2"}, indent=2) + "\n",
        encoding="utf-8",
    )
    assert bump_package_version(pkg, "0.5.0-rc.2") is False
