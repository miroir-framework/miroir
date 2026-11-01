"""#649: miroir-core's supported exports carry `@public` TSDoc, the template (miroir-sandbox) only imports those,
and docs/reference/core-public-api.md lists them.

Source cases need no build; pack-style cases read built declarations and skip unless built or MIROIR_REQUIRE_PACK=1.
Decisions: code-helpers/features/649-BUILD-core-public-api/analysis.md.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path

import pytest

import core_public_api as api
from core_public_api import DeclarationNotFound, Export

ROOT = Path(__file__).resolve().parents[2]
CORE = ROOT / "packages/miroir-core"
SANDBOX_SRC = ROOT / "packages/miroir-sandbox/src"
GENERATED = CORE / "src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts"
GENERATED_LIST = CORE / "scripts/public-generated-types.json"
REQUIRE_PACK = os.environ.get("MIROIR_REQUIRE_PACK") == "1"

# D2, analysis §4.3. The template's names are parsed (case 1); the two signature sets are fixed, since deriving them
# needs the TypeScript resolver: the plan's refactor checkpoint re-derives them.
SANDBOX_NAMES = {
    "Action2Error", "ConfigurationService", "Deployment", "Domain2ElementFailed", "Entity", "EntityInstance",
    "EntityInstanceCollection", "EntityVersion", "LoggerFactoryInterface", "LoggerInterface", "MiroirActivityTracker",
    "MiroirConfigClient", "MiroirEventService", "MiroirLoggerFactory", "PersistenceStoreControllerManager",
    "SpecificLoggerOptionsMap", "StoreOrBundleAction", "StoreUnitConfiguration", "defaultMetaModelEnvironment",
    "defaultSelfApplicationDeploymentMap", "expect", "versionHistoryEntityUuids",
}
# the core names of miroir-server-library's published declarations (dist/index.d.ts)
SERVER_LIBRARY_NAMES = {
    "ApplicationDeploymentMap", "AuthenticationGate", "DomainControllerInterface", "MiroirConfigServer",
    "PersistenceStoreControllerManagerInterface", "ProcessCapabilities",
}
# the core types named by the parameters and exported option and result types of startMiroirPlatform,
# startMiroirNode (miroir-localcache-redux/src/startMiroirPlatform.ts) and startMiroirClient (startMiroirClient.ts)
STARTUP_NAMES = {
    "DomainControllerInterface", "ExternalServiceClientInterface", "LoggerFactoryInterface", "LoggerOptions",
    "MiroirActivityTracker", "MiroirConfigClient", "MiroirConfigServer", "MiroirContext", "MiroirEventService",
    "PersistenceStoreControllerManager", "ProcessCapabilities", "RestClientInterface", "RestClientStub",
    "StoreSectionStartup",
}
PUBLIC_NAMES = SANDBOX_NAMES | SERVER_LIBRARY_NAMES | STARTUP_NAMES
GENERATED_NAMES = {
    "Deployment", "Entity", "EntityInstance", "EntityInstanceCollection", "EntityVersion", "MiroirConfigClient",
    "MiroirConfigServer", "StoreOrBundleAction", "StoreUnitConfiguration",
}
# D2b: reached through a public name, exported so it can be named, not marked
EXPORTED_UNMARKED = {"StorageType", "LoggerContextElement"}


# ---------------------------------------------------------------------------------------------------- parser samples


def write(folder: Path, files: dict[str, str]) -> None:
    for name, text in files.items():
        path = folder / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")


def test_the_parser_reads_every_export_block_form():
    text = """
export {
  A, // a comment { with braces }
  B as C,
  type D,
  /* E, */
} from "./a.js";
export { F } from './f';
export type { G, H as I } from "./g.js";
const local = require("./x.json");
export { local };
import type { J as _J } from "./j.js";
export type K = _J;
export const k = 1;
// export { Hidden } from "./hidden";
"""
    assert api.parse_exports(text) == [
        Export("A", "A", "./a.js"),
        Export("C", "B", "./a.js"),
        Export("D", "D", "./a.js"),
        Export("F", "F", "./f"),
        Export("G", "G", "./g.js"),
        Export("I", "H", "./g.js"),
        Export("local", "local", None),
        Export("K", "K", None),
        Export("k", "k", None),
    ]


def test_the_parser_finds_each_declaration_form(tmp_path):
    write(tmp_path, {
        "index.ts": "",
        "decls.ts": """
/** An interface. @public */
export interface Iface { a: string }
export type Alias = string;
export class Klass {}
export abstract class Abstract {}
export function over(a: string): string;
export function over(a: number): number;
export function over(a: unknown) { return a; }
export async function later() {}
export const value = 1;
export declare const declared: number;
const bottom = 2;
export { bottom };
export default Klass;
""",
        "outer.ts": """
