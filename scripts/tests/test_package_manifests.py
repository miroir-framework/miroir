"""#643: the manifests of the packages to publish (#621) are ones `npm pack` and a consumer install can rely on.

The published set is listed in `scripts/published-packages.json`. Cases marked "pack" run
`npm pack --dry-run --json` on a built package: they skip when the package's `dist/` is missing, unless
`MIROIR_REQUIRE_PACK=1` (set by the nonreg step `unit-643-package-manifests`), which makes that a failure.

Analysis and plan: code-helpers/features/643-BUILD-manifest-hygiene/
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
PUBLISHED_SET_FILE = ROOT / "scripts" / "published-packages.json"


def published_set() -> list[dict]:
    return json.loads(PUBLISHED_SET_FILE.read_text(encoding="utf-8"))


def manifest(folder: str) -> dict:
    return json.loads((ROOT / folder / "package.json").read_text(encoding="utf-8"))


def published_folders() -> list[str]:
    return [entry["folder"] for entry in published_set()]


# --------------------------------------------------------------------------------------------------------------------
# the set


def test_the_published_set_names_existing_workspace_packages():
    root_workspaces = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["workspaces"]
    assert root_workspaces == ["packages/*"], "the set assumes the packages/* workspace layout"
    folders = published_folders()
    assert len(folders) == len(set(folders)), "a package is listed twice"
    for folder in folders:
        assert folder.startswith("packages/") and folder.count("/") == 1, folder
        assert (ROOT / folder / "package.json").is_file(), f"{folder} has no package.json"


def test_the_published_set_matches_the_epic_mapping():
    # #621 analysis §4.1 (D7-b, D8-a); I6 renames them and updates this list.
    assert sorted(manifest(folder)["name"] for folder in published_folders()) == sorted(
        [
            "miroir-core",
            "miroir-app-miroir",
            "miroir-app-admin",
            "miroir-react",
            "miroir-localcache-redux",
            "miroir-server-library",
            "miroir-store-postgres",
            "miroir-store-filesystem",
            "miroir-store-indexedDb",
            "miroir-store-mongodb",
            "miroir-store-bundled",
            "miroir-mcp",
            "miroir-cli",
            "miroir-env",
        ]
    )


def test_each_package_of_the_set_has_a_scoped_published_name():
    for entry in published_set():
        assert entry["publishedName"].startswith("@miroir-framework/"), entry
    names = [entry["publishedName"] for entry in published_set()]
    # miroir-app-* join core and the local cache joins react (#621 D7-b, D8-a), so names repeat.
    assert sorted(set(names)) == sorted(
        [
            "@miroir-framework/core",
            "@miroir-framework/react",
            "@miroir-framework/server",
            "@miroir-framework/store-postgres",
            "@miroir-framework/store-filesystem",
            "@miroir-framework/store-indexeddb",
            "@miroir-framework/store-mongodb",
            "@miroir-framework/store-bundled",
            "@miroir-framework/mcp",
            "@miroir-framework/cli",
            "@miroir-framework/env",
        ]
    )


# --------------------------------------------------------------------------------------------------------------------
# helpers: built packages and their pack lists

import fnmatch
import functools
import os
import re
import subprocess

REQUIRE_PACK = os.environ.get("MIROIR_REQUIRE_PACK") == "1"
# Files npm always adds to a tarball, whatever `files` says.
ALWAYS_PACKED = re.compile(r"^(package\.json|README(\.[^/]*)?|LICEN[CS]E(\.[^/]*)?)$", re.IGNORECASE)
# The hand-written declaration stub of the meta-model packages (tsup `dts: false`, listed in their `files`).
DECLARATION_STUBS = {"packages/miroir-app-miroir": "./index.d.ts", "packages/miroir-app-admin": "./index.d.ts"}


def built(folder: str) -> bool:
    return (ROOT / folder / "dist").is_dir()


def require_built(folder: str) -> None:
    if built(folder):
        return
    message = f"{folder} is not built (no dist/): build the set first"
    if REQUIRE_PACK:
        pytest.fail(message)
    pytest.skip(message)


@functools.lru_cache(maxsize=None)
def pack_list(folder: str) -> tuple[str, ...]:
    result = subprocess.run(
        ["npm", "pack", "--dry-run", "--json", "--ignore-scripts"],
        cwd=ROOT / folder,
        capture_output=True,
        text=True,
        check=True,
    )
    packed = json.loads(result.stdout[result.stdout.find("[") :])
    return tuple(sorted(entry["path"] for entry in packed[0]["files"]))


def export_targets(exports: object) -> list[str]:
    """Every file path an `exports` map can resolve to (conditions flattened)."""
    if isinstance(exports, str):
        return [exports]
    if isinstance(exports, dict):
        return [target for value in exports.values() for target in export_targets(value)]
    return []


def entry_point_targets(folder: str) -> list[str]:
    data = manifest(folder)
    targets = export_targets(data.get("exports", {}))
    bin_field = data.get("bin", {})
    targets += [bin_field] if isinstance(bin_field, str) else list(bin_field.values())
    targets += [data[key] for key in ("main", "types") if key in data]
    return sorted({target.removeprefix("./") for target in targets})


# --------------------------------------------------------------------------------------------------------------------
# files and entry points (Slice 1)


@pytest.mark.parametrize("folder", published_folders())
def test_a_published_package_lists_its_files(folder):
    files = manifest(folder).get("files")
    assert files, f"{folder} has no `files`: npm pack would ship src/, tests and configs"
    assert [entry for entry in files if entry.split("/")[0] == "src" or "/src/" in entry] == []
    assert [entry for entry in files if entry.endswith(".d.ts.map")] == []


@pytest.mark.parametrize("folder", published_folders())
def test_a_published_package_declares_its_entry_points(folder):
    data = manifest(folder)
    exports = data.get("exports")
    assert isinstance(exports, dict), f"{folder} has no `exports` map: any internal file can be imported"
    assert exports.get("./package.json") == "./package.json"
    assert [key for key in exports if "src" in key.split("/")] == []
    for target in export_targets(exports):
        assert target == "./package.json" or target.startswith("./dist/") or target == DECLARATION_STUBS.get(folder), (
            f"{folder}: export target {target} is not a built file"
        )
    if data["name"] == "miroir-cli":
        # D7: the CLI is a program (`bin`); importing the package must not run it.
        assert list(exports) == ["./package.json"]
        assert "main" not in data and "types" not in data
        assert data.get("bin")


@pytest.mark.parametrize("folder", published_folders())
def test_a_published_tarball_holds_its_entry_points_and_no_sources(folder):
    require_built(folder)
    packed = pack_list(folder)
    assert [target for target in entry_point_targets(folder) if target not in packed] == []
    assert [path for path in packed if path.startswith(("src/", "tests/", "test/"))] == []
    assert [path for path in packed if path.endswith(".d.ts.map")] == []


@pytest.mark.parametrize("folder", published_folders())
def test_every_files_entry_matches_a_built_file(folder):
    require_built(folder)
    packed = pack_list(folder)
    unmatched = []
    for entry in manifest(folder).get("files", []):
        if ALWAYS_PACKED.match(entry):
            continue
        pattern = entry.rstrip("/")
        if not any(path == pattern or path.startswith(pattern + "/") or fnmatch.fnmatch(path, pattern) for path in packed):
            unmatched.append(entry)
    assert unmatched == [], f"{folder}: `files` entries that match no built file"


# import specifiers only (comments removed): static import/export ... from, import(), vi.mock()/vi.importActual()
SPECIFIER = re.compile(
    r"""(?:^\s*(?:import|export)\s(?:[^;'"]*?\sfrom\s*)?|\bimport\(\s*|\bvi\.(?:mock|importActual|doMock)\(\s*)['"]([^'"]+)['"]""",
    re.MULTILINE,
)
COMMENT = re.compile(r"/\*.*?\*/|^\s*//.*?$", re.DOTALL | re.MULTILINE)
SKIPPED_DIRS = {"node_modules", "dist", "release", ".vite"}


def source_files(*tops: str):
    for top in tops:
        for path in (ROOT / top).rglob("*"):
            if path.suffix in {".ts", ".tsx", ".mts", ".cts"} and not SKIPPED_DIRS.intersection(path.parts):
                yield path


def import_specifiers(text: str) -> list[str]:
    return SPECIFIER.findall(COMMENT.sub("", text))


def test_the_specifier_pattern_sees_every_import_form():
    sample = """
import { a,
  b } from "multi-line";
import type { T } from 'type-only';
export * from "re-export";
const lazy = await import("dynamic");
vi.mock("mocked", async () => ({}));
// import { gone } from "commented-out";
/* import { gone } from "block-commented"; */
import { local } from "./relative.js";
"""
    assert import_specifiers(sample) == ["multi-line", "type-only", "re-export", "dynamic", "mocked", "./relative.js"]


def test_no_repo_code_imports_a_package_source_folder():
    names = sorted((manifest(folder)["name"] for folder in published_folders()), key=len, reverse=True)
    source_import = re.compile(r"^(?:" + "|".join(re.escape(name) for name in names) + r")/src(?:/|$)")
    found = [
        f"{path.relative_to(ROOT)}: {specifier}"
        for path in source_files("packages", "scripts")
        for specifier in import_specifiers(path.read_text(encoding="utf-8", errors="replace"))
        if source_import.match(specifier)
    ]
    assert found == [], "import a named entry point instead of a package's src/ (it is not published)"
