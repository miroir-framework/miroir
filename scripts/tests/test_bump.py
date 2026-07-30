"""Phase 2 — bump package.json version without touching dependency ranges (#223)."""

from __future__ import annotations

import json
from pathlib import Path

from release_tag_lib.bump import bump_package_version, read_package_version


def _write_pkg(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def test_bump_sets_version_field(tmp_path: Path) -> None:
    pkg = tmp_path / "package.json"
    _write_pkg(
        pkg,
        {
            "name": "miroir-server",
            "version": "1.0.0",
            "dependencies": {"miroir-core": "*"},
        },
    )

    changed = bump_package_version(pkg, "0.5.0-rc.2")

    assert changed is True
    assert read_package_version(pkg) == "0.5.0-rc.2"


def test_bump_preserves_dependency_ranges(tmp_path: Path) -> None:
    pkg = tmp_path / "package.json"
    before = {
        "name": "miroir-server",
        "version": "1.0.0",
        "dependencies": {
            "miroir-core": "*",
            "miroir-mcp": "*",
        },
        "devDependencies": {"miroir-store-postgres": "*"},
        "peerDependencies": {"miroir-store-filesystem": "*"},
    }
    _write_pkg(pkg, before)

    bump_package_version(pkg, "0.5.0-rc.2")

    after = json.loads(pkg.read_text(encoding="utf-8"))
    assert after["dependencies"] == before["dependencies"]
    assert after["devDependencies"] == before["devDependencies"]
    assert after["peerDependencies"] == before["peerDependencies"]
