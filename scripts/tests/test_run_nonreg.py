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


# ------------------------------------------------------------------------------------------------
# #318 Slice 3: opt-in shared runner with legacy fallback

SHARED_FIXTURE_ARGV = ["npx", "vitest", "run", "--config", "scripts/tests/fixtures/vitest-shared/vitest.config.mjs"]


def shared_step(step_id: str, files: list[str], group: str = "fixture") -> dict:
    return {
        "id": step_id,
        "tier": "unit",
        "title": step_id,
        "argv": [*SHARED_FIXTURE_ARGV, *files],
        "shared": {"group": group, "argv": SHARED_FIXTURE_ARGV, "files": files},
    }


@pytest.fixture
def shared_manifest(tmp_path: Path) -> Path:
    return write_manifest(
        tmp_path,
        [
            shared_step("alpha", ["alpha.fixture"]),
            {
                "id": "plain",
                "tier": "unit",
                "title": "no shared descriptor",
                "argv": ["python", "-c", "pass"],
            },
            shared_step("beta", ["beta.fixture"]),
            shared_step("leaky", ["leak-1.fixture", "leak-2.fixture"]),
            shared_step("broken", ["broken.fixture"]),
        ],
    )


def steps_by_id(summary: dict) -> dict[str, dict]:
    return {s["id"]: s for s in summary["steps"]}


@requires_vitest
def test_shared_runner_runs_a_group_in_one_launch_and_keeps_one_row_per_step(
    tmp_path: Path, shared_manifest: Path
):
    _, summary, snap_dir = run_nonreg(tmp_path, shared_manifest, "--tier", "unit", "--runner", "shared")

    steps = steps_by_id(summary)
    assert [s["id"] for s in summary["steps"]] == ["alpha", "plain", "beta", "leaky", "broken"]
    assert summary["runner"] == "shared"
    for sid in ("alpha", "beta"):
        assert steps[sid]["status"] == "passed"
        assert steps[sid]["mode"] == "shared"
        assert steps[sid]["shared_group"] == "fixture"
        assert steps[sid]["vitest"]["tests_passed"] == 1
    assert steps["alpha"]["argv"] == steps["beta"]["argv"]
    assert "--no-isolate" in steps["alpha"]["argv"]
    assert (snap_dir / "logs" / "shared-fixture.log").is_file()
    assert "mode" not in steps["plain"]
    assert steps["plain"]["status"] == "passed"


@requires_vitest
def test_shared_failures_rerun_legacy_and_flag_state_leaks(tmp_path: Path, shared_manifest: Path):
    code, summary, _ = run_nonreg(tmp_path, shared_manifest, "--tier", "unit", "--runner", "shared")

    steps = steps_by_id(summary)
    assert steps["leaky"]["status"] == "passed"
    assert steps["leaky"]["mode"] == "shared→legacy"
    assert steps["leaky"]["shared_status"] == "failed"
    assert steps["leaky"]["shared_state_leak_suspected"] is True
    assert "--no-isolate" not in steps["leaky"]["argv"]

    assert steps["broken"]["status"] == "failed"
    assert steps["broken"]["mode"] == "shared→legacy"
    assert "shared_state_leak_suspected" not in steps["broken"]
    assert code == 1


@requires_vitest
def test_legacy_runner_ignores_shared_descriptors(tmp_path: Path, shared_manifest: Path):
    _, summary, snap_dir = run_nonreg(tmp_path, shared_manifest, "--tier", "unit")

    assert "runner" not in summary
    for step in summary["steps"]:
        assert set(step) == LEGACY_STEP_FIELDS
        assert "--no-isolate" not in step["argv"]
    assert not (snap_dir / "shared").exists()
    assert steps_by_id(summary)["leaky"]["status"] == "passed"


# ------------------------------------------------------------------------------------------------
# #318 Slice 4: shared runner for suites that run in one entry file (testMiroir --shared)

SUITES_LAUNCHER = ["node", "scripts/tests/fixtures/vitest-shared/suites-launcher.mjs"]


