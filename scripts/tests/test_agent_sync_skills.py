"""sync_agent_skills: .agents/skills -> .claude/skills copies (#301)."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

from sync_agent_skills import check, sync, tracked_skill_names

SCRIPT = Path(__file__).resolve().parents[1] / "sync_agent_skills.py"


def _skill(root: Path, name: str, body: str = "body") -> Path:
    d = root / ".agents" / "skills" / name
    d.mkdir(parents=True)
    (d / "SKILL.md").write_text(f"---\nname: {name}\n---\n{body}\n", encoding="utf-8")
    return d


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    (tmp_path / "skills-lock.json").write_text(
        json.dumps({"version": 1, "skills": {"tdd": {"source": "x"}}}), encoding="utf-8"
    )
    _skill(tmp_path, "miroir-edit-queries")
    (tmp_path / ".agents/skills/miroir-edit-queries/examples.md").write_text("ex", encoding="utf-8")
    _skill(tmp_path, "tdd")
    _skill(tmp_path, "personal-install")
    return tmp_path


def test_tracked_skills_are_miroir_prefixed_and_locked(repo: Path) -> None:
    assert tracked_skill_names(repo) == ["miroir-edit-queries", "tdd"]


def test_sync_copies_tracked_skills_byte_identically(repo: Path) -> None:
    sync(repo)
    copied = repo / ".claude/skills/miroir-edit-queries"
    assert (copied / "examples.md").read_text(encoding="utf-8") == "ex"
    assert (repo / ".claude/skills/tdd/SKILL.md").exists()
    assert check(repo) == []


def test_sync_ignores_untracked_personal_installs(repo: Path) -> None:
    sync(repo)
    assert not (repo / ".claude/skills/personal-install").exists()


def test_sync_removes_copies_no_longer_tracked(repo: Path) -> None:
    stale = repo / ".claude/skills/miroir-old"
    stale.mkdir(parents=True)
    (stale / "SKILL.md").write_text("old", encoding="utf-8")
    sync(repo)
    assert not stale.exists()


def test_sync_keeps_personal_installs_in_claude_folder(repo: Path) -> None:
    mine = repo / ".claude/skills/my-own"
    mine.mkdir(parents=True)
    sync(repo)
    assert mine.exists()


def test_check_reports_drifting_skill(repo: Path) -> None:
    sync(repo)
    (repo / ".claude/skills/tdd/SKILL.md").write_text("edited in the copy", encoding="utf-8")
    assert check(repo) == ["tdd"]


def test_check_reports_missing_copy(repo: Path) -> None:
    assert check(repo) == ["miroir-edit-queries", "tdd"]


def test_cli_check_exits_non_zero_on_drift(repo: Path) -> None:
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--check", "--root", str(repo)],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 1
    assert "miroir-edit-queries" in result.stdout
