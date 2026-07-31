"""Release-plan emission and #224 handoff contract."""

from __future__ import annotations

from dataclasses import asdict
from pathlib import Path
from typing import Any

from release_lib.common import dump_json, load_json
from release_lib.plan import ReleasePlan
from release_lib.tarballs import TarballInfo

HANDOFF_SCHEMA_VERSION = 1


def write_release_plan(
    repo_root: Path,
    plan: ReleasePlan,
    *,
    tarballs: list[TarballInfo] | None = None,
    worktree_path: Path | None = None,
) -> Path:
    path = repo_root / "release-plan.json"
    payload = plan.to_dict()
    payload["schemaVersion"] = HANDOFF_SCHEMA_VERSION
    payload["worktree_path"] = str(worktree_path or repo_root)
    payload["release_plan_path"] = str(path)
    payload["tarball_dir"] = str(repo_root / "release-tarballs")
    if tarballs is not None:
        payload["tarballs"] = [asdict(info) for info in tarballs]
    dump_json(path, payload)
    return path


def write_handoff_contract(
    repo_root: Path,
    plan: ReleasePlan,
    *,
    tarballs: list[TarballInfo],
) -> Path:
    """Write the #227 → #224 validated release-tree handoff descriptor."""
    path = repo_root / "release-handoff.json"
    payload: dict[str, Any] = {
        "schemaVersion": HANDOFF_SCHEMA_VERSION,
        "issue": 227,
        "consumerIssue": 224,
        "productVersion": plan.product_version,
        "baseRef": plan.base_ref,
        "releaseWorktree": str(repo_root),
        "releasePlan": str(repo_root / "release-plan.json"),
        "tarballDir": str(repo_root / "release-tarballs"),
        "layers": [
            {"index": index, "packages": list(layer)}
            for index, layer in enumerate(plan.layers)
        ],
        "selected": list(plan.selected),
        "distributeable": list(plan.distributeable),
        "bundleOnly": list(plan.bundle_only),
        "tarballs": [asdict(info) for info in tarballs],
        "constraints": [
            "Do not choose package versions or rewrite dependency ranges in #224.",
            "Build platform artefacts only from this validated release worktree.",
            "Embed/read the product version from release-plan.json / root package.json.",
            "Existing workflows that delete package-lock.json are not release validation.",
        ],
    }
    dump_json(path, payload)
    return path


def read_handoff(path: Path) -> dict[str, Any]:
    data = load_json(path)
    if data.get("schemaVersion") != HANDOFF_SCHEMA_VERSION:
        raise ValueError(f"unsupported handoff schema: {data.get('schemaVersion')}")
    return data
