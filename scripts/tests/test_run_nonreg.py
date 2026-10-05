"""#318 Slice 0: characterize the legacy contract of scripts/run-nonreg.py.

The real script runs against a small temporary manifest whose steps are `python -c` stubs,
so later slices (--timings, --runner shared) can prove the default run is unchanged.
"""

from __future__ import annotations

import json
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
}


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
    if "--jobs" in extra and "--environments-dir" not in extra:
        # A parallel run removes its workers' state for the test environments it knows: none here,
        # so this run never touches the state of a nonreg run that started these tests.
        (tmp_path / "no-environments").mkdir(exist_ok=True)
        jobs += ["--environments-dir", str(tmp_path / "no-environments")]
    proc = subprocess.run(
        [
            sys.executable,
            str(SCRIPT),
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

    assert last["id"] == "unit-321-tracked-assets"
    assert "tracked_assets_guard.py check --since {snapshot_dir}/tracked-assets-before.json" in " ".join(last["argv"])
    assert "miroir-env -- check --strict" in " ".join(last["argv"])


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
        [sys.executable, str(SCRIPT), "--manifest", str(scoped_manifest), "--results-root", str(tmp_path / "r"), "--scope", "a,nope"],
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
        [sys.executable, str(SCRIPT), "--manifest", str(scoped_manifest), "--results-root", str(tmp_path / "r"), "--scope", ""],
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
        [sys.executable, str(SCRIPT), "--manifest", str(manifest), "--results-root", str(tmp_path / "scoped"),
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
            sys.executable,
            str(SCRIPT),
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

    proc = run_raw(tmp_path, storage_manifest(tmp_path), "--storage", storage, "--environments-dir", str(envs))

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
            tmp_path, storage_manifest(tmp_path), "--storage", "sql", "--environments-dir", str(envs)
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

    proc = run_raw(tmp_path, storage_manifest(tmp_path), "--environments-dir", str(envs), *extra)

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
        env = {**os.environ, variable: value.format(port=port)}

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


def test_serial_run_runs_steps_one_after_the_other_without_a_worker(tmp_path: Path):
    log = tmp_path / "order.log"
    manifest = write_manifest(tmp_path, [order_step("a", log), order_step("b", log)])

    # A worker left in the calling shell does not reach a serial run's steps.
    code, summary, _ = run_nonreg(
        tmp_path, manifest, "--tier", "unit", env={**os.environ, "MIROIR_TEST_WORKER": "w9"}
    )

    assert code == 0
    assert log.read_text(encoding="utf-8").splitlines() == ["start a -", "end a", "start b -", "end b"]
    assert "jobs" not in summary


# #477 Slice 4: --jobs N runs steps and shared groups at the same time, one worker per job.
def timed_step(step_id: str, log: Path, *, sleep: float = 1.0, exit_code: int = 0) -> dict:
    code = (
        "import os, sys, time, json; "
        f"p = {str(log)!r}; "
        "w = os.environ.get('MIROIR_TEST_WORKER', '-'); "
        f"open(p, 'a').write(json.dumps(['start', {step_id!r}, w, time.time()]) + '\\n'); "
        f"time.sleep({sleep}); "
        f"open(p, 'a').write(json.dumps(['end', {step_id!r}, w, time.time()]) + '\\n'); "
        f"sys.exit({exit_code})"
    )
    return {"id": step_id, "tier": "unit", "title": step_id, "requires": "none", "argv": ["python", "-c", code]}


def read_events(log: Path) -> list[list]:
    return [json.loads(line) for line in log.read_text(encoding="utf-8").splitlines()]


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
        [sys.executable, str(SCRIPT), "--manifest", str(manifest), "--results-root", str(results_root),
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
        [sys.executable, str(SCRIPT), "--manifest", str(manifest), "--results-root", str(tmp_path / "r"), "--jobs", value],
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

        code, summary, _ = run_nonreg(
            tmp_path, manifest, "--tier", "unit", "--jobs", "2", "--keep-worker-state", *FS_PROFILE, *env_args
        )
        assert code == 0
        assert workers() and set(workers()) <= {f"{state}@w1", f"{state}@w2"}
        assert summary["worker_state"] == "kept"
    finally:
        for leftover in (ROOT / ".miroir").glob(f"{state}@*"):
            shutil.rmtree(leftover)


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
def test_a_step_that_runs_alone_waits_for_the_others_and_holds_the_next(tmp_path: Path):
    log = tmp_path / "events.log"
    alone = {**timed_step("alone", log, sleep=0.3), "parallel": False}
    manifest = write_manifest(
        tmp_path,
        [timed_step("before", log, sleep=0.6), alone, timed_step("after", log, sleep=0.3), timed_step("after2", log, sleep=0.3)],
    )

    code, _, _ = run_nonreg(tmp_path, manifest, "--tier", "unit", "--jobs", "3", *FS_PROFILE)

    s = spans(log)
    assert code == 0
    assert s["alone"][0] >= s["before"][1]
    assert s["after"][0] >= s["alone"][1]
    assert s["after2"][0] >= s["alone"][1]
    assert s["alone"][2] == "-"  # no worker: the run bracket is not a test environment step
    assert overlap(s["after"], s["after2"])


def test_the_run_bracket_runs_alone():
    steps = {s["id"]: s for s in json.loads((ROOT / "scripts" / "nonreg-manifest.json").read_text(encoding="utf-8"))["steps"]}

    assert steps["unit-321-environment-before"].get("parallel") is False
    assert steps["unit-321-tracked-assets"].get("parallel") is False


def test_parallel_is_only_ever_set_to_false():
    steps = json.loads((ROOT / "scripts" / "nonreg-manifest.json").read_text(encoding="utf-8"))["steps"]

    assert {s["parallel"] for s in steps if "parallel" in s} <= {False}
