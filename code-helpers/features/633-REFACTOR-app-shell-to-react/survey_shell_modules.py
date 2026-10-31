"""#633 survey: what keeps each module of miroir-standalone-app/src/miroir-fwk/4_view from moving to miroir-react.

Parses the imports of every .ts/.tsx under miroir-standalone-app/src (comments stripped), resolves relative
imports to files, and reports for each 4_view module:
- the app modules outside 4_view it imports (directly), grouped by area (4-tests, src root, MlTools)
- the external packages it imports that miroir-react does not declare
- static vs dynamic (import()) edges
and the strongly connected components of the 4_view import graph, plus the importers of each 4_view module from
outside it (sandbox alias, Electron, tests).

Usage: python code-helpers/features/633-REFACTOR-app-shell-to-react/survey_shell_modules.py [--json]
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
APP_SRC = REPO / "packages/miroir-standalone-app/src"
VIEW = APP_SRC / "miroir-fwk/4_view"
REACT_PKG = REPO / "packages/miroir-react/package.json"
EXTERNAL_IMPORTERS = {
    "miroir-sandbox": REPO / "packages/miroir-sandbox/src",
    "miroir-standalone-app-electron": REPO / "packages/miroir-standalone-app-electron/src",
    "miroir-standalone-app tests": REPO / "packages/miroir-standalone-app/tests",
}

COMMENT = re.compile(r"/\*.*?\*/|//[^\n]*", re.S)
STATIC = re.compile(r"""(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]""")
DYNAMIC = re.compile(r"""import\(\s*['"]([^'"]+)['"]\s*\)""")
EXTS = (".ts", ".tsx", "/index.ts", "/index.tsx")


def strip(text: str) -> str:
    return COMMENT.sub("", text)


def resolve(base: Path, spec: str) -> Path | None:
    target = (base.parent / spec).resolve()
    candidates = [target]
    if target.suffix in (".js", ".jsx"):
        candidates.append(target.with_suffix(".ts"))
        candidates.append(target.with_suffix(".tsx"))
    candidates += [Path(str(target) + ext) for ext in EXTS]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


def package_of(spec: str) -> str:
    parts = spec.split("/")
    return "/".join(parts[:2]) if spec.startswith("@") else parts[0]


def is_type_only(text: str, spec: str) -> bool:
    pattern = re.compile(r"import\s+type\s+[^;]*?['\"]" + re.escape(spec) + r"['\"]")
    return bool(pattern.search(text))


def scan(root: Path):
    edges: dict[Path, list[tuple[Path | str, str]]] = {}
    for file in sorted(root.rglob("*.ts*")):
        if file.suffix not in (".ts", ".tsx"):
            continue
        text = strip(file.read_text(encoding="utf-8"))
        found: list[tuple[Path | str, str]] = []
        for kind, regex in (("static", STATIC), ("dynamic", DYNAMIC)):
            for spec in regex.findall(text):
                if spec.startswith("."):
                    target = resolve(file, spec)
                    if target is not None:
                        found.append((target, "type" if kind == "static" and is_type_only(text, spec) else kind))
                else:
                    found.append((package_of(spec), kind))
        edges[file] = found
    return edges


def tarjan(nodes, adjacency):
    index, low, on_stack, stack, result, counter = {}, {}, set(), [], [], [0]

    def strongconnect(node):
        index[node] = low[node] = counter[0]
        counter[0] += 1
        stack.append(node)
        on_stack.add(node)
        for succ in adjacency.get(node, ()):
            if succ not in index:
                strongconnect(succ)
                low[node] = min(low[node], low[succ])
            elif succ in on_stack:
                low[node] = min(low[node], index[succ])
        if low[node] == index[node]:
            component = []
            while True:
                member = stack.pop()
                on_stack.discard(member)
                component.append(member)
                if member == node:
                    break
            if len(component) > 1:
                result.append(sorted(component))

    sys.setrecursionlimit(10000)
    for node in nodes:
        if node not in index:
            strongconnect(node)
    return result


def area(path: Path) -> str:
    rel = path.relative_to(APP_SRC).as_posix()
    if rel.startswith("miroir-fwk/4_view/"):
        return "4_view"
    if rel.startswith("miroir-fwk/4-tests/"):
        return "4-tests"
    return rel


def main() -> None:
    react = json.loads(REACT_PKG.read_text(encoding="utf-8"))
    react_packages = set(react.get("dependencies", {})) | set(react.get("peerDependencies", {})) | {"react", "miroir-react"}
    edges = scan(APP_SRC)
    view_modules = sorted(f for f in edges if f.is_relative_to(VIEW))
    rows = []
    for module in view_modules:
        app_outside: dict[str, list[str]] = defaultdict(list)
        missing_packages: set[str] = set()
        for target, kind in edges[module]:
            if isinstance(target, Path):
                if not target.is_relative_to(VIEW):
                    app_outside[area(target)].append(f"{target.relative_to(APP_SRC).as_posix()} ({kind})")
            elif target not in react_packages and not target.startswith("node:"):
                missing_packages.add(f"{target} ({kind})")
        rows.append({
            "module": module.relative_to(VIEW).as_posix(),
            "lines": len(module.read_text(encoding="utf-8").splitlines()),
            "appImportsOutside4View": {key: sorted(set(value)) for key, value in sorted(app_outside.items())},
            "packagesMiroirReactLacks": sorted(missing_packages),
        })

    adjacency = {
        module: [t for t, kind in edges[module] if isinstance(t, Path) and t.is_relative_to(VIEW) and kind != "type"]
        for module in view_modules
    }
    cycles = [[m.relative_to(VIEW).as_posix() for m in c] for c in tarjan(view_modules, adjacency)]

    # importers of 4_view modules from the rest of the app (4-tests, src root) and from other packages
    importers: dict[str, list[str]] = defaultdict(list)
    for file, found in edges.items():
        if file.is_relative_to(VIEW):
            continue
        for target, kind in found:
            if isinstance(target, Path) and target.is_relative_to(VIEW):
                importers[target.relative_to(VIEW).as_posix()].append(f"app:{area(file)} ({kind})")
    alias = re.compile(r"""['"]@miroir-app/miroir-fwk/4_view/([^'"]+)['"]""")
    relative_to_app = re.compile(r"""['"](?:\.\./)+(?:miroir-standalone-app/)?src/miroir-fwk/4_view/([^'"]+)['"]""")
    for label, root in EXTERNAL_IMPORTERS.items():
        if not root.exists():
            continue
        for file in root.rglob("*.ts*"):
            text = strip(file.read_text(encoding="utf-8"))
            for regex in (alias, relative_to_app):
                for spec in regex.findall(text):
                    importers[re.sub(r"\.(js|tsx?)$", "", spec)].append(f"{label}:{file.relative_to(REPO).as_posix()}")

    report = {"modules": rows, "cycles": cycles, "importersFromOutside4View": {k: sorted(set(v)) for k, v in sorted(importers.items())}}
    if "--json" in sys.argv:
        print(json.dumps(report, indent=2))
        return
    print(f"{len(rows)} modules, {sum(r['lines'] for r in rows)} lines under {VIEW.relative_to(REPO).as_posix()}\n")
    for row in rows:
        blockers = []
        for key, value in row["appImportsOutside4View"].items():
            blockers.append(f"{key}: {len(value)}")
        if row["packagesMiroirReactLacks"]:
            blockers.append("packages: " + ", ".join(row["packagesMiroirReactLacks"]))
        print(f"{row['module']} ({row['lines']}) -> " + ("; ".join(blockers) if blockers else "no outside blocker"))
    print("\nCycles (static and type-free edges inside 4_view):")
    for cycle in cycles:
        print(f"  [{len(cycle)}] " + ", ".join(cycle))
    print("\nImporters from outside 4_view:")
    for module, sources in report["importersFromOutside4View"].items():
        print(f"  {module}: " + ", ".join(sources))


if __name__ == "__main__":
    main()
