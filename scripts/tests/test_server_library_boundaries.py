"""#636: miroir-server-library imports no store package, no database driver, none of the binary's own
dependencies, and every build path builds it before the server release (ncc inlines it).

The static checks run anywhere (pr-checks runs them before Node is installed). The build checks need
the installed workspace and are skipped without it; the `unit-636-server-library` nonreg step runs them.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
LIBRARY = REPO_ROOT / "packages" / "miroir-server-library"
LIBRARY_DIST = LIBRARY / "dist"
TSUP = REPO_ROOT / "node_modules" / ".bin" / "tsup"

FORBIDDEN = re.compile(
    r"^(miroir-store-.*|pg|sequelize|mongodb|level|browser-level|classic-level|miroir-env|miroir-ai|@copilotkit/.*)$"
)


def _read(relative: str) -> str:
    return (REPO_ROOT / relative).read_text(encoding="utf-8")


def test_library_declares_no_store_driver_or_binary_dependency():
    manifest = json.loads((LIBRARY / "package.json").read_text(encoding="utf-8"))
    declared = {**manifest.get("dependencies", {}), **manifest.get("peerDependencies", {})}
    assert sorted(name for name in declared if FORBIDDEN.match(name)) == []


def test_library_stays_private_until_the_rename():
    # ci/release/release_lib/plan.py treats a non-private package as distributable (#621 I5, I6)
    assert json.loads((LIBRARY / "package.json").read_text(encoding="utf-8"))["private"] is True


@pytest.mark.parametrize(
    "build_file",
    [
        "build-all.sh",
        "Dockerfile",
        ".github/workflows/build-linux-runnables.yml",
        ".github/workflows/self-test.yml",
        "ci/build/build_server.sh",
    ],
)
def test_every_server_build_path_builds_the_library(build_file):
    assert "miroir-server-library" in _read(build_file)


def test_the_release_artifact_list_carries_the_library_dist():
    assert "packages/miroir-server-library/dist" in _read(".github/workflows/build-linux-runnables.yml")


def test_the_release_bundle_inlines_the_library():
    build_server = json.loads(_read("packages/miroir-server/package.json"))["scripts"]["build:server"]
    assert "-e miroir-server-library" not in build_server


needs_workspace = pytest.mark.skipif(not TSUP.exists(), reason="workspace not installed (npm ci)")
needs_dist = pytest.mark.skipif(
    not (LIBRARY_DIST / "metafile-esm.json").exists(), reason="library not built: npm run build -w miroir-server-library"
)


@needs_dist
def test_the_built_library_imports_nothing_forbidden():
    metafile = json.loads((LIBRARY_DIST / "metafile-esm.json").read_text(encoding="utf-8"))
    imported = {entry["path"] for output in metafile["outputs"].values() for entry in output["imports"]}
    assert sorted(path for path in imported if FORBIDDEN.match(path)) == []


@needs_workspace
@pytest.mark.parametrize("external", [False, True], ids=["bundled", "declared-dependency"])
def test_the_build_fails_on_a_store_import(tmp_path, external):
    out_dir = tmp_path / "probe"
    env = {**os.environ, "MIROIR_SERVER_LIBRARY_PROBE": str(out_dir)}
    if external:
        env["MIROIR_SERVER_LIBRARY_PROBE_EXTERNAL"] = "1"
    result = subprocess.run(
        ["npm", "run", "build", "-w", "miroir-server-library"],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=300,
    )
    shutil.rmtree(out_dir, ignore_errors=True)
    assert result.returncode != 0
    assert "miroir-server-library must not import stores" in result.stdout + result.stderr
    assert "miroir-store-filesystem" in result.stdout + result.stderr
