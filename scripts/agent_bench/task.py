"""Task prompts of the agent cost benchmark (#550).

A task file holds the feature description, the same for every arm, then one `## Contract` section per group of
arms, each introduced by a `<!-- contract: arm, arm -->` marker. The prompt sent to an arm is the description
followed by that arm's contract only.
"""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

BENCH_DIR = Path(__file__).resolve().parent
TASKS_DIR = BENCH_DIR / "tasks"
ARMS_DIR = BENCH_DIR / "arms"

ARMS = ("miroir-mcp", "miroir-files", "conventional")
FEATURES = ("overdue-loans", "lending-limit")

_MARKER = re.compile(r"^<!-- contract: (?P<arms>[a-z\-, ]+) -->\s*$", re.MULTILINE)


def _split(text: str) -> tuple[str, dict[str, str]]:
    markers = list(_MARKER.finditer(text))
    if not markers:
        raise ValueError("task file has no contract marker")
    description = text[: markers[0].start()].rstrip() + "\n"
    contracts: dict[str, str] = {}
    for index, marker in enumerate(markers):
        end = markers[index + 1].start() if index + 1 < len(markers) else len(text)
        body = text[marker.end() : end].strip()
        for arm in (name.strip() for name in marker.group("arms").split(",")):
            contracts[arm] = body
    return description, contracts


def task_prompt(feature: str, arm: str) -> str:
    description, contracts = _split((TASKS_DIR / f"{feature}.md").read_text(encoding="utf-8"))
    if arm not in contracts:
        raise ValueError(f"task {feature} has no contract for arm {arm}")
    contract = contracts[arm]
    return description if not contract else f"{description}\n{contract}\n"


def task_description(feature: str) -> str:
    return _split((TASKS_DIR / f"{feature}.md").read_text(encoding="utf-8"))[0]


def agents_md(arm: str) -> str:
    return (ARMS_DIR / arm / "AGENTS.md").read_text(encoding="utf-8")


def task_hash(feature: str, arm: str) -> str:
    """Identifies what the agent was given: a prompt or AGENTS.md change makes runs incomparable."""
    digest = hashlib.sha256()
    digest.update(task_prompt(feature, arm).encode("utf-8"))
    digest.update(agents_md(arm).encode("utf-8"))
    return digest.hexdigest()[:16]
