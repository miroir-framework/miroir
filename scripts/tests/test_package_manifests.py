"""#643: the manifests of the packages to publish (#621) are ones `npm pack` and a consumer install can rely on.

The published set is listed in `scripts/published-packages.json`. Cases marked "pack" run
`npm pack --dry-run --json` on a built package: they skip when the package's `dist/` is missing, unless
`MIROIR_REQUIRE_PACK=1` (set by the nonreg step `unit-643-package-manifests`), which makes that a failure.

Analysis and plan: code-helpers/features/643-BUILD-manifest-hygiene/
"""

from __future__ import annotations

import fnmatch
import functools
import json
import os
import re
import subprocess
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
SKIPPED_DIRS = {"node_modules", "dist", "release", ".vite"}


def source_files(*tops: str):
    for top in tops:
        for path in (ROOT / top).rglob("*"):
            if path.suffix in {".ts", ".tsx", ".mts", ".cts"} and not SKIPPED_DIRS.intersection(path.parts):
                yield path


def strip_comments(text: str) -> str:
    """Remove // and /* */ comments outside string literals ('...', "...", `...`), so that a "/*" inside a string
    (a glob, a path) does not swallow the code that follows it. Regex literals are not parsed: none of the set's
    sources has a comment marker inside one before an import."""
    out: list[str] = []
    i, n = 0, len(text)
    while i < n:
        char = text[i]
        if char in "'\"`":
            j = i + 1
            while j < n and text[j] != char:
                j += 2 if text[j] == "\\" else 1
            out.append(text[i : j + 1])
            i = j + 1
        elif text.startswith("//", i):
            j = text.find("\n", i)
            i = n if j < 0 else j
        elif text.startswith("/*", i):
            j = text.find("*/", i + 2)
            i = n if j < 0 else j + 2
        else:
            out.append(char)
            i += 1
    return "".join(out)


def import_specifiers(text: str) -> list[str]:
    return SPECIFIER.findall(strip_comments(text))


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


# --------------------------------------------------------------------------------------------------------------------
# metadata and TSDoc (Slice 2)

REPOSITORY_URL = "git+https://github.com/miroir-framework/miroir.git"


@pytest.mark.parametrize("folder", published_folders())
def test_a_published_package_carries_its_metadata(folder):
    data = manifest(folder)
    assert data.get("sideEffects") is False, f"{folder}: sideEffects must be false (D6)"
    assert data.get("engines", {}).get("node") == ">=22", f"{folder}: engines.node (D8)"
    assert data.get("repository") == {"type": "git", "url": REPOSITORY_URL, "directory": folder}
    assert data.get("license") == "MIT"


def tsconfig_chain_value(tsconfig: Path, option: str):
    """The effective compilerOptions value of `option`, following `extends` (relative paths only)."""
    # tsconfig files here are JSON with comments and trailing commas in places: strip both before parsing.
    text = tsconfig.read_text(encoding="utf-8")
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    text = re.sub(r"^\s*//.*$", "", text, flags=re.MULTILINE)
    text = re.sub(r",(\s*[}\]])", r"\1", text)
    config = json.loads(text)
    options = config.get("compilerOptions", {})
    if option in options:
        return options[option]
    parent = config.get("extends")
    if not parent:
        return None
    return tsconfig_chain_value((tsconfig.parent / parent).resolve(), option)


def declaration_tsconfig(folder: str) -> Path:
    # core emits its declarations with tsc from tsconfig.declarations.json (tsup onSuccess); the others with tsup dts.
    special = ROOT / folder / "tsconfig.declarations.json"
    return special if special.is_file() else ROOT / folder / "tsconfig.json"


@pytest.mark.parametrize("folder", published_folders())
def test_a_published_package_keeps_comments_in_its_declarations(folder):
    assert tsconfig_chain_value(declaration_tsconfig(folder), "removeComments") is not True, (
        f"{folder}: removeComments strips the TSDoc from the published .d.ts files (D5)"
    )


def test_published_declarations_carry_tsdoc():
    for folder in ("packages/miroir-localcache-redux", "packages/miroir-core"):
        require_built(folder)
    node_declarations = (ROOT / "packages/miroir-localcache-redux/dist/node.d.ts").read_text(encoding="utf-8")
    assert re.search(r"/\*\*(?:(?!\*/).)*\*/\s*declare function startMiroirNode", node_declarations, re.DOTALL), (
        "startMiroirNode lost its TSDoc in miroir-localcache-redux/dist/node.d.ts"
    )
    core_declarations = (ROOT / "packages/miroir-core/dist/5_tests/ModelValidationToolsFilesystem.d.ts").read_text(
        encoding="utf-8"
    )
    assert "/**" in core_declarations, "miroir-core declarations carry no TSDoc"


# --------------------------------------------------------------------------------------------------------------------
# shared libraries (Slice 3, analysis D1)

# library -> (peer range, owners). An owner either imports the library in src/ or needs it for a library it imports (†).
SHARED_LIBRARIES = {
    "zod": ("^4.6.7", {"miroir-core", "miroir-react", "miroir-mcp", "miroir-cli", "miroir-store-postgres"}),
    "react": (">=18.2.0", {"miroir-react", "miroir-localcache-redux"}),  # † localcache-redux: peer of react-redux
    "react-dom": ("^18.2.0", {"miroir-react"}),
    "react-redux": ("^9.3.0", {"miroir-react", "miroir-localcache-redux"}),
    "react-router-dom": ("^7.18.4", {"miroir-react"}),
    "formik": ("^2.4.9", {"miroir-react"}),
    "@mui/material": (">=5.17.1 <10", {"miroir-react"}),
    "@emotion/react": ("^11.10.5", {"miroir-react"}),
    "@emotion/styled": ("^11.10.5", {"miroir-react"}),  # † peer of @mui/material
}


