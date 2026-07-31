"""Release plan construction: Lerna candidates, overrides, layers."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Callable

from release_lib.common import ReleaseError, load_json, log_step, run, executable
from release_lib.semver import SEMVER, increment
from release_lib.workspace import (
    Workspace,
    find_cycles,
    release_closure,
    topological_layers,
    workspace_packages,
)

CandidateProvider = Callable[[Path, str], list[str]]


@dataclass(frozen=True)
class ReleasePlan:
    base_ref: str
    bump: str
    product_version: str
    lerna_candidates: tuple[str, ...]
    forced: tuple[str, ...]
    disabled: tuple[str, ...]
    closure_added: tuple[str, ...]
    selected: tuple[str, ...]
    layers: tuple[tuple[str, ...], ...]
    runtime_cycles: tuple[tuple[str, ...], ...] = ()
    dev_cycles: tuple[tuple[str, ...], ...] = ()
    distributeable: tuple[str, ...] = ()
    bundle_only: tuple[str, ...] = ()
    worktree_path: str | None = None
    release_plan_path: str | None = None
    tarball_dir: str | None = None

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["layers"] = [
            {"index": index, "packages": list(layer)}
            for index, layer in enumerate(self.layers)
        ]
        return data


def previous_release_tag(repo_root: Path) -> str:
    result = run(
        ["git", "tag", "--merged", "HEAD", "--sort=-version:refname"],
        cwd=repo_root,
    )
    for tag in result.stdout.splitlines():
        if SEMVER.fullmatch(tag):
            return tag
    raise ReleaseError("no reachable SemVer release tag; pass --since <ref>")


def lerna_candidates(repo_root: Path, base_ref: str) -> list[str]:
    log_step(f"asking Lerna which packages changed since {base_ref!r}")
    result = run(
        [executable("npx"), "lerna", "ls", "--since", base_ref, "--json"],
        cwd=repo_root,
    )
    start = result.stdout.find("[")
    if start < 0:
        raise ReleaseError("Lerna did not emit a JSON package list")
    try:
        entries = json_loads_list(result.stdout[start:])
    except ValueError as exc:
        raise ReleaseError(f"cannot parse Lerna package list: {exc}") from exc
    names: list[str] = []
    for entry in entries:
        name = entry.get("name") if isinstance(entry, dict) else None
        if not isinstance(name, str):
            raise ReleaseError("Lerna package list contains an entry without a name")
        names.append(name)
    return sorted(set(names))


def json_loads_list(text: str) -> list[Any]:
    import json

    entries = json.loads(text)
    if not isinstance(entries, list):
        raise ValueError("expected a JSON array")
    return entries


def classify_packages(
    packages: dict[str, Workspace],
    selected: set[str],
) -> tuple[tuple[str, ...], tuple[str, ...]]:
    """Non-private packages are treated as distributeable; private as bundle-only."""
    distributeable = tuple(
        sorted(name for name in selected if not packages[name].private)
    )
    bundle_only = tuple(sorted(name for name in selected if packages[name].private))
    return distributeable, bundle_only


def build_plan(
    repo_root: Path,
    *,
    bump: str,
    since: str | None,
    force: list[str],
    disable: list[str],
    candidate_provider: CandidateProvider = lerna_candidates,
) -> ReleasePlan:
    root = load_json(repo_root / "package.json")
    root_version = root.get("version")
    if not isinstance(root_version, str):
        raise ReleaseError("root package.json has no string version")
    packages = workspace_packages(repo_root)
    unknown = (set(force) | set(disable)) - set(packages)
    if unknown:
        raise ReleaseError("unknown workspace package(s): " + ", ".join(sorted(unknown)))
    overlap = set(force) & set(disable)
    if overlap:
        raise ReleaseError(
            "package(s) both forced and disabled: " + ", ".join(sorted(overlap))
        )
    if len(force) != len(set(force)) or len(disable) != len(set(disable)):
        raise ReleaseError("duplicate --force or --disable package")

    base_ref = since or previous_release_tag(repo_root)
    raw_candidates = set(candidate_provider(repo_root, base_ref))
    unknown_candidates = raw_candidates - set(packages)
    if unknown_candidates:
        raise ReleaseError(
            "Lerna returned unknown workspace package(s): "
            + ", ".join(sorted(unknown_candidates))
        )
    disabled_set = set(disable)
    non_candidates = disabled_set - raw_candidates
    if non_candidates:
        raise ReleaseError(
            "--disable only accepts Lerna candidates: "
            + ", ".join(sorted(non_candidates))
        )

    initial = (raw_candidates | set(force)) - disabled_set
    selected = release_closure(initial, packages)
    disabled_in_closure = selected & disabled_set
    if disabled_in_closure:
        raise ReleaseError(
            "cannot disable required runtime/peer dependency: "
            + ", ".join(sorted(disabled_in_closure))
        )

    layers = topological_layers(packages, selected)
    runtime_cycles = tuple(
        find_cycles(packages, selected=selected, runtime_only=True)
    )
    if runtime_cycles:
        rendered = "; ".join(" <-> ".join(cycle) for cycle in runtime_cycles)
        raise ReleaseError(f"runtime dependency cycle: {rendered}")
    # Dev cycles are reported for build context; they do not abort release layering.
    dev_cycles = tuple(find_cycles(packages, selected=selected, runtime_only=False))
    distributeable, bundle_only = classify_packages(packages, selected)
    product_version = increment(root_version, bump)

    if dev_cycles:
        log_step(
            f"note: {len(dev_cycles)} dev-only dependency cycle(s) detected "
            "(devDependencies only; informational, does not block the release) - "
            "see plan.dev_cycles"
        )
    log_step(
        f"plan: {root_version} --{bump}--> {product_version}; "
        f"{len(selected)} package(s) selected in {len(layers)} layer(s) "
        f"({len(distributeable)} distributeable, {len(bundle_only)} bundle-only)"
    )

    return ReleasePlan(
        base_ref=base_ref,
        bump=bump,
        product_version=product_version,
        lerna_candidates=tuple(sorted(raw_candidates)),
        forced=tuple(sorted(set(force))),
        disabled=tuple(sorted(disabled_set)),
        closure_added=tuple(sorted(selected - initial)),
        selected=tuple(sorted(selected)),
        layers=tuple(layers),
        runtime_cycles=runtime_cycles,
        dev_cycles=dev_cycles,
        distributeable=distributeable,
        bundle_only=bundle_only,
    )
