"""#664 D4: what `--apply` checks on each tarball before anything can be published.

Real `npm pack` tarballs of tiny packages and the real `npm publish --dry-run`; the registry cases ask npmjs.org
read-only and skip when it cannot be reached."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

RELEASE_DIR = Path(__file__).resolve().parents[1]
if str(RELEASE_DIR) not in sys.path:
    sys.path.insert(0, str(RELEASE_DIR))

from release_lib.common import ReleaseError, executable, npm_pack_entries, run
from release_lib.publish import (
    assert_version_free,
    check_publishable,
    dist_tag,
    published_integrity,
    tarball_integrity,
)

VERSION = "1.0.0-rc.1"
GOOD = {
    "name": "@miroir-framework/fixture-a",
    "version": VERSION,
    "publishConfig": {"access": "public"},
    "dependencies": {"@miroir-framework/fixture-core": VERSION, "zod": "^4.0.0"},
}


def pack(folder: Path, manifest: dict) -> Path:
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "package.json").write_text(json.dumps(manifest), encoding="utf-8")
    (folder / "index.js").write_text("export const a = 1;\n", encoding="utf-8")
    out = folder.parent / f"{folder.name}-out"
    out.mkdir(exist_ok=True)
    result = run([executable("npm"), "pack", "--json", "--pack-destination", str(out)], cwd=folder)
    return out / npm_pack_entries(result.stdout)[0]["filename"]


def check(tarball: Path) -> None:
    check_publishable(tarball, version=VERSION, internal={"@miroir-framework/fixture-core"})


def test_a_release_candidate_goes_to_next_and_a_release_to_latest() -> None:
    assert (dist_tag("0.5.0-rc.2"), dist_tag("0.5.0")) == ("next", "latest")


def test_a_valid_tarball_passes(tmp_path: Path) -> None:
    check(pack(tmp_path / "a", GOOD))


@pytest.mark.parametrize(
    "change, message",
    [
        ({"private": True}, "marked private"),
        ({"name": "fixture-a"}, "outside @miroir-framework/"),
        ({"version": "1.0.0-rc.0"}, "expected '1.0.0-rc.1'"),
        ({"publishConfig": {}}, "access is not public"),
        ({"dependencies": {"@miroir-framework/fixture-core": "*"}}, "expected the exact"),
    ],
)
def test_a_tarball_the_release_must_not_publish_is_refused(tmp_path: Path, change: dict, message: str) -> None:
    with pytest.raises(ReleaseError, match=message):
        check(pack(tmp_path / "a", {**GOOD, **change}))


def test_the_integrity_of_a_tarball_is_the_one_npm_records(tmp_path: Path) -> None:
    folder = tmp_path / "a"
    tarball = pack(folder, GOOD)
    result = run([executable("npm"), "pack", "--json", "--dry-run"], cwd=folder)
    assert tarball_integrity(tarball) == npm_pack_entries(result.stdout)[0]["integrity"]


@pytest.fixture
def npmjs() -> None:
    try:
        published_integrity("@miroir-framework/jzod", "1.0.0")
    except ReleaseError as error:
        pytest.skip(f"npmjs.org unreachable: {error}")


def test_a_version_on_the_registry_is_taken(npmjs: None) -> None:
    with pytest.raises(ReleaseError, match="already on the registry"):
        assert_version_free("@miroir-framework/jzod", "1.0.0")


@pytest.mark.parametrize(
    "name, version",
    [("@miroir-framework/jzod", "0.0.0-never-published"), ("@miroir-framework/fixture-never-published", "1.0.0")],
)
def test_a_version_or_package_absent_from_the_registry_is_free(npmjs: None, name: str, version: str) -> None:
    assert_version_free(name, version)


def release_of(tmp_path: Path, manifests: list[dict]):
    """A plan and its packed tarballs, as `pack_layer` records them (paths relative to the release root)."""
    from release_lib.plan import ReleasePlan
    from release_lib.tarballs import TarballInfo

    infos = []
    for index, manifest in enumerate(manifests):
        tarball = pack(tmp_path / f"p{index}", manifest)
        infos.append(
            TarballInfo(
                package=manifest["name"], layer=0, path=str(tarball.relative_to(tmp_path)), sha256="", distributeable=True
            )
        )
    names = tuple(m["name"] for m in manifests) + ("@miroir-framework/fixture-core",)
    plan = ReleasePlan(
        base_ref="x", bump="exact", product_version=VERSION, lerna_candidates=(), forced=(), disabled=(),
        closure_added=(), selected=names, layers=(names,), distributeable=names,
    )
    return plan, infos


def test_the_release_checks_every_distributeable_tarball(tmp_path: Path, npmjs: None) -> None:
    from release_lib.tarballs import check_release_tarballs

    plan, infos = release_of(tmp_path, [GOOD, {**GOOD, "name": "@miroir-framework/fixture-b", "private": True}])
    with pytest.raises(ReleaseError, match="fixture-b cannot be published: is marked private"):
        check_release_tarballs(tmp_path, plan, infos)
    check_release_tarballs(tmp_path, plan, infos[:1])
