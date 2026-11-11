"""#658: the out-of-workspace consumer test.

The fast cases check how the test points a generated project at the tarballs. The slow cases (MIROIR_CONSUMER_TEST=1,
set by the nonreg step `full-658-consumer-project`) pack the built workspace, generate a project outside the
repository, install, type-check and build it, start its server and query it: they need built packages and the npm
registry for third-party dependencies.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path

import pytest

RELEASE_DIR = Path(__file__).resolve().parents[1]
if str(RELEASE_DIR) not in sys.path:
    sys.path.insert(0, str(RELEASE_DIR))

from release_lib.common import ReleaseError
from release_lib.consumer_project import (
    GENERATOR,
    check_client,
    check_entity_list,
    missing_tarballs,
    pack_workspace,
    prepare_project,
    required_packages,
    rewrite_dependencies,
    started_server,
    tarballs_from_manifest,
)

REPO_ROOT = RELEASE_DIR.parents[1]
SLOW = pytest.mark.skipif(os.environ.get("MIROIR_CONSUMER_TEST") != "1", reason="set MIROIR_CONSUMER_TEST=1")


def test_the_project_needs_the_generator_the_template_packages_and_their_runtime_closure():
    assert required_packages(REPO_ROOT) == [
        "@miroir-framework/core",
        "@miroir-framework/create-app",
        "@miroir-framework/env",
        "@miroir-framework/mcp",  # through @miroir-framework/server
        "@miroir-framework/react",
        "@miroir-framework/server",
        "@miroir-framework/store-filesystem",
        "@miroir-framework/versioning",  # through @miroir-framework/react and @miroir-framework/server
    ]


def test_direct_dependencies_and_transitive_ones_point_at_the_tarballs(tmp_path):
    tarballs = {name: tmp_path / f"{name.split('/')[1]}.tgz" for name in required_packages(REPO_ROOT)}
    manifest = {
        "name": "app",
        "dependencies": {"@miroir-framework/core": "1.0.0", "@miroir-framework/server": "1.0.0", "react": "18.3.1"},
        "devDependencies": {"vite": "8.3.5"},
    }
    rewritten = rewrite_dependencies(manifest, tarballs)
    core = f"file:{(tmp_path / 'core.tgz').as_posix()}"
    assert rewritten["dependencies"]["@miroir-framework/core"] == core
    assert rewritten["dependencies"]["react"] == "18.3.1"
    # npm resolves the server's own dependency on mcp through the overrides, never from the registry
    assert rewritten["overrides"]["@miroir-framework/mcp"] == f"file:{(tmp_path / 'mcp.tgz').as_posix()}"
    assert rewritten["overrides"]["@miroir-framework/core"] == core  # equal to the direct spec, as npm requires
    assert GENERATOR not in rewritten["overrides"]
    assert manifest["dependencies"]["@miroir-framework/core"] == "1.0.0"  # the input is left as it was


def test_a_miroir_dependency_without_a_tarball_is_an_error(tmp_path):
    with pytest.raises(ReleaseError, match="no tarball for @miroir-framework/env"):
        rewrite_dependencies({"dependencies": {"@miroir-framework/env": "1.0.0"}}, {})


def test_a_release_tarball_folder_is_read_from_its_manifest_even_when_moved(tmp_path):
    folder = tmp_path / "moved-tarballs"
    (folder / "P0").mkdir(parents=True)
    (folder / "P0" / "core.tgz").write_bytes(b"x")
    (folder / "manifest.json").write_text(
        json.dumps({"tarballs": [{"package": "@miroir-framework/core", "layer": 0, "path": "release-tarballs/P0/core.tgz"}]})
    )
    found = tarballs_from_manifest(tmp_path / "no-repository-here", folder)
    assert found == {"@miroir-framework/core": (folder / "P0" / "core.tgz").resolve()}
    assert "@miroir-framework/create-app" in missing_tarballs(REPO_ROOT, found)


def test_a_release_tarball_folder_prefers_its_own_tarball_over_the_recorded_path(tmp_path):
    """A kept folder is tested as kept, even when a later build of the same version rewrote the recorded path."""
    repository = tmp_path / "repository"
    (repository / "release-tarballs" / "P0").mkdir(parents=True)
    (repository / "release-tarballs" / "P0" / "core.tgz").write_bytes(b"newer build")
    kept = tmp_path / "kept"
    (kept / "P0").mkdir(parents=True)
    (kept / "P0" / "core.tgz").write_bytes(b"kept build")
    (kept / "manifest.json").write_text(
        json.dumps({"tarballs": [{"package": "@miroir-framework/core", "layer": 0, "path": "release-tarballs/P0/core.tgz"}]})
    )
    assert tarballs_from_manifest(repository, kept) == {"@miroir-framework/core": (kept / "P0" / "core.tgz").resolve()}


# ----------------------------------------------------------------------------------------------------------------
# slow: a generated project, installed from tarballs, outside the repository


@pytest.fixture(scope="module")
def running_project():
    work = Path(tempfile.mkdtemp(prefix="miroir-consumer-test-"))
    tarballs = pack_workspace(REPO_ROOT, work / "tarballs")
    project = prepare_project(tarballs, work)
    assert not str(project.resolve()).startswith(str(REPO_ROOT.resolve())), "the project must be outside the repository"
    with started_server(project) as server:
        yield server


@SLOW
def test_generated_project_serves_the_entity_list(running_project):
    check_entity_list(running_project.base_url)


@SLOW
def test_generated_project_serves_its_client(running_project):
    check_client(running_project.base_url)
