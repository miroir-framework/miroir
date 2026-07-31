from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

RELEASE_DIR = Path(__file__).resolve().parents[1]
if str(RELEASE_DIR) not in sys.path:
    sys.path.insert(0, str(RELEASE_DIR))

from release_lib.common import ReleaseError
from release_lib.handoff import HANDOFF_SCHEMA_VERSION, write_handoff_contract, write_release_plan
from release_lib.plan import build_plan
from release_lib.semver import increment
from release_lib.workspace import find_cycles, topological_layers, workspace_packages


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
        dependencies={"core": "*", "lib": "*"},
        private=False,
    )
    write_manifest(
        tmp_path / "packages" / "lib" / "package.json",
        "lib",
        "0.2.0",
        dependencies={"core": "*"},
        private=False,
    )
    write_manifest(
        tmp_path / "packages" / "core" / "package.json",
        "core",
        "0.3.0",
        private=True,
        scripts={"build": "echo build"},
    )
    write_manifest(
        tmp_path / "packages" / "docs" / "package.json",
        "docs",
        "0.1.0",
        private=False,
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


def test_plan_layers_runtime_closure(repo: Path) -> None:
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
    assert plan.closure_added == ("core", "lib")
    assert plan.selected == ("app", "core", "lib")
    assert plan.layers == (("core",), ("lib",), ("app",))
    assert plan.distributeable == ("app", "lib")
    assert plan.bundle_only == ("core",)


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
    assert plan.layers == (("docs",),)


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


def test_runtime_cycle_aborts_layering(tmp_path: Path) -> None:
    write_manifest(tmp_path / "package.json", "root", "1.0.0")
    write_manifest(
        tmp_path / "packages" / "a" / "package.json",
        "a",
        "1.0.0",
        dependencies={"b": "*"},
    )
    write_manifest(
        tmp_path / "packages" / "b" / "package.json",
        "b",
        "1.0.0",
        dependencies={"a": "*"},
    )
    packages = workspace_packages(tmp_path)
    with pytest.raises(ReleaseError, match="runtime dependency cycle"):
        topological_layers(packages, ["a", "b"])


def test_dev_cycle_is_reported_but_does_not_block_runtime_layers(tmp_path: Path) -> None:
    write_manifest(tmp_path / "package.json", "root", "1.0.0")
    write_manifest(
        tmp_path / "packages" / "a" / "package.json",
        "a",
        "1.0.0",
        dependencies={},
        devDependencies={"b": "*"},
    )
    write_manifest(
        tmp_path / "packages" / "b" / "package.json",
        "b",
        "1.0.0",
        dependencies={"a": "*"},
    )
    packages = workspace_packages(tmp_path)
    assert find_cycles(packages, selected=["a", "b"], runtime_only=True) == []
    assert find_cycles(packages, selected=["a", "b"], runtime_only=False)
    assert topological_layers(packages, ["a", "b"]) == (("a",), ("b",))


def test_handoff_contract_written(repo: Path) -> None:
    plan = build_plan(
        repo,
        bump="patch",
        since="1.2.2",
        force=[],
        disable=[],
        candidate_provider=candidates(["docs"]),
    )
    plan_path = write_release_plan(repo, plan, tarballs=[])
    handoff = write_handoff_contract(repo, plan, tarballs=[])
    data = json.loads(handoff.read_text(encoding="utf-8"))
    assert data["schemaVersion"] == HANDOFF_SCHEMA_VERSION
    assert data["consumerIssue"] == 224
    assert data["productVersion"] == plan.product_version
    assert Path(data["releasePlan"]) == plan_path
