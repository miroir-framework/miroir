"""Workspace package dependency graphs and cycle detection (#223 D6)."""

from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable


@dataclass(frozen=True)
class Cycle:
    nodes: tuple[str, ...]


def workspace_package_jsons(repo_root: Path) -> dict[str, Path]:
    """Map package name → package.json path for ``packages/*/package.json``."""
    root = repo_root.resolve()
    result: dict[str, Path] = {}
    packages_dir = root / "packages"
    if not packages_dir.is_dir():
        return result
    for pkg_json in sorted(packages_dir.glob("*/package.json")):
        data = json.loads(pkg_json.read_text(encoding="utf-8"))
        name = data.get("name")
        if isinstance(name, str) and name:
            result[name] = pkg_json
    return result


def _edges_from_kinds(
    packages: dict[str, Path],
    kinds: Iterable[str],
) -> dict[str, set[str]]:
    graph: dict[str, set[str]] = defaultdict(set)
    kind_set = set(kinds)
    for name, path in packages.items():
        data: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
        for kind in kind_set:
            deps = data.get(kind) or {}
            if not isinstance(deps, dict):
                continue
            for dep_name in deps:
                if dep_name in packages:
                    graph[name].add(dep_name)
    return graph


def _find_cycles(graph: dict[str, set[str]]) -> list[Cycle]:
    """Return unique simple cycles (as frozensets of nodes), order-normalized."""
    found: set[frozenset[str]] = set()

    def dfs(start: str, node: str, path: list[str], on_stack: set[str]) -> None:
        for nxt in sorted(graph.get(node, ())):
            if nxt == start and len(path) >= 1:
                found.add(frozenset(path))
            elif nxt not in on_stack and len(path) < 32:
                dfs(start, nxt, path + [nxt], on_stack | {nxt})

    for name in sorted(graph.keys() | {n for outs in graph.values() for n in outs}):
        dfs(name, name, [name], {name})

    cycles: list[Cycle] = []
    for nodes in found:
        if len(nodes) < 2:
            continue
        cycles.append(Cycle(nodes=tuple(sorted(nodes))))
    cycles.sort(key=lambda c: c.nodes)
    return cycles


def find_runtime_cycles(repo_root: Path) -> list[Cycle]:
    packages = workspace_package_jsons(repo_root)
    graph = _edges_from_kinds(packages, ("dependencies", "peerDependencies"))
    return _find_cycles(graph)


def find_dev_involving_cycles(repo_root: Path) -> list[Cycle]:
    """Cycles visible when counting dependencies + devDependencies (+ peers)."""
    packages = workspace_package_jsons(repo_root)
    graph = _edges_from_kinds(
        packages, ("dependencies", "devDependencies", "peerDependencies")
    )
    return _find_cycles(graph)
