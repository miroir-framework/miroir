"""Phase 3 — workspace dependency cycle detection (#223 D6)."""

from __future__ import annotations

import json
from pathlib import Path

from release_tag_lib.dep_graph import find_dev_involving_cycles, find_runtime_cycles


def _write_pkg(
    root: Path,
    name: str,
    *,
    dependencies: dict[str, str] | None = None,
    dev_dependencies: dict[str, str] | None = None,
    peer_dependencies: dict[str, str] | None = None,
) -> None:
    payload: dict = {"name": name, "version": "0.0.0"}
    if dependencies is not None:
        payload["dependencies"] = dependencies
    if dev_dependencies is not None:
        payload["devDependencies"] = dev_dependencies
    if peer_dependencies is not None:
        payload["peerDependencies"] = peer_dependencies
    path = root / "packages" / name / "package.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def test_mutual_runtime_dependencies_are_a_cycle(tmp_path: Path) -> None:
    _write_pkg(tmp_path, "pkg-a", dependencies={"pkg-b": "*"})
    _write_pkg(tmp_path, "pkg-b", dependencies={"pkg-a": "*"})

    cycles = find_runtime_cycles(tmp_path)

    assert len(cycles) >= 1
    nodes = {frozenset(c.nodes) for c in cycles}
    assert frozenset({"pkg-a", "pkg-b"}) in nodes


def test_acyclic_runtime_graph_has_no_cycles(tmp_path: Path) -> None:
    _write_pkg(tmp_path, "pkg-a", dependencies={"pkg-b": "*"})
    _write_pkg(tmp_path, "pkg-b")
    assert find_runtime_cycles(tmp_path) == []


def test_dev_back_edge_is_not_a_runtime_cycle(tmp_path: Path) -> None:
    _write_pkg(tmp_path, "pkg-a", dev_dependencies={"pkg-b": "*"})
    _write_pkg(tmp_path, "pkg-b", dependencies={"pkg-a": "*"})

    assert find_runtime_cycles(tmp_path) == []
    dev_cycles = find_dev_involving_cycles(tmp_path)
    assert frozenset({"pkg-a", "pkg-b"}) in {frozenset(c.nodes) for c in dev_cycles}


def test_peer_dependencies_count_as_runtime_edges(tmp_path: Path) -> None:
    _write_pkg(tmp_path, "pkg-a", peer_dependencies={"pkg-b": "*"})
    _write_pkg(tmp_path, "pkg-b", dependencies={"pkg-a": "*"})

    cycles = find_runtime_cycles(tmp_path)
    assert frozenset({"pkg-a", "pkg-b"}) in {frozenset(c.nodes) for c in cycles}
