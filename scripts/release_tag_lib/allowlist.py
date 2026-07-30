"""B+ release allow-list for product tagging (#223 D2)."""

from __future__ import annotations

from pathlib import Path

# Package names that must share the product SemVer (plus root package.json).
BPLUS_PACKAGE_NAMES: frozenset[str] = frozenset(
    {
        "miroir-standalone-app-electron",
        "miroir-server",
        "miroir-standalone-app",
        "miroir-cli",
        "miroir-mcp",
    }
)


def release_manifest_paths(repo_root: Path) -> list[Path]:
    """Return root + B+ ``package.json`` paths.

    Raises FileNotFoundError if any required path is missing.
    """
    root = repo_root.resolve()
    root_pkg = root / "package.json"
    if not root_pkg.is_file():
        raise FileNotFoundError(f"missing root package.json: {root_pkg}")

    paths: list[Path] = [root_pkg]
    missing: list[str] = []
    for name in sorted(BPLUS_PACKAGE_NAMES):
        pkg = root / "packages" / name / "package.json"
        if not pkg.is_file():
            missing.append(name)
        else:
            paths.append(pkg)

    if missing:
        raise FileNotFoundError(
            "missing B+ package.json for: " + ", ".join(missing)
        )
    return paths
