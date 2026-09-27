#!/usr/bin/env python3
"""Fail when the code a build ships changes without someone choosing it (#326).

Compares the report a build writes (`dist/.vite/bundle-report.json`, from
packages/miroir-standalone-app/vite/bundleReportPlugin.js) with the app's committed `bundle-policy.json`:

  allowlist  every npm and workspace package of the build, and every Node built-in the build empties for the browser
             (named `node:<module> via <importing package>`), is listed under `eager` (some of its code loads with
             the page) or `lazy` (only in chunks loaded on demand). A new package, or a `lazy` one that now loads with
             the page, fails with the import chain that brings it in. So does a listed package that left the build,
             or an `eager` one that is now lazy: the lists only move when someone updates them.
  forbidden  no package matching a `forbiddenEager` glob (`@testing-library/*`) loads with the page, even if listed.
  budget     the gzip size of the chunks loaded with the page stays within `eagerGzipTolerance` (2%) of
             `eagerGzipBaseline`. Above, the PR grew the initial load; below, the PR shrank it and lowers the
             baseline, so the gain is kept.

Run: python scripts/check_bundle_policy.py <report> <policy>
     python scripts/check_bundle_policy.py <report> <policy> --init   write the lists and the baseline from the
                                                                       report, keeping forbiddenEager and the tolerance

Plan: code-helpers/features/326-BUILD-build-hardening/tdd-implementation-plan.md
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from fnmatch import fnmatchcase
from pathlib import Path

LISTED_KINDS = ("npm", "workspace")
DEFAULT_TOLERANCE = 0.02
DEFAULT_FORBIDDEN_EAGER = ["@testing-library/*"]
DEFAULT_COMMENT = (
    "Bundle guard (#326), checked by scripts/check_bundle_policy.py against the build's bundle-report.json. "
    "See docs/internals/code-splitting.md."
)


@dataclass(frozen=True)
class Violation:
    rule: str
    message: str

    def __str__(self) -> str:
        return f"[{self.rule}] {self.message}"


def shipped_packages(report: dict) -> dict[str, dict]:
    """Name -> {loadKind, via} for every package the allowlist covers."""
    packages = {
        entry["name"]: {"loadKind": entry["loadKind"], "via": entry.get("via", "")}
        for entry in report["packages"]
        if entry["kind"] in LISTED_KINDS
    }
    load_kinds = {chunk["file"]: chunk["loadKind"] for chunk in report["chunks"]}
    for finding in report["findings"]:
        if finding["kind"] != "externalized-node-module" or not finding.get("chunk"):
            continue
        name = f"node:{finding['module']} via {finding['importerPackage']}"
        load_kind = "lazy" if load_kinds.get(finding["chunk"]) == "lazy" else "eager"
        current = packages.get(name)
        if current is None or (load_kind == "eager" and current["loadKind"] == "lazy"):
            packages[name] = {"loadKind": load_kind, "via": finding.get("via", "")}
    return packages


def check(report: dict, policy: dict) -> list[Violation]:
    violations: list[Violation] = []
    shipped = shipped_packages(report)
    eager = set(policy.get("eager", []))
    lazy = set(policy.get("lazy", []))

    for name in sorted(eager & lazy):
        violations.append(Violation("allowlist", f"{name} is listed both eager and lazy: keep one"))
    for name, info in sorted(shipped.items()):
        via = f" ({info['via']})" if info["via"] else ""
        if name not in eager and name not in lazy:
            violations.append(
                Violation(
                    "allowlist",
                    f"{name} is new in the build and {describe(info['loadKind'])}{via}: "
                    f"add it to \"{info['loadKind']}\" in the policy if it is wanted",
                )
            )
        elif info["loadKind"] == "eager" and name not in eager:
            violations.append(
                Violation(
                    "allowlist",
                    f"{name} is listed lazy but now loads with the page{via}: "
                    'restore the lazy loading, or move it to "eager" in the policy',
                )
            )
        elif info["loadKind"] == "lazy" and name not in lazy:
            violations.append(
                Violation("allowlist", f'{name} now loads only on demand: move it to "lazy" in the policy')
            )
    for name in sorted((eager | lazy) - shipped.keys()):
        violations.append(Violation("allowlist", f"{name} is no longer in the build: remove it from the policy"))

    for name, info in sorted(shipped.items()):
        patterns = [pattern for pattern in policy.get("forbiddenEager", []) if fnmatchcase(name, pattern)]
        if info["loadKind"] == "eager" and patterns:
            via = f" ({info['via']})" if info["via"] else ""
            violations.append(
                Violation("forbidden", f"{name} loads with the page{via}, which forbiddenEager {patterns[0]} forbids")
            )

    violations.extend(check_budget(report, policy))
    return violations


def describe(load_kind: str) -> str:
    return "loads with the page" if load_kind == "eager" else "loads on demand"


def check_budget(report: dict, policy: dict) -> list[Violation]:
    size = report["totals"]["eager"]["gzipBytes"]
    baseline = policy["eagerGzipBaseline"]
    tolerance = policy.get("eagerGzipTolerance", DEFAULT_TOLERANCE)
    change = size / baseline - 1
    if size > baseline * (1 + tolerance):
        return [
            Violation(
                "budget",
                f"the chunks loaded with the page are {size} bytes gzipped, {change:+.1%} over the baseline of "
                f"{baseline} (limit +{tolerance:.0%}): find what grew in the report, or raise eagerGzipBaseline "
                "with the reason in the PR",
            )
        ]
    if size < baseline * (1 - tolerance):
        return [
            Violation(
                "budget",
                f"the chunks loaded with the page are {size} bytes gzipped, {change:+.1%} under the baseline of "
                f"{baseline}: lower eagerGzipBaseline to {size} to keep the gain",
            )
        ]
    return []


def init(report: dict, existing: dict) -> dict:
    """A policy that the report passes, keeping the existing comment, tolerance and forbiddenEager."""
    shipped = shipped_packages(report)
    return {
        "$comment": existing.get("$comment", DEFAULT_COMMENT),
        "eagerGzipBaseline": report["totals"]["eager"]["gzipBytes"],
        "eagerGzipTolerance": existing.get("eagerGzipTolerance", DEFAULT_TOLERANCE),
        "forbiddenEager": existing.get("forbiddenEager", DEFAULT_FORBIDDEN_EAGER),
        "eager": sorted(name for name, info in shipped.items() if info["loadKind"] == "eager"),
        "lazy": sorted(name for name, info in shipped.items() if info["loadKind"] == "lazy"),
    }


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("report", type=Path, help="bundle-report.json written by the build")
    parser.add_argument("policy", type=Path, help="the app's bundle-policy.json")
    parser.add_argument("--init", action="store_true", help="write the policy's lists and baseline from the report")
    args = parser.parse_args(argv)

    if not args.report.exists():
        print(f"{args.report} is missing: build the app first (npm run build -w <app>)", file=sys.stderr)
        return 2
    report = read_json(args.report)
    if args.init:
        existing = read_json(args.policy) if args.policy.exists() else {}
        policy = init(report, existing)
        args.policy.write_text(json.dumps(policy, indent=2) + "\n", encoding="utf-8")
        print(
            f"wrote {args.policy}: {len(policy['eager'])} eager and {len(policy['lazy'])} lazy packages, "
            f"eager gzip baseline {policy['eagerGzipBaseline']} bytes"
        )
    if not args.policy.exists():
        print(f"{args.policy} is missing: create it with --init", file=sys.stderr)
        return 2

    policy = read_json(args.policy)
    violations = check(report, policy)
    for violation in violations:
        print(violation)
    eager = report["totals"]["eager"]
    print(
        f"{len(violations)} violation(s); loaded with the page: {eager['chunks']} chunks, "
        f"{eager['gzipBytes']} bytes gzipped (baseline {policy['eagerGzipBaseline']})"
    )
    return 1 if violations else 0


if __name__ == "__main__":
    sys.exit(main())
