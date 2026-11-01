"""#652: the packages bundled into another are reached through their owner, so a process or a bundle holds one copy.

- A vite config that aliases `@miroir-framework/core` to core's sources (a string alias, which also matches
  `@miroir-framework/core/<subpath>` by prefix) aliases the meta-model subpaths too, to the private packages that
  core's sources import: otherwise `@miroir-framework/core/meta-model` resolves to `src/index.ts/meta-model`.
- The server release (`miroir-server/release/index.js`, ncc) leaves core and its subpaths external: it holds no meta-model
  data next to core's own. Runs when `MIROIR_RELEASE_SMOKE=1` (nonreg step `build-636-server-release`), after a build.
- The redux local cache is bundled into `@miroir-framework/react` (and its `/local-cache` entry) and, for its Node entry,
  into `@miroir-framework/server/startup`: no other source imports it, and no file imports it next to one of those.

Analysis and plan: code-helpers/features/652-BUILD-bundle-meta-model-and-local-cache/
"""

from __future__ import annotations

import os
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]

CORE_STRING_ALIAS = re.compile(r"""^\s*["']@miroir-framework/core["']\s*:""", re.MULTILINE)
SUBPATH_ALIAS = re.compile(r"""^\s*["']@miroir-framework/core/(meta-model|admin)["']\s*:""", re.MULTILINE)
# the Entity entity's uuid as a JSON value: present in the meta-model data, nowhere in the server's own code
META_MODEL_MARKER = re.compile(r"""uuid["']?\s*:\s*["']16dbfe28-e1d7-4f20-9ba4-c1a9873202ad["']""")


def vite_configs() -> list[Path]:
    return sorted(
        path
        for pattern in ("vite.config.*", "vitest.config.*")
        for path in (ROOT / "packages").glob(f"*/{pattern}")
    )


def aliasing_configs() -> list[Path]:
    return [path for path in vite_configs() if CORE_STRING_ALIAS.search(path.read_text(encoding="utf-8"))]


def test_configs_aliasing_core_to_its_sources_alias_the_meta_model_subpaths():
    configs = aliasing_configs()
    assert configs, "no vite config aliases @miroir-framework/core: update this guard"
    missing = []
    for path in configs:
        text = path.read_text(encoding="utf-8")
        aliased = {match.group(1) for match in SUBPATH_ALIAS.finditer(text)}
        root_alias = CORE_STRING_ALIAS.search(text)
        before_root = {m.group(1) for m in SUBPATH_ALIAS.finditer(text) if m.start() < root_alias.start()}
        if aliased != {"meta-model", "admin"} or before_root != aliased:
            missing.append(f"{path.relative_to(ROOT)}: {sorted(aliased)} (before the root alias: {sorted(before_root)})")
    assert missing == [], "alias @miroir-framework/core/meta-model and /admin before @miroir-framework/core"


LOCAL_CACHE_IMPORT = re.compile(r"""(?:from|import|require\()\s*['"]miroir-localcache-redux(/node)?['"]""")
SERVER_STARTUP_IMPORT = re.compile(r"""(?:from|import\()\s*['"]@miroir-framework/server/startup['"]""")
CODE_SUFFIXES = {".ts", ".tsx", ".mts", ".js", ".mjs"}


def code_files(*tops: str) -> list[Path]:
    return sorted(
        path
        for top in tops
        for path in (ROOT / "packages").glob(top)
        if path.suffix in CODE_SUFFIXES and not {"node_modules", "dist", "release"} & set(path.parts)
    )


def test_node_sources_take_the_startup_call_from_the_server_library():
    """#652 (D4): the local cache's Node entry is bundled into `@miroir-framework/server/startup`; a Node process that
    imported it directly would hold a second local cache next to the server library's."""
    found = [
        str(path.relative_to(ROOT))
        for path in code_files("*/src/**/*")
        if not path.is_relative_to(ROOT / "packages/miroir-server-library")
        and not path.is_relative_to(ROOT / "packages/miroir-localcache-redux")
        and any(match.group(1) for match in LOCAL_CACHE_IMPORT.finditer(path.read_text(encoding="utf-8")))
    ]
    assert found == [], "import startMiroirNode from @miroir-framework/server/startup"


REACT_IMPORT = re.compile(r"""(?:from|import\()\s*['"]@miroir-framework/react(/[^'"]*)?['"]""")
# the packages that bundle the local cache (#652 D3, D4), and the local cache itself
LOCAL_CACHE_OWNERS = ("packages/miroir-react", "packages/miroir-server-library", "packages/miroir-localcache-redux")


def test_only_its_owners_import_the_local_cache_in_sources():
    """#652 (D3): the redux local cache reaches an application through `@miroir-framework/react` (or `/local-cache`),
    a Node process through `@miroir-framework/server/startup`."""
    found = [
        str(path.relative_to(ROOT))
        for path in code_files("*/src/**/*")
        if not any(path.is_relative_to(ROOT / owner) for owner in LOCAL_CACHE_OWNERS)
        and LOCAL_CACHE_IMPORT.search(path.read_text(encoding="utf-8"))
    ]
    assert found == [], "import the local cache from @miroir-framework/react or @miroir-framework/server/startup"


def test_no_file_holds_two_local_caches():
    found = [
        str(path.relative_to(ROOT))
        for path in code_files("*/src/**/*", "*/tests/**/*")
        if not any(path.is_relative_to(ROOT / owner) for owner in LOCAL_CACHE_OWNERS)
        and LOCAL_CACHE_IMPORT.search(text := path.read_text(encoding="utf-8"))
        and (SERVER_STARTUP_IMPORT.search(text) or REACT_IMPORT.search(text))
    ]
    assert found == [], "a file imports the local cache next to a package that bundles it"


def test_the_meta_model_marker_matches_the_meta_model_data():
    sample = '{"uuid":"16dbfe28-e1d7-4f20-9ba4-c1a9873202ad","name":"Entity"}'
    assert META_MODEL_MARKER.search(sample) and META_MODEL_MARKER.search("{uuid:'16dbfe28-e1d7-4f20-9ba4-c1a9873202ad'}")
    assert not META_MODEL_MARKER.search('const entityEntityUuid = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad";')


@pytest.mark.skipif(os.environ.get("MIROIR_RELEASE_SMOKE") != "1", reason="needs the server release build (nonreg)")
def test_the_server_release_holds_no_meta_model():
    release = ROOT / "packages/miroir-server/release/index.js"
    assert release.is_file(), "build the release first: npm run build:server -w miroir-server"
    assert not META_MODEL_MARKER.search(release.read_text(encoding="utf-8", errors="replace")), (
        "release/index.js inlines meta-model data: mark the @miroir-framework/core subpaths external in build:server"
    )
