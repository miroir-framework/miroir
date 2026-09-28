"""fill_lockfile_integrity: every registry package of the lockfile gets the hash `npm ci` checks (#326)."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

import pytest

from check_dependency_policy import check_lockfile
from fill_lockfile_integrity import dist_of, main

# Stands in for the registry that `npm view` asks: (tarball URL, integrity) per spec.
REGISTRY = {
    "zod@3.25.76": ("https://registry.npmjs.org/zod/-/zod-3.25.76.tgz", "sha512-zod"),
    "@typescript/typescript6@6.0.3": (
        "https://registry.npmjs.org/@typescript/typescript6/-/typescript6-6.0.3.tgz",
        "sha512-typescript6",
    ),
    "@mui/material@5.18.0": ("https://registry.npmjs.org/@mui/material/-/material-5.18.0.tgz", "sha512-mui"),
}


def registry(spec: str, answers: dict = REGISTRY) -> tuple[str, str]:
    if spec not in answers:
        raise subprocess.CalledProcessError(1, ["npm", "view", spec])
    return answers[spec]


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    """A workspace whose lockfile lacks the hash of an aliased, a hoisted and a nested registry package."""
    (tmp_path / "package.json").write_text(json.dumps({"name": "miroir-framework"}), encoding="utf-8")
    lock = {
        "lockfileVersion": 3,
        "packages": {
            "": {"name": "miroir-framework"},
            "node_modules/typescript": {"name": "@typescript/typescript6", "version": "6.0.3", "dev": True},
            "node_modules/zod": {"version": "3.25.76", "license": "MIT"},
            "node_modules/react": {"version": "18.3.1", "resolved": "https://r/react-18.3.1.tgz", "integrity": "sha512-r"},
            "node_modules/miroir-core": {"resolved": "packages/miroir-core", "link": True},
            "packages/miroir-core": {"name": "miroir-core", "version": "0.5.0"},
            "packages/miroir-core/node_modules/@mui/material": {"version": "5.18.0", "license": "MIT"},
        },
    }
    (tmp_path / "package-lock.json").write_text(json.dumps(lock, indent=2) + "\n", encoding="utf-8")
    return tmp_path


def _lock(repo: Path) -> dict:
    return json.loads((repo / "package-lock.json").read_text(encoding="utf-8"))["packages"]


def test_filled_entries_carry_the_registry_hash_right_after_their_version(repo: Path) -> None:
    assert main([], root=repo, lookup=registry) == 0
    zod = _lock(repo)["node_modules/zod"]
    assert list(zod.items()) == [
        ("version", "3.25.76"),
        ("resolved", REGISTRY["zod@3.25.76"][0]),
        ("integrity", REGISTRY["zod@3.25.76"][1]),
        ("license", "MIT"),
    ]


def test_an_alias_is_looked_up_by_its_package_name(repo: Path) -> None:
    main([], root=repo, lookup=registry)
    assert _lock(repo)["node_modules/typescript"]["integrity"] == "sha512-typescript6"


def test_a_nested_package_is_looked_up_by_its_own_name(repo: Path) -> None:
    main([], root=repo, lookup=registry)
    assert _lock(repo)["packages/miroir-core/node_modules/@mui/material"]["integrity"] == "sha512-mui"


def test_entries_with_a_hash_links_and_workspaces_are_left_alone(repo: Path) -> None:
    before = _lock(repo)
    main([], root=repo, lookup=registry)
    after = _lock(repo)
    for key in ("node_modules/react", "node_modules/miroir-core", "packages/miroir-core"):
        assert after[key] == before[key]


def test_the_filled_lockfile_follows_the_lockfile_rule(repo: Path) -> None:
    main([], root=repo, lookup=registry)
    assert check_lockfile(repo) == []


def test_dry_run_writes_nothing(repo: Path, capsys: pytest.CaptureFixture[str]) -> None:
    before = (repo / "package-lock.json").read_text(encoding="utf-8")
    assert main(["--dry-run"], root=repo, lookup=registry) == 0
    assert (repo / "package-lock.json").read_text(encoding="utf-8") == before
    assert "Would fill the integrity of 3 package(s)" in capsys.readouterr().out


def test_an_unanswered_package_writes_nothing_and_exits_1(repo: Path, capsys: pytest.CaptureFixture[str]) -> None:
    without_zod = {spec: answer for spec, answer in REGISTRY.items() if spec != "zod@3.25.76"}
    before = (repo / "package-lock.json").read_text(encoding="utf-8")
    assert main([], root=repo, lookup=lambda spec: registry(spec, without_zod)) == 1
    assert (repo / "package-lock.json").read_text(encoding="utf-8") == before
    assert "zod@3.25.76" in capsys.readouterr().out



# `npm view <spec> version dist.tarball dist.integrity --json`: an object for one matching version (copied from the
# registry's answer for rxjs@7.8.1), a list of such objects when several published versions match.
RXJS = {
    "version": "7.8.1",
    "dist.tarball": "https://registry.npmjs.org/rxjs/-/rxjs-7.8.1.tgz",
    "dist.integrity": "sha512-AA3TVj+0A2iuIoQkWEK/tqFjBq2j+6PO6Y0zJcvzLAFhEFIO3HL0vls9hWLncZbAAbK0mar7oZ4V079I/qPMxg==",
}
RXJS_BUILD = {
    "version": "7.8.1+build.2",
    "dist.tarball": "https://registry.npmjs.org/rxjs/-/rxjs-7.8.1+build.2.tgz",
    "dist.integrity": "sha512-build",
}


def test_a_single_answer_gives_its_tarball_and_integrity() -> None:
    assert dist_of("rxjs@7.8.1", RXJS) == (RXJS["dist.tarball"], RXJS["dist.integrity"])


def test_a_list_answer_gives_the_exact_version() -> None:
    assert dist_of("rxjs@7.8.1", [RXJS_BUILD, RXJS]) == (RXJS["dist.tarball"], RXJS["dist.integrity"])


def test_a_list_answer_without_the_exact_version_leaves_the_package_unanswered(
    repo: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    def lookup(spec: str) -> tuple[str, str]:
        return dist_of(spec, [RXJS_BUILD]) if spec == "zod@3.25.76" else registry(spec)

    assert main([], root=repo, lookup=lookup) == 1
    assert "zod@3.25.76" in capsys.readouterr().out
