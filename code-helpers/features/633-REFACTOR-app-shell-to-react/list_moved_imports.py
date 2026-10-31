"""#633: which symbols code outside the moved set imports from each module that moves to miroir-react.

The moved set is analysis.md §5.1 (and §5.2 for miroir-diagram-class). Importers scanned: miroir-standalone-app
src and tests, miroir-sandbox src, miroir-standalone-app-electron src, miroir-core tests. Static and dynamic
imports are read with comments stripped; `vi.mock("<path>")` strings are reported as well, since a moved module
can no longer be mocked by its app path. Source-text readers are files that name `4_view/<path>` literally;
guards that join a directory and a file name (e.g. mcpToolRunner.253.phase0) are not found and need a grep
for the base name.

The output feeds the index.ts exports of each slice and packages/miroir-react/tests/shellExports.unit.test.ts.

Usage: python code-helpers/features/633-REFACTOR-app-shell-to-react/list_moved_imports.py [--json]
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
VIEW = REPO / "packages/miroir-standalone-app/src/miroir-fwk/4_view"

MOVED = {
    "miroir-react": [
        "PageDispatcher.tsx",
        "components/Page/RootComponent.tsx",
        "components/Page/AppBar.tsx",
        "components/EventTimelineContainer.tsx",
        "components/InstanceEditorOutline.tsx",
        "ErrorLogsPageDEFUNCT.tsx",
        "routes/HomePage.tsx",
        "routes/SettingsPage.tsx",
        "routes/SearchPage.tsx",
        "routes/TransformerBuilderPage.tsx",
        "routes/Check.tsx",
        "routes/LoginPage.tsx",
        "routes/Runners.tsx",
        "routes/ModelDiagramPage.tsx",
        "pages/MiroirEventsPage.tsx",
        "components/Runners/RunnerView.tsx",
        "components/Runners/RunnersList.tsx",
        "components/Runners/Runner_CreateApplication.tsx",
        "components/Runners/Runner_CreateEntity.tsx",
        "components/Runners/Runner_DropApplication.tsx",
        "components/Runners/Runner_DropEntity.tsx",
        "components/Runners/Runner_InstallApplication.tsx",
        "components/Runners/resolveMcpToolAction.ts",
        "components/SequenceEditor/SequenceEditor.tsx",
        "services/ConfigurationService.ts",
        "services/usePageConfiguration.ts",
        "services/index.ts",
        "routes/ai/miroirAiBackend.ts",
        "routes/ai/agentBackendPick.ts",
    ],
    "miroir-diagram-class": ["components/Reports/ModelDiagramReportSectionView.tsx"],
}
IMPORTER_ROOTS = [
    REPO / "packages/miroir-standalone-app/src",
    REPO / "packages/miroir-standalone-app/tests",
    REPO / "packages/miroir-sandbox/src",
    REPO / "packages/miroir-standalone-app-electron/src",
    REPO / "packages/miroir-core/tests",
]

COMMENT = re.compile(r"/\*.*?\*/|//[^\n]*", re.S)
NAMED = re.compile(r"""import\s+(type\s+)?\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]""", re.S)
DYNAMIC = re.compile(r"""import\(\s*['"]([^'"]+)['"]\s*\)""")
MOCK = re.compile(r"""vi\.(?:do)?[mM]ock\(\s*['"]([^'"]+)['"]""")


def resolve(base: Path, spec: str) -> Path | None:
    if not spec.startswith("."):
        if spec.startswith("@miroir-app/"):
            target = REPO / "packages/miroir-standalone-app/src" / spec[len("@miroir-app/"):]
        else:
            return None
    else:
        target = (base.parent / spec).resolve()
    for candidate in (target, target.with_suffix(".ts"), target.with_suffix(".tsx"), Path(f"{target}.ts"), Path(f"{target}.tsx")):
        if candidate.is_file():
            return candidate.resolve()
    return None


def main() -> None:
    moved = {(VIEW / rel).resolve(): (package, rel) for package, rels in MOVED.items() for rel in rels}
    symbols: dict[str, set[str]] = defaultdict(set)
    importers: dict[str, set[str]] = defaultdict(set)
    mocks: dict[str, set[str]] = defaultdict(set)
    source_text: dict[str, set[str]] = defaultdict(set)
    for root in IMPORTER_ROOTS:
        for path in root.rglob("*"):
            if path.suffix not in (".ts", ".tsx") or "node_modules" in path.parts or path.resolve() in moved:
                continue
            text = COMMENT.sub("", path.read_text(encoding="utf-8", errors="replace"))
            where = str(path.relative_to(REPO))
            for type_kw, names, spec in NAMED.findall(text):
                target = resolve(path, spec)
                if target not in moved:
                    continue
                _, rel = moved[target]
                importers[rel].add(where)
                for name in names.split(","):
                    name = name.strip()
                    if not name:
                        continue
                    is_type = bool(type_kw) or name.startswith("type ")
                    name = name.removeprefix("type ").split(" as ")[0].strip()
                    symbols[rel].add(f"{name} (type)" if is_type else name)
            for spec in DYNAMIC.findall(text):
                target = resolve(path, spec)
                if target in moved:
                    importers[moved[target][1]].add(f"{where} (dynamic)")
            for target, (_, rel) in moved.items():
                if f"4_view/{rel}" in text:
                    source_text[rel].add(where)
            for spec in MOCK.findall(text):
                target = resolve(path, spec)
                if target in moved:
                    mocks[moved[target][1]].add(where)
    result = {
        rel: {
            "package": package,
            "symbols": sorted(symbols[rel]),
            "importers": sorted(importers[rel]),
            "pathMocks": sorted(mocks[rel]),
            "sourceTextReaders": sorted(source_text[rel]),
        }
        for package, rels in MOVED.items()
        for rel in rels
    }
    if "--json" in sys.argv:
        print(json.dumps(result, indent=2))
        return
    for rel, info in result.items():
        print(
            f"{rel} -> {info['package']}: {len(info['importers'])} importers, {len(info['pathMocks'])} path mocks, "
            f"{len(info['sourceTextReaders'])} source-text readers"
        )
        if info["symbols"]:
            print("    " + ", ".join(info["symbols"]))


if __name__ == "__main__":
    main()