def published_manifests() -> dict[str, dict]:
    return {manifest(folder)["name"]: manifest(folder) for folder in published_folders()}


def test_shared_libraries_are_peers_of_the_published_set():
    found = sorted(
        f"{name}: dependencies.{library}"
        for name, data in published_manifests().items()
        for library in SHARED_LIBRARIES
        if library in data.get("dependencies", {})
    )
    assert found == [], "a shared library as a dependency gives the consumer a second copy (D1)"


def test_each_shared_library_has_its_peer_range_and_owners_across_the_set():
    for library, (expected_range, expected_owners) in SHARED_LIBRARIES.items():
        declared = {
            name: data["peerDependencies"][library]
            for name, data in published_manifests().items()
            if library in data.get("peerDependencies", {})
        }
        assert set(declared) == expected_owners, f"{library}: peer owners"
        assert set(declared.values()) == {expected_range}, f"{library}: one peer range across the set"


# --------------------------------------------------------------------------------------------------------------------
# declared imports (Slice 3b, analysis D9): tsup externalizes only dependencies and peers and bundles the rest

# Node's built-in modules (`require("module").builtinModules`, Node 22, without the `_` internals).
NODE_BUILTINS = set(
    "assert async_hooks buffer child_process cluster console constants crypto dgram diagnostics_channel dns domain "
    "events fs http http2 https inspector module net os path perf_hooks process punycode querystring readline repl "
    "stream string_decoder sys timers tls trace_events tty url util v8 vm wasi worker_threads zlib".split()
)
# (package, dependency) -> reason. "imported" entries: imported but not declared; "declared": declared, not imported.
ALLOWED_UNDECLARED_IMPORTS = {
    ("miroir-core", "vitest"): "type-only, QueryRunnerTestTools; left to the 'Public API of core' item of #621",
    ("miroir-app-miroir", "miroir-core"): "type-only; a runtime dependency would make a core <-> app-miroir cycle (#621 D7)",
}
ALLOWED_UNIMPORTED_DECLARATIONS = {
    ("miroir-store-postgres", "pg"): "Sequelize loads the driver by name",
    ("miroir-store-postgres", "pg-hstore"): "Sequelize loads it by name",
    ("miroir-localcache-redux", "react"): "peer of react-redux (D1)",
    ("miroir-react", "@emotion/styled"): "peer of @mui/material (D1)",
}


def package_of(specifier: str) -> str | None:
    if specifier.startswith((".", "/", "node:", "virtual:")):
        return None
    parts = specifier.split("/")
    name = "/".join(parts[:2]) if specifier.startswith("@") else parts[0]
    return None if name in NODE_BUILTINS else name


@functools.lru_cache(maxsize=None)
def imported_packages(folder: str) -> frozenset[str]:
    own = manifest(folder)["name"]
    found = set()
    for path in source_files(f"{folder}/src"):
        if path.name.endswith(".d.ts") or ".test." in path.name:
            continue  # ambient declarations (lodash-es.d.ts) are not imports of the build
        for specifier in import_specifiers(path.read_text(encoding="utf-8", errors="replace")):
            name = package_of(specifier)
            if name and name != own:
                found.add(name)
    return frozenset(found)


def runtime_declarations(folder: str) -> set[str]:
    data = manifest(folder)
    return set(data.get("dependencies", {})) | set(data.get("peerDependencies", {}))


def test_package_of_reads_bare_specifiers_only():
    assert [package_of(s) for s in ["zod", "@mui/material/styles", "./x.js", "node:fs", "fs/promises", "lodash/merge", "uuid"]] == [
        "zod", "@mui/material", None, None, None, "lodash", "uuid",
    ]  # fmt: skip


@pytest.mark.parametrize("folder", published_folders())
def test_a_published_package_declares_what_its_sources_import(folder):
    name = manifest(folder)["name"]
    undeclared = sorted(
        package
        for package in imported_packages(folder) - runtime_declarations(folder)
        if (name, package) not in ALLOWED_UNDECLARED_IMPORTS
    )
    assert undeclared == [], f"{folder}: tsup bundles these into dist/; declare them (D9)"


@pytest.mark.parametrize("folder", published_folders())
def test_a_published_package_imports_what_it_declares(folder):
    name = manifest(folder)["name"]
    unused = sorted(
        package
        for package in runtime_declarations(folder) - imported_packages(folder)
        if (name, package) not in ALLOWED_UNIMPORTED_DECLARATIONS
    )
    assert unused == [], f"{folder}: npm installs these for consumers but src/ never imports them (D9)"


def test_localcache_redux_dist_does_not_inline_its_dependencies():
    folder = "packages/miroir-localcache-redux"
    require_built(folder)
    built_code = "\n".join(path.read_text(encoding="utf-8") for path in (ROOT / folder / "dist").glob("*.js"))
    assert "function enablePatches" not in built_code, "immer is bundled into dist/"
    assert re.search(r"""from\s*['"]immer['"]""", built_code)
    assert re.search(r"""from\s*['"]miroir-app-admin['"]""", built_code)
