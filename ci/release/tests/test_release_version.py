from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

RELEASE_DIR = Path(__file__).resolve().parents[1]
if str(RELEASE_DIR) not in sys.path:
    sys.path.insert(0, str(RELEASE_DIR))

from release_lib.common import ReleaseError, run
from release_lib.handoff import HANDOFF_SCHEMA_VERSION, write_handoff_contract, write_release_plan
from release_lib.lerna_ops import (
    restore_files,
    rewrite_internal_wildcard_ranges,
    verify_release_ranges,
)
from release_lib.plan import build_plan
from release_lib.semver import increment
from release_lib.workspace import find_cycles, topological_layers, workspace_packages


def write_manifest(path: Path, name: str, version: str, **sections: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload: dict[str, object] = {"name": name, "version": version}
    payload.update(sections)
    path.write_text(json.dumps(payload), encoding="utf-8")


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    write_manifest(tmp_path / "package.json", "root", "1.2.3")
    write_manifest(
        tmp_path / "packages" / "app" / "package.json",
        "app",
        "0.4.0",
        dependencies={"core": "*", "lib": "*"},
        private=False,
    )
    write_manifest(
        tmp_path / "packages" / "lib" / "package.json",
        "lib",
        "0.2.0",
        dependencies={"core": "*"},
        private=False,
    )
    write_manifest(
        tmp_path / "packages" / "core" / "package.json",
        "core",
        "0.3.0",
        private=True,
        scripts={"build": "echo build"},
    )
    write_manifest(
        tmp_path / "packages" / "docs" / "package.json",
        "docs",
        "0.1.0",
        private=False,
    )
    write_published_set(tmp_path, ["lib"])
    return tmp_path


def write_published_set(root: Path, names: list[str]) -> None:
    """#664: scripts/published-packages.json, the set every release packs; here a folder's name is its package's."""
    path = root / "scripts" / "published-packages.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps([{"folder": f"packages/{name}", "publishedName": name} for name in names]),
        encoding="utf-8",
    )


def candidates(names: list[str]):
    def provider(_repo_root: Path, _base_ref: str) -> list[str]:
        return names

    return provider


def test_increment_major_minor_patch() -> None:
    assert increment("1.2.3", "major") == "2.0.0"
    assert increment("1.2.3", "minor") == "1.3.0"
    assert increment("1.2.3", "patch") == "1.2.4"


def test_increment_promotes_patch_prerelease_to_stable() -> None:
    assert increment("1.2.3-rc.1", "patch") == "1.2.3"


def test_plan_layers_runtime_closure(repo: Path) -> None:
    plan = build_plan(
        repo,
        bump="minor",
        since="1.2.2",
        force=[],
        disable=[],
        candidate_provider=candidates(["app"]),
    )

    assert plan.product_version == "1.3.0"
    assert plan.lerna_candidates == ("app",)
    assert plan.closure_added == ("core",)  # lib is in the published set, selected before the closure
    assert plan.selected == ("app", "core", "lib")
    assert plan.layers == (("core",), ("lib",), ("app",))
    # #664: the published set is distributeable, whatever `private` says; app is not in it
    assert plan.distributeable == ("lib",)
    assert plan.bundle_only == ("app", "core")


def test_plan_force_adds_package_and_disable_removes_candidate(repo: Path) -> None:
    plan = build_plan(
        repo,
        bump="patch",
        since="1.2.2",
        force=["docs"],
        disable=["app"],
        candidate_provider=candidates(["app"]),
    )

    assert plan.forced == ("docs",)
    assert plan.disabled == ("app",)
    # #664: lib (published) and its closure ride along with every release
    assert plan.selected == ("core", "docs", "lib")
    assert plan.layers == (("core", "docs"), ("lib",))


def test_a_plan_with_no_change_still_selects_the_whole_published_set(repo: Path) -> None:
    # #664 D2: exact internal pins need every published package at the new version, changed or not
    plan = build_plan(
        repo, bump="patch", since="1.2.2", force=[], disable=[], candidate_provider=candidates([])
    )
    assert plan.selected == ("core", "lib")
    assert plan.closure_added == ("core",)


def test_a_published_package_is_distributeable_even_when_marked_private(repo: Path) -> None:
    # #664 D1: the published set decides, the `private` flag no longer does
    write_manifest(
        repo / "packages" / "lib" / "package.json", "lib", "0.2.0", dependencies={"core": "*"}, private=True
    )
    plan = build_plan(
        repo, bump="patch", since="1.2.2", force=[], disable=[], candidate_provider=candidates([])
    )
    assert plan.distributeable == ("lib",)


