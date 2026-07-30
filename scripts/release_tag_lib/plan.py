"""Build a product release plan (#223) — version stamp + D6 cycle gate."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

from release_tag_lib.allowlist import release_manifest_paths
from release_tag_lib.dep_graph import Cycle, find_runtime_cycles
from release_tag_lib.semver_util import is_prerelease, parse_product_version


class ReleasePlanError(ValueError):
    """Invalid version or no-go dependency graph for tagging."""


@dataclass
class ReleasePlan:
    version: str
    files_to_bump: list[Path]
    is_prerelease: bool
    runtime_cycles: list[Cycle] = field(default_factory=list)


def build_release_plan(repo_root: Path, version: str) -> ReleasePlan:
    """Validate version + runtime graph; return plan (no file writes).

    Raises:
        ValueError: invalid product version
        FileNotFoundError: missing allow-listed package.json
        ReleasePlanError: runtime dependency cycle (D6 N1)
    """
    try:
        parsed = parse_product_version(version)
    except ValueError as exc:
        raise ReleasePlanError(str(exc)) from exc

    cycles = find_runtime_cycles(repo_root)
    if cycles:
        rendered = "; ".join(" <-> ".join(c.nodes) for c in cycles)
        raise ReleasePlanError(f"runtime dependency cycle: {rendered}")

    files = release_manifest_paths(repo_root)
    return ReleasePlan(
        version=parsed,
        files_to_bump=files,
        is_prerelease=is_prerelease(parsed),
        runtime_cycles=[],
    )
