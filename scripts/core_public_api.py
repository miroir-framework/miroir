"""The public API of miroir-core (#649): which exports carry `@public` TSDoc, where they are declared, and the
generated list in docs/reference/core-public-api.md.

Reads TypeScript with regular expressions on comment-masked text (ts_source.mask_comments), bounded by the export
forms of core's `src/index.ts` and of the modules it re-exports from; a name whose declaration cannot be found raises,
it never passes silently.

    python scripts/core_public_api.py            # print the list
    python scripts/core_public_api.py --write    # write docs/reference/core-public-api.md
    python scripts/core_public_api.py --check    # exit 1 when the document is out of date
"""

from __future__ import annotations

import argparse
import functools
import re
import sys
from dataclasses import dataclass
from pathlib import Path

from ts_source import mask_comments

ROOT = Path(__file__).resolve().parents[1]
CORE_SRC = ROOT / "packages/miroir-core/src"
INDEX = CORE_SRC / "index.ts"
DOC = ROOT / "docs/reference/core-public-api.md"

EXPORT_BLOCK = re.compile(
    r"\bexport\s+(type\s+)?\{([^}]*)\}(?:\s*from\s*([\"'])([^\"']+)\3)?",
)
DECLARATION_KINDS = r"interface|type|class|function\*?|const|let|var|enum|namespace"
DECLARATION_PREFIX = r"(?:declare\s+)?(?:default\s+)?(?:abstract\s+)?(?:async\s+)?"
KIND_PATTERN = re.compile(rf"{DECLARATION_PREFIX}({DECLARATION_KINDS})\b")
PUBLIC_TAG = re.compile(r"@public\b")


class DeclarationNotFound(Exception):
    pass


@dataclass(frozen=True)
class Export:
    """One name exported by a module: `name` is what importers write, `local` the name in the source module, `source`
    the specifier it comes from (None for a local of the exporting module)."""

    name: str
    local: str
    source: str | None


@dataclass(frozen=True)
class Declaration:
    name: str
    kind: str
    file: Path
    line: int
    tsdoc: str | None

    @property
    def public(self) -> bool:
        return self.tsdoc is not None and bool(PUBLIC_TAG.search(self.tsdoc))

    @property
    def summary(self) -> str:
        """The first sentence-like line of the TSDoc, without tags."""
        if not self.tsdoc:
            return ""
        for raw in self.tsdoc.splitlines():
            line = raw.strip().lstrip("*").strip()
            if line and not line.startswith("@"):
                return line
        return ""


def parse_exports(text: str) -> list[Export]:
    """Names exported through `export { … }` / `export type { … }` blocks (with or without `from`), and through
    `export <declaration> Name` statements, in source order."""
    masked = mask_comments(text)
    found: list[tuple[int, Export]] = []
    for match in EXPORT_BLOCK.finditer(masked):
        source = match.group(4)
        for item in match.group(2).split(","):
            words = item.split()
            if not words:
                continue
            if words[0] == "type" and len(words) > 1:
                words = words[1:]
            if len(words) == 3 and words[1] == "as":
                local, name = words[0], words[2]
            elif len(words) == 1:
                local = name = words[0]
            else:
                raise ValueError(f"unrecognised export item {item.strip()!r}")
            found.append((match.start(), Export(name, local, source)))
    for match in re.finditer(rf"\bexport\s+{DECLARATION_PREFIX}(?:{DECLARATION_KINDS})\s+([A-Za-z_$][\w$]*)", masked):
        found.append((match.start(), Export(match.group(1), match.group(1), None)))
    return [export for _, export in sorted(found, key=lambda pair: pair[0])]


IMPORT_BLOCK = re.compile(r"\bimport\s+(?:type\s+)?\{([^}]*)\}\s*from\s*([\"'])([^\"']+)\2")


