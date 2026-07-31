from __future__ import annotations

import json
from pathlib import Path

import pytest

from release_version import ReleaseError, build_plan, increment


def write_manifest(path: Path, name: str, version: str, **sections: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload: dict[str, object] = {"name": name, "version": version}
    payload.update(sections)
    path.write_text(json.dumps(payload), encoding="utf-8")


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    write_manifest(tmp_path / "package.json", "root", "1.2.3")
    write_manifest(
        tmp_path / "packages" / "app" / "package.json",
        "app",
        "0.4.0",
        dependencies={"core": "*"},
    )
    write_manifest(
        tmp_path / "packages" / "core" / "package.json",
        "core",
        "0.3.0",
    )
    write_manifest(
        tmp_path / "packages" / "docs" / "package.json",
        "docs",
        "0.1.0",
    )
    return tmp_path


def candidates(names: list[str]):
    def provider(_repo_root: Path, _base_ref: str) -> list[str]:
        return names

    return provider


def test_increment_major_minor_patch() -> None:
    assert increment("1.2.3", "major") == "2.0.0"
    assert increment("1.2.3", "minor") == "1.3.0"
    assert increment("1.2.3", "patch") == "1.2.4"


def test_increment_promotes_patch_prerelease_to_stable() -> None:
    assert increment("1.2.3-rc.1", "patch") == "1.2.3"


def test_plan_uses_lerna_candidates_and_runtime_closure(repo: Path) -> None:
    plan = build_plan(
        repo,
        bump="minor",
        since="1.2.2",
        force=[],
        disable=[],
        candidate_provider=candidates(["app"]),
    )

    assert plan.product_version == "1.3.0"
    assert plan.lerna_candidates == ("app",)
    assert plan.closure_added == ("core",)
    assert plan.selected == ("app", "core")


def test_plan_force_adds_package_and_disable_removes_candidate(repo: Path) -> None:
    plan = build_plan(
        repo,
        bump="patch",
        since="1.2.2",
        force=["docs"],
        disable=["app"],
        candidate_provider=candidates(["app"]),
    )

    assert plan.forced == ("docs",)
    assert plan.disabled == ("app",)
    assert plan.selected == ("docs",)


def test_plan_rejects_disabling_required_dependency(repo: Path) -> None:
    with pytest.raises(ReleaseError, match="required runtime/peer dependency"):
        build_plan(
            repo,
            bump="patch",
            since="1.2.2",
            force=[],
            disable=["core"],
            candidate_provider=candidates(["app", "core"]),
        )


def test_plan_rejects_unknown_or_conflicting_overrides(repo: Path) -> None:
    with pytest.raises(ReleaseError, match="unknown workspace"):
        build_plan(
            repo,
            bump="patch",
            since="1.2.2",
            force=["missing"],
            disable=[],
            candidate_provider=candidates([]),
        )
    with pytest.raises(ReleaseError, match="both forced and disabled"):
        build_plan(
            repo,
            bump="patch",
            since="1.2.2",
            force=["docs"],
            disable=["docs"],
            candidate_provider=candidates([]),
        )
