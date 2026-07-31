"""Lerna versioning and selection enforcement."""

from __future__ import annotations

from pathlib import Path

from release_lib.common import ReleaseError, dump_json, executable, load_json, run
from release_lib.plan import ReleasePlan
from release_lib.workspace import RUNTIME_KINDS, workspace_packages

# Exact Lerna invocation proven for #227:
#   npx lerna version <product_version>
#     --force-publish=<selected comma list>
#     --yes --no-git-tag-version --no-push --no-changelog --ignore-scripts
# Unselected package manifests are restored from pre-version backups so
# Lerna cannot permanently rewrite packages outside the reviewed closure.


def backup_files(paths: list[Path]) -> dict[Path, bytes | None]:
    return {path: path.read_bytes() if path.exists() else None for path in paths}


def restore_files(backups: dict[Path, bytes | None]) -> None:
    for path, data in backups.items():
        if data is None:
            path.unlink(missing_ok=True)
        else:
            path.write_bytes(data)


def set_root_and_lerna_version(repo_root: Path, version: str) -> None:
    root_path = repo_root / "package.json"
    root = load_json(root_path)
    root["version"] = version
    dump_json(root_path, root)

    lerna_path = repo_root / "lerna.json"
    if lerna_path.is_file():
        lerna = load_json(lerna_path)
        lerna["version"] = version
        dump_json(lerna_path, lerna)


def verify_selection_enforced(
    repo_root: Path,
    plan: ReleasePlan,
    pre_versions: dict[str, str],
) -> None:
    """Fail if Lerna changed a package outside the approved selected closure."""
    packages = workspace_packages(repo_root)
    for name, before in pre_versions.items():
        after = packages[name].version
        if name in plan.selected:
            if after != plan.product_version:
                raise ReleaseError(
                    f"{name} has version {after}, expected {plan.product_version}"
                )
        elif after != before:
            raise ReleaseError(
                f"Lerna mutated unselected package {name}: {before} -> {after}"
            )


def verify_release_ranges(repo_root: Path, plan: ReleasePlan) -> None:
    packages = workspace_packages(repo_root)
    for name in plan.selected:
        manifest = load_json(packages[name].path)
        for kind in RUNTIME_KINDS:
            dependencies = manifest.get(kind, {})
            if not isinstance(dependencies, dict):
                continue
            for dependency in packages[name].runtime_dependencies:
                if dependency not in plan.selected or dependency not in dependencies:
                    continue
                value = dependencies[dependency]
                if value == "*" or (
                    isinstance(value, str) and value.startswith("file:")
                ):
                    raise ReleaseError(
                        f"{name} {kind} dependency {dependency} is not releaseable: {value!r}"
                    )


def apply_lerna_version(repo_root: Path, plan: ReleasePlan) -> None:
    """Version the selected closure with Lerna; restore unselected manifests."""
    packages = workspace_packages(repo_root)
    pre_versions = {name: workspace.version for name, workspace in packages.items()}
    manifest_paths = [workspace.path for workspace in packages.values()]
    protected = [
        repo_root / "package.json",
        repo_root / "package-lock.json",
        repo_root / "lerna.json",
        *manifest_paths,
    ]
    backups = backup_files(protected)
    force_publish = ",".join(plan.selected) if plan.selected else ""
    try:
        args = [
            executable("npx"),
            "lerna",
            "version",
            plan.product_version,
            "--yes",
            "--no-git-tag-version",
            "--no-push",
            "--no-changelog",
            "--ignore-scripts",
        ]
        if force_publish:
            args.insert(4, f"--force-publish={force_publish}")
        result = run(args, cwd=repo_root, check=False)
        if result.returncode != 0:
            raise ReleaseError(
                "lerna version failed:\n"
                + (result.stderr or result.stdout or f"exit {result.returncode}")
            )

        # Restore packages that must remain outside the release closure.
        for name, workspace in packages.items():
            if name not in plan.selected:
                data = backups[workspace.path]
                if data is not None:
                    workspace.path.write_bytes(data)

        set_root_and_lerna_version(repo_root, plan.product_version)
        lock_result = run(
            [executable("npm"), "install", "--package-lock-only", "--ignore-scripts"],
            cwd=repo_root,
            check=False,
        )
        if lock_result.returncode != 0:
            raise ReleaseError(
                "npm lockfile update failed:\n"
                + (lock_result.stderr or lock_result.stdout or "")
            )

        verify_selection_enforced(repo_root, plan, pre_versions)
        verify_release_ranges(repo_root, plan)
        ci_result = run(
            [executable("npm"), "ci", "--ignore-scripts"],
            cwd=repo_root,
            check=False,
        )
        if ci_result.returncode != 0:
            raise ReleaseError(
                "npm ci failed after release versioning:\n"
                + (ci_result.stderr or ci_result.stdout or "")
            )
    except Exception:
        restore_files(backups)
        raise


def commit_tag_push(
    repo_root: Path,
    plan: ReleasePlan,
    *,
    commit: bool,
    tag: bool,
    push: bool,
) -> None:
    if push and not (commit and tag):
        raise ReleaseError("--push requires --commit and --tag")
    if commit:
        run(
            [
                "git",
                "add",
                "package.json",
                "package-lock.json",
                "lerna.json",
                "packages",
                "release-plan.json",
                "release-tarballs",
            ],
            cwd=repo_root,
            check=False,
        )
        run(
            ["git", "commit", "-m", f"release: {plan.product_version}"],
            cwd=repo_root,
        )
    if tag:
        exists = run(
            ["git", "tag", "-l", plan.product_version],
            cwd=repo_root,
        ).stdout.strip()
        if exists:
            raise ReleaseError(f"tag already exists: {plan.product_version}")
        run(
            [
                "git",
                "tag",
                "-a",
                plan.product_version,
                "-m",
                f"release {plan.product_version}",
            ],
            cwd=repo_root,
        )
    if push:
        run(["git", "push"], cwd=repo_root)
        run(["git", "push", "--tags"], cwd=repo_root)
