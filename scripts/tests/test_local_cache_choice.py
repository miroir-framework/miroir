"""#656: the local cache is chosen at startup, not by editing framework sources.

UI sources reach the local cache through one switch file
(`packages/miroir-react/src/miroir-localcache-imports.ts`). The sources that still import
`react-redux`, `ReactReduxContext` or a local cache package directly are an allowlist the issue's
slices shrink; it ends empty.
"""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
UI_SOURCE_ROOTS = ["packages/miroir-react/src", "packages/miroir-standalone-app/src"]
SWITCH_FILE = "packages/miroir-react/src/miroir-localcache-imports.ts"

DIRECT_LOCAL_CACHE = re.compile(
    r"""(?:\bfrom\s+|\bimport\s*\(\s*)["'](?:react-redux|miroir-localcache-(?:redux|zustand)(?:/[^"']*)?|@miroir-framework/react/local-cache/(?:redux|zustand))["']"""
    r"""|\bReactReduxContext\b"""
)

# Shrinks slice by slice (Slices 3 and 4); empty at the end of #656.
ALLOWLIST = {
    # the UI test helpers, on redux until Slice 4
    "packages/miroir-standalone-app/src/miroir-fwk/4-tests/componentTests/componentTestTools.tsx",
    "packages/miroir-standalone-app/src/miroir-fwk/4-tests/tests-utils.tsx",
    "packages/miroir-standalone-app/src/miroir-fwk/4-tests/useSelectedApplicationMiroirTestSuiteRegistries.ts",
}
# #656 (D9): the entries of @miroir-framework/react that hold one local cache each, with its React binding
CACHE_ENTRIES = {"packages/miroir-react/src/local-cache-redux.ts", "packages/miroir-react/src/local-cache-zustand.ts"}


def _ui_sources():
    for root in UI_SOURCE_ROOTS:
        for path in sorted((REPO_ROOT / root).rglob("*")):
            if path.suffix in {".ts", ".tsx"} and path.is_file():
                yield path.relative_to(REPO_ROOT).as_posix()


def test_the_pattern_finds_the_switch_file():
    text = (REPO_ROOT / SWITCH_FILE).read_text(encoding="utf-8")
    assert DIRECT_LOCAL_CACHE.search(text), "the switch file no longer matches: the pattern is stale"


def test_only_allowlisted_ui_sources_reach_a_local_cache_directly():
    direct = {
        source
        for source in _ui_sources()
        if source != SWITCH_FILE
        and source not in CACHE_ENTRIES
        and DIRECT_LOCAL_CACHE.search((REPO_ROOT / source).read_text(encoding="utf-8"))
    }
    assert direct == ALLOWLIST
