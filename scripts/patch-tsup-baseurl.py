#!/usr/bin/env python3
"""Patch tsup 8.5.x so DTS builds do not inject deprecated baseUrl.

tsup unconditionally sets `baseUrl: compilerOptions.baseUrl || "."` in its
rollup-plugin-dts compilerOptions. Under TypeScript 6+, that triggers TS5101
even when the project never set baseUrl; under TypeScript 7 it is a hard error.
Upstream: https://github.com/egoist/tsup/issues/1388 / PR #1390 (unmerged).

Idempotent — safe to run on every install.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROLLUP = ROOT / "node_modules" / "tsup" / "dist" / "rollup.js"

OLD = 'baseUrl: compilerOptions.baseUrl || ".",'
NEW = "...(compilerOptions.baseUrl ? { baseUrl: compilerOptions.baseUrl } : {}),"


def main() -> int:
    if not ROLLUP.is_file():
        print("patch-tsup-baseurl: tsup not installed, skipping")
        return 0
    text = ROLLUP.read_text(encoding="utf-8")
    if NEW in text or "compilerOptions.baseUrl ?" in text:
        print("patch-tsup-baseurl: already applied")
        return 0
    if OLD not in text:
        print("patch-tsup-baseurl: unexpected tsup rollup.js (pattern missing); skip")
        return 0
    ROLLUP.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")
    print("patch-tsup-baseurl: patched node_modules/tsup/dist/rollup.js")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
