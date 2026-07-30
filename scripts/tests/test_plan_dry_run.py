"""Phase 4 — dry-run release plan does not mutate the tree (#223)."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from release_tag_lib.allowlist import BPLUS_PACKAGE_NAMES
from release_tag_lib.plan import ReleasePlanError, build_release_plan


def _workspace(root: Path) -> dict[Path, str]:
    """Create minimal B+ workspace; return path → content snapshot."""
    files: dict[Path, str] = {}
    root_pkg = root / "package.json"
    root_pkg.write_text(
        json.dumps({"name": "miroir-framework", "version": "0.5.0-rc.1"}, indent=2)
        + "\n",
        encoding="utf-8",
    )
    files[root_pkg] = root_pkg.read_text(encoding="utf-8")
    for name in sorted(BPLUS_PACKAGE_NAMES):
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
        files[pkg] = pkg.read_text(encoding="utf-8")
    core = root / "packages" / "miroir-core" / "package.json"
    core.parent.mkdir(parents=True, exist_ok=True)
    core.write_text(
        json.dumps({"name": "miroir-core", "version": "0.0.0"}, indent=2) + "\n",
        encoding="utf-8",
    )
    files[core] = core.read_text(encoding="utf-8")
    return files


def _hashes(files: dict[Path, str]) -> dict[Path, str]:
    return {
        p: hashlib.sha256(p.read_text(encoding="utf-8").encode("utf-8")).hexdigest()
        for p in files
    }


def test_build_release_plan_lists_allowlisted_files_and_version(tmp_path: Path) -> None:
    _workspace(tmp_path)
    plan = build_release_plan(tmp_path, "0.5.0-rc.2")

    assert plan.version == "0.5.0-rc.2"
    assert len(plan.files_to_bump) == 1 + len(BPLUS_PACKAGE_NAMES)
    assert plan.files_to_bump[0] == (tmp_path / "package.json").resolve()
    bumped_names = [
        json.loads(p.read_text(encoding="utf-8"))["name"] for p in plan.files_to_bump
    ]
    assert bumped_names[0] == "miroir-framework"
    assert set(bumped_names[1:]) == set(BPLUS_PACKAGE_NAMES)


def test_build_release_plan_sets_is_prerelease(tmp_path: Path) -> None:
    _workspace(tmp_path)
    assert build_release_plan(tmp_path, "0.5.0-rc.2").is_prerelease is True
    assert build_release_plan(tmp_path, "0.5.0").is_prerelease is False


def test_build_release_plan_does_not_modify_files(tmp_path: Path) -> None:
    snapshot = _workspace(tmp_path)
    before = _hashes(snapshot)

    build_release_plan(tmp_path, "0.5.0-rc.2")

    assert _hashes(snapshot) == before
    for path, content in snapshot.items():
        assert path.read_text(encoding="utf-8") == content


def test_invalid_version_fails_without_touching_files(tmp_path: Path) -> None:
    snapshot = _workspace(tmp_path)
    before = _hashes(snapshot)

    with pytest.raises(ReleasePlanError):
        build_release_plan(tmp_path, "v0.5.0-rc.2")

    assert _hashes(snapshot) == before