import { inner as renamed } from "./inner.js";
export { renamed };
export { deep } from "./inner";
""",
        "inner.ts": "/**\n * Deep.\n * @public\n */\nexport function deep() {}\nexport const inner = 3;\n",
    })
    index = tmp_path / "index.ts"
    expected_kinds = {
        "Iface": "interface", "Alias": "type", "Klass": "class", "Abstract": "class", "over": "function",
        "later": "function", "value": "const", "declared": "const", "bottom": "const",
    }
    for name, kind in expected_kinds.items():
        declaration = api.find_declaration(Export(name, name, "./decls.js"), index)
        assert (declaration.kind, declaration.file.name) == (kind, "decls.ts"), name
    assert api.find_declaration(Export("over", "over", "./decls"), index).line == 7
    assert api.find_declaration(Export("Iface", "Iface", "./decls"), index).public
    assert not api.find_declaration(Export("Alias", "Alias", "./decls"), index).public
    deep = api.find_declaration(Export("deep", "deep", "./outer.js"), index)
    assert (deep.file.name, deep.public, deep.summary) == ("inner.ts", True, "Deep.")
    renamed = api.find_declaration(Export("renamed", "renamed", "./outer.js"), index)
    assert (renamed.file.name, renamed.kind) == ("inner.ts", "const")
    with pytest.raises(DeclarationNotFound, match=r"missing: no declaration of 'missing' in .*decls\.ts"):
        api.find_declaration(Export("missing", "missing", "./decls.js"), index)
    with pytest.raises(DeclarationNotFound, match="cannot resolve"):
        api.find_declaration(Export("x", "x", "./nowhere.js"), index)


def test_a_public_tag_counts_only_on_a_top_level_declaration(tmp_path, monkeypatch):
    write(tmp_path, {
        "good.ts": (
            'const s = "/** @public */";\n// /** @public */\nconst commented = 1;\n'
            'const glob = "src/**"; /** @public */\nexport type Glob = string;\n'
            "\n/**\n * Good.\n * @public\n */\nexport type Good = string;\n"
        ),
        "member.ts": "export class K {\n  /** @public */\n  method() {}\n}\n",
    })
    monkeypatch.setattr(api, "CORE_SRC", tmp_path)
    (tmp_path / "member.ts").rename(tmp_path / "member.ts.off")
    assert api.marked_in_sources() == {(tmp_path / "good.ts", "Good"), (tmp_path / "good.ts", "Glob")}
    (tmp_path / "member.ts.off").rename(tmp_path / "member.ts")
    with pytest.raises(ValueError, match=r"member\.ts:2: @public is not on a top-level declaration"):
        api.marked_in_sources()


# -------------------------------------------------------------------------------------------------- the real sources


def test_every_name_index_ts_exports_has_a_declaration():
    declarations = api.index_declarations()
    assert len(declarations) > 1000
    assert PUBLIC_NAMES <= set(declarations)


IMPORT_FROM_CORE = re.compile(
    r"\bimport\s+(type\s+)?\{([^}]*)\}\s*from\s*([\"'])(?:@miroir-framework/core|miroir-core)\3"
)
# any string naming core or a subpath of it: each must be the specifier of a plain named import
CORE_SPECIFIER = re.compile(r"([\"'`])(?:@miroir-framework/core|miroir-core)(?:/[^\"'`]*)?\1")
TEMPLATE_SUFFIXES = {".ts", ".tsx", ".mts", ".cts", ".js", ".jsx", ".mjs", ".cjs"}
SANDBOX = ROOT / "packages/miroir-sandbox"


def named_imports(text: str) -> tuple[set[str], list[str]]:
    """The names of the plain named imports from "@miroir-framework/core" in `text` (comments stripped), and the other uses of
    a core specifier: namespace or default imports, re-exports, dynamic imports, subpaths."""
    from ts_source import strip_comments

    code = strip_comments(text)
    names: set[str] = set()
    plain_ends: set[int] = set()
    for match in IMPORT_FROM_CORE.finditer(code):
        plain_ends.add(match.end())
        for item in match.group(2).split(","):
            words = item.split()
            if words and words[0] == "type" and len(words) > 1:
                words = words[1:]
            if words:
                names.add(words[0])
    others = [
        code[code.rfind("\n", 0, m.start()) + 1 : m.end()].strip()
        for m in CORE_SPECIFIER.finditer(code)
        if m.end() not in plain_ends
    ]
    return names, others


def sandbox_core_imports() -> set[str]:
    names: set[str] = set()
    others: list[str] = []
    for path in sorted(SANDBOX.rglob("*")):
        if path.suffix not in TEMPLATE_SUFFIXES or {"node_modules", "dist"} & set(path.parts):
            continue
        found, other = named_imports(path.read_text(encoding="utf-8"))
        names |= found
        others += [f"{path.relative_to(ROOT)}: {line}" for line in other]
    assert others == [], "the template reaches core other than by named imports of the package root"
    return names


def test_the_template_import_scan_sees_every_form():
    text = """