def imported_binding(text: str, local: str) -> Export | None:
    """The named import that binds `local` in a module, as an Export of that name from its source."""
    for match in IMPORT_BLOCK.finditer(mask_comments(text)):
        for item in match.group(1).split(","):
            words = item.split()
            if words and words[0] == "type" and len(words) > 1:
                words = words[1:]
            if len(words) == 3 and words[1] == "as" and words[2] == local:
                return Export(local, words[0], match.group(3))
            if len(words) == 1 and words[0] == local:
                return Export(local, local, match.group(3))
    return None


def display(path: Path) -> str:
    try:
        return path.relative_to(ROOT).as_posix()
    except ValueError:
        return str(path)


def resolve_module(importer: Path, specifier: str) -> Path | None:
    if not specifier.startswith("."):
        return None
    base = (importer.parent / specifier).resolve()
    stem = base.with_suffix("") if base.suffix in {".js", ".mjs", ".ts", ".tsx"} else base
    for candidate in (stem.with_suffix(".ts"), stem.with_suffix(".tsx"), stem / "index.ts", base):
        if candidate.is_file():
            return candidate
    return None


def _tsdoc_before(text: str, offset: int) -> str | None:
    """The `/** … */` comment that ends right before `offset` (only whitespace between), if any."""
    end = len(text[:offset].rstrip())
    if not text.startswith("*/", end - 2):
        return None
    begin = text.rfind("/*", 0, end - 2)
    if begin < 0 or not text.startswith("/**", begin):
        return None
    return text[begin + 3 : end - 2]


def _line_start(text: str, offset: int) -> int:
    return text.rfind("\n", 0, offset) + 1


@functools.lru_cache(maxsize=None)
def source(file: Path) -> tuple[str, str]:
    """The text of a file and its comment-masked text, read once per run."""
    text = file.read_text(encoding="utf-8")
    return text, mask_comments(text)


TOP_LEVEL_DECLARATION = re.compile(
    rf"^[ \t]*(?:export\s+)?{DECLARATION_PREFIX}({DECLARATION_KINDS})\s+([A-Za-z_$][\w$]*)",
    re.MULTILINE,
)


@functools.lru_cache(maxsize=None)
def declarations_of(file: Path) -> dict[str, Declaration]:
    """The declarations of a file that start a line, exported or not, by name (the first one for overloads)."""
    text, masked = source(file)
    found: dict[str, Declaration] = {}
    for match in TOP_LEVEL_DECLARATION.finditer(masked):
        name = match.group(2)
        if name in found:
            continue
        start = match.start()
        while masked[start] in " \t":
            start += 1
        found[name] = Declaration(
            name=name,
            kind=match.group(1).rstrip("*"),
            file=file,
            line=masked.count("\n", 0, start) + 1,
            tsdoc=_tsdoc_before(text, _line_start(text, start)),
        )
    return found


def declaration_in(file: Path, local: str) -> Declaration | None:
    return declarations_of(file).get(local)


def find_declaration(export: Export, importer: Path) -> Declaration:
    """The declaration behind one export of `importer`: in the module it comes from (or `importer` for a local),
    following one level of `export { … } from` in that module. Raises DeclarationNotFound, naming the files tried."""
    tried: list[str] = []
    module = importer if export.source is None else resolve_module(importer, export.source)
    if module is None:
        raise DeclarationNotFound(f"{export.name}: cannot resolve {export.source!r} from {importer}")
    tried.append(display(module))
    declaration = declaration_in(module, export.local)
    if declaration is None and export.source is not None:
        module_text = source(module)[0]
        for inner in parse_exports(module_text):
            if inner.name != export.local:
                continue
            if inner.source is None:
                # `import { x } from "…"` then `export { x }`: follow the import
                inner = imported_binding(module_text, inner.local) or inner
            if inner.source is None:
                continue
            next_module = resolve_module(module, inner.source)
            if next_module is None:
                continue
            tried.append(display(next_module))
            declaration = declaration_in(next_module, inner.local)
            break
    if declaration is None:
        raise DeclarationNotFound(f"{export.name}: no declaration of {export.local!r} in {', '.join(tried)}")
    return Declaration(export.name, declaration.kind, declaration.file, declaration.line, declaration.tsdoc)