def test_a_published_package_cannot_be_disabled(repo: Path) -> None:
    with pytest.raises(ReleaseError, match="published set"):
        build_plan(
            repo, bump="patch", since="1.2.2", force=[], disable=["lib"], candidate_provider=candidates(["lib"])
        )


def test_a_plan_needs_the_published_set(repo: Path) -> None:
    (repo / "scripts" / "published-packages.json").unlink()
    with pytest.raises(ReleaseError, match="published-packages.json"):
        build_plan(
            repo, bump="patch", since="1.2.2", force=[], disable=[], candidate_provider=candidates([])
        )


def test_plan_rejects_disabling_required_dependency(repo: Path) -> None:
    with pytest.raises(ReleaseError, match="required runtime/peer dependency"):
        build_plan(
            repo,
            bump="patch",
            since="1.2.2",
            force=[],
            disable=["core"],
            candidate_provider=candidates(["app", "core"]),
        )


def test_plan_rejects_unknown_or_conflicting_overrides(repo: Path) -> None:
    with pytest.raises(ReleaseError, match="unknown workspace"):
        build_plan(
            repo,
            bump="patch",
            since="1.2.2",
            force=["missing"],
            disable=[],
            candidate_provider=candidates([]),
        )
    with pytest.raises(ReleaseError, match="both forced and disabled"):
        build_plan(
            repo,
            bump="patch",
            since="1.2.2",
            force=["docs"],
            disable=["docs"],
            candidate_provider=candidates([]),
        )


def test_runtime_cycle_aborts_layering(tmp_path: Path) -> None:
    write_manifest(tmp_path / "package.json", "root", "1.0.0")
    write_manifest(
        tmp_path / "packages" / "a" / "package.json",
        "a",
        "1.0.0",
        dependencies={"b": "*"},
    )
    write_manifest(
        tmp_path / "packages" / "b" / "package.json",
        "b",
        "1.0.0",
        dependencies={"a": "*"},
    )
    packages = workspace_packages(tmp_path)
    with pytest.raises(ReleaseError, match="runtime dependency cycle"):
        topological_layers(packages, ["a", "b"])


def test_dev_cycle_is_reported_but_does_not_block_runtime_layers(tmp_path: Path) -> None:
    write_manifest(tmp_path / "package.json", "root", "1.0.0")
    write_manifest(
        tmp_path / "packages" / "a" / "package.json",
        "a",
        "1.0.0",
        dependencies={},
        devDependencies={"b": "*"},
    )
    write_manifest(
        tmp_path / "packages" / "b" / "package.json",
        "b",
        "1.0.0",
        dependencies={"a": "*"},
    )
    packages = workspace_packages(tmp_path)
    assert find_cycles(packages, selected=["a", "b"], runtime_only=True) == []
    assert find_cycles(packages, selected=["a", "b"], runtime_only=False)
    assert topological_layers(packages, ["a", "b"]) == (("a",), ("b",))


