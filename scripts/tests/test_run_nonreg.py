"""#318 Slice 0: characterize the legacy contract of scripts/run-nonreg.py.

The real script runs against a small temporary manifest whose steps are `python -c` stubs,
so later slices (--timings, --runner shared) can prove the default run is unchanged.
"""

from __future__ import annotations

import json
import re
import os
import shutil
import socket
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
    "worker",  # #728: serial runs give their steps worker w1
}

LEGACY_SUMMARY_KEYS = {
    "stamp",
    "tier",
    "mode",
    "profile",
    "storage",
    "local_cache",
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
    "worker_state",  # #728: serial runs clear their worker after each step
}


WORKER_LOCKS_ENV = "MIROIR_NONREG_WORKER_LOCKS"
# The lock folder of the run that started these tests, if it set one: `private_worker_locks` replaces it
# for most tests, `checkout_worker_locks` gives it back (#584 review).
INHERITED_WORKER_LOCKS = os.environ.get(WORKER_LOCKS_ENV)


@pytest.fixture(autouse=True)
def private_worker_locks(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """The runs started here claim their workers in a folder of their own (#584), so they get w1, w2...
    even while a nonreg run that started these tests holds those numbers. Safe because their test
    environments are private (`runner_cmd`); a test on the repository's environment names takes the
    checkout's claims instead (`checkout_worker_locks`)."""
    monkeypatch.setenv(WORKER_LOCKS_ENV, str(tmp_path / "worker-locks"))


def checkout_worker_locks(env: dict[str, str] | None = None) -> dict[str, str]:
    """The environment of a run whose test environments are named like the repository's
    (test-filesystem, test-sql): it claims workers with the checkout's lock files (#584), so it never
    clears the stores of a nonreg run that started these tests."""
    restored = {k: v for k, v in (env if env is not None else os.environ).items() if k != WORKER_LOCKS_ENV}
    if INHERITED_WORKER_LOCKS is not None:
        restored[WORKER_LOCKS_ENV] = INHERITED_WORKER_LOCKS
    return restored


def runner_cmd(tmp_path: Path) -> list[str]:
    """The runner, with no test environments to clear (#728): every run clears its workers' state for the
    environments it knows, so a run started here never touches the stores of a nonreg run that started these
    tests, and watches no built packages (#736). A later --environments-dir or --watch-root in the arguments
    overrides them."""
    empty = tmp_path / "no-environments"
    empty.mkdir(parents=True, exist_ok=True)
    # #736: nor are the repository's built packages watched, which a nonreg step may build meanwhile
    no_packages = tmp_path / "no-packages"
    no_packages.mkdir(parents=True, exist_ok=True)
    return [sys.executable, str(SCRIPT), "--environments-dir", str(empty), "--watch-root", str(no_packages)]


def write_manifest(tmp_path: Path, steps: list[dict], scopes: dict[str, str] | None = None) -> Path:
    manifest = {
        "version": 1,
        "defaultProfile": "emulatedServer-sql",
        "profiles": ["emulatedServer-sql", "emulatedServer-filesystem"],
        "steps": steps,
    }
    if scopes is not None:
        manifest["scopes"] = scopes
    path = tmp_path / "manifest.json"
    path.write_text(json.dumps(manifest), encoding="utf-8")
    return path


def run_nonreg(
    tmp_path: Path, manifest: Path, *extra: str, env: dict[str, str] | None = None
) -> tuple[int, dict, Path]:
    results_root = tmp_path / "results"
    # The contract tests below describe a serial run; #477 tests ask for --jobs themselves.
    jobs = [] if "--jobs" in extra else ["--jobs", "1"]
    proc = subprocess.run(
        [
            *runner_cmd(tmp_path),
            "--manifest",
            str(manifest),
            "--results-root",
            str(results_root),
            *jobs,
            *extra,
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
        env=env,
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


def test_snapshot_dir_placeholder_expands_to_the_run_snapshot(tmp_path: Path):
    """#321 Slice 11: a step can write into, and read from, the snapshot of its run."""
    manifest = write_manifest(
        tmp_path,
        [
            {
                "id": "writes",
                "tier": "unit",
                "title": "writes a file into the snapshot",
                "requires": "none",
                "argv": ["python", "-c", "import sys, pathlib; pathlib.Path(sys.argv[1]).write_text('before')", "{snapshot_dir}/before.txt"],
            },
            {
                "id": "reads",
                "tier": "unit",
                "title": "reads it back",
                "requires": "none",
                "argv": ["python", "-c", "import sys, pathlib; assert pathlib.Path(sys.argv[1]).read_text() == 'before'", "{snapshot_dir}/before.txt"],
            },
        ],
    )

    code, summary, snap_dir = run_nonreg(tmp_path, manifest, "--tier", "unit")

    assert code == 0, summary
    assert (snap_dir / "before.txt").read_text(encoding="utf-8") == "before"
    assert summary["steps"][0]["argv"][-1] == (snap_dir / "before.txt").as_posix()


def test_every_tier_starts_by_recording_the_environment_and_ends_with_the_tracked_assets_check():
    """#321 Slice 11: unit steps run in every tier, in manifest order."""
    steps = json.loads((ROOT / "scripts" / "nonreg-manifest.json").read_text(encoding="utf-8"))["steps"]
    first, last = steps[0], steps[-1]

    assert first["id"] == "unit-321-environment-before"
    assert first["tier"] == last["tier"] == "unit"
    assert "tracked_assets_guard.py snapshot --output {snapshot_dir}/tracked-assets-before.json" in " ".join(first["argv"])
    assert "miroir-env -- show --json > {snapshot_dir}/environment.json" in " ".join(first["argv"])
    # the developer's own state (e.g. an application deployed by hand) is not the run's doing
    assert "miroir-env -- check --snapshot {snapshot_dir}/environment-check-before.json" in " ".join(first["argv"])

    assert last["id"] == "unit-321-tracked-assets"
    assert "tracked_assets_guard.py check --since {snapshot_dir}/tracked-assets-before.json" in " ".join(last["argv"])
    assert "miroir-env -- check --strict --since {snapshot_dir}/environment-check-before.json" in " ".join(last["argv"])


# ------------------------------------------------------------------------------------------------
# #351 Slice 1: --scope selects the steps of named scopes, plus the `always` bracket


def _scoped_step(step_id: str, tier: str, *scopes: str) -> dict:
    return {"id": step_id, "tier": tier, "title": step_id, "scopes": list(scopes), "argv": ["python", "-c", "pass"]}


@pytest.fixture
def scoped_manifest(tmp_path: Path) -> Path:
    return write_manifest(
        tmp_path,
        [
            _scoped_step("before", "unit", "always"),
            _scoped_step("a1", "unit", "a", "smoke"),
            _scoped_step("b1", "unit", "b"),
            _scoped_step("a2", "default", "a"),
            _scoped_step("c1", "unit", "c"),
            _scoped_step("after", "unit", "always"),
        ],
        scopes={"always": "run bracket", "smoke": "wide and thin", "a": "A", "b": "B", "c": "C"},
    )


def test_scope_runs_its_steps_plus_the_always_steps_in_manifest_order(tmp_path: Path, scoped_manifest: Path):
    code, summary, snap_dir = run_nonreg(tmp_path, scoped_manifest, "--scope", "a")

    assert code == 0
    assert [s["id"] for s in summary["steps"]] == ["before", "a1", "a2", "after"]
    assert summary["scopes"] == ["a"]
    assert "- Scopes: `a`" in (snap_dir / "summary.md").read_text(encoding="utf-8")


def test_several_scopes_run_their_union(tmp_path: Path, scoped_manifest: Path):
    _, summary, _ = run_nonreg(tmp_path, scoped_manifest, "--scope", "smoke,b")

    assert [s["id"] for s in summary["steps"]] == ["before", "a1", "b1", "after"]


def test_only_adds_steps_to_a_scope(tmp_path: Path, scoped_manifest: Path):
    _, summary, _ = run_nonreg(tmp_path, scoped_manifest, "--scope", "b", "--only", "c1")

    assert [s["id"] for s in summary["steps"]] == ["before", "b1", "c1", "after"]


def test_tier_still_filters_a_scope(tmp_path: Path, scoped_manifest: Path):
    _, summary, _ = run_nonreg(tmp_path, scoped_manifest, "--scope", "a", "--tier", "unit")

    assert [s["id"] for s in summary["steps"]] == ["before", "a1", "after"]


def test_unknown_scope_is_an_error_naming_the_declared_scopes(tmp_path: Path, scoped_manifest: Path):
    proc = subprocess.run(
        [*runner_cmd(tmp_path), "--manifest", str(scoped_manifest), "--results-root", str(tmp_path / "r"), "--scope", "a,nope"],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert proc.returncode == 2
    assert "unknown scope(s): nope" in proc.stderr
    assert "a, b, c, smoke" in proc.stderr
    assert not (tmp_path / "r").exists()


def test_run_without_scope_records_no_scopes(tmp_path: Path, scoped_manifest: Path):
    _, summary, _ = run_nonreg(tmp_path, scoped_manifest, "--tier", "unit")

    assert "scopes" not in summary
    assert len(summary["steps"]) == 5


# ------------------------------------------------------------------------------------------------
# #351 Slice 2: the real manifest is fully scoped

REAL_MANIFEST = json.loads((ROOT / "scripts" / "nonreg-manifest.json").read_text(encoding="utf-8"))
REAL_SCOPES = REAL_MANIFEST.get("scopes", {})


def test_scope_catalogue_declares_three_to_eight_scopes_including_smoke():
    selectable = [n for n in REAL_SCOPES if n != "always"]

    assert "smoke" in selectable and "always" in REAL_SCOPES
    assert 3 <= len(selectable) <= 8, selectable


def test_every_manifest_step_names_declared_scopes():
    problems = [
        (s["id"], s.get("scopes"))
        for s in REAL_MANIFEST["steps"]
        if not s.get("scopes") or not set(s["scopes"]) <= set(REAL_SCOPES)
    ]

    assert problems == []


def test_every_manifest_step_has_a_scope_besides_smoke():
    """So the non-smoke scopes together always cover the whole suite."""
    smoke_only = [s["id"] for s in REAL_MANIFEST["steps"] if set(s.get("scopes", [])) <= {"smoke"}]

    assert smoke_only == []


def test_the_run_bracket_is_in_the_always_scope():
    always = [s["id"] for s in REAL_MANIFEST["steps"] if "always" in s.get("scopes", [])]

    assert always == ["unit-321-environment-before", "unit-321-tracked-assets"]


def test_smoke_is_wide_one_step_in_each_main_layer():
    smoke = [set(s["scopes"]) for s in REAL_MANIFEST["steps"] if "smoke" in s.get("scopes", [])]

    for layer in ("core", "actions", "runners", "ui"):
        assert any(layer in scopes for scopes in smoke), layer


def test_empty_scope_is_an_error_not_a_full_run(tmp_path: Path, scoped_manifest: Path):
    proc = subprocess.run(
        [*runner_cmd(tmp_path), "--manifest", str(scoped_manifest), "--results-root", str(tmp_path / "r"), "--scope", ""],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert proc.returncode == 2
    assert "--scope needs at least one scope name" in proc.stderr
    assert not (tmp_path / "r").exists()


def test_compare_with_a_scoped_run_only_looks_at_the_steps_both_runs_selected(tmp_path: Path):
    manifest = write_manifest(
        tmp_path,
        [
            _scoped_step("before", "unit", "always"),
            _scoped_step("a1", "unit", "a"),
            {**_scoped_step("b1", "unit", "b"), "argv": ["python", "-c", "import sys; sys.exit(1)"]},
            _scoped_step("after", "unit", "always"),
        ],
        scopes={"always": "run bracket", "a": "A", "b": "B"},
    )
    _, full, full_dir = run_nonreg(tmp_path / "full", manifest, "--tier", "unit")
    assert full["counts"]["failed"] == 1

    proc = subprocess.run(
        [*runner_cmd(tmp_path), "--manifest", str(manifest), "--results-root", str(tmp_path / "scoped"),
         "--tier", "unit", "--scope", "a", "--compare", str(full_dir)],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert proc.returncode == 0, proc.stdout
    assert "missing steps (0)" in proc.stdout
    assert "still failing (0)" in proc.stdout
    assert "scoped compare: 1 step(s) selected by only one run ignored: b1" in proc.stdout


# ------------------------------------------------------------------------------------------------
# #390: choose the store of a run with --storage


def storage_manifest(tmp_path: Path) -> Path:
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
                "id": "needs-store",
                "tier": "default",
                "title": "integration step on the run's store",
                "requires": "storage",
                "argv": ["python", "-c", ECHO_ARGV, "--profile", "{profile}"],
            },
        ],
    )


def free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def write_environments(tmp_path: Path, postgres_port: int, mongodb_port: int) -> Path:
    envs = tmp_path / "environments"
    envs.mkdir()
    (envs / "test-filesystem.json").write_text(json.dumps({"name": "test-filesystem"}), encoding="utf-8")
    (envs / "test-sql.json").write_text(
        json.dumps(
            {
                "name": "test-sql",
                "extends": "test-filesystem",
                "connections": {"postgres": {"host": "127.0.0.1", "port": postgres_port}},
            }
        ),
        encoding="utf-8",
    )
    (envs / "test-mongodb.json").write_text(
        json.dumps(
            {
                "name": "test-mongodb",
                "extends": "test-filesystem",
                "connections": {"mongodb": {"url": f"mongodb://127.0.0.1:{mongodb_port}"}},
            }
        ),
        encoding="utf-8",
    )
    return envs


def run_raw(
    tmp_path: Path, manifest: Path, *extra: str, env: dict[str, str] | None = None
) -> subprocess.CompletedProcess:
    return subprocess.run(
        [
            *runner_cmd(tmp_path),
            "--manifest",
            str(manifest),
            "--results-root",
            str(tmp_path / "results"),
            *extra,
        ],
        cwd=ROOT,
        capture_output=True,
        text=True,
        check=False,
        env=env,
    )


def test_storage_selects_the_emulated_server_profile_and_is_recorded(tmp_path: Path):
    manifest = storage_manifest(tmp_path)
    by_storage = tmp_path / "by-storage"
    by_profile = tmp_path / "by-profile"
    by_storage.mkdir()
    by_profile.mkdir()

    code, summary, snap_dir = run_nonreg(by_storage, manifest, "--storage", "filesystem")
    _, profile_summary, _ = run_nonreg(by_profile, manifest, "--profile", "emulatedServer-filesystem")

    assert code == 0
    assert summary["profile"] == "emulatedServer-filesystem"
    assert summary["storage"] == "filesystem"
    assert [s["argv"] for s in summary["steps"]] == [s["argv"] for s in profile_summary["steps"]]
    assert summary["steps"][1]["requires"] == "storage"
    assert "- Storage: `filesystem`" in (snap_dir / "summary.md").read_text(encoding="utf-8")


def test_default_run_records_the_sql_storage(tmp_path: Path):
    _, summary, _ = run_nonreg(tmp_path, storage_manifest(tmp_path), "--tier", "unit")

    assert summary["profile"] == "emulatedServer-sql"
    assert summary["storage"] == "sql"


def test_a_profile_that_is_not_emulated_server_has_no_storage(tmp_path: Path):
    _, summary, _ = run_nonreg(tmp_path, storage_manifest(tmp_path), "--tier", "unit", "--profile", "realServer-sql")

    assert summary["storage"] is None


@pytest.mark.parametrize(
    "extra",
    [
        ("--storage", "oracle"),
        ("--storage", "sql", "--profile", "emulatedServer-sql"),
    ],
)
def test_unknown_storage_or_storage_with_profile_is_rejected(tmp_path: Path, extra: tuple[str, ...]):
    proc = run_raw(tmp_path, storage_manifest(tmp_path), *extra)

    assert proc.returncode == 2
    assert not (tmp_path / "results").exists()


@pytest.mark.parametrize(("storage", "service"), [("sql", "PostgreSQL"), ("mongodb", "MongoDB")])
def test_unreachable_store_service_stops_the_run_before_any_step(tmp_path: Path, storage: str, service: str):
    port = free_port()
    envs = write_environments(tmp_path, postgres_port=port, mongodb_port=port)

    proc = run_raw(
        tmp_path, storage_manifest(tmp_path), "--storage", storage, "--environments-dir", str(envs),
        env=checkout_worker_locks(),
    )

    assert proc.returncode == 2
    assert f"{service} is not reachable at 127.0.0.1:{port}" in proc.stderr
    assert not (tmp_path / "results").exists()


def test_reachable_store_service_lets_the_run_proceed(tmp_path: Path):
    with socket.socket() as server:
        server.bind(("127.0.0.1", 0))
        server.listen()
        port = server.getsockname()[1]
        envs = write_environments(tmp_path, postgres_port=port, mongodb_port=port)

        code, summary, _ = run_nonreg(
            tmp_path, storage_manifest(tmp_path), "--storage", "sql", "--environments-dir", str(envs),
            env=checkout_worker_locks(),
        )

    assert code == 0
    assert [s["status"] for s in summary["steps"]] == ["passed", "passed"]


@pytest.mark.parametrize(
    "extra",
    [
        ("--tier", "unit"),
        ("--dry-run",),
        ("--storage", "indexedDb"),
    ],
)
def test_store_check_is_skipped_when_no_step_needs_a_service(tmp_path: Path, extra: tuple[str, ...]):
    envs = write_environments(tmp_path, postgres_port=free_port(), mongodb_port=free_port())

    proc = run_raw(tmp_path, storage_manifest(tmp_path), "--environments-dir", str(envs), *extra, env=checkout_worker_locks())

    assert proc.returncode == 0, proc.stderr


@pytest.mark.parametrize(
    ("storage", "variable", "value"),
    [
        ("sql", "MIROIR_TEST_POSTGRES_HOST", "127.0.0.2"),
        ("mongodb", "MIROIR_TEST_MONGODB_CONNECTION_STRING", "mongodb://127.0.0.2:{port}"),
    ],
)
def test_store_check_follows_the_address_overrides_of_the_integration_tests(
    tmp_path: Path, storage: str, variable: str, value: str
):
    # The environment points at a listening port; the override moves the tests (and the check)
    # to another host where nothing listens.
    with socket.socket() as server:
        server.bind(("127.0.0.1", 0))
        server.listen()
        port = server.getsockname()[1]
        envs = write_environments(tmp_path, postgres_port=port, mongodb_port=port)
        env = checkout_worker_locks({**os.environ, variable: value.format(port=port)})

        proc = run_raw(
            tmp_path, storage_manifest(tmp_path), "--storage", storage, "--environments-dir", str(envs), env=env
        )

    assert proc.returncode == 2
    assert f"not reachable at 127.0.0.2:{port}" in proc.stderr


# #446: choose the local cache implementation of a run with --local-cache

ECHO_LOCAL_CACHE = "import os; print('LOCAL_CACHE=' + repr(os.environ.get('MIROIR_TEST_LOCAL_CACHE')))"


def local_cache_manifest(tmp_path: Path) -> Path:
    return write_manifest(
        tmp_path,
        [
            {
                "id": "echo-local-cache",
                "tier": "unit",
                "title": "echo the local cache of the run",
                "requires": "none",
                "argv": ["python", "-c", ECHO_LOCAL_CACHE],
            },
        ],
    )


def step_log(snap_dir: Path, step_id: str) -> str:
    return (snap_dir / "logs" / f"{step_id}.log").read_text(encoding="utf-8")


def test_local_cache_is_passed_to_the_steps_and_recorded(tmp_path: Path):
    code, summary, snap_dir = run_nonreg(tmp_path, local_cache_manifest(tmp_path), "--local-cache", "zustand")

    assert code == 0
    assert summary["local_cache"] == "zustand"
    assert "LOCAL_CACHE='zustand'" in step_log(snap_dir, "echo-local-cache")
    assert "- Local cache: `zustand`" in (snap_dir / "summary.md").read_text(encoding="utf-8")


def test_local_cache_defaults_to_redux_whatever_the_calling_shell_sets(tmp_path: Path):
    env = {**os.environ, "MIROIR_TEST_LOCAL_CACHE": "zustand"}
    proc = run_raw(tmp_path, local_cache_manifest(tmp_path), env=env)
    snap_dir = next(p for p in (tmp_path / "results").iterdir() if p.is_dir() and p.name != "latest")
    summary = json.loads((snap_dir / "summary.json").read_text(encoding="utf-8"))

    assert proc.returncode == 0, proc.stdout + proc.stderr
    assert summary["local_cache"] == "redux"
    assert "LOCAL_CACHE='redux'" in step_log(snap_dir, "echo-local-cache")


def test_unknown_local_cache_is_rejected(tmp_path: Path):
    proc = run_raw(tmp_path, local_cache_manifest(tmp_path), "--local-cache", "mobx")

    assert proc.returncode == 2
    assert "invalid choice" in proc.stderr


# #477 Slice 0: the serial contract that --jobs 1 keeps.
def order_step(step_id: str, log: Path) -> dict:
    code = (
        "import os, sys, time; "
        f"p = {str(log)!r}; "
        f"open(p, 'a').write('start {step_id} ' + os.environ.get('MIROIR_TEST_WORKER', '-') + '\\n'); "
        "time.sleep(0.3); "
        f"open(p, 'a').write('end {step_id}\\n')"
    )
    return {"id": step_id, "tier": "unit", "title": step_id, "requires": "none", "argv": ["python", "-c", code]}


def test_serial_run_runs_steps_one_after_the_other_on_worker_w1(tmp_path: Path):
    log = tmp_path / "order.log"
    manifest = write_manifest(tmp_path, [order_step("a", log), order_step("b", log)])

    # A worker left in the calling shell does not reach a serial run's steps: they run on w1 (#728).
    code, summary, _ = run_nonreg(
        tmp_path, manifest, "--tier", "unit", env={**os.environ, "MIROIR_TEST_WORKER": "w9"}
    )

    assert code == 0
    assert log.read_text(encoding="utf-8").splitlines() == ["start a w1", "end a", "start b w1", "end b"]
    assert "jobs" not in summary


def test_steps_write_failed_run_exports_into_the_snapshot(tmp_path: Path):
    seen = tmp_path / "export-dir.txt"
    code = f"import os; open({str(seen)!r}, 'w').write(os.environ.get('MIROIR_RUN_EXPORT_DIR', '-'))"
    manifest = write_manifest(
        tmp_path,
        [{"id": "a", "tier": "unit", "title": "a", "requires": "none", "argv": ["python", "-c", code]}],
    )

    exit_code, _, snap_dir = run_nonreg(tmp_path, manifest, "--tier", "unit")

    assert exit_code == 0
    assert Path(seen.read_text(encoding="utf-8")) == snap_dir / "run-exports"


# #477 Slice 4: --jobs N runs steps and shared groups at the same time, one worker per job.
def timed_step(step_id: str, log: Path, *, sleep: float = 1.0, exit_code: int = 0) -> dict:
    code = (
        "import os, sys, time, json; "
        # One file per step: appends from concurrent processes to a shared file are not atomic on Windows.
        f"p = {str(log) + '.' + step_id!r}; "
        "w = os.environ.get('MIROIR_TEST_WORKER', '-'); "
        f"open(p, 'a').write(json.dumps(['start', {step_id!r}, w, time.time()]) + '\\n'); "
        f"time.sleep({sleep}); "
        f"open(p, 'a').write(json.dumps(['end', {step_id!r}, w, time.time()]) + '\\n'); "
        f"sys.exit({exit_code})"
    )
    return {"id": step_id, "tier": "unit", "title": step_id, "requires": "none", "argv": ["python", "-c", code]}


def read_events(log: Path) -> list[list]:
    return [
        json.loads(line)
        for step_log in sorted(log.parent.glob(log.name + ".*"))
        for line in step_log.read_text(encoding="utf-8").splitlines()
    ]


def spans(log: Path) -> dict[str, tuple[float, float, str]]:
    events = read_events(log)
    starts = {e[1]: (e[3], e[2]) for e in events if e[0] == "start"}
    ends = {e[1]: e[3] for e in events if e[0] == "end"}
    return {sid: (starts[sid][0], ends[sid], starts[sid][1]) for sid in starts}


def overlap(a: tuple[float, float, str], b: tuple[float, float, str]) -> bool:
    return a[0] < b[1] and b[0] < a[1]


FS_PROFILE = ("--profile", "emulatedServer-filesystem")


def test_jobs_runs_steps_at_the_same_time_each_in_its_own_worker(tmp_path: Path):
    log = tmp_path / "events.log"
    manifest = write_manifest(tmp_path, [timed_step(s, log) for s in ("a", "b", "c")])

    code, summary, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--jobs", "2", *FS_PROFILE)

    assert code == 0
    s = spans(log)
    assert overlap(s["a"], s["b"])
    for x, y in (("a", "b"), ("a", "c"), ("b", "c")):
        if overlap(s[x], s[y]):
            assert s[x][2] != s[y][2]
    assert {span[2] for span in s.values()} <= {"w1", "w2"}
    assert summary["jobs"] == 2
    assert {step["worker"] for step in summary["steps"]} <= {"w1", "w2"}


def test_jobs_one_runs_steps_one_after_the_other(tmp_path: Path):
    log = tmp_path / "events.log"
    manifest = write_manifest(tmp_path, [timed_step(s, log, sleep=0.2) for s in ("a", "b")])

    run_nonreg(tmp_path, manifest, "--tier", "unit", "--jobs", "1", *FS_PROFILE)

    s = spans(log)
    assert not overlap(s["a"], s["b"])


def test_parallel_summary_keeps_manifest_order_and_compares_with_a_serial_run(tmp_path: Path):
    log = tmp_path / "events.log"
    # "slow" finishes last although it comes first in the manifest.
    manifest = write_manifest(
        tmp_path,
        [timed_step("slow", log, sleep=1.0), timed_step("quick", log, sleep=0.1), timed_step("fails", log, sleep=0.1, exit_code=3)],
    )
    serial_dir = tmp_path / "serial"
    serial_dir.mkdir()
    _, serial, serial_snap = run_nonreg(serial_dir, manifest, "--tier", "unit", "--jobs", "1", *FS_PROFILE)

    code, summary, _ = run_nonreg(
        tmp_path, manifest, "--tier", "unit", "--jobs", "3", *FS_PROFILE,
        "--compare", str(serial_snap / "summary.json"),
    )

    assert [st["id"] for st in summary["steps"]] == ["slow", "quick", "fails"]
    assert [st["status"] for st in summary["steps"]] == [st["status"] for st in serial["steps"]]
    assert code == 1  # the failing step, not a compare difference


def test_fail_fast_with_jobs_lets_running_steps_finish_and_starts_no_new_one(tmp_path: Path):
    log = tmp_path / "events.log"
    manifest = write_manifest(
        tmp_path,
        [
            timed_step("fails", log, sleep=0.1, exit_code=3),
            timed_step("running", log, sleep=1.0),
            timed_step("later", log, sleep=0.1),
        ],
    )

    code, summary, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--jobs", "2", "--fail-fast", *FS_PROFILE)

    statuses = {st["id"]: st["status"] for st in summary["steps"]}
    assert code == 1
    assert statuses == {"fails": "failed", "running": "passed", "later": "not_run"}
    assert "later" not in spans(log)


def test_parallel_console_prints_each_step_as_one_block(tmp_path: Path):
    log = tmp_path / "events.log"
    manifest = write_manifest(tmp_path, [timed_step(s, log, sleep=0.5) for s in ("a", "b")])
    results_root = tmp_path / "results"

    proc = subprocess.run(
        [*runner_cmd(tmp_path), "--manifest", str(manifest), "--results-root", str(results_root),
         "--tier", "unit", "--jobs", "2", *FS_PROFILE],
        cwd=ROOT, capture_output=True, text=True, check=False,
    )

    lines = proc.stdout.splitlines()
    for sid in ("a", "b"):
        header = next(i for i, line in enumerate(lines) if line.startswith("=== ") and line.endswith(f"] {sid} ==="))
        assert lines[header + 1].startswith("$ ")
        assert "PASSED" in lines[header + 2]


@pytest.mark.parametrize("value", ["0", "-1"])
def test_jobs_must_be_positive(tmp_path: Path, value: str):
    manifest = write_manifest(tmp_path, [{"id": "x", "tier": "unit", "title": "x", "argv": ["python", "-c", "pass"]}])
    proc = subprocess.run(
        [*runner_cmd(tmp_path), "--manifest", str(manifest), "--results-root", str(tmp_path / "r"), "--jobs", value],
        cwd=ROOT, capture_output=True, text=True, check=False,
    )
    assert proc.returncode == 2


def worker_state_step(step_id: str, state: str) -> dict:
    """Writes into .miroir/<state>@<worker>, as a test environment opened by the step would."""
    code = (
        "import os, pathlib; "
        f"d = pathlib.Path('.miroir') / ({state!r} + '@' + os.environ['MIROIR_TEST_WORKER']); "
        "d.mkdir(parents=True, exist_ok=True); (d / 'x.json').write_text('{}')"
    )
    return {"id": step_id, "tier": "unit", "title": step_id, "requires": "none", "argv": ["python", "-c", code]}


def test_worker_state_is_removed_after_the_run_unless_kept(tmp_path: Path):
    state = "test-pytest477"
    manifest = write_manifest(tmp_path, [worker_state_step("a", state), worker_state_step("b", state)])
    environments = tmp_path / "environments"
    environments.mkdir()
    (environments / f"{state}.json").write_text("{}", encoding="utf-8")
    env_args = ("--environments-dir", str(environments))
    workers = lambda: sorted(p.name for p in (ROOT / ".miroir").glob(f"{state}@*"))  # noqa: E731
    try:
        removed_dir = tmp_path / "removed"
        removed_dir.mkdir()
        code, _, _ = run_nonreg(removed_dir, manifest, "--tier", "unit", "--jobs", "2", *FS_PROFILE, *env_args)
        assert code == 0
        assert workers() == []

        # Passed steps are cleared even with --keep-worker-state (#728).
        code, summary, _ = run_nonreg(
            tmp_path, manifest, "--tier", "unit", "--jobs", "2", "--keep-worker-state", *FS_PROFILE, *env_args
        )
        assert code == 0
        assert workers() == []
        assert summary["worker_state"] == "removed"
    finally:
        for leftover in (ROOT / ".miroir").glob(f"{state}@*"):
            shutil.rmtree(leftover)


def test_a_worker_state_with_a_database_is_cleared_and_a_failed_clear_is_reported(tmp_path: Path):
    # The environment has a PostgreSQL connection, so its stores are cleared through miroir-env clear even
    # on a filesystem run; miroir-env does not know this environment, so the clear fails (#477 review).
    state = "test-pytest477db"
    manifest = write_manifest(tmp_path, [worker_state_step("a", state)])
    environments = tmp_path / "environments"
    environments.mkdir()
    (environments / f"{state}.json").write_text(
        json.dumps({"connections": {"postgres": {"host": "localhost"}}}), encoding="utf-8"
    )
    try:
        code, summary, _ = run_nonreg(
            tmp_path, manifest, "--tier", "unit", "--jobs", "2", *FS_PROFILE, "--environments-dir", str(environments)
        )
        assert code == 0
        assert summary["worker_state"] == "incomplete"
    finally:
        for leftover in (ROOT / ".miroir").glob(f"{state}@*"):
            shutil.rmtree(leftover)


@pytest.mark.skipif(os.name == "nt", reason="the test holds the lock with fcntl")
def test_a_second_run_on_the_same_results_root_is_refused(tmp_path: Path):
    import fcntl

    manifest = write_manifest(tmp_path, [{"id": "x", "tier": "unit", "title": "x", "argv": ["python", "-c", "pass"]}])
    results_root = tmp_path / "results"
    results_root.mkdir()
    with open(results_root / ".run.lock", "a+") as held:
        fcntl.flock(held.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        proc = subprocess.run(
            [*runner_cmd(tmp_path), "--manifest", str(manifest), "--results-root", str(results_root), "--jobs", "1"],
            cwd=ROOT, capture_output=True, text=True, check=False,
        )
    assert proc.returncode == 2
    assert "another nonreg run" in proc.stderr


def load_runner():
    import importlib.util

    spec = importlib.util.spec_from_file_location("run_nonreg_module", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    sys.modules["run_nonreg_module"] = module
    spec.loader.exec_module(module)
    return module


def test_fail_fast_starts_nothing_after_a_failure_while_a_worker_is_free(tmp_path: Path, monkeypatch):
    # With 4 jobs and 2 units, a worker is free when the second unit comes: the failure of the first
    # must still stop it (#477 review).
    import time

    runner = load_runner()
    steps = [{"id": i, "title": i, "tier": "unit", "requires": "none", "argv": []} for i in ("fails", "later")]
    started: list[str] = []

    def fake_run_unit(unit, shared_groups, run, worker):
        step = unit.steps[0]
        started.append(step["id"])
        status = "failed" if step["id"] == "fails" else "passed"
        return {step["id"]: runner.StepResult(step["id"], step["id"], "unit", "none", status)}, []

    def slow_schedule(units):
        for unit in units:
            yield unit
            time.sleep(0.3)

    monkeypatch.setattr(runner, "run_unit", fake_run_unit)
    monkeypatch.setattr(runner, "schedule_alone_last", slow_schedule)
    run = runner.RunContext(profile="emulatedServer-filesystem", snap_dir=tmp_path, dry_run=False, timings=False)

    results, _ = runner.run_parallel(steps, {}, run, fail_fast=True, jobs=4)

    assert started == ["fails"]
    assert [r.status for r in results] == ["failed", "not_run"]


@requires_vitest
def test_a_shared_group_runs_as_one_job_on_one_worker(tmp_path: Path, shared_manifest: Path):
    _, summary, _ = run_nonreg(
        tmp_path, shared_manifest, "--tier", "unit", "--runner", "shared", "--jobs", "2", *FS_PROFILE
    )

    steps = steps_by_id(summary)
    assert [s["id"] for s in summary["steps"]] == ["alpha", "plain", "beta", "leaky", "broken"]
    group_workers = {steps[sid]["worker"] for sid in ("alpha", "beta", "leaky", "broken")}
    assert len(group_workers) == 1
    assert steps["alpha"]["status"] == "passed"
    assert steps["broken"]["mode"] == "shared→legacy"


# #477 Slice 5: a step with "parallel": false runs with no other step running.
def test_a_step_that_runs_alone_runs_after_the_parallel_steps(tmp_path: Path):
    # #737: an alone step no longer drains the pool at its place in the manifest; it waits for the end.
    log = tmp_path / "events.log"
    alone = {**timed_step("alone", log, sleep=0.3), "parallel": False}
    manifest = write_manifest(
        tmp_path,
        [timed_step("before", log, sleep=0.6), alone, timed_step("after", log, sleep=0.3), timed_step("after2", log, sleep=0.3)],
    )

    code, summary, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--jobs", "3", *FS_PROFILE)

    s = spans(log)
    assert code == 0
    assert s["alone"][0] >= max(s["before"][1], s["after"][1], s["after2"][1])
    assert overlap(s["before"], s["after"]) and overlap(s["after"], s["after2"])
    assert s["alone"][2] != "-"  # #728: a step that runs alone still gets a worker
    assert [st["id"] for st in summary["steps"]] == ["before", "alone", "after", "after2"]


def test_the_alone_steps_run_before_the_closing_bracket(tmp_path: Path):
    log = tmp_path / "events.log"

    def bracket(step_id: str) -> dict:
        return {**timed_step(step_id, log, sleep=0.1), "parallel": False, "worker": False}

    manifest = write_manifest(
        tmp_path,
        [
            bracket("open"),
            timed_step("a", log, sleep=0.3),
            {**timed_step("alone", log, sleep=0.1), "parallel": False},
            timed_step("b", log, sleep=0.3),
            bracket("close"),
        ],
    )

    code, _, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--jobs", "2", *FS_PROFILE)

    s = spans(log)
    assert code == 0
    assert s["a"][0] >= s["open"][1] and overlap(s["a"], s["b"])
    assert s["alone"][0] >= max(s["a"][1], s["b"][1])
    assert s["close"][0] >= s["alone"][1]


def test_a_serial_run_keeps_the_manifest_order_of_the_alone_steps(tmp_path: Path):
    log = tmp_path / "events.log"
    manifest = write_manifest(
        tmp_path,
        [timed_step("a", log, sleep=0.1), {**timed_step("alone", log, sleep=0.1), "parallel": False}, timed_step("b", log, sleep=0.1)],
    )

    run_nonreg(tmp_path, manifest, "--tier", "unit", *FS_PROFILE)

    s = spans(log)
    assert s["a"][1] <= s["alone"][0] and s["alone"][1] <= s["b"][0]


def test_every_manifest_step_that_runs_alone_says_why():
    silent = [s["id"] for s in REAL_MANIFEST["steps"] if s.get("parallel") is False and not s.get("parallelReason")]
    assert silent == [], 'give these "parallel": false steps a "parallelReason" (#737)'


def test_the_run_bracket_runs_alone():
    steps = {s["id"]: s for s in json.loads((ROOT / "scripts" / "nonreg-manifest.json").read_text(encoding="utf-8"))["steps"]}

    assert steps["unit-321-environment-before"].get("parallel") is False
    assert steps["unit-321-tracked-assets"].get("parallel") is False
    # #728: the bracket reads the unworkered environments; it is the only step without a worker.
    assert {sid for sid, step in steps.items() if step.get("worker") is False} == {
        "unit-321-environment-before",
        "unit-321-tracked-assets",
    }


def test_parallel_is_only_ever_set_to_false():
    steps = json.loads((ROOT / "scripts" / "nonreg-manifest.json").read_text(encoding="utf-8"))["steps"]

    assert {s["parallel"] for s in steps if "parallel" in s} <= {False}


# #728: every step (or shared group) starts from an empty worker state, in serial and parallel runs.
# One name per pytest process: two pytest runs at once (a developer's and a nonreg step's) never meet.
PROBE_STATE = f"test-pytest728-{os.getpid()}"


def state_probe_step(step_id: str, log: Path, *, exit_code: int = 0) -> dict:
    """Records whether its worker state exists when it starts, then writes into it, as a test environment
    opened by the step would."""
    code = (
        "import json, os, pathlib, sys; "
        "w = os.environ.get('MIROIR_TEST_WORKER', '-'); "
        f"d = pathlib.Path('.miroir') / ({PROBE_STATE!r} + '@' + w); "
        f"open({str(log) + '.' + step_id!r}, 'w').write(json.dumps([{step_id!r}, w, d.exists()])); "
        "d.mkdir(parents=True, exist_ok=True); "
        f"(d / ({step_id!r} + '.json')).write_text('{{}}'); "
        f"sys.exit({exit_code})"
    )
    return {"id": step_id, "tier": "unit", "title": step_id, "requires": "none", "argv": ["python", "-c", code]}


def probes(log: Path) -> dict[str, tuple[str, bool]]:
    entries = [json.loads(p.read_text(encoding="utf-8")) for p in log.parent.glob(log.name + ".*")]
    return {sid: (worker, existed) for sid, worker, existed in entries}


def probe_workers() -> list[str]:
    return sorted(p.name for p in (ROOT / ".miroir").glob(f"{PROBE_STATE}@*"))


@pytest.fixture
def probe_environments(tmp_path: Path):
    environments = tmp_path / "environments"
    environments.mkdir()
    (environments / f"{PROBE_STATE}.json").write_text("{}", encoding="utf-8")
    yield ("--environments-dir", str(environments))
    for leftover in (ROOT / ".miroir").glob(f"{PROBE_STATE}@*"):
        shutil.rmtree(leftover)


def test_serial_run_gives_every_step_an_empty_worker_state(tmp_path: Path, probe_environments):
    log = tmp_path / "probe.log"
    manifest = write_manifest(tmp_path, [state_probe_step(s, log) for s in ("a", "b", "c")])

    code, summary, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--jobs", "1", *FS_PROFILE, *probe_environments)

    assert code == 0
    assert probes(log) == {"a": ("w1", False), "b": ("w1", False), "c": ("w1", False)}
    assert probe_workers() == []
    assert summary["worker_state"] == "removed"
    assert [step["worker"] for step in summary["steps"]] == ["w1", "w1", "w1"]


def test_parallel_run_gives_every_step_an_empty_worker_state(tmp_path: Path, probe_environments):
    log = tmp_path / "probe.log"
    manifest = write_manifest(tmp_path, [state_probe_step(s, log) for s in ("a", "b", "c", "d", "e")])

    code, _, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--jobs", "2", *FS_PROFILE, *probe_environments)

    assert code == 0
    seen = probes(log)
    assert set(seen) == {"a", "b", "c", "d", "e"}
    assert {worker for worker, _ in seen.values()} <= {"w1", "w2"}
    assert not any(existed for _, existed in seen.values())
    assert probe_workers() == []


def test_leftover_worker_state_is_cleared_before_the_first_step(tmp_path: Path, probe_environments):
    log = tmp_path / "probe.log"
    manifest = write_manifest(tmp_path, [state_probe_step("a", log)])
    leftover = ROOT / ".miroir" / f"{PROBE_STATE}@w1"
    leftover.mkdir(parents=True)
    (leftover / "from-a-killed-run.json").write_text("{}", encoding="utf-8")

    code, _, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--jobs", "1", *FS_PROFILE, *probe_environments)

    assert code == 0
    assert probes(log) == {"a": ("w1", False)}


def test_keep_worker_state_keeps_failed_units_and_clears_passed_ones(tmp_path: Path, probe_environments):
    log = tmp_path / "probe.log"
    manifest = write_manifest(
        tmp_path,
        [state_probe_step("ok", log), state_probe_step("fails", log, exit_code=3), state_probe_step("after", log)],
    )

    code, summary, _ = run_nonreg(
        tmp_path, manifest, "--tier", "unit", "--jobs", "1", "--keep-worker-state", *FS_PROFILE, *probe_environments
    )

    assert code == 1
    assert probes(log) == {"ok": ("w1", False), "fails": ("w1", False), "after": ("w2", False)}
    assert probe_workers() == [f"{PROBE_STATE}@w1"]
    assert (ROOT / ".miroir" / f"{PROBE_STATE}@w1" / "fails.json").is_file()
    assert summary["worker_state"] == "kept"
    assert summary["kept_workers"] == ["w1"]


def test_failed_units_are_cleared_without_keep_worker_state(tmp_path: Path, probe_environments):
    log = tmp_path / "probe.log"
    manifest = write_manifest(tmp_path, [state_probe_step("fails", log, exit_code=3), state_probe_step("after", log)])

    code, summary, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--jobs", "1", *FS_PROFILE, *probe_environments)

    assert code == 1
    assert probes(log) == {"fails": ("w1", False), "after": ("w1", False)}
    assert probe_workers() == []
    assert "kept_workers" not in summary


def test_a_shared_member_rerun_starts_from_an_empty_worker_state(tmp_path: Path, monkeypatch):
    runner = load_runner()
    members = [
        {"id": m, "title": m, "tier": "unit", "requires": "none", "argv": [],
         "shared": {"group": "g", "argv": ["python", "-c", "pass"], "files": [f"{m}.test.ts"]}}
        for m in ("m1", "m2")
    ]
    calls: list[str] = []
    fresh = iter(["w2", "w3"])

    def failed_launch(argv, env):
        calls.append("launch")
        return subprocess.CompletedProcess(argv, 1, "", "")

    def fake_run_step(step, *, worker, **kwargs):
        calls.append(f"rerun {step['id']} on {worker}")
        return runner.StepResult(step["id"], step["id"], "unit", "none", "failed" if step["id"] == "m1" else "passed")

    def fresh_worker(failed):
        calls.append(f"release failed={failed}")
        return next(fresh)

    monkeypatch.setattr(runner, "spawn", failed_launch)
    monkeypatch.setattr(runner, "run_step", fake_run_step)
    (tmp_path / "logs").mkdir()

    results = runner.run_shared_group(
        "g", members, profile="emulatedServer-filesystem", snap_dir=tmp_path, dry_run=False, timings=False,
        worker="w1", fresh_worker=fresh_worker,
    )

    # The group's state goes first (its launch failed), then the state of m1's failed re-run.
    assert calls == ["launch", "release failed=True", "rerun m1 on w2", "release failed=True", "rerun m2 on w3"]
    assert results["m1"].extra["worker"] == "w2"
    assert results["m2"].extra["worker"] == "w3"


def test_a_step_that_runs_alone_gets_an_empty_worker_state(tmp_path: Path, probe_environments):
    log = tmp_path / "probe.log"
    manifest = write_manifest(
        tmp_path, [state_probe_step("a", log), {**state_probe_step("alone", log), "parallel": False}]
    )

    for jobs in ("1", "2"):
        run_dir = tmp_path / f"jobs{jobs}"
        run_dir.mkdir()
        code, _, _ = run_nonreg(run_dir, manifest, "--tier", "unit", "--jobs", jobs, *FS_PROFILE, *probe_environments)
        assert code == 0
        worker, existed = probes(log)["alone"]
        assert worker != "-" and not existed


def test_a_step_without_worker_runs_on_none(tmp_path: Path, probe_environments):
    log = tmp_path / "probe.log"
    manifest = write_manifest(tmp_path, [{**state_probe_step("bracket", log), "parallel": False, "worker": False}])

    for jobs in ("1", "2"):
        run_dir = tmp_path / f"jobs{jobs}"
        run_dir.mkdir()
        run_nonreg(run_dir, manifest, "--tier", "unit", "--jobs", jobs, *FS_PROFILE, *probe_environments)
        assert probes(log)["bracket"][0] == "-"
    shutil.rmtree(ROOT / ".miroir" / f"{PROBE_STATE}@-", ignore_errors=True)


def test_a_passed_shared_member_records_the_worker_of_the_launch(tmp_path: Path, monkeypatch):
    # #728 review: m2's re-run moves to w2; m1, which passed in the launch on w1, keeps w1.
    runner = load_runner()
    members = [
        {"id": m, "title": m, "tier": "unit", "requires": "none", "argv": [],
         "shared": {"group": "g", "argv": ["python", "-c", "pass"], "files": [f"{m}.test.ts"]}}
        for m in ("m1", "m2")
    ]

    def launch(argv, env):
        report = next(a for a in argv if a.startswith("--outputFile.json=")).split("=", 1)[1]
        Path(report).write_text(json.dumps({"testResults": [
            {"name": "/x/m1.test.ts", "status": "passed", "assertionResults": [{"status": "passed"}]},
            {"name": "/x/m2.test.ts", "status": "failed", "assertionResults": [{"status": "failed"}]},
        ]}), encoding="utf-8")
        return subprocess.CompletedProcess(argv, 1, "", "")

    monkeypatch.setattr(runner, "spawn", launch)
    monkeypatch.setattr(
        runner, "run_step",
        lambda step, **kwargs: runner.StepResult(step["id"], step["id"], "unit", "none", "failed"),
    )
    (tmp_path / "logs").mkdir()

    results = runner.run_shared_group(
        "g", members, profile="emulatedServer-filesystem", snap_dir=tmp_path, dry_run=False, timings=False,
        worker="w1", fresh_worker=lambda failed: "w2",
    )

    assert results["m1"].status == "passed"
    assert results["m1"].extra["worker"] == "w1"
    assert results["m2"].extra["worker"] == "w2"


def test_a_worker_whose_clear_failed_is_not_used_again(tmp_path: Path):
    # #728 review: miroir-env does not know this environment, so clearing its PostgreSQL stores fails; the
    # second step must not run on the worker that may still hold the first one's stores.
    state = f"test-pytest728db-{os.getpid()}"
    log = tmp_path / "events.log"
    manifest = write_manifest(
        tmp_path, [worker_state_step("a", state), timed_step("b", log, sleep=0.1)]
    )
    environments = tmp_path / "environments"
    environments.mkdir()
    (environments / f"{state}.json").write_text(
        json.dumps({"connections": {"postgres": {"host": "localhost"}}}), encoding="utf-8"
    )
    try:
        code, summary, _ = run_nonreg(
            tmp_path, manifest, "--tier", "unit", "--jobs", "1", *FS_PROFILE, "--environments-dir", str(environments)
        )
        assert code == 0
        assert summary["worker_state"] == "incomplete"
        assert [step["worker"] for step in summary["steps"]] == ["w1", "w2"]
    finally:
        for leftover in (ROOT / ".miroir").glob(f"{state}@*"):
            shutil.rmtree(leftover)


def test_a_step_does_not_get_the_terminal_of_the_run(tmp_path: Path):
    # A step that finds a terminal on its stdin can change its mode (a raw-mode password prompt) and leave
    # the console of the run scrambled, its summary unreadable. A step reads an empty stdin.
    code = "import sys; data = sys.stdin.read(); sys.exit(1 if data else 0)"
    manifest = write_manifest(
        tmp_path, [{"id": "reads-stdin", "tier": "unit", "title": "t", "requires": "none", "argv": ["python", "-c", code]}]
    )
    results_root = tmp_path / "results"
    for jobs in ("1", "2"):
        proc = subprocess.run(
            [*runner_cmd(tmp_path), "--manifest", str(manifest), "--results-root", str(results_root),
             "--tier", "unit", "--jobs", jobs, *FS_PROFILE],
            cwd=ROOT, input="typed by the user\n", capture_output=True, text=True, check=False,
        )
        assert proc.returncode == 0, proc.stdout + proc.stderr


# #584: a run never clears the state of a worker that another run holds. The pytest nonreg step starts
# runs on the repository's environment names while the nonreg run that started it uses w1..wN.


def test_a_worker_held_by_another_run_is_skipped_and_its_state_kept(tmp_path: Path, probe_environments):
    held = ROOT / ".miroir" / f"{PROBE_STATE}@w1"
    held.mkdir(parents=True, exist_ok=True)
    (held / "in-use.json").write_text("{}", encoding="utf-8")
    claim = load_runner().try_lock(Path(os.environ[WORKER_LOCKS_ENV]) / "w1.lock")
    assert claim is not None
    log = tmp_path / "probe.log"
    manifest = write_manifest(tmp_path, [state_probe_step("a", log)])
    try:
        code, summary, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--jobs", "2", *FS_PROFILE, *probe_environments)
    finally:
        claim.close()

    assert code == 0
    assert probes(log) == {"a": ("w2", False)}
    assert (held / "in-use.json").is_file()
    assert summary["steps"][0]["worker"] == "w2"


def test_a_run_gives_its_worker_numbers_back_when_it_ends(tmp_path: Path, probe_environments):
    log = tmp_path / "probe.log"
    manifest = write_manifest(tmp_path, [state_probe_step("a", log)])
    first = tmp_path / "first"
    first.mkdir()

    code, _, _ = run_nonreg(first, manifest, "--tier", "unit", "--jobs", "1", *FS_PROFILE, *probe_environments)
    assert code == 0
    claim = load_runner().try_lock(Path(os.environ[WORKER_LOCKS_ENV]) / "w1.lock")

    assert claim is not None
    claim.close()


def test_try_lock_raises_an_error_that_is_not_a_busy_lock(tmp_path: Path, monkeypatch):
    # #584 review: a folder whose filesystem rejects locks must stop the run, not make Workers.acquire try
    # new worker numbers forever.
    import errno

    runner = load_runner()

    def unsupported(*_args):
        raise OSError(errno.ENOLCK, "No locks available")

    if os.name == "nt":
        import msvcrt

        monkeypatch.setattr(msvcrt, "locking", unsupported)
    else:
        import fcntl

        monkeypatch.setattr(fcntl, "flock", unsupported)
    with pytest.raises(OSError):
        runner.try_lock(tmp_path / "w1.lock")


def test_a_worker_directory_left_by_rmtree_fails_the_clear(tmp_path: Path, monkeypatch):
    # #584: on Windows, rmtree(ignore_errors=True) leaves a folder another process has a file open in.
    runner = load_runner()
    state = f"test-pytest584-{os.getpid()}"
    environments = tmp_path / "environments"
    environments.mkdir()
    (environments / f"{state}.json").write_text("{}", encoding="utf-8")
    monkeypatch.setattr(runner, "ENVIRONMENTS_DIR", environments)
    left = ROOT / ".miroir" / f"{state}@w1"
    left.mkdir(parents=True, exist_ok=True)
    monkeypatch.setattr(runner.shutil, "rmtree", lambda *_args, **_kwargs: None)
    try:
        lines, complete = runner.remove_worker_state(["w1"])
        workers = runner.Workers(keep_failed=False, dry_run=False)
        workers.used.append("w1")
        workers.release("w1", failed=False)
    finally:
        monkeypatch.undo()
        shutil.rmtree(left, ignore_errors=True)

    assert complete is False
    assert any(line.startswith("could not remove") for line in lines)
    assert workers.free == []


# --- #734: verdict equivalence check, K serial vs K parallel runs ---------------------------------


def write_summary(path: Path, statuses: dict[str, str], jobs: int = 1) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    summary = {"stamp": path.name, "steps": [{"id": sid, "status": st} for sid, st in statuses.items()]}
    if jobs != 1:
        summary["jobs"] = jobs
    (path / "summary.json").write_text(json.dumps(summary), encoding="utf-8")
    return path


def equivalence_report(tmp_path: Path) -> dict:
    reports = sorted((tmp_path / "results" / "equivalence").glob("*.json"))
    assert len(reports) == 1, reports
    return json.loads(reports[0].read_text(encoding="utf-8"))


def summaries_check(tmp_path: Path, serial: list[dict], parallel: list[dict], extra: tuple[str, ...] = ()):
    manifest = write_manifest(tmp_path, [])
    serial_dirs = [str(write_summary(tmp_path / f"s{i}", v)) for i, v in enumerate(serial)]
    parallel_dirs = [str(write_summary(tmp_path / f"p{i}", v, jobs=4)) for i, v in enumerate(parallel)]
    proc = run_raw(tmp_path, manifest, "--serial-runs", *serial_dirs, "--parallel-runs", *parallel_dirs, *extra)
    return proc, manifest


def test_equivalence_classifies_each_step_from_existing_summaries(tmp_path: Path):
    proc, _ = summaries_check(
        tmp_path,
        serial=[
            {"stable": "passed", "gap": "passed", "flaky": "passed", "broken": "failed", "skip": "skipped"},
            {"stable": "passed", "gap": "passed", "flaky": "failed", "broken": "failed", "skip": "skipped"},
        ],
        parallel=[
            {"stable": "passed", "gap": "passed", "flaky": "passed", "broken": "failed", "skip": "passed"},
            {"stable": "passed", "gap": "failed", "flaky": "passed", "broken": "failed", "skip": "passed"},
        ],
    )

    assert proc.returncode == 1, proc.stdout + proc.stderr
    report = equivalence_report(tmp_path)
    assert {sid: st["class"] for sid, st in report["steps"].items()} == {
        "stable": "same",
        "gap": "parallel_gap",
        "flaky": "flaky",
        "broken": "same",
        "skip": "not_compared",
    }
    assert report["parallel_gaps"] == ["gap"]
    assert report["new_flaky"] == ["flaky"]
    assert report["jobs"] == [4]
    assert report["steps"]["gap"]["parallel"] == ["passed", "failed"]
    assert "gap: serial 0/2 failed, parallel 1/2 failed" in proc.stdout


def test_a_step_that_fails_in_every_serial_run_and_passes_in_a_parallel_one_is_a_gap(tmp_path: Path):
    proc, _ = summaries_check(
        tmp_path, serial=[{"a": "failed"}, {"a": "failed"}], parallel=[{"a": "failed"}, {"a": "passed"}]
    )

    assert proc.returncode == 1
    assert equivalence_report(tmp_path)["parallel_gaps"] == ["a"]


def test_equivalence_passes_when_the_only_differences_are_known_flaky_steps(tmp_path: Path):
    (tmp_path / "nonreg-flaky.json").write_text(json.dumps({"steps": {"f": {"reason": "timing"}}}), encoding="utf-8")
    proc, _ = summaries_check(
        tmp_path,
        serial=[{"ok": "passed", "f": "passed"}, {"ok": "passed", "f": "failed"}],
        parallel=[{"ok": "passed", "f": "failed"}, {"ok": "passed", "f": "failed"}],
    )

    assert proc.returncode == 0, proc.stdout + proc.stderr
    report = equivalence_report(tmp_path)
    assert report["flaky"] == ["f"] and report["new_flaky"] == []
    assert report["steps"]["f"]["known_flaky"] is True
    assert "f [known]" in proc.stdout


def test_record_flaky_adds_the_new_flaky_steps_to_the_list_next_to_the_manifest(tmp_path: Path):
    (tmp_path / "nonreg-flaky.json").write_text(json.dumps({"steps": {"old": {"reason": "kept"}}}), encoding="utf-8")
    proc, _ = summaries_check(
        tmp_path,
        serial=[{"f": "passed"}, {"f": "failed"}],
        parallel=[{"f": "passed"}, {"f": "passed"}],
        extra=("--record-flaky",),
    )

    assert proc.returncode == 0, proc.stdout + proc.stderr
    flaky = json.loads((tmp_path / "nonreg-flaky.json").read_text(encoding="utf-8"))["steps"]
    assert list(flaky) == ["f", "old"]
    assert flaky["old"] == {"reason": "kept"}
    assert "equivalence check" in flaky["f"]["reason"]
    assert equivalence_report(tmp_path)["recorded_flaky"] == ["f"]


def test_compare_does_not_fail_on_a_known_flaky_step(tmp_path: Path):
    manifest = write_manifest(tmp_path, [])
    (tmp_path / "nonreg-flaky.json").write_text(json.dumps({"steps": {"f": {"reason": "timing"}}}), encoding="utf-8")
    current = write_summary(tmp_path / "cur", {"ok": "passed", "f": "failed"})
    baseline = write_summary(tmp_path / "base", {"ok": "passed", "f": "passed"})

    proc = run_raw(tmp_path, manifest, "--compare", str(current), str(baseline))
    assert proc.returncode == 0, proc.stdout + proc.stderr
    assert "new failures (0)" in proc.stdout
    assert "known flaky, not counted (1): f" in proc.stdout

    other = write_summary(tmp_path / "other", {"ok": "failed", "f": "failed"})
    proc = run_raw(tmp_path, manifest, "--compare", str(other), str(baseline))
    assert proc.returncode == 1
    assert "new failures (1): ok" in proc.stdout


def test_equivalence_runs_k_serial_and_k_parallel_runs_and_finds_a_parallel_only_failure(tmp_path: Path):
    busy = tmp_path / "busy"
    # "holder" marks a shared resource busy while it runs; "user" fails when it finds it busy, which only
    # happens when the two run at the same time.
    holder = (
        "import pathlib, time; "
        f"p = pathlib.Path({str(busy)!r}); p.write_text('x'); time.sleep(1.0); p.unlink()"
    )
    user = f"import pathlib, sys, time; time.sleep(0.4); sys.exit(1 if pathlib.Path({str(busy)!r}).exists() else 0)"
    manifest = write_manifest(
        tmp_path,
        [
            {"id": "holder", "tier": "unit", "title": "holder", "requires": "none", "argv": ["python", "-c", holder]},
            {"id": "user", "tier": "unit", "title": "user", "requires": "none", "argv": ["python", "-c", user]},
        ],
    )

    proc = run_raw(tmp_path, manifest, "--tier", "unit", *FS_PROFILE, "--equivalence", "2", "--jobs", "2")

    assert proc.returncode == 1, proc.stdout + proc.stderr
    report = equivalence_report(tmp_path)
    assert len(report["serial_runs"]) == 2 and len(report["parallel_runs"]) == 2
    assert len(set(report["serial_runs"] + report["parallel_runs"])) == 4
    assert report["jobs"] == [2]
    assert report["steps"]["holder"]["class"] == "same"
    assert report["steps"]["user"] == {
        "class": "parallel_gap",
        "serial": ["passed", "passed"],
        "parallel": ["failed", "failed"],
        "known_flaky": False,
    }


@pytest.mark.parametrize(
    "extra",
    [
        ["--equivalence", "2", "--jobs", "1"],
        ["--equivalence", "0", "--jobs", "2"],
        ["--equivalence", "2", "--compare", "latest"],
        ["--serial-runs", "x"],
        ["--record-flaky"],
    ],
)
def test_equivalence_rejects_inconsistent_options(tmp_path: Path, extra: list[str]):
    manifest = write_manifest(tmp_path, [])
    proc = run_raw(tmp_path, manifest, *extra)
    assert proc.returncode == 2, proc.stdout + proc.stderr
    assert "error:" in proc.stderr


def test_a_run_compared_with_a_baseline_does_not_fail_on_a_known_flaky_step(tmp_path: Path):
    manifest = write_manifest(
        tmp_path,
        [
            {"id": "ok", "tier": "unit", "title": "ok", "requires": "none", "argv": ["python", "-c", "pass"]},
            {"id": "f", "tier": "unit", "title": "f", "requires": "none", "argv": ["python", "-c", "raise SystemExit(1)"]},
        ],
    )
    baseline = write_summary(tmp_path / "base", {"ok": "passed", "f": "passed"})

    code, _, _ = run_nonreg(tmp_path / "unknown", manifest, "--tier", "unit", *FS_PROFILE, "--compare", str(baseline))
    assert code == 1

    (tmp_path / "nonreg-flaky.json").write_text(json.dumps({"steps": {"f": {"reason": "timing"}}}), encoding="utf-8")
    code, summary, _ = run_nonreg(tmp_path / "known", manifest, "--tier", "unit", *FS_PROFILE, "--compare", str(baseline))
    assert summary["counts"]["failed"] == 1
    assert code == 0


def test_two_equivalence_checks_in_the_same_second_keep_both_reports(tmp_path: Path):
    runner = load_runner()
    root = tmp_path / "results"
    (root / "equivalence").mkdir(parents=True)
    first = runner.unique_stamp(root / "equivalence", ".json")
    (root / "equivalence" / f"{first}.json").write_text("{}", encoding="utf-8")

    second = runner.unique_stamp(root / "equivalence", ".json")

    assert second != first
    assert not (root / "equivalence" / f"{second}.json").exists()


# --- #736: built packages that change during the run taint the steps -----------------------------


def py_step(step_id: str, code: str, **fields) -> dict:
    return {"id": step_id, "tier": "unit", "title": step_id, "requires": "none", "argv": ["python", "-c", code], **fields}


def packages_root(tmp_path: Path) -> Path:
    root = tmp_path / "checkout"
    for folder in ("packages/miroir-core/dist", "packages/miroir-sandbox/dist", "packages/miroir-server/release"):
        (root / folder).mkdir(parents=True)
        (root / folder / "index.js").write_text("// built\n", encoding="utf-8")
    return root


def rewrite(path: Path, sleep: float = 0.0) -> str:
    return f"import pathlib, time; time.sleep({sleep}); pathlib.Path({str(path)!r}).write_text('// rebuilt, longer\\n')"


def test_a_step_that_rebuilds_a_watched_package_taints_itself_and_the_steps_after_it(tmp_path: Path):
    root = packages_root(tmp_path)
    manifest = write_manifest(
        tmp_path,
        [
            py_step("before", "pass"),
            py_step("builder", rewrite(root / "packages/miroir-core/dist/index.js")),
            py_step("after", "raise SystemExit(3)"),
        ],
    )

    code, summary, snap_dir = run_nonreg(tmp_path, manifest, "--tier", "unit", *FS_PROFILE, "--watch-root", str(root))

    assert code == 1
    by_id = {st["id"]: st for st in summary["steps"]}
    assert by_id["before"]["status"] == "passed"
    assert by_id["builder"]["status"] == "tainted"
    assert by_id["builder"]["verdict_before_taint"] == "passed"
    assert by_id["builder"]["tainted_by"] == ["packages/miroir-core/dist/index.js"]
    assert by_id["after"]["status"] == "tainted"
    assert by_id["after"]["verdict_before_taint"] == "failed"
    assert summary["counts"]["tainted"] == 2
    assert "tainted: **2**" in (snap_dir / "summary.md").read_text(encoding="utf-8")


def test_a_removed_release_file_taints_the_run(tmp_path: Path):
    root = packages_root(tmp_path)
    release = root / "packages/miroir-server/release/index.js"
    manifest = write_manifest(tmp_path, [py_step("cleaner", f"import pathlib; pathlib.Path({str(release)!r}).unlink()")])

    code, summary, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", *FS_PROFILE, "--watch-root", str(root))

    assert code == 1
    assert summary["steps"][0]["tainted_by"] == ["packages/miroir-server/release/index.js"]


def test_the_outputs_a_step_declares_in_builds_are_not_watched(tmp_path: Path):
    root = packages_root(tmp_path)
    manifest = write_manifest(
        tmp_path,
        [
            py_step("sandbox", rewrite(root / "packages/miroir-sandbox/dist/index.js"), builds=["packages/miroir-sandbox/dist"]),
            py_step("after", "pass"),
        ],
    )

    code, summary, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", *FS_PROFILE, "--watch-root", str(root))

    assert code == 0, summary
    assert [st["status"] for st in summary["steps"]] == ["passed", "passed"]
    assert "tainted" not in summary["counts"]


def test_a_build_during_a_parallel_step_taints_the_steps_running_with_it(tmp_path: Path):
    root = packages_root(tmp_path)
    manifest = write_manifest(
        tmp_path,
        [
            py_step("long", "import time; time.sleep(1.5)"),
            py_step("builder", rewrite(root / "packages/miroir-core/dist/index.js", sleep=0.3)),
        ],
    )

    code, summary, _ = run_nonreg(
        tmp_path, manifest, "--tier", "unit", *FS_PROFILE, "--jobs", "2", "--watch-root", str(root)
    )

    assert code == 1
    assert [st["status"] for st in summary["steps"]] == ["tainted", "tainted"]


def test_compare_and_equivalence_take_no_verdict_from_a_tainted_step(tmp_path: Path):
    manifest = write_manifest(tmp_path, [])
    current = write_summary(tmp_path / "cur", {"ok": "passed", "t": "tainted"})
    baseline = write_summary(tmp_path / "base", {"ok": "passed", "t": "failed"})

    proc = run_raw(tmp_path, manifest, "--compare", str(current), str(baseline))

    assert proc.returncode == 0  # the run itself exits 1 on a tainted step; the compare has nothing to say
    assert "tainted, not compared (1): t" in proc.stdout
    assert "fixed (0)" in proc.stdout

    (tmp_path / "eq").mkdir()
    proc, _ = summaries_check(tmp_path / "eq", serial=[{"t": "passed"}], parallel=[{"t": "tainted"}])
    assert proc.returncode == 0
    assert equivalence_report(tmp_path / "eq")["not_compared"] == ["t"]


BUILD_COMMAND = re.compile(r"npm run (build|devBuild|build:[\w-]+)\b|\btsup\b")


def test_every_manifest_step_that_builds_a_package_declares_its_outputs():
    undeclared = [
        s["id"] for s in REAL_MANIFEST["steps"] if BUILD_COMMAND.search(" ".join(s["argv"])) and not s.get("builds")
    ]
    assert undeclared == [], "declare the folders these steps build in `builds` (#736)"
