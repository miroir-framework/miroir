from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

RELEASE_DIR = Path(__file__).resolve().parents[1]
if str(RELEASE_DIR) not in sys.path:
    sys.path.insert(0, str(RELEASE_DIR))

from release_lib.tarballs import TarballInfo, sha256_file, validate_layer_consumer


def test_sha256_file(tmp_path: Path) -> None:
    path = tmp_path / "blob.bin"
    path.write_bytes(b"miroir-release")
    digest = sha256_file(path)
    assert len(digest) == 64
    assert digest == sha256_file(path)


def test_validate_layer_consumer_skips_bundle_only(tmp_path: Path) -> None:
    from release_lib.plan import ReleasePlan

    plan = ReleasePlan(
        base_ref="1.0.0",
        bump="patch",
        product_version="1.0.1",
        lerna_candidates=(),
        forced=(),
        disabled=(),
        closure_added=(),
        selected=("core",),
        layers=(("core",),),
        distributeable=(),
        bundle_only=("core",),
    )
    infos = [
        TarballInfo(
            package="core",
            layer=0,
            path="release-tarballs/P0/core.tgz",
            sha256="abc",
            distributeable=False,
        )
    ]
    # Bundle-only layers do not require a clean consumer install.
    validate_layer_consumer(tmp_path, plan, infos, through_layer=0)


def _info(package: str) -> TarballInfo:
    return TarballInfo(package=package, layer=0, path=f"release-tarballs/P0/{package.split('/')[1]}.tgz", sha256="x", distributeable=True)


def test_the_consumer_test_takes_the_tarballs_of_the_release(tmp_path: Path) -> None:
    """#658: with every package the generated project needs packed, the consumer test gets their tarballs."""
    from release_lib.consumer_project import required_packages
    from release_lib.tarballs import consumer_test_inputs

    repo_root = RELEASE_DIR.parents[1]
    infos = [_info(name) for name in required_packages(repo_root)]
    tarballs, missing = consumer_test_inputs(repo_root, infos)
    assert missing == []
    assert tarballs["@miroir-framework/core"] == (repo_root / "release-tarballs/P0/core.tgz").resolve()


def test_the_consumer_test_names_what_the_release_did_not_pack(tmp_path: Path) -> None:
    """#658: a release that selects only some packages skips the consumer test and says which ones are missing."""
    from release_lib.tarballs import consumer_test_inputs

    repo_root = RELEASE_DIR.parents[1]
    _, missing = consumer_test_inputs(repo_root, [_info("@miroir-framework/core")])
    assert "@miroir-framework/create-app" in missing and "@miroir-framework/core" not in missing
