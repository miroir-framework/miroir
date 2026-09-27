#!/usr/bin/env python3
"""Fail when a dependency could enter the build without someone choosing it (#326).

Rules (all run by default; --rule selects some):
  specs           third-party specs are exact versions; internal miroir-* specs are "*"; the root .npmrc sets
                  save-exact=true. Peer dependencies keep their ranges: they state compatibility, not what is installed.
  classification  build and test tools stay out of `dependencies`, so production installs, `npm audit --omit=dev`
                  and the Electron package never carry them.
  lockfile        package-lock.json installs the pinned version of every direct dependency, and lists every
                  platform binary its packages declare (npm/cli#4828 drops the other platforms' ones), so `npm ci`
                  alone installs a working tree on every OS.
  workflows       GitHub workflows and composite actions install with `npm ci`, never `npm install`.

Run: python scripts/check_dependency_policy.py [--rule NAME]...
Plan: code-helpers/features/326-BUILD-build-hardening/tdd-implementation-plan.md
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Iterable

ROOT = Path(__file__).resolve().parent.parent

EXACT_VERSION_RE = re.compile(r"^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$")
INSTALL_SECTIONS = ("dependencies", "devDependencies", "optionalDependencies")

# Build and test tools: exact names, then name prefixes. A vite plugin counts because npm installs its `vite` peer.
BUILD_AND_TEST_TOOLS = ("electron", "electron-builder", "happy-dom", "vite", "vitest")
BUILD_AND_TEST_TOOL_PREFIXES = ("vite-plugin-", "@vitejs/", "@vitest/")

NPM_INSTALL_RE = re.compile(r"\bnpm\s+(install|i|add)\b")


@dataclass(frozen=True)
class Violation:
    rule: str
    where: str
    message: str

    def __str__(self) -> str:
        return f"[{self.rule}] {self.where}: {self.message}"


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _rel(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def manifest_paths(root: Path) -> list[Path]:
    """Root package.json first, then every workspace package.json, in path order."""
    root_manifest = root / "package.json"
    paths = [root_manifest]
    for pattern in _load_json(root_manifest).get("workspaces", []):
        paths.extend(sorted(p for p in root.glob(f"{pattern}/package.json") if "node_modules" not in p.parts))
    return paths


def workspace_names(root: Path) -> set[str]:
    return {_load_json(p).get("name", "") for p in manifest_paths(root)[1:]}


# --------------------------------------------------------------------------------------------------------------------
# specs


def spec_problem(spec: str) -> str | None:
    """Why a third-party spec may resolve to a version nobody chose, or None when it is pinned."""
    if spec.startswith("npm:"):
        _, _, version = spec[4:].rpartition("@")
        return spec_problem(version)
    if spec.startswith(("file:", "link:")):
        return None
    if spec.startswith(("https://", "http://")):
        return None if re.search(r"\d+\.\d+\.\d+", spec) else "URL without a version"
    if spec.startswith(("git", "github:")) or "/" in spec:
        return None if re.search(r"#[0-9a-f]{40}$", spec) else "git reference without a commit SHA"
    if EXACT_VERSION_RE.match(spec):
        return None
    return "not an exact version"


def _override_leaves(overrides: dict, prefix: str = "") -> Iterable[tuple[str, str]]:
    for name, value in overrides.items():
        path = f"{prefix}{name}"
        if isinstance(value, dict):
            yield from _override_leaves(value, f"{path} > ")
        elif isinstance(value, str) and not value.startswith("$"):
            yield path, value


def check_specs(root: Path) -> list[Violation]:
    violations: list[Violation] = []
    internal = workspace_names(root)
    for path in manifest_paths(root):
        manifest = _load_json(path)
        where = _rel(root, path)
        for section in INSTALL_SECTIONS:
            for name, spec in manifest.get(section, {}).items():
                if name in internal:
                    if spec != "*":
                        violations.append(Violation("specs", where, f'{section}.{name} "{spec}": internal packages use "*"'))
                    continue
                problem = spec_problem(spec)
                if problem:
                    violations.append(Violation("specs", where, f'{section}.{name} "{spec}": {problem}'))
        for name, spec in _override_leaves(manifest.get("overrides", {})):
            problem = spec_problem(spec)
            if problem:
                violations.append(Violation("specs", where, f'overrides.{name} "{spec}": {problem}'))
    npmrc = root / ".npmrc"
    settings = [line.replace(" ", "") for line in npmrc.read_text(encoding="utf-8").splitlines()] if npmrc.is_file() else []
    if "save-exact=true" not in settings:
        violations.append(Violation("specs", ".npmrc", "missing save-exact=true, so `npm install x` writes a range"))
    return violations


# --------------------------------------------------------------------------------------------------------------------
# classification


def is_build_or_test_tool(name: str) -> bool:
    return name in BUILD_AND_TEST_TOOLS or name.startswith(BUILD_AND_TEST_TOOL_PREFIXES)


def check_classification(root: Path) -> list[Violation]:
    return [
        Violation("classification", _rel(root, path), f"{name} is a build or test tool: move it to devDependencies")
        for path in manifest_paths(root)
        for name in _load_json(path).get("dependencies", {})
        if is_build_or_test_tool(name)
    ]


# --------------------------------------------------------------------------------------------------------------------
# lockfile


def _lock_packages(root: Path) -> dict[str, dict]:
    return _load_json(root / "package-lock.json").get("packages", {})


def _resolve(packages: dict[str, dict], base: str, name: str) -> str | None:
    """The lockfile key Node resolution finds for `name` required from `base` (a key, or "" for the root)."""
    while True:
        key = f"{base}/node_modules/{name}" if base else f"node_modules/{name}"
        if key in packages:
            return key
        if not base:
            return None
        parent, sep, _ = base.rpartition("/node_modules/")
        base = parent if sep else ""


def _pinned_version(spec: str) -> str | None:
    version = spec[4:].rpartition("@")[2] if spec.startswith("npm:") else spec
    return version if EXACT_VERSION_RE.match(version) else None


def check_lockfile(root: Path) -> list[Violation]:
    packages = _lock_packages(root)
    internal = workspace_names(root)
    violations: list[Violation] = []
    for path in manifest_paths(root):
        base = "" if path.parent == root else _rel(root, path.parent)
        manifest = _load_json(path)
        for section in INSTALL_SECTIONS:
            for name, spec in manifest.get(section, {}).items():
                pinned = _pinned_version(spec) if name not in internal else None
                key = _resolve(packages, base, name) if pinned else None
                if key and packages[key].get("version") != pinned:
                    violations.append(
                        Violation(
                            "lockfile",
                            _rel(root, path),
                            f'{section}.{name} "{spec}" but package-lock.json installs {packages[key].get("version")}',
                        )
                    )
    for key, entry in packages.items():
        if entry.get("link"):
            continue
        missing = [
            name
            for section in ("dependencies", "optionalDependencies")
            for name in entry.get(section, {})
            if _resolve(packages, key, name) is None
        ]
        if missing:
            listed = ", ".join(missing[:3]) + (", …" if len(missing) > 3 else "")
            violations.append(
                Violation(
                    "lockfile",
                    "package-lock.json",
                    f"{key or '<root>'} lacks {len(missing)} package(s) ({listed}); see docs/contributing/"
                    "development-setup.md, Dependency policy, to regenerate the lockfile",
                )
            )
    return violations


# --------------------------------------------------------------------------------------------------------------------
# workflows


def workflow_files(root: Path) -> list[Path]:
    github = root / ".github"
    return sorted([*github.glob("workflows/*.yml"), *github.glob("workflows/*.yaml"), *github.glob("actions/*/action.yml")])


def check_workflows(root: Path) -> list[Violation]:
    return [
        Violation("workflows", f"{_rel(root, path)}:{number}", "installs with `npm install`; use `npm ci`")
        for path in workflow_files(root)
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1)
        if not line.lstrip().startswith("#") and NPM_INSTALL_RE.search(line.split(" #", 1)[0])
    ]


# --------------------------------------------------------------------------------------------------------------------
# CLI

RULES: dict[str, Callable[[Path], list[Violation]]] = {
    "specs": check_specs,
    "classification": check_classification,
    "lockfile": check_lockfile,
    "workflows": check_workflows,
}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").splitlines()[0])
    parser.add_argument("--rule", action="append", choices=list(RULES), help="rule to run (repeatable); default: all")
    parser.add_argument("--root", type=Path, default=ROOT, help=argparse.SUPPRESS)
    args = parser.parse_args(argv)

    violations = [violation for rule in args.rule or RULES for violation in RULES[rule](args.root)]
    for violation in violations:
        print(violation)
    if violations:
        print(f"{len(violations)} dependency policy violation(s). See docs/contributing/development-setup.md, Dependency policy.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
