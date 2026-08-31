#!/usr/bin/env python3
"""Fail if unallowlisted bare console.* calls exist under packages/*/src (#237).

Allowlist matches docs/reference/testing.md § Bare console.* allowlist.
Run: python scripts/check_bare_console.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKAGES = ROOT / "packages"

CONSOLE_RE = re.compile(r"\bconsole\.(log|info|debug|warn|error)\s*\(")

# Whole files may use bare console.* (tracker hops, pre-start sink, debug utils, operator CLI).
ALLOWLIST_FILES = {
    "MiroirActivityTracker.ts",
    "PreStartLogger.ts",
    "test-expect.ts",
    "FoldedStateTreeDebug.ts",
    "FoldedStateTreeUtils.ts",
    "chunkLoadTrace.ts",
    "ViewParamsUpdateQueueTestUtils.ts",
    "test-icon-extraction.ts",
    "IconExtractionDemo.tsx",
    "ThemedIcon.simple.test.tsx",
    "configLoader.ts",
    "storeStartup.ts",
    "ipcServerSetup.ts",
}

# miroir-mcp startup/shutdown messages go to stderr for operator visibility.
ALLOWLIST_REL_PATHS = {
    "packages/miroir-mcp/src/index.ts",
}

# Operator CLI lines in miroir-server (usage banner + startup params).
SERVER_LINE_PATTERNS = [
    re.compile(r"console\.error\(`Usage:"),
    re.compile(r"console\.error\(``"),
    re.compile(r"console\.error\(`OPTIONS:"),
    re.compile(r"console\.error\(`  --"),
    re.compile(r"console\.error\(`                      Overrides --"),
    re.compile(r"console\.error\(`  -h,"),
    re.compile(r'console\.error\("Error:'),
    re.compile(r"console\.error\(`Error:"),
    re.compile(r"console\.log\(`Server startup parameters:"),
    re.compile(r"console\.log\(`  --"),
]


def is_comment_or_string_only(line: str) -> bool:
    stripped = line.lstrip()
    return stripped.startswith("//") or stripped.startswith("*")


def is_allowed(path: Path, line: str) -> bool:
    if path.name in ALLOWLIST_FILES:
        return True
    rel = path.relative_to(ROOT).as_posix()
    if rel in ALLOWLIST_REL_PATHS:
        return True
    if rel.endswith("packages/miroir-server/src/server.ts"):
        return any(p.search(line) for p in SERVER_LINE_PATTERNS)
    return False


def scan_file(path: Path) -> list[tuple[int, str]]:
    violations: list[tuple[int, str]] = []
    text = path.read_text(encoding="utf-8")
    for i, line in enumerate(text.splitlines(), 1):
        if is_comment_or_string_only(line):
            continue
        if not CONSOLE_RE.search(line):
            continue
        if is_allowed(path, line):
            continue
        violations.append((i, line.strip()))
    return violations


def main() -> int:
    all_violations: list[tuple[str, int, str]] = []
    for path in sorted(PACKAGES.rglob("src/**/*.ts")) + sorted(PACKAGES.rglob("src/**/*.tsx")):
        if "node_modules" in path.parts:
            continue
        for line_no, line in scan_file(path):
            rel = path.relative_to(ROOT).as_posix()
            all_violations.append((rel, line_no, line))

    if not all_violations:
        print("check_bare_console: OK (no unallowlisted bare console.* in packages/*/src)")
        return 0

    print(f"check_bare_console: {len(all_violations)} violation(s):\n")
    for rel, line_no, line in all_violations:
        print(f"  {rel}:{line_no}: {line[:120]}")
    print(
        "\nMigrate to module log.* or add an explicit allowlist entry in scripts/check_bare_console.py "
        "(see docs/reference/testing.md)."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
