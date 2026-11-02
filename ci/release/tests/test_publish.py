"""#664 tracer: a release's handoff, published layer by layer by ci/release/publish.py.

Real `npm pack` tarballs, the real `npm publish` and `npm view`, against a local registry (local_registry.py)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

RELEASE_DIR = Path(__file__).resolve().parents[1]
TESTS_DIR = Path(__file__).resolve().parent
for entry in (RELEASE_DIR, TESTS_DIR):
    if str(entry) not in sys.path:
        sys.path.insert(0, str(entry))

from local_registry import local_registry
from release_lib.common import ReleaseError, executable, run
from release_lib.handoff import read_handoff, write_handoff_contract
from release_lib.plan import ReleasePlan
from release_lib.publish import published_integrity
from release_lib.tarballs import TarballInfo, sha256_file

VERSION = "2.0.0-rc.1"
CORE = "@miroir-framework/fixture-core"
STORE = "@miroir-framework/fixture-store"


def pack_into(release: Path, layer: int, name: str, *, content: str = "1", **manifest: object) -> TarballInfo:
    source = release.parent / "sources" / name.split("/")[1]
    source.mkdir(parents=True, exist_ok=True)
    (source / "package.json").write_text(
        json.dumps({"name": name, "version": VERSION, "publishConfig": {"access": "public"}, **manifest}),
        encoding="utf-8",
    )
    (source / "index.js").write_text(f"export const value = {content};\n", encoding="utf-8")
    out = release / "release-tarballs" / f"P{layer}"
    out.mkdir(parents=True, exist_ok=True)
    result = run([executable("npm"), "pack", "--json", "--pack-destination", str(out)], cwd=source)
    tarball = out / json.loads(result.stdout[result.stdout.find("[") :])[0]["filename"]
    return TarballInfo(
        package=name, layer=layer, path=tarball.relative_to(release).as_posix(), sha256=sha256_file(tarball),
        distributeable=True,
    )


def release_with(release: Path, infos: list[TarballInfo]) -> dict:
    layers = tuple(tuple(i.package for i in infos if i.layer == n) for n in sorted({i.layer for i in infos}))
    names = tuple(sorted(i.package for i in infos))
    plan = ReleasePlan(
        base_ref="x", bump="exact", product_version=VERSION, lerna_candidates=(), forced=(), disabled=(),
        closure_added=(), selected=names, layers=layers, distributeable=names,
    )
    return read_handoff(write_handoff_contract(release, plan, tarballs=infos))


@pytest.fixture
def registry(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    with local_registry() as (url, store):
        npmrc = tmp_path / ".npmrc"
        npmrc.write_text(f"//{url.split('//', 1)[1]}:_authToken=test-token\n", encoding="utf-8")
        monkeypatch.setenv("NPM_CONFIG_USERCONFIG", str(npmrc))
        yield url, store


@pytest.fixture
def release(tmp_path: Path) -> tuple[Path, dict]:
    root = tmp_path / "worktree"
    root.mkdir()
    # listed store first: the order comes from the layers, not from the tarball list
    infos = [
        pack_into(root, 1, STORE, dependencies={CORE: VERSION}),
        pack_into(root, 0, CORE),
    ]
    return root, release_with(root, infos)


def publish(handoff_path: Path, *args: str) -> int:
    import publish as publish_command

    return publish_command.main(["--handoff", str(handoff_path), *args])


def test_the_handoff_lists_the_publish_commands_in_layer_order(release: tuple[Path, dict]) -> None:
    root, handoff = release
    assert [(e["layer"], e["package"], e["tag"]) for e in handoff["publish"]] == [(0, CORE, "next"), (1, STORE, "next")]
    script = (root / "publish-commands.sh").read_text(encoding="utf-8")
    commands = [line for line in script.splitlines() if line.startswith("npm publish")]
    assert commands == [e["command"] for e in handoff["publish"]]
    assert all("--provenance" not in c and "--dry-run" not in c for c in commands)


def test_without_yes_nothing_is_published(registry, release) -> None:
    url, store = registry
    root, _ = release
    assert publish(root / "release-handoff.json", "--registry", url) == 0
    assert store.publish_order == []


def test_with_yes_every_package_is_published_dependencies_first(registry, release) -> None:
    url, store = registry
    root, _ = release
    assert publish(root / "release-handoff.json", "--registry", url, "--yes") == 0
    assert store.publish_order == [f"{CORE}@{VERSION}", f"{STORE}@{VERSION}"]
    assert store.packuments[CORE]["dist-tags"] == {"next": VERSION}


def test_a_rerun_skips_what_this_release_already_published(registry, release, capsys) -> None:
    url, store = registry
    root, handoff = release
    # a partial publish: the first layer went out, then the run stopped
    run([executable("npm"), "publish", handoff["publish"][0]["tarball"], "--access", "public", "--tag", "next",
         "--registry", url], cwd=root)
    assert publish(root / "release-handoff.json", "--registry", url, "--yes") == 0
    assert store.publish_order == [f"{CORE}@{VERSION}", f"{STORE}@{VERSION}"]
    states = {o["package"]: o["state"] for o in json.loads(capsys.readouterr().out)}
    assert states == {CORE: "already published", STORE: "published"}


def test_other_content_at_the_same_version_stops_before_publishing(registry, release, tmp_path: Path) -> None:
    url, store = registry
    root, _ = release
    other = tmp_path / "other"
    other.mkdir()
    rebuilt = pack_into(other, 0, CORE, content="2")
    run([executable("npm"), "publish", rebuilt.path, "--access", "public", "--tag", "next", "--registry", url], cwd=other)
    assert publish(root / "release-handoff.json", "--registry", url, "--yes") == 1
    assert store.publish_order == [f"{CORE}@{VERSION}"]


def test_the_registry_reports_the_integrity_of_what_was_published(registry, release) -> None:
    url, _ = registry
    root, handoff = release
    assert published_integrity(CORE, VERSION, registry=url) is None
    assert publish(root / "release-handoff.json", "--registry", url, "--yes") == 0
    assert published_integrity(CORE, VERSION, registry=url).startswith("sha512-")


def test_a_handoff_without_publish_entries_is_refused(tmp_path: Path) -> None:
    from release_lib.publish import publish_handoff

    with pytest.raises(ReleaseError, match="nothing to publish"):
        publish_handoff({"releaseWorktree": str(tmp_path), "productVersion": VERSION}, execute=False)


def test_verify_refuses_a_tarball_changed_after_packing(release) -> None:
    import release_version

    root, handoff = release
    (root / "release-plan.json").write_text("{}", encoding="utf-8")
    release_version.verify_handoff(root / "release-handoff.json")
    (root / handoff["publish"][0]["tarball"]).write_bytes(b"tampered")
    with pytest.raises(ReleaseError, match="changed since it was packed"):
        release_version.verify_handoff(root / "release-handoff.json")


def test_a_tarball_changed_after_packing_stops_the_run_before_any_publish(registry, release) -> None:
    url, store = registry
    root, handoff = release
    # the last layer's tarball repacked: the first layer must not go out either
    store_entry = handoff["publish"][1]
    rebuilt = pack_into(root.parent / "other", 1, STORE, content="2", dependencies={CORE: VERSION})
    (root / store_entry["tarball"]).write_bytes((root.parent / "other" / rebuilt.path).read_bytes())
    assert publish(root / "release-handoff.json", "--registry", url, "--yes") == 1
    assert store.publish_order == []
