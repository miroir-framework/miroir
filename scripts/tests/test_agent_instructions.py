"""Agent instruction files (#301): AGENTS.md stays short, accurate and shared."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
AGENTS_MD = REPO_ROOT / "AGENTS.md"
MAX_AGENTS_MD_BYTES = 12 * 1024

# Backticked repo-relative paths, e.g. `packages/miroir-core/src/index.ts` or `docs/`.
REPO_PATH = re.compile(r"`((?:packages|docs|scripts|code-helpers|\.github|\.agents|\.claude)/[^`\s]*)`")
PLACEHOLDER = re.compile(r"[<>{}*]|\.\.\.")


def test_agents_md_is_short() -> None:
    assert AGENTS_MD.stat().st_size <= MAX_AGENTS_MD_BYTES


def test_agents_md_repo_paths_exist() -> None:
    text = AGENTS_MD.read_text(encoding="utf-8")
    missing = [
        p
        for p in REPO_PATH.findall(text)
        if not PLACEHOLDER.search(p) and not (REPO_ROOT / p).exists()
    ]
    assert missing == []


def test_other_agent_entry_points_include_agents_md() -> None:
    for entry in ("CLAUDE.md", ".github/copilot-instructions.md"):
        lines = (REPO_ROOT / entry).read_text(encoding="utf-8").splitlines()
        assert "@AGENTS.md" in lines, entry


def test_graphify_guidance_is_conditional() -> None:
    for line in AGENTS_MD.read_text(encoding="utf-8").splitlines():
        if "graphify query" in line:
            assert "when `graphify-out/graph.json` exists" in line
