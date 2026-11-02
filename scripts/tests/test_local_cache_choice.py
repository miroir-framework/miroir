"""#656: the local cache is chosen at startup, not by editing framework sources.

UI sources reach the local cache through one switch file
(`packages/miroir-react/src/miroir-localcache-imports.ts`), the binding `LocalCacheProvider` is given, or
`loadLocalCache`; no other UI source imports `react-redux`, `ReactReduxContext` or a local cache package.
A type-only import loads nothing, so it is allowed.
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

# `import type ... from "...";`: erased by the compiler, it loads no local cache
TYPE_ONLY_IMPORT = re.compile(r"""\bimport\s+type\s[^;]*?\bfrom\s+["'][^"']*["']""")
# #656 (D9): the entries of @miroir-framework/react that hold one local cache each, with its React binding
CACHE_ENTRIES = {"packages/miroir-react/src/local-cache-redux.ts", "packages/miroir-react/src/local-cache-zustand.ts"}


def _ui_sources():
    for root in UI_SOURCE_ROOTS:
        for path in sorted((REPO_ROOT / root).rglob("*")):
            if path.suffix in {".ts", ".tsx"} and path.is_file():
                yield path.relative_to(REPO_ROOT).as_posix()


def _loads_a_local_cache(text: str) -> bool:
    return bool(DIRECT_LOCAL_CACHE.search(TYPE_ONLY_IMPORT.sub("", text)))


def test_the_pattern_finds_the_switch_file():
    text = (REPO_ROOT / SWITCH_FILE).read_text(encoding="utf-8")
    assert _loads_a_local_cache(text), "the switch file no longer matches: the pattern is stale"


def test_a_type_only_import_loads_no_local_cache():
    assert not _loads_a_local_cache('import type * as Entry from "@miroir-framework/react/local-cache/redux";')
    assert _loads_a_local_cache('import { LocalCache } from "@miroir-framework/react/local-cache/redux";')


def test_no_ui_source_reaches_a_local_cache_directly():
    direct = {
        source
        for source in _ui_sources()
        if source != SWITCH_FILE
        and source not in CACHE_ENTRIES
        and _loads_a_local_cache((REPO_ROOT / source).read_text(encoding="utf-8"))
    }
    assert direct == set()