def index_exports() -> list[Export]:
    return parse_exports(INDEX.read_text(encoding="utf-8"))


def index_declarations() -> dict[str, Declaration]:
    """Every name `index.ts` exports, with its declaration."""
    return {export.name: find_declaration(export, INDEX) for export in index_exports()}


def public_declarations() -> list[Declaration]:
    return sorted((d for d in index_declarations().values() if d.public), key=lambda d: d.name.lower())


def marked_in_sources() -> set[tuple[Path, str]]:
    """Every (file, declared name) of core's `src/` whose TSDoc carries `@public`. Raises when a tag is not on a
    top-level declaration."""
    marked: set[tuple[Path, str]] = set()
    for file in sorted(CORE_SRC.rglob("*.ts")):
        text = file.read_text(encoding="utf-8")
        if "@public" not in text:
            continue
        masked = mask_comments(text)
        for doc in re.finditer(r"/\*\*(?:(?!\*/).)*\*/", text, re.DOTALL):
            if not PUBLIC_TAG.search(doc.group(0)) or masked[doc.start()] != " ":
                continue
            following = re.compile(
                rf"\s*(?:export\s+)?{DECLARATION_PREFIX}(?:{DECLARATION_KINDS})\s+([A-Za-z_$][\w$]*)"
            ).match(masked, doc.end())
            if not following:
                line = text.count("\n", 0, doc.start()) + 1
                raise ValueError(f"{display(file)}:{line}: @public is not on a top-level declaration")
            marked.add((file, following.group(1)))
    return marked


def render_doc(declarations: list[Declaration] | None = None) -> str:
    declarations = public_declarations() if declarations is None else declarations
    lines = [
        "# miroir-core public API",
        "",
        "<!-- Generated by `python scripts/core_public_api.py --write` from the `@public` TSDoc tags of",
        "     packages/miroir-core/src; checked by scripts/tests/test_core_public_api.py. Do not edit by hand. -->",
        "",
        "`miroir-core` is in 0.x: no export is stable, and any of them may change in any release. The exports below",
        "carry `@public` TSDoc: they are what an application is meant to use. Everything else `miroir-core` exports",
        "serves the other Miroir packages, which are released with it. Types reached through a public name (the",
        "type of a property or a parameter) can be used as part of that name, without a promise of their own.",
        "Why and how the list is chosen: [`code-helpers/features/649-BUILD-core-public-api/analysis.md`]"
        "(../../code-helpers/features/649-BUILD-core-public-api/analysis.md).",
        "",
        f"{len(declarations)} exports.",
        "",
        "| Name | Kind | Declared in | Summary |",
        "|---|---|---|---|",
    ]
    for d in declarations:
        where = d.file.relative_to(ROOT / "packages/miroir-core").as_posix()
        summary = d.summary.replace("|", "\\|")
        lines.append(f"| `{d.name}` | {d.kind} | `{where}` | {summary} |")
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--write", action="store_true", help=f"write {DOC.relative_to(ROOT)}")
    group.add_argument("--check", action="store_true", help="exit 1 when the document is out of date")
    args = parser.parse_args(argv)
    doc = render_doc()
    if args.write:
        DOC.write_text(doc, encoding="utf-8")
        print(f"wrote {DOC.relative_to(ROOT)}")
        return 0
    if args.check:
        current = DOC.read_text(encoding="utf-8") if DOC.is_file() else ""
        if current != doc:
            print(f"{DOC.relative_to(ROOT)} is out of date: run python scripts/core_public_api.py --write")
            return 1
        return 0
    sys.stdout.write(doc)
    return 0


if __name__ == "__main__":
    sys.exit(main())