def test_restore_files_isolates_failures_and_restores_the_rest(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    # No retry delay: this test asserts isolation/aggregation, not the retry timing.
    import release_lib.lerna_ops as lerna_ops

    monkeypatch.setattr(lerna_ops, "_RESTORE_RETRY_ATTEMPTS", 1)
    monkeypatch.setattr(lerna_ops, "_RESTORE_RETRY_DELAY_SECONDS", 0)

    good = tmp_path / "good.json"
    good.write_text("mutated", encoding="utf-8")
    # A missing parent directory makes the write deterministically fail every attempt,
    # simulating a file a concurrent process (e.g. Lerna/npm) still holds.
    unrestorable = tmp_path / "missing-dir" / "bad.json"
    backups = {good: b"original", unrestorable: b"original"}

    with pytest.raises(ReleaseError, match=r"RESTORE FAILED for 1 of 2"):
        restore_files(backups)

    # The failure on one path must not prevent every other backed-up file from
    # being restored — a single-file glitch must never look like a full restore
    # while silently leaving the rest of the tree mutated.
    assert good.read_bytes() == b"original"


def test_verify_release_ranges_rejects_untouched_wildcards(repo: Path) -> None:
    # Every internal edge in the fixture uses '*', mirroring this monorepo's
    # real convention: `lerna version` never rewrites it (there is no old
    # version number in the string for it to bump), so left alone it fails
    # the "must be concrete before release" check.
    plan = build_plan(
        repo,
        bump="minor",
        since="1.2.2",
        force=[],
        disable=[],
        candidate_provider=candidates(["app"]),
    )
    with pytest.raises(ReleaseError, match="is not releaseable: '\\*'"):
        verify_release_ranges(repo, plan)


def test_rewrite_internal_wildcard_ranges_makes_ranges_releaseable(repo: Path) -> None:
    plan = build_plan(
        repo,
        bump="minor",
        since="1.2.2",
        force=[],
        disable=[],
        candidate_provider=candidates(["app"]),
    )

    rewritten = rewrite_internal_wildcard_ranges(repo, plan)

    assert set(rewritten) == {"app", "lib"}
    app_manifest = json.loads((repo / "packages" / "app" / "package.json").read_text(encoding="utf-8"))
    # Exact versions, never "^1.3.0" (#326): a released package pins the internal packages released with it.
    assert app_manifest["dependencies"] == {"core": "1.3.0", "lib": "1.3.0"}
    lib_manifest = json.loads((repo / "packages" / "lib" / "package.json").read_text(encoding="utf-8"))
    assert lib_manifest["dependencies"] == {"core": "1.3.0"}
    # Nothing to rewrite for 'core' (it has no internal runtime dependencies itself).
    verify_release_ranges(repo, plan)


def test_run_decodes_utf8_child_output_not_locale_codepage(tmp_path: Path) -> None:
    # Regression for the `_readerthread` UnicodeDecodeError seen on Windows:
    # tsup emits UTF-8 output containing characters outside cp1252 (e.g. its
    # "\u26a1\ufe0f Build success" emoji). Without an explicit encoding, a
    # captured pipe falls back to locale.getpreferredencoding() (cp1252 on a
    # non-UTF-8 Windows console), and decoding those bytes crashes subprocess's
    # internal reader thread. That crash is harmless to the child process
    # itself (build still succeeds) but is confusing noise in the CLI output.
    emitter = tmp_path / "emit_utf8.py"
    emitter.write_text(
        "import sys\n"
        "sys.stdout.buffer.write('\\u26a1\\ufe0f ok'.encode('utf-8'))\n",
        encoding="utf-8",
    )
    result = run([sys.executable, str(emitter)], cwd=tmp_path, check=False, announce=False)
    assert result.returncode == 0
    assert result.stdout == "\u26a1\ufe0f ok"


def test_handoff_contract_written(repo: Path) -> None:
    plan = build_plan(
        repo,
        bump="patch",
        since="1.2.2",
        force=[],
        disable=[],
        candidate_provider=candidates(["docs"]),
    )
    plan_path = write_release_plan(repo, plan, tarballs=[])
    handoff = write_handoff_contract(repo, plan, tarballs=[])
    data = json.loads(handoff.read_text(encoding="utf-8"))
    assert data["schemaVersion"] == HANDOFF_SCHEMA_VERSION
    assert data["consumerIssue"] == 224
    assert data["productVersion"] == plan.product_version
    assert Path(data["releasePlan"]) == plan_path


# ---------------------------------------------------------------------------------------------------------------
# #664 D7: an exact product version, so a release candidate (0.5.0-rc.2) can be produced


def test_an_exact_version_is_the_product_version(repo: Path) -> None:
    plan = build_plan(
        repo, version="1.3.0-rc.1", since="1.2.2", force=[], disable=[], candidate_provider=candidates([])
    )
    assert (plan.product_version, plan.bump) == ("1.3.0-rc.1", "exact")


@pytest.mark.parametrize("version, message", [("1.3", "invalid SemVer"), ("1.2.3", "already the current")])
def test_an_exact_version_must_be_valid_and_new(repo: Path, version: str, message: str) -> None:
    with pytest.raises(ReleaseError, match=message):
        build_plan(repo, version=version, since="1.2.2", force=[], disable=[], candidate_provider=candidates([]))


def test_a_plan_takes_a_bump_or_a_version_not_both(repo: Path) -> None:
    with pytest.raises(ReleaseError, match="--bump or --version"):
        build_plan(
            repo, bump="patch", version="1.3.0", since="1.2.2", force=[], disable=[],
            candidate_provider=candidates([]),
        )


def test_the_command_refuses_a_bump_with_a_version() -> None:
    import release_version

    with pytest.raises(SystemExit):
        release_version.parse_args(["--bump", "patch", "--version", "1.3.0"])
    assert release_version.parse_args(["--version", "1.3.0"]).version == "1.3.0"


def test_the_command_refuses_a_version_whose_tag_exists(tmp_path: Path) -> None:
    import release_version

    run(["git", "init", "-q"], cwd=tmp_path)
    run(["git", "-c", "user.email=t@t", "-c", "user.name=t", "commit", "-q", "--allow-empty", "-m", "x"], cwd=tmp_path)
    run(["git", "tag", "1.3.0"], cwd=tmp_path)
    with pytest.raises(ReleaseError, match="tag 1.3.0 already exists"):
        release_version.assert_version_untagged(tmp_path, "1.3.0")
    release_version.assert_version_untagged(tmp_path, "1.3.1")


# ---------------------------------------------------------------------------------------------------------------
# #664 D9: the release commit and where it goes. A real repository, a bare remote, a detached release worktree.


def git(cwd: Path, *args: str) -> str:
    return run(["git", "-c", "user.email=t@t", "-c", "user.name=t", *args], cwd=cwd).stdout.strip()


@pytest.fixture
def release_worktree(tmp_path: Path) -> tuple[Path, Path]:
    remote = tmp_path / "remote.git"
    run(["git", "init", "-q", "--bare", str(remote)], cwd=tmp_path)
    source = tmp_path / "source"
    source.mkdir()
    git(source, "init", "-q")
    write_manifest(source / "package.json", "root", "1.2.3")
    write_manifest(source / "packages" / "lib" / "package.json", "lib", "1.2.3")
    git(source, "add", "-A")
    git(source, "commit", "-q", "-m", "init")
    git(source, "tag", "unrelated")
    git(source, "remote", "add", "origin", str(remote))
    git(source, "push", "-q", "origin", "HEAD:refs/heads/main")
    worktree = tmp_path / "worktree"
    git(source, "worktree", "add", "-q", "--detach", str(worktree), "HEAD")
    write_manifest(worktree / "package.json", "root", "1.3.0")
    (worktree / "release-plan.json").write_text("{}", encoding="utf-8")
    (worktree / "release-tarballs" / "P0").mkdir(parents=True)
    (worktree / "release-tarballs" / "P0" / "lib-1.3.0.tgz").write_bytes(b"tarball")
    (worktree / "publish-commands.sh").write_text("npm publish\n", encoding="utf-8")
    return worktree, remote


def release_plan_for(version: str):
    from release_lib.plan import ReleasePlan

    return ReleasePlan(
        base_ref="x", bump="exact", product_version=version, lerna_candidates=(), forced=(), disabled=(),
        closure_added=(), selected=("lib",), layers=(("lib",),),
    )


def test_the_release_commit_holds_no_tarball(release_worktree) -> None:
    from release_lib.lerna_ops import commit_and_tag

    worktree, _ = release_worktree
    commit_and_tag(worktree, release_plan_for("1.3.0"), commit=True, tag=True)
    files = git(worktree, "show", "--name-only", "--format=", "HEAD").splitlines()
    assert sorted(files) == ["package.json", "release-plan.json"]


def test_record_pushes_only_the_release_tag_and_its_branch(release_worktree) -> None:
    from release_lib.lerna_ops import commit_and_tag, push_release

    worktree, remote = release_worktree
    commit_and_tag(worktree, release_plan_for("1.3.0"), commit=True, tag=True)
    push_release(worktree, "1.3.0")
    head = git(worktree, "rev-parse", "HEAD")
    refs = {ref: sha for ref, sha in (line.split(" ")[::-1] for line in git(remote, "show-ref").splitlines())}
    assert refs["refs/heads/release/1.3.0"] == head
    assert git(remote, "rev-list", "-n", "1", "refs/tags/1.3.0") == head
    assert "refs/tags/unrelated" not in refs


def test_record_refuses_a_release_already_pushed(release_worktree) -> None:
    from release_lib.lerna_ops import commit_and_tag, push_release

    worktree, _ = release_worktree
    commit_and_tag(worktree, release_plan_for("1.3.0"), commit=True, tag=True)
    push_release(worktree, "1.3.0")
    with pytest.raises(ReleaseError, match="already has release/1.3.0"):
        push_release(worktree, "1.3.0")


def test_record_refuses_an_untagged_worktree(release_worktree) -> None:
    from release_lib.lerna_ops import push_release

    worktree, _ = release_worktree
    with pytest.raises(ReleaseError, match="tag 1.3.0 is missing"):
        push_release(worktree, "1.3.0")


def test_the_command_refuses_push_and_names_record() -> None:
    import release_version

    assert release_version.main(["--version", "9.9.9", "--push"]) == 1


def test_a_folder_bundled_into_a_published_package_is_built_before_it(repo: Path) -> None:
    # #664: react resolves the local caches it bundles (#652, #656) through their dist/, so they build first
    write_manifest(repo / "packages" / "inner" / "package.json", "inner", "0.2.0", dependencies={"core": "*"},
                   private=True)
    (repo / "scripts" / "published-packages.json").write_text(
        json.dumps([
            {"folder": "packages/lib", "publishedName": "lib"},
            {"folder": "packages/inner", "publishedName": "lib"},
        ]),
        encoding="utf-8",
    )
    plan = build_plan(repo, bump="patch", since="1.2.2", force=[], disable=[], candidate_provider=candidates([]))
    assert plan.layers == (("core",), ("inner",), ("lib",))
    assert (plan.distributeable, plan.bundle_only) == (("lib",), ("core", "inner"))
