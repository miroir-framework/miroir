#!/usr/bin/env python3
"""Produce a Lerna-managed, distribution-ready Miroir release tree.

The script is deliberately independent from ``scripts/release_tag.py``.  It
uses Lerna to version the selected release closure, including internal package
range rewrites, then restores packages deliberately excluded by the operator.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


SEMVER = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$")
DEPENDENCY_KINDS = ("dependencies", "peerDependencies")
REPO_ROOT = Path(__file__).resolve().parents[2]


class ReleaseError(ValueError):
    """A release plan cannot be produced or safely applied."""


@dataclass(frozen=True)
class Workspace:
    name: str
    path: Path
    version: str
    dependencies: tuple[str, ...]


@dataclass(frozen=True)
class ReleasePlan:
    base_ref: str
    bump: str
    product_version: str
    lerna_candidates: tuple[str, ...]
    forced: tuple[str, ...]
    disabled: tuple[str, ...]
    closure_added: tuple[str, ...]
    selected: tuple[str, ...]


def run(
    args: list[str],
    *,
    cwd: Path,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=cwd, check=check, capture_output=True, text=True)


def executable(name: str) -> str:
    """Return the Windows command shim when the producer runs under Python."""
    return f"{name}.cmd" if sys.platform == "win32" else name


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def workspace_packages(repo_root: Path) -> dict[str, Workspace]:
    packages: dict[str, Workspace] = {}
    for manifest in sorted((repo_root / "packages").glob("*/package.json")):
        data = load_json(manifest)
        name = data.get("name")
        version = data.get("version")
        if not isinstance(name, str) or not isinstance(version, str):
            raise ReleaseError(f"{manifest}: expected string name and version")
        dependencies: set[str] = set()
        for kind in DEPENDENCY_KINDS:
            value = data.get(kind, {})
            if isinstance(value, dict):
                dependencies.update(dep for dep in value if isinstance(dep, str))
        packages[name] = Workspace(
            name=name,
            path=manifest,
            version=version,
            dependencies=tuple(sorted(dependencies)),
        )
    return packages


def increment(version: str, bump: str) -> str:
    match = SEMVER.fullmatch(version)
    if match is None:
        raise ReleaseError(f"invalid SemVer version: {version!r}")
    core, separator, _pre_release = version.partition("-")
    major, minor, patch = (int(part) for part in core.split("."))
    if bump == "major":
        return f"{major + 1}.0.0"
    if bump == "minor":
        return f"{major}.{minor + 1}.0"
    if bump == "patch":
        if separator:
            return core
        return f"{major}.{minor}.{patch + 1}"
    raise ReleaseError(f"unsupported bump: {bump}")


def previous_release_tag(repo_root: Path) -> str:
    result = run(
        ["git", "tag", "--merged", "HEAD", "--sort=-version:refname"],
        cwd=repo_root,
    )
    for tag in result.stdout.splitlines():
        if SEMVER.fullmatch(tag):
            return tag
    raise ReleaseError("no reachable SemVer release tag; pass --since <ref>")


def lerna_candidates(repo_root: Path, base_ref: str) -> list[str]:
    result = run(
        [executable("npx"), "lerna", "ls", "--since", base_ref, "--json"],
        cwd=repo_root,
    )
    start = result.stdout.find("[")
    if start < 0:
        raise ReleaseError("Lerna did not emit a JSON package list")
    try:
        entries = json.loads(result.stdout[start:])
    except json.JSONDecodeError as exc:
        raise ReleaseError(f"cannot parse Lerna package list: {exc}") from exc
    if not isinstance(entries, list):
        raise ReleaseError("Lerna package list must be an array")
    names: list[str] = []
    for entry in entries:
        name = entry.get("name") if isinstance(entry, dict) else None
        if not isinstance(name, str):
            raise ReleaseError("Lerna package list contains an entry without a name")
        names.append(name)
    return sorted(set(names))


def release_closure(
    initial: set[str],
    packages: dict[str, Workspace],
) -> set[str]:
    selected = set(initial)
    todo = list(initial)
    while todo:
        name = todo.pop()
        for dependency in packages[name].dependencies:
            if dependency in packages and dependency not in selected:
                selected.add(dependency)
                todo.append(dependency)
    return selected


def build_plan(
    repo_root: Path,
    *,
    bump: str,
    since: str | None,
    force: list[str],
    disable: list[str],
    candidate_provider: Any = lerna_candidates,
) -> ReleasePlan:
    root = load_json(repo_root / "package.json")
    root_version = root.get("version")
    if not isinstance(root_version, str):
        raise ReleaseError("root package.json has no string version")
    packages = workspace_packages(repo_root)
    unknown = (set(force) | set(disable)) - set(packages)
    if unknown:
        raise ReleaseError("unknown workspace package(s): " + ", ".join(sorted(unknown)))
    overlap = set(force) & set(disable)
    if overlap:
        raise ReleaseError("package(s) both forced and disabled: " + ", ".join(sorted(overlap)))
    if len(force) != len(set(force)) or len(disable) != len(set(disable)):
        raise ReleaseError("duplicate --force or --disable package")

    base_ref = since or previous_release_tag(repo_root)
    raw_candidates = set(candidate_provider(repo_root, base_ref))
    unknown_candidates = raw_candidates - set(packages)
    if unknown_candidates:
        raise ReleaseError(
            "Lerna returned unknown workspace package(s): "
            + ", ".join(sorted(unknown_candidates))
        )
    disabled_set = set(disable)
    non_candidates = disabled_set - raw_candidates
    if non_candidates:
        raise ReleaseError(
            "--disable only accepts Lerna candidates: " + ", ".join(sorted(non_candidates))
        )

    initial = (raw_candidates | set(force)) - disabled_set
    selected = release_closure(initial, packages)
    disabled_in_closure = selected & disabled_set
    if disabled_in_closure:
        raise ReleaseError(
            "cannot disable required runtime/peer dependency: "
            + ", ".join(sorted(disabled_in_closure))
        )
    closure_added = selected - initial
    return ReleasePlan(
        base_ref=base_ref,
        bump=bump,
        product_version=increment(root_version, bump),
        lerna_candidates=tuple(sorted(raw_candidates)),
        forced=tuple(sorted(set(force))),
        disabled=tuple(sorted(disabled_set)),
        closure_added=tuple(sorted(closure_added)),
        selected=tuple(sorted(selected)),
    )


def print_plan(plan: ReleasePlan) -> None:
    print(json.dumps(asdict(plan), indent=2))


def assert_clean(repo_root: Path) -> None:
    result = run(["git", "status", "--porcelain"], cwd=repo_root)
    if result.stdout.strip():
        raise ReleaseError("working tree is dirty; use a clean release worktree")


def backup_files(paths: list[Path]) -> dict[Path, bytes | None]:
    return {path: path.read_bytes() if path.exists() else None for path in paths}


def restore_files(backups: dict[Path, bytes | None]) -> None:
    for path, data in backups.items():
        if data is None:
            path.unlink(missing_ok=True)
        else:
            path.write_bytes(data)


def set_root_version(repo_root: Path, version: str) -> None:
    path = repo_root / "package.json"
    root = load_json(path)
    root["version"] = version
    path.write_text(json.dumps(root, indent=2) + "\n", encoding="utf-8")


def verify_release_tree(repo_root: Path, plan: ReleasePlan) -> None:
    packages = workspace_packages(repo_root)
    for name in plan.selected:
        if packages[name].version != plan.product_version:
            raise ReleaseError(
                f"{name} has version {packages[name].version}, expected {plan.product_version}"
            )
        manifest = load_json(packages[name].path)
        for kind in DEPENDENCY_KINDS:
            dependencies = manifest.get(kind, {})
            if not isinstance(dependencies, dict):
                continue
            for dependency in packages[name].dependencies:
                if dependency not in plan.selected or dependency not in dependencies:
                    continue
                value = dependencies[dependency]
                if value == "*" or (isinstance(value, str) and value.startswith("file:")):
                    raise ReleaseError(
                        f"{name} {kind} dependency {dependency} is not releaseable: {value!r}"
                    )
    root = load_json(repo_root / "package.json")
    if root.get("version") != plan.product_version:
        raise ReleaseError("root package.json version was not synchronized")
    lerna = load_json(repo_root / "lerna.json")
    if lerna.get("version") != plan.product_version:
        raise ReleaseError("lerna.json version was not synchronized")
    run([executable("npm"), "ci", "--ignore-scripts"], cwd=repo_root)


def apply_plan(repo_root: Path, plan: ReleasePlan) -> None:
    """Version with Lerna, preserving excluded package manifests exactly."""
    assert_clean(repo_root)
    packages = workspace_packages(repo_root)
    manifest_paths = [workspace.path for workspace in packages.values()]
    protected = [
        repo_root / "package.json",
        repo_root / "package-lock.json",
        repo_root / "lerna.json",
        *manifest_paths,
    ]
    backups = backup_files(protected)
    try:
        force_publish = ",".join(plan.selected)
        run(
            [
                executable("npx"),
                "lerna",
                "version",
                plan.product_version,
                f"--force-publish={force_publish}",
                "--yes",
                "--no-git-tag-version",
                "--no-push",
                "--no-changelog",
                "--ignore-scripts",
            ],
            cwd=repo_root,
        )

        for name, workspace in packages.items():
            if name not in plan.selected:
                data = backups[workspace.path]
                if data is not None:
                    workspace.path.write_bytes(data)
        set_root_version(repo_root, plan.product_version)
        run(
            [executable("npm"), "install", "--package-lock-only", "--ignore-scripts"],
            cwd=repo_root,
        )
        verify_release_tree(repo_root, plan)
    except Exception:
        restore_files(backups)
        raise


def commit_tag_push(repo_root: Path, plan: ReleasePlan, *, commit: bool, tag: bool, push: bool) -> None:
    if push and not (commit and tag):
        raise ReleaseError("--push requires --commit and --tag")
    if commit:
        run(["git", "add", "package.json", "package-lock.json", "lerna.json", "packages"], cwd=repo_root)
        run(["git", "commit", "-m", f"release: {plan.product_version}"], cwd=repo_root)
    if tag:
        run(
            ["git", "tag", "-a", plan.product_version, "-m", f"release {plan.product_version}"],
            cwd=repo_root,
        )
    if push:
        run(["git", "push"], cwd=repo_root)
        run(["git", "push", "--tags"], cwd=repo_root)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--bump", required=True, choices=("major", "minor", "patch"))
    parser.add_argument("--since")
    parser.add_argument("--force", action="append", default=[])
    parser.add_argument("--disable", action="append", default=[])
    parser.add_argument("--apply", action="store_true", help="Write the release tree")
    parser.add_argument("--commit", action="store_true")
    parser.add_argument("--tag", action="store_true")
    parser.add_argument("--push", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        plan = build_plan(
            REPO_ROOT,
            bump=args.bump,
            since=args.since,
            force=args.force,
            disable=args.disable,
        )
        print_plan(plan)
        if not args.apply:
            return 0
        apply_plan(REPO_ROOT, plan)
        commit_tag_push(REPO_ROOT, plan, commit=args.commit, tag=args.tag, push=args.push)
        return 0
    except (OSError, ReleaseError, subprocess.CalledProcessError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