def suites_step(step_id: str, suites: list[str]) -> dict:
    return {
        "id": step_id,
        "tier": "unit",
        "title": step_id,
        "argv": [*SUITES_LAUNCHER, "--suites", ",".join(suites)],
        "shared": {"group": "suites", "argv": SUITES_LAUNCHER, "suites": suites},
    }


@requires_vitest
def test_shared_suites_group_maps_results_by_describe(tmp_path: Path):
    manifest = write_manifest(
        tmp_path,
        [
            suites_step("one", ["alpha_suite"]),
            suites_step("two", ["beta_suite", "gamma_suite"]),
            suites_step("bad", ["failing"]),
        ],
    )
    code, summary, snap_dir = run_nonreg(
        tmp_path, manifest, "--tier", "unit", "--runner", "shared", "--timings"
    )

    steps = steps_by_id(summary)
    assert steps["one"]["mode"] == "shared"
    assert steps["one"]["vitest"]["tests_passed"] == 2
    assert steps["two"]["mode"] == "shared"
    assert steps["two"]["vitest"]["tests_passed"] == 4
    assert "--suites" in steps["one"]["argv"]
    assert steps["one"]["argv"][-1] == "alpha_suite,beta_suite,gamma_suite,failing"
    assert "--no-isolate" not in steps["one"]["argv"]
    assert steps["bad"]["status"] == "failed"
    assert steps["bad"]["mode"] == "shared→legacy"
    assert code == 1

    timings = {s["id"]: s for s in json.loads((snap_dir / "timings.json").read_text(encoding="utf-8"))["steps"]}
    two_tests = [t["name"] for f in timings["two"]["files"] for t in f["tests"]]
    assert sorted(two_tests) == [
        "beta_suite > first",
        "beta_suite > second",
        "gamma_suite > first",
        "gamma_suite > second",
    ]
    # One launch, one collect: charged to the first member only.
    assert timings["one"]["files"][0]["collect_ms"] > 0
    assert timings["two"]["files"][0]["collect_ms"] == 0


# ------------------------------------------------------------------------------------------------
# #318 review: verdicts when the group launch fails, and fail-fast reporting

STUB_LAUNCHER = ["python", "scripts/tests/fixtures/shared_stub_launcher.py"]


def stub_suites_step(step_id: str, suite: str, launcher_extra: list[str] | None = None) -> dict:
    return {
        "id": step_id,
        "tier": "unit",
        "title": step_id,
        "argv": ["python", "-c", "pass"],
        "shared": {"group": "stub", "argv": [*STUB_LAUNCHER, *(launcher_extra or [])], "suites": [suite]},
    }


def test_shared_launch_failing_after_passing_tests_reruns_every_member_legacy(tmp_path: Path):
    manifest = write_manifest(
        tmp_path,
        [
            stub_suites_step("one", "s1", ["--exit", "1"]),
            stub_suites_step("two", "s2", ["--exit", "1"]),
        ],
    )
    code, summary, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--runner", "shared")

    for step in summary["steps"]:
        assert step["mode"] == "shared→legacy"
        assert step["shared_status"] == "launch-failed"
        assert step["status"] == "passed"
    assert code == 0


def test_fail_fast_reports_group_members_that_already_ran(tmp_path: Path):
    manifest = write_manifest(
        tmp_path,
        [
            stub_suites_step("first", "s1"),
            {"id": "fails", "tier": "unit", "title": "exits 3", "argv": ["python", "-c", "import sys; sys.exit(3)"]},
            stub_suites_step("later", "s2"),
            {"id": "after", "tier": "unit", "title": "never runs", "argv": ["python", "-c", "pass"]},
        ],
    )
    _, summary, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--runner", "shared", "--fail-fast")

    steps = steps_by_id(summary)
    assert steps["first"]["status"] == "passed"
    assert steps["fails"]["status"] == "failed"
    assert steps["later"]["status"] == "passed"
    assert steps["later"]["mode"] == "shared"
    assert steps["after"]["status"] == "not_run"
