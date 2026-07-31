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
from release_lib.lerna_ops import (
    restore_files,
    rewrite_internal_wildcard_ranges,
    verify_release_ranges,
)
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


def test_restore_files_isolates_failures_and_restores_the_rest(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # No retry delay: this test asserts isolation/aggregation, not the retry timing.
    import release_lib.lerna_ops as lerna_ops

    monkeypatch.setattr(lerna_ops, "_RESTORE_RETRY_ATTEMPTS", 1)
    monkeypatch.setattr(lerna_ops, "_RESTORE_RETRY_DELAY_SECONDS", 0)

    good = tmp_path / "good.json"
    good.write_text("mutated", encoding="utf-8")
    # A missing parent directory makes the write deterministically fail every attempt,
    # simulating a file a concurrent process (e.g. Lerna/npm) still holds.
    unrestorable = tmp_path / "missing-dir" / "bad.json"
    backups = {good: b"original", unrestorable: b"original"}

    with pytest.raises(ReleaseError, match=r"RESTORE FAILED for 1 of 2"):
        restore_files(backups)

    # The failure on one path must not prevent every other backed-up file from
    # being restored — a single-file glitch must never look like a full restore
    # while silently leaving the rest of the tree mutated.
    assert good.read_bytes() == b"original"


def test_verify_release_ranges_rejects_untouched_wildcards(repo: Path) -> None:
    # Every internal edge in the fixture uses '*', mirroring this monorepo's
    # real convention: `lerna version` never rewrites it (there is no old
    # version number in the string for it to bump), so left alone it fails
    # the "must be concrete before release" check.
    plan = build_plan(
        repo,
        bump="minor",
        since="1.2.2",
        force=[],
        disable=[],
        candidate_provider=candidates(["app"]),
    )
    with pytest.raises(ReleaseError, match="is not releaseable: '\\*'"):
        verify_release_ranges(repo, plan)


def test_rewrite_internal_wildcard_ranges_makes_ranges_releaseable(repo: Path) -> None:
    plan = build_plan(
        repo,
        bump="minor",
        since="1.2.2",
        force=[],
        disable=[],
        candidate_provider=candidates(["app"]),
    )

    rewritten = rewrite_internal_wildcard_ranges(repo, plan)

    assert set(rewritten) == {"app", "lib"}
    app_manifest = json.loads((repo / "packages" / "app" / "package.json").read_text(encoding="utf-8"))
    assert app_manifest["dependencies"] == {"core": "^1.3.0", "lib": "^1.3.0"}
    lib_manifest = json.loads((repo / "packages" / "lib" / "package.json").read_text(encoding="utf-8"))
    assert lib_manifest["dependencies"] == {"core": "^1.3.0"}
    # Nothing to rewrite for 'core' (it has no internal runtime dependencies itself).
    verify_release_ranges(repo, plan)


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
