"""#321 Slice 0: the tracked-assets guard reports asset files a run changed.

Each test builds a throwaway git repository with the monorepo's asset layout and runs the real
script against it, so the guard is proven on git's own view of the working tree.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "tracked_assets_guard.py"


def _git(repo: Path, *args: str) -> None:
    subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True)


def _write(repo: Path, relative: str, content: str) -> None:
    path = repo / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def _guard(repo: Path, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(SCRIPT), "--repo", str(repo), *args],
        capture_output=True,
        text=True,
    )


@pytest.fixture()
def repo(tmp_path: Path) -> Path:
    _git(tmp_path, "init", "-q")
    _git(tmp_path, "config", "user.email", "guard@example.com")
    _git(tmp_path, "config", "user.name", "guard")
    _write(tmp_path, "packages/app-admin/assets/admin_data/d/1.json", "{}")
    _write(tmp_path, "packages/standalone/tests/assets/admin_data/d/2.json", "{}")
    _write(tmp_path, "packages/standalone/src/index.ts", "export {};")
    _write(tmp_path, ".gitignore", "packages/standalone/tests/tmp/\n")
    _git(tmp_path, "add", "-A")
    _git(tmp_path, "commit", "-q", "-m", "init")
    return tmp_path


def test_clean_checkout_passes(repo: Path) -> None:
    result = _guard(repo, "check")
    assert result.returncode == 0, result.stdout + result.stderr


def test_modified_package_asset_is_reported(repo: Path) -> None:
    _write(repo, "packages/app-admin/assets/admin_data/d/1.json", '{"changed": true}')
    result = _guard(repo, "check", "--json")
    assert result.returncode == 1
    assert json.loads(result.stdout)["changed"] == ["packages/app-admin/assets/admin_data/d/1.json"]


def test_file_added_to_test_assets_is_reported(repo: Path) -> None:
    _write(repo, "packages/standalone/tests/assets/admin_data/d/3.json", "{}")
    result = _guard(repo, "check", "--json")
    assert result.returncode == 1
    assert json.loads(result.stdout)["changed"] == ["packages/standalone/tests/assets/admin_data/d/3.json"]


def test_deleted_asset_is_reported(repo: Path) -> None:
    (repo / "packages/app-admin/assets/admin_data/d/1.json").unlink()
    result = _guard(repo, "check", "--json")
    assert result.returncode == 1
    assert json.loads(result.stdout)["changed"] == ["packages/app-admin/assets/admin_data/d/1.json"]


def test_changes_outside_asset_folders_are_ignored(repo: Path) -> None:
    _write(repo, "packages/standalone/src/index.ts", "export const x = 1;")
    _write(repo, "packages/standalone/tests/tmp/store/4.json", "{}")
    result = _guard(repo, "check")
    assert result.returncode == 0, result.stdout


def test_snapshot_ignores_edits_made_before_the_run(repo: Path, tmp_path_factory: pytest.TempPathFactory) -> None:
    _write(repo, "packages/app-admin/assets/admin_data/d/1.json", '{"edited by the developer": true}')
    snapshot = tmp_path_factory.mktemp("snap") / "snapshot.json"
    assert _guard(repo, "snapshot", "--output", str(snapshot)).returncode == 0

    assert _guard(repo, "check", "--since", str(snapshot)).returncode == 0

    _write(repo, "packages/standalone/tests/assets/admin_data/d/2.json", '{"written by a test": true}')
    result = _guard(repo, "check", "--since", str(snapshot), "--json")
    assert result.returncode == 1
    assert json.loads(result.stdout)["changed"] == ["packages/standalone/tests/assets/admin_data/d/2.json"]


def test_pre_existing_edit_changed_again_during_the_run_is_reported(
    repo: Path, tmp_path_factory: pytest.TempPathFactory
) -> None:
    _write(repo, "packages/app-admin/assets/admin_data/d/1.json", '{"edit": 1}')
    snapshot = tmp_path_factory.mktemp("snap") / "snapshot.json"
    _guard(repo, "snapshot", "--output", str(snapshot))
    _write(repo, "packages/app-admin/assets/admin_data/d/1.json", '{"edit": 2}')
    result = _guard(repo, "check", "--since", str(snapshot), "--json")
    assert result.returncode == 1
    assert json.loads(result.stdout)["changed"] == ["packages/app-admin/assets/admin_data/d/1.json"]


def test_check_since_a_missing_snapshot_checks_changes_since_head(repo: Path, tmp_path_factory: pytest.TempPathFactory) -> None:
    """#321 Slice 11: `run-nonreg.py --only` may run the final check without the first step's snapshot."""
    missing = tmp_path_factory.mktemp("snap") / "absent.json"
    _write(repo, "packages/app/assets/app_data/row.json", '{"changed": true}')

    result = _guard(repo, "check", "--since", str(missing))

    assert result.returncode == 1
    assert "no snapshot" in result.stdout
    assert "packages/app/assets/app_data/row.json" in result.stdout
