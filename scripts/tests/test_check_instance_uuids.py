"""#509: the instance-uuid guard reports two instances of one Entity folder that share a uuid.

The first tests build a throwaway git repository with the monorepo's asset layout and run the real
script against it. The last one runs it on this repository, so `pytest scripts/tests` (pre-push gate
and pr-checks.yml) fails when a duplicate is committed.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "check_instance_uuids.py"

ENTITY_FOLDER = "16dbfe28-e1d7-4f20-9ba4-c1a9873202ad"
BOOK = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
AUTHOR = "d7a144ff-d1b9-4135-800c-a7cfc1f38733"
TABLES = "35961086-f932-477a-aa77-ac8360ffbf61"
SHARED = "11111111-2222-4333-8444-555555555555"


def _git(repo: Path, *args: str) -> None:
    subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True)


def _write(repo: Path, relative: str, content: object) -> None:
    path = repo / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(content), encoding="utf-8")


def _commit(repo: Path) -> None:
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "assets")


def _guard(repo: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), "--repo", str(repo)],
        capture_output=True,
        text=True,
    )


@pytest.fixture()
def repo(tmp_path: Path) -> Path:
    _git(tmp_path, "init", "-q")
    _git(tmp_path, "config", "user.email", "guard@example.com")
    _git(tmp_path, "config", "user.name", "guard")
    _write(tmp_path, f"packages/app/assets/app_data/{BOOK}/a.json", {"uuid": "a"})
    _commit(tmp_path)
    return tmp_path


def test_unique_uuids_pass(repo: Path) -> None:
    result = _guard(repo)
    assert result.returncode == 0, result.stdout + result.stderr


def test_two_instances_of_one_entity_sharing_a_uuid_are_reported(repo: Path) -> None:
    _write(repo, f"packages/app/assets/app_data/{BOOK}/{SHARED}.json", {"uuid": SHARED, "name": "first"})
    _write(repo, f"packages/app/assets/app_data/{BOOK}/other.json", {"uuid": SHARED, "name": "second"})
    _commit(repo)

    result = _guard(repo)

    assert result.returncode == 1
    assert SHARED in result.stdout
    assert f"packages/app/assets/app_data/{BOOK}/{SHARED}.json" in result.stdout
    assert f"packages/app/assets/app_data/{BOOK}/other.json" in result.stdout


def test_one_uuid_in_two_entity_folders_passes(repo: Path) -> None:
    _write(repo, f"packages/app/assets/app_data/{BOOK}/b.json", {"uuid": SHARED})
    _write(repo, f"packages/app/assets/app_data/{AUTHOR}/b.json", {"uuid": SHARED})
    _commit(repo)

    result = _guard(repo)

    assert result.returncode == 0, result.stdout


def test_entity_with_another_primary_key_is_skipped(repo: Path) -> None:
    _write(
        repo,
        f"packages/app/assets/app_model/{ENTITY_FOLDER}/{TABLES}.json",
        {"uuid": TABLES, "name": "tables", "idAttribute": ["table_schema", "table_name"]},
    )
    _write(repo, f"packages/app/assets/app_data/{TABLES}/1.json", {"uuid": SHARED, "table_name": "a"})
    _write(repo, f"packages/app/assets/app_data/{TABLES}/2.json", {"uuid": SHARED, "table_name": "b"})
    _commit(repo)

    result = _guard(repo)

    assert result.returncode == 0, result.stdout


def test_untracked_files_are_ignored(repo: Path) -> None:
    _write(repo, f"packages/app/assets/app_data/{BOOK}/untracked.json", {"uuid": "a"})

    result = _guard(repo)

    assert result.returncode == 0, result.stdout


def test_json_without_a_uuid_is_ignored(repo: Path) -> None:
    _write(repo, f"packages/app/assets/app_data/{BOOK}/list-1.json", [{"uuid": "a"}])
    _write(repo, f"packages/app/assets/app_data/{BOOK}/list-2.json", [{"uuid": "a"}])
    _write(repo, f"packages/app/assets/app_data/{BOOK}/no-uuid-1.json", {"name": "a"})
    _write(repo, f"packages/app/assets/app_data/{BOOK}/no-uuid-2.json", {"name": "a"})
    _commit(repo)

    result = _guard(repo)

    assert result.returncode == 0, result.stdout


def test_invalid_json_is_reported(repo: Path) -> None:
    (repo / f"packages/app/assets/app_data/{BOOK}/broken.json").write_text("{", encoding="utf-8")
    _commit(repo)

    result = _guard(repo)

    assert result.returncode == 1
    assert f"packages/app/assets/app_data/{BOOK}/broken.json" in result.stdout


def test_one_entity_folder_in_two_packages_is_checked_per_package(repo: Path) -> None:
    _write(repo, f"packages/app/assets/app_data/{AUTHOR}/c.json", {"uuid": SHARED})
    _write(repo, f"packages/other/assets/other_data/{AUTHOR}/c.json", {"uuid": SHARED})
    _commit(repo)

    result = _guard(repo)

    assert result.returncode == 0, result.stdout


def test_another_package_declaring_a_composite_key_does_not_skip_this_package(repo: Path) -> None:
    _write(
        repo,
        f"packages/app/assets/app_model/{ENTITY_FOLDER}/{TABLES}.json",
        {"uuid": TABLES, "name": "tables"},
    )
    _write(
        repo,
        f"packages/other/assets/other_model/{ENTITY_FOLDER}/{TABLES}.json",
        {"uuid": TABLES, "name": "tables", "idAttribute": ["table_name"]},
    )
    _write(repo, f"packages/app/assets/app_data/{TABLES}/1.json", {"uuid": SHARED})
    _write(repo, f"packages/app/assets/app_data/{TABLES}/2.json", {"uuid": SHARED})
    _commit(repo)

    result = _guard(repo)

    assert result.returncode == 1
    assert SHARED in result.stdout


def test_tracked_file_deleted_in_the_working_tree_is_skipped(repo: Path) -> None:
    _write(repo, f"packages/app/assets/app_data/{BOOK}/gone.json", {"uuid": "a"})
    _commit(repo)
    (repo / f"packages/app/assets/app_data/{BOOK}/gone.json").unlink()

    result = _guard(repo)

    assert result.returncode == 0, result.stdout


def test_repository_has_no_duplicate_instance_uuids() -> None:
    result = _guard(ROOT)
    assert result.returncode == 0, result.stdout + result.stderr
