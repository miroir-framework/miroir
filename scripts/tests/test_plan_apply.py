"""Phase 5 — apply_release_plan writes allow-listed versions only (#223)."""

from __future__ import annotations

import json
from pathlib import Path

from release_tag_lib.allowlist import BPLUS_PACKAGE_NAMES
from release_tag_lib.bump import read_package_version
from release_tag_lib.plan import apply_release_plan, build_release_plan


def _workspace(root: Path) -> None:
    (root / "package.json").write_text(
        json.dumps(
            {
                "name": "miroir-framework",
                "version": "0.5.0-rc.1",
                "dependencies": {},
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    for name in sorted(BPLUS_PACKAGE_NAMES):
        pkg = root / "packages" / name / "package.json"
        pkg.parent.mkdir(parents=True, exist_ok=True)
        pkg.write_text(
            json.dumps(
                {
                    "name": name,
                    "version": "1.0.0",
                    "dependencies": {"miroir-core": "*"},
                    "devDependencies": {"something": "*"},
                },
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
    core = root / "packages" / "miroir-core" / "package.json"
    core.parent.mkdir(parents=True, exist_ok=True)
    core.write_text(
        json.dumps(
            {
                "name": "miroir-core",
                "version": "0.0.0",
                "dependencies": {"miroir-test-app_deployment-miroir": "*"},
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


def test_apply_updates_allowlisted_versions(tmp_path: Path) -> None:
    _workspace(tmp_path)
    plan = build_release_plan(tmp_path, "0.5.0-rc.2")
    apply_release_plan(plan)

    assert read_package_version(tmp_path / "package.json") == "0.5.0-rc.2"
    for name in BPLUS_PACKAGE_NAMES:
        assert (
            read_package_version(tmp_path / "packages" / name / "package.json")
            == "0.5.0-rc.2"
        )


def test_apply_leaves_internal_package_version_unchanged(tmp_path: Path) -> None:
    _workspace(tmp_path)
    apply_release_plan(build_release_plan(tmp_path, "0.5.0-rc.2"))
    assert read_package_version(tmp_path / "packages" / "miroir-core" / "package.json") == "0.0.0"


def test_apply_preserves_dependency_ranges(tmp_path: Path) -> None:
    _workspace(tmp_path)
    server = tmp_path / "packages" / "miroir-server" / "package.json"
    before = json.loads(server.read_text(encoding="utf-8"))

    apply_release_plan(build_release_plan(tmp_path, "0.5.0-rc.2"))

    after = json.loads(server.read_text(encoding="utf-8"))
    assert after["dependencies"] == before["dependencies"]
    assert after["devDependencies"] == before["devDependencies"]


def test_apply_twice_is_safe(tmp_path: Path) -> None:
    _workspace(tmp_path)
    plan = build_release_plan(tmp_path, "0.5.0-rc.2")
    apply_release_plan(plan)
    apply_release_plan(plan)
    assert read_package_version(tmp_path / "package.json") == "0.5.0-rc.2"
    assert (
        read_package_version(tmp_path / "packages" / "miroir-cli" / "package.json")
        == "0.5.0-rc.2"
    )
