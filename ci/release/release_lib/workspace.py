"""Workspace package inventory and dependency graphs."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from release_lib.common import ReleaseError, load_json

RUNTIME_KINDS = ("dependencies", "peerDependencies")
DEV_KINDS = ("dependencies", "peerDependencies", "devDependencies")


@dataclass(frozen=True)
class Workspace:
    name: str
    path: Path
    version: str
    private: bool
    has_build: bool
    runtime_dependencies: tuple[str, ...]
    all_dependencies: tuple[str, ...]


def workspace_packages(repo_root: Path) -> dict[str, Workspace]:
    packages: dict[str, Workspace] = {}
    for manifest in sorted((repo_root / "packages").glob("*/package.json")):
        data = load_json(manifest)
        name = data.get("name")
        version = data.get("version")
        if not isinstance(name, str) or not isinstance(version, str):
            raise ReleaseError(f"{manifest}: expected string name and version")
        runtime: set[str] = set()
        all_deps: set[str] = set()
        for kind in DEV_KINDS:
            value = data.get(kind, {})
            if not isinstance(value, dict):
                continue
            names = {dep for dep in value if isinstance(dep, str)}
            all_deps.update(names)
            if kind in RUNTIME_KINDS:
                runtime.update(names)
        scripts = data.get("scripts", {})
        packages[name] = Workspace(
            name=name,
            path=manifest,
            version=version,
            private=bool(data.get("private", False)),
            has_build=isinstance(scripts, dict) and "build" in scripts,
            runtime_dependencies=tuple(sorted(runtime)),
            all_dependencies=tuple(sorted(all_deps)),
        )
    return packages


def _edges(
    packages: dict[str, Workspace],
    *,
    selected: Iterable[str] | None,
    runtime_only: bool,
) -> dict[str, set[str]]:
    names = set(selected) if selected is not None else set(packages)
    graph: dict[str, set[str]] = {name: set() for name in names}
    for name in names:
        deps = (
            packages[name].runtime_dependencies
            if runtime_only
            else packages[name].all_dependencies
        )
        for dep in deps:
            if dep in names:
                graph[name].add(dep)
    return graph


def find_cycles(
    packages: dict[str, Workspace],
    *,
    selected: Iterable[str] | None = None,
    runtime_only: bool = True,
) -> list[tuple[str, ...]]:
    graph = _edges(packages, selected=selected, runtime_only=runtime_only)
    found: set[frozenset[str]] = set()

    def dfs(start: str, node: str, path: list[str], on_stack: set[str]) -> None:
        for nxt in sorted(graph.get(node, ())):
            if nxt == start and len(path) >= 1:
                found.add(frozenset(path))
            elif nxt not in on_stack and len(path) < 64:
                dfs(start, nxt, path + [nxt], on_stack | {nxt})

    for name in sorted(graph):
        dfs(name, name, [name], {name})
    cycles = [tuple(sorted(nodes)) for nodes in found if len(nodes) >= 2]
    cycles.sort()
    return cycles


def topological_layers(
    packages: dict[str, Workspace],
    selected: Iterable[str],
) -> tuple[tuple[str, ...], ...]:
    """Partition selected packages into P0…Pn by runtime/peer dependencies."""
    names = set(selected)
    unknown = names - set(packages)
    if unknown:
        raise ReleaseError(
            "unknown package(s) in selection: " + ", ".join(sorted(unknown))
        )
    cycles = find_cycles(packages, selected=names, runtime_only=True)
    if cycles:
        rendered = "; ".join(" <-> ".join(cycle) for cycle in cycles)
        raise ReleaseError(f"runtime dependency cycle: {rendered}")

    deps = {
        name: {
            dep
            for dep in packages[name].runtime_dependencies
            if dep in names
        }
        for name in names
    }
    done: set[str] = set()
    layers: list[tuple[str, ...]] = []
    while len(done) < len(names):
        ready = tuple(
            sorted(name for name, reqs in deps.items() if name not in done and reqs <= done)
        )
        if not ready:
            stuck = sorted(names - done)
            raise ReleaseError(
                "cannot layer selected packages; stuck on: " + ", ".join(stuck)
            )
        layers.append(ready)
        done.update(ready)
    return tuple(layers)


def release_closure(
    initial: set[str],
    packages: dict[str, Workspace],
) -> set[str]:
    selected = set(initial)
    todo = list(initial)
    while todo:
        name = todo.pop()
        for dependency in packages[name].runtime_dependencies:
            if dependency in packages and dependency not in selected:
                selected.add(dependency)
                todo.append(dependency)
    return selected
