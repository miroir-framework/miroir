"""Batch and workspace robustness of the agent cost benchmark (#550)."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agent_bench import batch  # noqa: E402
from agent_bench.acceptance import adapter_conventional  # noqa: E402


def test_a_batch_starts_in_a_runs_folder_that_does_not_exist_yet(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(batch.subprocess, "run", lambda *args, **kwargs: subprocess.CompletedProcess(args, 0))
    runs_dir = tmp_path / "new" / "runs"

    assert batch.main(["--runs-dir", str(runs_dir)]) == 0

    assert runs_dir.is_dir()
    assert "no run.json" in capsys.readouterr().out


def test_a_run_without_a_result_still_gets_its_line():
    line = batch.run_line(
        {"runId": "r", "stopReason": "no_result", "acceptance": {"passed": 0, "total": 6}, "valid": True}
    )
    assert line == "r: no cost, ? turns, stop no_result, acceptance 0/6, valid True"


def test_the_app_is_copied_when_node_modules_cannot_be_hard_linked(tmp_path, monkeypatch):
    source = tmp_path / "app"
    (source / "node_modules" / "pkg").mkdir(parents=True)
    (source / "node_modules" / "pkg" / "index.js").write_text("module")
    (source / "prisma" / "library-data").mkdir(parents=True)
    (source / "package.json").write_text("{}")
    monkeypatch.setattr(
        adapter_conventional.subprocess, "run", lambda *args, **kwargs: subprocess.CompletedProcess(args, 1)
    )
    target = tmp_path / "copy"

    adapter_conventional.copy_app(source, target)

    assert (target / "node_modules" / "pkg" / "index.js").read_text() == "module"
    assert (target / "package.json").exists()