import { A, type B } from "@miroir-framework/core";
import type { C as D } from '@miroir-framework/core';
// import { Commented } from "@miroir-framework/core";
import * as core from "@miroir-framework/core";
import Def, { E } from "@miroir-framework/core";
export { F } from "@miroir-framework/core";
const g = await import("@miroir-framework/core");
const h = await import(`@miroir-framework/core`);
import { H } from "@miroir-framework/core/model-validation-fs";
"""
    names, others = named_imports(text)
    assert names == {"A", "B", "C"}
    assert len(others) == 6


def test_the_template_only_imports_public_exports_of_core():
    """Case 1 (G2): a new import of an unmarked core export by the template fails here."""
    imported = sandbox_core_imports()
    declarations = api.index_declarations()
    unmarked = sorted(name for name in imported if name not in declarations or not declarations[name].public)
    assert unmarked == [], "the template imports core exports that are not @public: mark them (D2) or drop the import"
    assert imported == SANDBOX_NAMES, "the template's core imports changed: update SANDBOX_NAMES and analysis §4.3"


@pytest.mark.parametrize("names", [SERVER_LIBRARY_NAMES, STARTUP_NAMES], ids=["server-library", "startup-calls"])
def test_the_core_types_of_the_startup_signatures_are_public(names):
    """Case 2 and the startup set (D2)."""
    declarations = api.index_declarations()
    assert sorted(name for name in names if not declarations[name].public) == []


def test_the_public_marks_are_exactly_the_supported_set():
    """Case 3: every @public tag in core's src sits on a declaration that index.ts exports under its own name, and
    the marked names are the D2 set."""
    declarations = api.index_declarations()
    reached = {(d.file, d.name) for d in declarations.values() if d.public}
    assert api.marked_in_sources() == reached, "a @public declaration is not exported by index.ts under its name"
    assert {name for _, name in reached} == PUBLIC_NAMES


def test_types_reached_through_public_names_are_exported_unmarked():
    """D2b."""
    declarations = api.index_declarations()
    assert {name: declarations[name].public for name in EXPORTED_UNMARKED if name in declarations} == {
        name: False for name in EXPORTED_UNMARKED
    }


def test_the_generated_public_types_carry_the_tag():
    """D3: the generator marks the names of its list."""
    listed = json.loads(GENERATED_LIST.read_text(encoding="utf-8"))
    assert sorted(listed) == sorted(GENERATED_NAMES)
    text = GENERATED.read_text(encoding="utf-8")
    for name in listed:
        assert re.search(rf"/\*\* @public \*/\n^export type {name} =", text, re.MULTILINE), name


def require_file(path: Path, build: str) -> None:
    if path.is_file():
        return
    message = f"{path.relative_to(ROOT)} is not built: {build}"
    if REQUIRE_PACK:
        pytest.fail(message)
    pytest.skip(message)


def test_the_built_declarations_keep_the_tag():
    """Case 4 (pack-style): consumers hover the built declarations, emitted per file by tsc into dist/."""
    require_file(CORE / "dist/index.d.ts", "npm run build -w @miroir-framework/core")
    missing: list[str] = []
    for declaration in api.public_declarations():
        relative = declaration.file.relative_to(CORE / "src").with_suffix(".d.ts")
        path = CORE / "dist" / relative
        text = path.read_text(encoding="utf-8") if path.is_file() else ""
        built = api.declarations_in_text(text).get(declaration.name)
        if built is None or not built.public:
            missing.append(f"{declaration.name} ({relative.as_posix()})")
    assert missing == [], "built declarations without @public: rebuild core, or the tag does not survive tsc"


def test_the_server_library_declarations_import_exactly_the_listed_core_types():
    """Case 2, pack-style: the server library's published declarations import the set above, by name."""
    path = ROOT / "packages/miroir-server-library/dist/index.d.ts"
    require_file(path, "npm run build -w @miroir-framework/server")
    names, others = named_imports(path.read_text(encoding="utf-8"))
    assert others == []
    assert names == SERVER_LIBRARY_NAMES


def test_the_core_readme_states_the_stance_and_links_the_list():
    readme = (CORE / "README.md").read_text(encoding="utf-8")
    assert "0.x" in readme and "@public" in readme
    assert "docs/reference/core-public-api.md" in readme


def test_the_public_api_document_is_in_sync():
    """Case 5 (G3)."""
    assert api.DOC.read_text(encoding="utf-8") == api.render_doc(), "run python scripts/core_public_api.py --write"
