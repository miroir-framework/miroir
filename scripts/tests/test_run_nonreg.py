"""#318 Slice 0: characterize the legacy contract of scripts/run-nonreg.py.

The real script runs against a small temporary manifest whose steps are `python -c` stubs,
so later slices (--timings, --runner shared) can prove the default run is unchanged.
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "run-nonreg.py"

ECHO_ARGV = "import json, sys; print('ARGV=' + json.dumps(sys.argv[1:]))"

LEGACY_STEP_FIELDS = {
    "id",
    "title",
    "tier",
    "requires",
    "status",
    "exit_code",
    "duration_s",
    "skip_reason",
    "argv",
    "log_file",
    "vitest",
    "error_tail",
}

LEGACY_SUMMARY_KEYS = {
    "stamp",
    "tier",
    "mode",
    "profile",
    "started_at",
    "finished_at",
    "duration_s",
    "manifest",
    "git",
    "counts",
    "steps",
    "snapshot_dir",
    "summary_json",
    "summary_md",
}


def write_manifest(tmp_path: Path, steps: list[dict]) -> Path:
    manifest = {
        "version": 1,
        "defaultProfile": "emulatedServer-sql",
        "profiles": ["emulatedServer-sql", "emulatedServer-filesystem"],
        "steps": steps,
    }
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps(manifest), encoding="utf-8")
    return path


def run_nonreg(tmp_path: Path, manifest: Path, *extra: str) -> tuple[int, dict, Path]:
    results_root = tmp_path / "results"
    proc = subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
            "--manifest",
            str(manifest),
            "--results-root",
            str(results_root),
            *extra,
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    snapshots = [p for p in results_root.iterdir() if p.is_dir() and p.name != "latest"]
    assert len(snapshots) == 1, proc.stdout + proc.stderr
    snap_dir = snapshots[0]
    summary = json.loads((snap_dir / "summary.json").read_text(encoding="utf-8"))
    return proc.returncode, summary, snap_dir


@pytest.fixture
def stub_manifest(tmp_path: Path) -> Path:
    return write_manifest(
        tmp_path,
        [
            {
                "id": "echo-profile",
                "tier": "unit",
                "title": "echo argv with profile",
                "requires": "none",
                "argv": ["python", "-c", ECHO_ARGV, "--profile", "{profile}"],
            },
            {
                "id": "fails",
                "tier": "unit",
                "title": "exits 3",
                "requires": "none",
                "argv": ["python", "-c", "import sys; sys.exit(3)"],
            },
            {
                "id": "default-tier-only",
                "tier": "default",
                "title": "not in unit tier",
                "requires": "none",
                "argv": ["python", "-c", "pass"],
            },
        ],
    )


def test_legacy_run_expands_profile_and_records_each_step(tmp_path: Path, stub_manifest: Path):
    code, summary, snap_dir = run_nonreg(
        tmp_path, stub_manifest, "--tier", "unit", "--profile", "emulatedServer-filesystem"
    )

    assert code == 1
    assert set(summary) == LEGACY_SUMMARY_KEYS
    assert summary["counts"] == {"passed": 1, "failed": 1, "skipped": 0, "not_run": 0}
    assert [s["id"] for s in summary["steps"]] == ["echo-profile", "fails"]
    for step in summary["steps"]:
        assert set(step) == LEGACY_STEP_FIELDS

    echo_log = (snap_dir / "logs" / "echo-profile.log").read_text(encoding="utf-8")
    assert 'ARGV=["--profile", "emulatedServer-filesystem"]' in echo_log
    assert summary["steps"][1]["exit_code"] == 3


def test_legacy_run_writes_no_timing_artifacts(tmp_path: Path, stub_manifest: Path):
    _, _, snap_dir = run_nonreg(tmp_path, stub_manifest, "--tier", "unit")

    assert sorted(p.name for p in snap_dir.iterdir()) == ["logs", "summary.json", "summary.md"]


def test_fail_fast_marks_later_steps_not_run(tmp_path: Path):
    manifest = write_manifest(
        tmp_path,
        [
            {"id": "a", "tier": "unit", "title": "a", "argv": ["python", "-c", "import sys; sys.exit(1)"]},
            {"id": "b", "tier": "unit", "title": "b", "argv": ["python", "-c", "pass"]},
        ],
    )
    _, summary, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--fail-fast")

    assert [s["status"] for s in summary["steps"]] == ["failed", "not_run"]


# ------------------------------------------------------------------------------------------------
# #318 Slice 2: opt-in timing profile

VITEST_FIXTURE_CONFIG = "scripts/tests/fixtures/vitest-timing/vitest.config.mjs"

# pr-checks runs these tests before `npm ci`: the vitest-backed cases need node_modules.
requires_vitest = pytest.mark.skipif(
    not (ROOT / "node_modules" / "vitest").is_dir(),
    reason="vitest not installed (run npm ci)",
)


@pytest.fixture
def vitest_fixture_manifest(tmp_path: Path) -> Path:
    return write_manifest(
        tmp_path,
        [
            {
                "id": "timed-fixture",
                "tier": "unit",
                "title": "vitest fixture with known hook and body times",
                "argv": ["npx", "vitest", "run", "--config", VITEST_FIXTURE_CONFIG],
            }
        ],
    )


@requires_vitest
def test_timings_split_collect_hooks_and_bodies(tmp_path: Path, vitest_fixture_manifest: Path):
    code, summary, snap_dir = run_nonreg(tmp_path, vitest_fixture_manifest, "--tier", "unit", "--timings")

    assert code == 0, summary["steps"][0].get("error_tail")
    timings = json.loads((snap_dir / "timings.json").read_text(encoding="utf-8"))
    [step] = timings["steps"]
    assert step["id"] == "timed-fixture"
    [record] = step["files"]
    assert record["file"].endswith("timing.fixture.test.mjs")
    assert record["phases"] == [{"name": "fixture.moduleInit", "ms": 5}]

    [test] = record["tests"]
    assert test["name"] == "timed > sleeps 100 ms"
    assert 190 <= test["before_each_ms"] < 400
    assert 95 <= test["body_ms"] < 300
    assert 25 <= test["after_each_ms"] < 200

    timed_suite = next(s for s in record["suites"] if s["name"] == "timed")
    assert 145 <= timed_suite["before_all_ms"] < 400
    assert 45 <= timed_suite["after_all_ms"] < 250

    assert summary["timings_json"].endswith("timings.json")
    summary_md = (snap_dir / "summary.md").read_text(encoding="utf-8")
    assert "### Slowest tests" in summary_md


@requires_vitest
def test_default_run_does_not_enable_the_timing_runner(tmp_path: Path, vitest_fixture_manifest: Path):
    code, summary, snap_dir = run_nonreg(tmp_path, vitest_fixture_manifest, "--tier", "unit")

    assert code == 0
    assert "timings_json" not in summary
    assert sorted(p.name for p in snap_dir.iterdir()) == ["logs", "summary.json", "summary.md"]
    assert "### Slowest tests" not in (snap_dir / "summary.md").read_text(encoding="utf-8")
