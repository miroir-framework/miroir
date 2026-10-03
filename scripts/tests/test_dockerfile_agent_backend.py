"""#409 Slice 6: the Docker image keeps only the agent SDK picked with the AGENT_BACKEND build
argument (default none).

The removal step of the Dockerfile runs here with sh on a fake node_modules tree; Docker builds
themselves are not run in CI or in cloud sessions.
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
DOCKERFILE = ROOT / "Dockerfile"

CURSOR_DIRS = ["node_modules/@cursor/sdk", "node_modules/@cursor/sdk-linux-x64-musl"]
CLAUDE_DIRS = [
    "node_modules/@anthropic-ai/claude-agent-sdk",
    "node_modules/@anthropic-ai/claude-agent-sdk-linux-x64-musl",
    "packages/miroir-ai/node_modules/@anthropic-ai/claude-agent-sdk",
]
KEPT_DIRS = ["node_modules/@anthropic-ai/sdk", "packages/miroir-ai/node_modules/zod", "node_modules/express"]


def _instructions() -> list[str]:
    """Dockerfile instructions of the builder stage, continuation lines joined."""
    text = re.sub(r"\\\n", " ", DOCKERFILE.read_text(encoding="utf-8"))
    lines = [line.strip() for line in text.splitlines()]
    instructions = [line for line in lines if line and not line.startswith("#")]
    final_stage = next(i for i, line in enumerate(instructions) if line.startswith("FROM") and i > 0)
    return instructions[:final_stage]


def _removal_step() -> str:
    steps = [line for line in _instructions() if line.startswith("RUN") and "AGENT_BACKEND" in line]
    assert len(steps) == 1, steps
    return steps[0][len("RUN") :].strip()


def test_agent_backend_build_argument_defaults_to_none():
    assert "ARG AGENT_BACKEND=none" in _instructions()


def test_removal_step_runs_after_the_prune():
    instructions = _instructions()
    prune = next(i for i, line in enumerate(instructions) if "npm prune --omit=dev" in line)
    removal = next(i for i, line in enumerate(instructions) if line.startswith("RUN") and "AGENT_BACKEND" in line)
    argument = instructions.index("ARG AGENT_BACKEND=none")
    assert argument < removal and prune < removal


pytestmark = pytest.mark.skipif(shutil.which("sh") is None, reason="needs a POSIX shell")


def _run_removal(tmp_path: Path, backend: str) -> subprocess.CompletedProcess:
    for directory in CURSOR_DIRS + CLAUDE_DIRS + KEPT_DIRS:
        (tmp_path / directory).mkdir(parents=True)
    return subprocess.run(
        ["sh", "-c", _removal_step()],
        cwd=tmp_path,
        env={**os.environ, "AGENT_BACKEND": backend},
        capture_output=True,
        text=True,
    )


def _present(tmp_path: Path, directories: list[str]) -> list[str]:
    return [directory for directory in directories if (tmp_path / directory).exists()]


@pytest.mark.parametrize(
    ("backend", "kept_sdk_dirs"),
    [("none", []), ("cursor", CURSOR_DIRS), ("claude", CLAUDE_DIRS)],
)
def test_only_the_picked_sdk_is_kept(tmp_path: Path, backend: str, kept_sdk_dirs: list[str]):
    result = _run_removal(tmp_path, backend)
    assert result.returncode == 0, result.stderr
    assert _present(tmp_path, CURSOR_DIRS + CLAUDE_DIRS) == kept_sdk_dirs
    assert _present(tmp_path, KEPT_DIRS) == KEPT_DIRS


def test_an_unknown_backend_fails_the_build(tmp_path: Path):
    result = _run_removal(tmp_path, "gemini")
    assert result.returncode != 0
    assert "AGENT_BACKEND" in result.stderr
