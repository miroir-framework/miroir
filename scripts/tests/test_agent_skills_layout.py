"""Agent skill layout of the real repository (#301)."""

from __future__ import annotations

import json
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
AGENTS_SKILLS = REPO_ROOT / ".agents" / "skills"
CLAUDE_SKILLS = REPO_ROOT / ".claude" / "skills"

MIROIR_OWNED = {
    "miroir-feature-analysis",
    "miroir-analysis-to-tdd-plan",
    "miroir-edit-transformers",
    "miroir-edit-composite-transformers",
    "miroir-edit-queries",
}


def _lock_keys() -> set[str]:
    return set(json.loads((REPO_ROOT / "skills-lock.json").read_text(encoding="utf-8"))["skills"])


def test_miroir_owned_skills_are_in_agents_folder() -> None:
    present = {p.name for p in AGENTS_SKILLS.iterdir() if p.is_dir()}
    assert MIROIR_OWNED <= present


def test_every_locked_skill_has_a_directory() -> None:
    present = {p.name for p in AGENTS_SKILLS.iterdir() if p.is_dir()}
    assert _lock_keys() <= present


def test_claude_folder_has_every_miroir_skill() -> None:
    assert MIROIR_OWNED <= {p.name for p in CLAUDE_SKILLS.iterdir() if p.is_dir()}
