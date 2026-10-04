#!/usr/bin/env python3
"""Repo-wide non-regression runner for Miroir.

Reads scripts/nonreg-manifest.json, runs selected tiers, writes a timestamped
snapshot under test-results/nonreg/<stamp>/, and prints a synthetic summary.

Examples:
  python scripts/run-nonreg.py --tier default --run-all
  python scripts/run-nonreg.py --tier unit --fail-fast
  npm run nonreg -- --tier default --run-all
  npm run nonreg -- --storage filesystem
  npm run nonreg -- --storage filesystem --local-cache zustand
  python scripts/run-nonreg.py --compare test-results/nonreg/<stamp>/summary.json
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Literal
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "scripts" / "nonreg-manifest.json"
RESULTS_ROOT = ROOT / "test-results" / "nonreg"
ENVIRONMENTS_DIR = ROOT / "environments"

# #390: `--storage <s>` runs the integration steps on profile `emulatedServer-<s>`, whose test
# environment is `environments/test-<s>.json`. Steps with `"requires": "storage"` need that store.
STORAGES = ("sql", "filesystem", "indexedDb", "mongodb")
EMULATED_PROFILE_PREFIX = "emulatedServer-"
REQUIRES_STORAGE = "storage"

# #446: `--local-cache <c>` builds the tests' DomainControllers on miroir-localcache-<c>. The runner
# passes it to every step in MIROIR_TEST_LOCAL_CACHE, read by the test setup (setupMiroirTest,
# IntegrationTestSession). Without the option, steps run on redux.
LOCAL_CACHES = ("redux", "zustand")
DEFAULT_LOCAL_CACHE = "redux"
LOCAL_CACHE_ENV = "MIROIR_TEST_LOCAL_CACHE"

TierName = Literal["unit", "default", "full"]
TIER_ORDER: dict[str, int] = {"unit": 0, "default": 1, "full": 2}
StepStatus = Literal["passed", "failed", "skipped", "not_run"]

VITEST_SUMMARY_RE = re.compile(
    r"Tests\s+(?:(\d+)\s+failed\s*)?(?:(\d+)\s+passed\s*)?(?:(\d+)\s+skipped\s*)?",
    re.IGNORECASE,
)
TEST_FILES_RE = re.compile(
    r"Test Files\s+(?:(\d+)\s+failed\s*)?(?:(\d+)\s+passed\s*)?(?:(\d+)\s+skipped\s*)?",
    re.IGNORECASE,
)

# ANSI color codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
GRAY = "\033[90m"
RESET = "\033[0m"


@dataclass
class StepResult:
    id: str
    title: str
    tier: str
    requires: str
    status: StepStatus
    exit_code: int | None = None
    duration_s: float | None = None
    skip_reason: str | None = None
    argv: list[str] = field(default_factory=list)
    log_file: str | None = None
    vitest: dict[str, int] | None = None
    error_tail: str | None = None
    # Fields only written by --runner shared (#318); absent from legacy summaries.
    extra: dict[str, Any] = field(default_factory=dict)


def step_to_dict(result: StepResult) -> dict[str, Any]:
    data = asdict(result)
    extra = data.pop("extra")
    data.update(extra)
    return data


def load_manifest() -> dict[str, Any]:
    with MANIFEST_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


def repo_relative(path: Path) -> str:
    """Path relative to the repo root when inside it, else absolute (e.g. --results-root in /tmp)."""
    try:
        return str(path.relative_to(ROOT)).replace("\\", "/")
    except ValueError:
        return str(path).replace("\\", "/")


def expand_argv(argv: list[str], profile: str, snap_dir: Path | None = None) -> list[str]:
    """`{profile}` → the run's profile; `{snapshot_dir}` → the run's snapshot directory (#321)."""
    expanded = [part.replace("{profile}", profile) for part in argv]
    if snap_dir is None:
        return expanded
    return [part.replace("{snapshot_dir}", snap_dir.as_posix()) for part in expanded]


def resolve_argv(argv: list[str]) -> list[str]:
    """Resolve npm/npx/node on Windows (npm.cmd) so subprocess can spawn without shell=True."""
    if not argv:
        return argv
    cmd = argv[0]
    if cmd not in ("npm", "npx", "node", "pnpm", "yarn"):
        return argv
    found = shutil.which(cmd)
    if found:
        return [found, *argv[1:]]
    if os.name == "nt":
        for ext in (".cmd", ".exe", ".bat"):
            found = shutil.which(cmd + ext)
            if found:
                return [found, *argv[1:]]
    return argv


def profile_for_storage(storage: str) -> str:
    return EMULATED_PROFILE_PREFIX + storage


def storage_of_profile(profile: str) -> str | None:
    """The store of an `emulatedServer-<storage>` profile; None for any other profile."""
    if not profile.startswith(EMULATED_PROFILE_PREFIX):
        return None
    storage = profile[len(EMULATED_PROFILE_PREFIX) :]
    return storage if storage in STORAGES else None


def load_environment_connections(name: str, environments_dir: Path) -> dict[str, Any]:
    """`connections` of environments/<name>.json, merged over the environments it extends."""
    path = environments_dir / f"{name}.json"
    if not path.is_file():
        return {}
    env = json.loads(path.read_text(encoding="utf-8"))
    connections = dict(load_environment_connections(env["extends"], environments_dir)) if env.get("extends") else {}
    connections.update(env.get("connections") or {})
    return connections


def storage_service(storage: str, environments_dir: Path) -> tuple[str, str, int] | None:
    """(service, host, port) the store needs; None when it needs none.

    The address comes from the store's test environment, overridden like the integration tests
    do it (IntegrationTestSession.ts): `MIROIR_TEST_POSTGRES_HOST` replaces the PostgreSQL host,
    `MIROIR_TEST_MONGODB_CONNECTION_STRING` the MongoDB url.
    """
    connections = load_environment_connections(f"test-{storage}", environments_dir)
    if storage == "sql":
        postgres = connections.get("postgres") or {}
        host = os.environ.get("MIROIR_TEST_POSTGRES_HOST") or postgres.get("host") or "localhost"
        return ("PostgreSQL", host, int(postgres.get("port") or 5432))
    if storage == "mongodb":
        url = urlsplit(
            os.environ.get("MIROIR_TEST_MONGODB_CONNECTION_STRING")
            or (connections.get("mongodb") or {}).get("url")
            or "mongodb://localhost:27017"
        )
        return ("MongoDB", url.hostname or "localhost", url.port or 27017)
    return None


def check_storage_service(storage: str, environments_dir: Path) -> str | None:
    """Error message when the store's service does not accept connections; None when it does."""
    service = storage_service(storage, environments_dir)
    if service is None:
        return None
    name, host, port = service
    try:
        with socket.create_connection((host, port), timeout=3):
            return None
    except OSError as exc:
        return (
            f"{name} is not reachable at {host}:{port} (environments/test-{storage}.json, "
            f"MIROIR_TEST_POSTGRES_HOST, MIROIR_TEST_MONGODB_CONNECTION_STRING): {exc}. "
            f"Start it, or choose another store with --storage ({', '.join(STORAGES)})."
        )


def step_in_tier(step_tier: str, selected: TierName) -> bool:
    return TIER_ORDER[step_tier] <= TIER_ORDER[selected]


ALWAYS_SCOPE = "always"


def select_steps(
    manifest: dict[str, Any],
    tier: TierName,
    only_ids: set[str] | None,
    scopes: set[str] | None,
) -> list[dict[str, Any]]:
    """Steps of the tier, restricted to `--only` ids and `--scope` scopes (#351) when given.

    With both, the selection is their union; `always` steps join every scoped selection.
    """
    if only_ids is None and scopes is None:
        return [s for s in manifest["steps"] if step_in_tier(s["tier"], tier)]
    wanted_scopes = (scopes or set()) | ({ALWAYS_SCOPE} if scopes else set())

    def selected(step: dict[str, Any]) -> bool:
        if only_ids is not None and step["id"] in only_ids:
            return True
        return bool(wanted_scopes & set(step.get("scopes", [])))

    return [s for s in manifest["steps"] if step_in_tier(s["tier"], tier) and selected(s)]


def parse_scopes(arg: str, manifest: dict[str, Any]) -> list[str]:
    """Scope names from `--scope a,b`; raises ValueError on a name the manifest does not declare."""
    names = [s.strip() for s in arg.split(",") if s.strip()]
    if not names:
        raise ValueError("--scope needs at least one scope name")
    declared = sorted(n for n in manifest.get("scopes", {}) if n != ALWAYS_SCOPE)
    unknown = [n for n in names if n not in declared]
    if unknown:
        raise ValueError(
            f"unknown scope(s): {', '.join(unknown)}; declared scopes: {', '.join(declared) or '(none)'}"
        )
    return names


def parse_vitest_counts(text: str) -> dict[str, int] | None:
    """Best-effort parse of Vitest footer counts from combined stdout/stderr."""
    files_m = None
    tests_m = None
    for line in text.splitlines():
        if "Test Files" in line:
            files_m = TEST_FILES_RE.search(line)
        if line.strip().startswith("Tests ") or "Tests " in line and "passed" in line.lower():
            tests_m = VITEST_SUMMARY_RE.search(line)
    if not files_m and not tests_m:
        return None
    out: dict[str, int] = {}
    if tests_m:
        failed, passed, skipped = tests_m.groups()
        out["tests_failed"] = int(failed or 0)
        out["tests_passed"] = int(passed or 0)
        out["tests_skipped"] = int(skipped or 0)
    if files_m:
        failed, passed, skipped = files_m.groups()
        out["files_failed"] = int(failed or 0)
        out["files_passed"] = int(passed or 0)
        out["files_skipped"] = int(skipped or 0)
    return out or None


def tail_text(text: str, max_lines: int = 40) -> str:
    lines = text.splitlines()
    return "\n".join(lines[-max_lines:])


def spawn(argv: list[str], env: dict[str, str] | None) -> subprocess.CompletedProcess[str]:
    """Run one command from the repo root, capturing combined output."""
    # Windows: npm/npx resolve to *.cmd; CreateProcess cannot launch .cmd without a shell.
    if os.name == "nt":
        return subprocess.run(
            subprocess.list2cmdline(argv),
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=True,
            env=env,
        )
    return subprocess.run(
        argv,
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        shell=False,
        env=env,
    )


def run_step(
    step: dict[str, Any],
    *,
    profile: str,
    snap_dir: Path,
    dry_run: bool,
    timings: bool = False,
) -> StepResult:
    step_id = step["id"]
    argv = resolve_argv(expand_argv(list(step["argv"]), profile, snap_dir))
    title = step["title"]
    tier = step["tier"]
    requires = step.get("requires", "none")

    result = StepResult(
        id=step_id,
        title=title,
        tier=tier,
        requires=requires,
        status="not_run",
        argv=argv,
    )

    log_path = snap_dir / "logs" / f"{step_id}.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    result.log_file = repo_relative(log_path)

    if dry_run:
        result.status = "skipped"
        result.skip_reason = "dry-run"
        log_path.write_text(f"DRY-RUN: {' '.join(argv)}\n", encoding="utf-8")
        return result

    print(f"\n=== [{tier}] {step_id} ===", flush=True)
    print(f"$ {' '.join(argv)}", flush=True)
    env = timing_env(snap_dir, step_id) if timings else None
    started = time.perf_counter()
    try:
        proc = spawn(argv, env)
    except OSError as exc:
        result.status = "failed"
        result.exit_code = 127
        result.duration_s = round(time.perf_counter() - started, 3)
        result.error_tail = str(exc)
        log_path.write_text(f"OSError: {exc}\nargv: {argv}\n", encoding="utf-8")
        print(f"{RED}FAILED{RESET} (spawn): {exc}", flush=True)
        return result

    duration = time.perf_counter() - started
    combined = (proc.stdout or "") + ("\n" if proc.stderr else "") + (proc.stderr or "")
    log_path.write_text(combined, encoding="utf-8")
    result.exit_code = proc.returncode
    result.duration_s = round(duration, 3)
    result.vitest = parse_vitest_counts(combined)
    if proc.returncode == 0:
        result.status = "passed"
        print(f"{GREEN}PASSED{RESET} ({result.duration_s}s)", flush=True)
    else:
        result.status = "failed"
        result.error_tail = tail_text(combined)
        print(f"{RED}FAILED{RESET} exit={proc.returncode} ({result.duration_s}s)", flush=True)
    return result


TIMINGS_DIRNAME = "timings"
SLOWEST_LIMIT = 15


def timing_env(snap_dir: Path, step_id: str) -> dict[str, str]:
    """Env for one step with the opt-in timing profile (#318): vitest configs add the timing runner."""
    return {
        **os.environ,
        "MIROIR_TEST_TIMING": "1",
        "MIROIR_TEST_TIMING_DIR": str(snap_dir / TIMINGS_DIRNAME / step_id),
    }


def collect_step_timings(snap_dir: Path, results: list[StepResult]) -> dict[str, Any]:
    """Merge the per-file JSON written by scripts/vitest/timingRunner.mjs into one document."""
    steps = []
    for result in results:
        step_dir = snap_dir / TIMINGS_DIRNAME / result.id
        files = []
        if step_dir.is_dir():
            for path in sorted(step_dir.glob("*.json")):
                try:
                    files.append(json.loads(path.read_text(encoding="utf-8")))
                except (OSError, json.JSONDecodeError) as exc:
                    files.append({"file": path.name, "error": str(exc)})
        steps.append({"id": result.id, "status": result.status, "duration_s": result.duration_s, "files": files})
    return {"steps": steps}


def _ms(value: Any) -> float:
    return float(value) if isinstance(value, (int, float)) else 0.0


def timings_markdown(timings: dict[str, Any]) -> list[str]:
    """Slowest-first tables for summary.md (only written with --timings)."""
    step_rows = []
    file_rows = []
    test_rows = []
    for step in timings["steps"]:
        files = [f for f in step["files"] if "error" not in f]
        hooks_ms = 0.0
        bodies_ms = 0.0
        collect_ms = 0.0
        for record in files:
            collect_ms += _ms(record.get("collect_ms"))
            suite_hooks = sum(_ms(s.get("before_all_ms")) + _ms(s.get("after_all_ms")) for s in record.get("suites", []))
            test_hooks = sum(_ms(t.get("before_each_ms")) + _ms(t.get("after_each_ms")) for t in record.get("tests", []))
            test_bodies = sum(_ms(t.get("body_ms")) for t in record.get("tests", []))
            hooks_ms += suite_hooks + test_hooks
            bodies_ms += test_bodies
            file_rows.append((suite_hooks + test_hooks, step["id"], record.get("file", "?"), _ms(record.get("collect_ms")), suite_hooks, test_hooks, test_bodies))
            for test in record.get("tests", []):
                test_rows.append((_ms(test.get("total_ms")), step["id"], test.get("name", "?"), _ms(test.get("before_each_ms")), _ms(test.get("body_ms")), _ms(test.get("after_each_ms"))))
        step_rows.append((step.get("duration_s") or 0.0, step["id"], len(files), collect_ms, hooks_ms, bodies_ms))

    def secs(ms: float) -> str:
        return f"{ms / 1000:.2f}s"

    lines = ["## Timings", "", "### Slowest steps", "", "| Step | Wall | Files | Collect | Hooks | Test bodies |", "|---|---|---|---|---|---|"]
    for wall, sid, nfiles, collect_ms, hooks_ms, bodies_ms in sorted(step_rows, reverse=True)[:SLOWEST_LIMIT]:
        lines.append(f"| `{sid}` | {wall}s | {nfiles} | {secs(collect_ms)} | {secs(hooks_ms)} | {secs(bodies_ms)} |")
    lines += ["", "### Most time in hooks, by test file", "", "| Step | File | Collect | beforeAll+afterAll | beforeEach+afterEach | Test bodies |", "|---|---|---|---|---|---|"]
    for _, sid, fname, collect_ms, suite_hooks, test_hooks, bodies_ms in sorted(file_rows, reverse=True)[:SLOWEST_LIMIT]:
        lines.append(f"| `{sid}` | `{fname}` | {secs(collect_ms)} | {secs(suite_hooks)} | {secs(test_hooks)} | {secs(bodies_ms)} |")
    lines += ["", "### Slowest tests", "", "| Step | Test | Total | beforeEach | Body | afterEach |", "|---|---|---|---|---|---|"]
    for total, sid, name, before_ms, body_ms, after_ms in sorted(test_rows, reverse=True)[:SLOWEST_LIMIT]:
        lines.append(f"| `{sid}` | {name} | {secs(total)} | {secs(before_ms)} | {secs(body_ms)} | {secs(after_ms)} |")
    lines.append("")
    return lines


# ------------------------------------------------------------------------------------------------
# Shared runner (#318, opt-in with --runner shared)
#
# A step joins a shared group when its manifest entry has
#   "shared": {"group": "<name>", "argv": [<command prefix>], "files": [<vitest filters>]}
# or, for MiroirTest runner/action suites run by one entry file (testMiroir --shared),
#   "shared": {"group": "<name>", "argv": [<command prefix>], "suites": [<suite keys>]}
# Every member of a group has the same argv prefix. The group runs once:
#   files:  <argv prefix> --no-isolate --reporter=json --outputFile.json=<report> <all files>
#   suites: <argv prefix> --reporter=json --outputFile.json=<report> --suites <all suites>
# and each member's verdict comes from the report entries of its files (path contains a filter)
# or of its suites (tests whose first describe is the suite key).
# Members that fail in shared mode re-run alone with their legacy argv (fallback), so a state leak
# between files never turns into a false failure; the step records both verdicts.

SHARED_DIRNAME = "shared"


def plan_shared_groups(steps: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
    groups: dict[str, list[dict[str, Any]]] = {}
    for step in steps:
        shared = step.get("shared")
        if not shared:
            continue
        groups.setdefault(shared["group"], []).append(step)
    for name, members in groups.items():
        prefixes = {json.dumps(m["shared"]["argv"]) for m in members}
        if len(prefixes) > 1:
            raise ValueError(f"shared group {name!r}: members use different argv prefixes")
    return groups


def _vitest_counts_from_report(entries: list[dict[str, Any]]) -> dict[str, int]:
    statuses = [a.get("status") for e in entries for a in e.get("assertionResults", [])]
    return {
        "tests_failed": statuses.count("failed"),
        "tests_passed": statuses.count("passed"),
        "tests_skipped": sum(1 for st in statuses if st in ("skipped", "pending", "todo")),
        "files_failed": sum(1 for e in entries if e.get("status") != "passed"),
        "files_passed": sum(1 for e in entries if e.get("status") == "passed"),
        "files_skipped": 0,
    }


def _matches(path: str, filters: list[str]) -> bool:
    normalized = path.replace("\\", "/")
    return any(f in normalized for f in filters)


def _entries_by_suite(entries: list[dict[str, Any]], members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Split file-level report entries into one pseudo-entry per member, by first describe title."""
    split: list[dict[str, Any]] = []
    for member in members:
        suites = set(member["shared"]["suites"])
        assertions = [
            a
            for e in entries
            for a in e.get("assertionResults", [])
            if (a.get("ancestorTitles") or [None])[0] in suites
        ]
        if not assertions:
            continue
        failed = any(a.get("status") == "failed" for a in assertions)
        split.append(
            {
                "member": member["id"],
                "name": ",".join(sorted(suites)),
                "status": "failed" if failed else "passed",
                "assertionResults": assertions,
                "startTime": 0,
                "endTime": sum(a.get("duration") or 0 for a in assertions),
            }
        )
    return split


def _record_for_suites(record: dict[str, Any], suites: list[str]) -> dict[str, Any]:
    """The part of a per-file timing record that belongs to the given describe titles."""
    def belongs(name: str) -> bool:
        return any(name == k or name.startswith(f"{k} > ") for k in suites)

    return {
        **record,
        "phases": [p for p in record.get("phases", []) if any(p.get("name", "").endswith(f" {k}") for k in suites)],
        "suites": [x for x in record.get("suites", []) if belongs(x.get("name", ""))],
        "tests": [t for t in record.get("tests", []) if belongs(t.get("name", ""))],
    }


def _distribute_group_timings(snap_dir: Path, group: str, members: list[dict[str, Any]]) -> None:
    group_dir = snap_dir / TIMINGS_DIRNAME / f"{SHARED_DIRNAME}-{group}"
    if not group_dir.is_dir():
        return
    # Collect, setup, prepare and environment are paid once per file for the whole group: they
    # go to the first member that owns part of the file, and are 0 for the others.
    startup_keys = ("collect_ms", "setup_ms", "prepare_ms", "environment_ms")
    for record_path in sorted(group_dir.glob("*.json")):
        try:
            filepath = json.loads(record_path.read_text(encoding="utf-8")).get("filepath", "")
        except (OSError, json.JSONDecodeError):
            continue
        startup_charged = False
        for member in members:
            target = snap_dir / TIMINGS_DIRNAME / member["id"]
            if "suites" in member["shared"]:
                record = json.loads(record_path.read_text(encoding="utf-8"))
                part = _record_for_suites(record, member["shared"]["suites"])
                if not (part["suites"] or part["tests"]):
                    continue
                if startup_charged:
                    part.update({k: 0 for k in startup_keys if k in part})
                startup_charged = True
                target.mkdir(parents=True, exist_ok=True)
                (target / record_path.name).write_text(json.dumps(part, indent=2) + "\n", encoding="utf-8")
            elif _matches(filepath, member["shared"]["files"]):
                target.mkdir(parents=True, exist_ok=True)
                shutil.copy2(record_path, target / record_path.name)


def run_shared_group(
    group: str,
    members: list[dict[str, Any]],
    *,
    profile: str,
    snap_dir: Path,
    dry_run: bool,
    timings: bool,
) -> dict[str, StepResult]:
    shared_dir = snap_dir / SHARED_DIRNAME
    shared_dir.mkdir(parents=True, exist_ok=True)
    report_path = shared_dir / f"{group}.json"
    log_path = snap_dir / "logs" / f"{SHARED_DIRNAME}-{group}.log"
    by_suite = "suites" in members[0]["shared"]
    report_args = ["--reporter=json", f"--outputFile.json={report_path}"]
    if by_suite:
        suites = [k for m in members for k in m["shared"]["suites"]]
        tail = [*report_args, "--suites", ",".join(suites)]
    else:
        files = [f for m in members for f in m["shared"]["files"]]
        tail = ["--no-isolate", *report_args, *files]
    argv = resolve_argv(expand_argv(list(members[0]["shared"]["argv"]), profile, snap_dir) + tail)

    def base_result(member: dict[str, Any]) -> StepResult:
        return StepResult(
            id=member["id"],
            title=member["title"],
            tier=member["tier"],
            requires=member.get("requires", "none"),
            status="not_run",
            argv=argv,
            log_file=repo_relative(log_path),
            extra={"mode": "shared", "shared_group": group},
        )

    if dry_run:
        log_path.write_text(f"DRY-RUN: {' '.join(argv)}\n", encoding="utf-8")
        results = {}
        for member in members:
            result = base_result(member)
            result.status = "skipped"
            result.skip_reason = "dry-run"
            results[member["id"]] = result
        return results

    print(f"\n=== [shared] {group}: {', '.join(m['id'] for m in members)} ===", flush=True)
    print(f"$ {' '.join(argv)}", flush=True)
    env = timing_env(snap_dir, f"{SHARED_DIRNAME}-{group}") if timings else None
    started = time.perf_counter()
    try:
        proc = spawn(argv, env)
        combined = (proc.stdout or "") + ("\n" if proc.stderr else "") + (proc.stderr or "")
        exit_code: int | None = proc.returncode
    except OSError as exc:
        combined = f"OSError: {exc}\nargv: {argv}\n"
        exit_code = 127
    group_duration = round(time.perf_counter() - started, 3)
    log_path.write_text(combined, encoding="utf-8")

    entries: list[dict[str, Any]] = []
    if report_path.is_file():
        try:
            entries = json.loads(report_path.read_text(encoding="utf-8")).get("testResults", [])
        except (OSError, json.JSONDecodeError):
            entries = []
    if timings:
        _distribute_group_timings(snap_dir, group, members)
    if by_suite:
        entries = _entries_by_suite(entries, members)

    # A launch that fails while none of its tests failed (teardown, reporting, an unhandled
    # error) cannot be pinned on one member, so none of its members counts as passed.
    unexplained_failure = exit_code != 0 and not any(
        a.get("status") == "failed" for e in entries for a in e.get("assertionResults", [])
    )

    results: dict[str, StepResult] = {}
    for member in members:
        result = base_result(member)
        result.extra["shared_group_duration_s"] = group_duration
        result.exit_code = exit_code
        if by_suite:
            matched = [e for e in entries if e.get("member") == member["id"]]
        else:
            matched = [e for e in entries if _matches(e.get("name", ""), member["shared"]["files"])]
        result.vitest = _vitest_counts_from_report(matched) if matched else None
        result.duration_s = round(
            sum((e.get("endTime", 0) - e.get("startTime", 0)) for e in matched) / 1000, 3
        )
        passed = (
            bool(matched)
            and all(e.get("status") == "passed" for e in matched)
            and not unexplained_failure
        )
        if passed:
            result.status = "passed"
            print(f"{GREEN}PASSED{RESET} [shared] {member['id']} ({result.duration_s}s)", flush=True)
            results[member["id"]] = result
            continue
        print(f"{RED}FAILED{RESET} [shared] {member['id']}; re-running legacy", flush=True)
        fallback = run_step(member, profile=profile, snap_dir=snap_dir, dry_run=False, timings=timings)
        fallback.extra = {
            "mode": "shared→legacy",
            "shared_group": group,
            "shared_status": (
                "launch-failed" if unexplained_failure else "failed" if matched else "no-results"
            ),
            "shared_group_duration_s": group_duration,
        }
        if fallback.status == "passed":
            # Passes alone, fails in the group: files interfere through shared module state.
            fallback.extra["shared_state_leak_suspected"] = True
        results[member["id"]] = fallback
    print(f"shared group {group} done in {group_duration}s", flush=True)
    return results


def write_summary_md(summary: dict[str, Any], path: Path, timings: dict[str, Any] | None = None) -> None:
    lines = [
        f"# Non-reg snapshot `{summary['stamp']}`",
        "",
        f"- Tier: `{summary['tier']}`",
        f"- Mode: `{summary['mode']}`",
        f"- Profile: `{summary['profile']}`",
        f"- Storage: `{summary.get('storage') or '(not an emulatedServer profile)'}`",
        f"- Local cache: `{summary.get('local_cache') or DEFAULT_LOCAL_CACHE}`",
        *([f"- Scopes: `{', '.join(summary['scopes'])}`"] if summary.get("scopes") else []),
        f"- Started: `{summary['started_at']}`",
        f"- Finished: `{summary['finished_at']}`",
        f"- Duration: `{summary['duration_s']}s`",
        "",
        "## Counts",
        "",
        f"- passed: **{summary['counts']['passed']}**",
        f"- failed: **{summary['counts']['failed']}**",
        f"- skipped: **{summary['counts']['skipped']}**",
        f"- not_run: **{summary['counts']['not_run']}**",
        "",
        "## Steps",
        "",
        "| Status | Id | Duration | Notes |",
        "|--------|----|----------|-------|",
    ]
    for step in summary["steps"]:
        notes = step.get("skip_reason") or ""
        if step.get("vitest"):
            v = step["vitest"]
            notes = (
                f"tests {v.get('tests_passed', '?')}+/"
                f"{v.get('tests_failed', '?')}f/"
                f"{v.get('tests_skipped', '?')}s"
            )
        elif step.get("exit_code") not in (None, 0) and step["status"] == "failed":
            notes = f"exit {step['exit_code']}"
        dur = f"{step['duration_s']}s" if step.get("duration_s") is not None else "—"
        lines.append(
            f"| {step['status']} | `{step['id']}` | {dur} | {notes} |"
        )
    lines.append("")
    if timings is not None:
        lines += timings_markdown(timings)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_synthetic_report(summary: dict[str, Any]) -> None:
    print("\n" + "=" * 72)
    print("NON-REG SYNTHETIC SUMMARY")
    print("=" * 72)
    print(
        f"tier={summary['tier']} mode={summary['mode']} profile={summary['profile']} "
        + (f"scopes={','.join(summary['scopes'])} " if summary.get("scopes") else "")
        + f"duration={summary['duration_s']}s"
    )
    print(
        f"passed={summary['counts']['passed']}  "
        f"failed={summary['counts']['failed']}  "
        f"skipped={summary['counts']['skipped']}  "
        f"not_run={summary['counts']['not_run']}"
    )
    print("-" * 72)
    for step in summary["steps"]:
        status = step["status"]
        mark_text = {
            "passed": "PASS",
            "failed": "FAIL",
            "skipped": "SKIP",
            "not_run": "----",
        }[status]
        color = {
            "passed": GREEN,
            "failed": RED,
            "skipped": YELLOW,
            "not_run": GRAY,
        }[status]
        mark = f"{color}[{mark_text}]{RESET}"
        extra = ""
        if status == "skipped" and step.get("skip_reason"):
            extra = f" ({step['skip_reason']})"
        elif status == "failed":
            extra = f" exit={step.get('exit_code')}"
        dur = f" {step['duration_s']}s" if step.get("duration_s") is not None else ""
        print(f"  {mark} {step['id']}{dur}{extra}")
    print("-" * 72)
    print(f"snapshot: {summary['snapshot_dir']}")
    print(f"summary:  {summary['summary_json']}")
    print("=" * 72)


def read_latest_stamp() -> str | None:
    """Return the stamp currently pointed at by latest / latest.txt, if any."""
    latest_link = RESULTS_ROOT / "latest"
    latest_txt = RESULTS_ROOT / "latest.txt"
    try:
        if latest_link.is_symlink():
            return Path(os.readlink(latest_link)).name.rstrip("/\\")
    except OSError:
        pass
    if latest_txt.is_file():
        stamp = latest_txt.read_text(encoding="utf-8").strip()
        return stamp or None
    return None


def resolve_summary_json(path_like: str | Path) -> Path:
    """Resolve stamp dir, summary.json, or `latest` → a concrete summary.json file."""
    raw = str(path_like).strip().replace("\\", "/")
    if raw in ("latest", "test-results/nonreg/latest", "./test-results/nonreg/latest"):
        stamp = read_latest_stamp()
        if not stamp:
            raise FileNotFoundError(
                "No previous nonreg snapshot (test-results/nonreg/latest missing). "
                "Run once without --compare first."
            )
        path = RESULTS_ROOT / stamp
    else:
        path = Path(path_like)
        if not path.is_absolute():
            path = ROOT / path

    path = path.resolve()
    if path.is_dir():
        path = path / "summary.json"
    if not path.is_file():
        raise FileNotFoundError(f"summary.json not found: {path}")
    return path


def load_summary(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as fh:
        data = json.load(fh)
    try:
        data["summary_json"] = str(path.relative_to(ROOT)).replace("\\", "/")
    except ValueError:
        data["summary_json"] = str(path)
    return data


def compare_summaries(current: dict[str, Any], baseline_path: Path) -> int:
    baseline = load_summary(baseline_path)

    def by_id(steps: Iterable[dict[str, Any]]) -> dict[str, dict[str, Any]]:
        return {s["id"]: s for s in steps}

    cur = by_id(current["steps"])
    base = by_id(baseline["steps"])
    all_ids = sorted(set(cur) | set(base))
    # A scoped run (#351) selects a subset: only the steps both runs selected are comparable.
    ignored: list[str] = []
    if current.get("scopes") or baseline.get("scopes"):
        ignored = sorted(set(cur) ^ set(base))
        all_ids = sorted(set(cur) & set(base))

    new_fails: list[str] = []
    fixed: list[str] = []
    still_failing: list[str] = []
    newly_skipped: list[str] = []
    missing_now: list[str] = []
    added_now: list[str] = []

    for sid in all_ids:
        c = cur.get(sid)
        b = base.get(sid)
        if c is None:
            missing_now.append(sid)
            continue
        if b is None:
            added_now.append(sid)
            if c["status"] == "failed":
                new_fails.append(sid)
            continue
        if c["status"] == "failed" and b["status"] != "failed":
            new_fails.append(sid)
        elif c["status"] != "failed" and b["status"] == "failed":
            fixed.append(sid)
        elif c["status"] == "failed" and b["status"] == "failed":
            still_failing.append(sid)
        elif c["status"] == "skipped" and b["status"] != "skipped":
            newly_skipped.append(sid)

    print("\n" + "=" * 72)
    print("NON-REG COMPARE")
    print("=" * 72)
    print(f"baseline: {baseline.get('summary_json', baseline_path)}")
    print(f"current:  {current.get('summary_json', '(in-memory)')}")
    if current.get("stamp") and baseline.get("stamp") and current["stamp"] == baseline["stamp"]:
        print("warning: current and baseline are the same stamp (self-compare)")
    print(f"new failures ({len(new_fails)}): {', '.join(new_fails) or '—'}")
    print(f"fixed ({len(fixed)}): {', '.join(fixed) or '—'}")
    print(f"still failing ({len(still_failing)}): {', '.join(still_failing) or '—'}")
    print(f"newly skipped ({len(newly_skipped)}): {', '.join(newly_skipped) or '—'}")
    print(f"added steps ({len(added_now)}): {', '.join(added_now) or '—'}")
    print(f"missing steps ({len(missing_now)}): {', '.join(missing_now) or '—'}")
    if ignored:
        print(f"scoped compare: {len(ignored)} step(s) selected by only one run ignored: {', '.join(ignored)}")
    print("=" * 72)
    return 1 if new_fails or still_failing else 0


def update_latest_pointer(stamp: str) -> None:
    latest_link = RESULTS_ROOT / "latest"
    try:
        if latest_link.is_symlink() or latest_link.is_file():
            latest_link.unlink(missing_ok=True)
        if latest_link.exists():
            # Existing non-symlink directory — fall back to latest.txt
            (RESULTS_ROOT / "latest.txt").write_text(stamp + "\n", encoding="utf-8")
            return
        latest_link.symlink_to(stamp, target_is_directory=True)
    except OSError:
        (RESULTS_ROOT / "latest.txt").write_text(stamp + "\n", encoding="utf-8")


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="Run Miroir repo non-regression tiers.",
        epilog=(
            "Compare examples:\n"
            "  npm run nonreg -- --compare latest\n"
            "  npm run nonreg -- --compare test-results/nonreg/20260717T234407Z\n"
            "  npm run nonreg -- --compare path/to/A/summary.json path/to/B/summary.json\n"
            "  python scripts/run-nonreg.py --compare A B   # compare only, no re-run\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument(
        "--tier",
        choices=["unit", "default", "full"],
        default="default",
        help="unit ⊂ default ⊂ full (default: default = A+B+curated C)",
    )
    mode = p.add_mutually_exclusive_group()
    mode.add_argument(
        "--run-all",
        action="store_true",
        help="Continue after failures (default if neither mode flag set)",
    )
    mode.add_argument(
        "--fail-fast",
        action="store_true",
        help="Stop at first failed step",
    )
    store = p.add_mutually_exclusive_group()
    store.add_argument(
        "--storage",
        choices=STORAGES,
        default=None,
        help="Store of the integration steps: runs them on profile emulatedServer-<storage> (#390)",
    )
    store.add_argument(
        "--profile",
        default=None,
        help="Integration profile (default: manifest defaultProfile)",
    )
    p.add_argument(
        "--local-cache",
        choices=LOCAL_CACHES,
        default=None,
        help=f"LocalCache implementation of the tests' DomainControllers (default: {DEFAULT_LOCAL_CACHE}) (#446)",
    )
    p.add_argument(
        "--only",
        default=None,
        help="Comma-separated step ids to run (still filtered by --tier)",
    )
    p.add_argument(
        "--scope",
        default=None,
        help=(
            "Comma-separated scope names from the manifest's `scopes` (#351): runs their steps plus "
            "the `always` steps (still filtered by --tier; union with --only)"
        ),
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="List/expand steps without executing",
    )
    p.add_argument(
        "--compare",
        nargs="+",
        metavar="PATH",
        help=(
            "One path: run then compare against that baseline "
            "(accepts summary.json, stamp dir, or 'latest' — resolved BEFORE this run updates latest). "
            "Two paths: compare-only, no re-run (current baseline)."
        ),
    )
    p.add_argument(
        "--compare-only",
        nargs=2,
        metavar=("CURRENT", "BASELINE"),
        help="Deprecated alias for --compare CURRENT BASELINE",
    )
    p.add_argument(
        "--timings",
        action="store_true",
        help=(
            "Opt-in timing profile (#318): run vitest with the timing runner and write "
            "timings.json (collect, hooks, test bodies) plus slowest-first tables in summary.md"
        ),
    )
    p.add_argument(
        "--runner",
        choices=["legacy", "shared"],
        default="legacy",
        help=(
            "legacy (default): one launch per step, as always. shared (#318, opt-in): steps with a "
            "'shared' descriptor run together per group in one vitest launch; failures re-run legacy"
        ),
    )
    p.add_argument(
        "--manifest",
        default=None,
        help="Manifest to run (default: scripts/nonreg-manifest.json)",
    )
    p.add_argument(
        "--results-root",
        default=None,
        help="Directory for snapshots (default: test-results/nonreg)",
    )
    p.add_argument(
        "--environments-dir",
        default=None,
        help="Where the test environments are read for the store check (default: environments)",
    )
    return p


def main(argv: list[str] | None = None) -> int:
    global MANIFEST_PATH, RESULTS_ROOT, ENVIRONMENTS_DIR
    args = build_parser().parse_args(argv)
    if args.manifest:
        MANIFEST_PATH = Path(args.manifest).resolve()
    if args.results_root:
        RESULTS_ROOT = Path(args.results_root).resolve()
    if args.environments_dir:
        ENVIRONMENTS_DIR = Path(args.environments_dir).resolve()
    manifest = load_manifest()
    if args.storage:
        profile = profile_for_storage(args.storage)
    else:
        profile = args.profile or manifest.get("defaultProfile") or "emulatedServer-sql"
    storage = storage_of_profile(profile)
    # Set even for the default, so a value left in the calling shell does not leak into the run.
    local_cache = args.local_cache or DEFAULT_LOCAL_CACHE
    os.environ[LOCAL_CACHE_ENV] = local_cache

    compare_paths: list[str] = list(args.compare or [])
    if args.compare_only:
        compare_paths = list(args.compare_only)

    # Two paths → compare only (no test run).
    if len(compare_paths) == 2:
        try:
            current_path = resolve_summary_json(compare_paths[0])
            baseline_path = resolve_summary_json(compare_paths[1])
        except FileNotFoundError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 2
        return compare_summaries(load_summary(current_path), baseline_path)

    if len(compare_paths) > 2:
        print("error: --compare accepts 1 path (run+diff) or 2 paths (diff only)", file=sys.stderr)
        return 2

    # Resolve baseline BEFORE this run creates a new stamp / rewrites `latest`.
    baseline_path: Path | None = None
    if len(compare_paths) == 1:
        try:
            baseline_path = resolve_summary_json(compare_paths[0])
        except FileNotFoundError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 2
        print(f"compare baseline (resolved before run): {baseline_path}", flush=True)

    selected_tier: TierName = args.tier  # type: ignore[assignment]
    fail_fast = bool(args.fail_fast)
    # Default to run-all when neither flag is set.
    mode_name = "fail-fast" if fail_fast else "run-all"

    only_ids = None
    if args.only:
        only_ids = {s.strip() for s in args.only.split(",") if s.strip()}

    scope_names: list[str] | None = None
    if args.scope is not None:
        try:
            scope_names = parse_scopes(args.scope, manifest)
        except ValueError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 2

    steps = select_steps(
        manifest, selected_tier, only_ids, set(scope_names) if scope_names is not None else None
    )
    if not steps:
        print("No steps selected.", file=sys.stderr)
        return 2

    # #390: stop before the first step when the store's service is down, instead of failing
    # every step that needs it on ECONNREFUSED.
    if storage and not args.dry_run and any(s.get("requires") == REQUIRES_STORAGE for s in steps):
        error = check_storage_service(storage, ENVIRONMENTS_DIR)
        if error:
            print(f"error: {error}", file=sys.stderr)
            return 2

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    snap_dir = RESULTS_ROOT / stamp
    snap_dir.mkdir(parents=True, exist_ok=True)
    (snap_dir / "logs").mkdir(exist_ok=True)

    started_at = datetime.now(timezone.utc).isoformat()
    wall_start = time.perf_counter()
    results: list[StepResult] = []
    aborted = False
    shared_groups = plan_shared_groups(steps) if args.runner == "shared" else {}
    shared_results: dict[str, StepResult] = {}

    for step in steps:
        # A shared group runs all its members at the first one, so a member listed after a
        # fail-fast abort may already have run: report its real result, not "not_run".
        if aborted and step["id"] not in shared_results:
            results.append(
                StepResult(
                    id=step["id"],
                    title=step["title"],
                    tier=step["tier"],
                    requires=step.get("requires", "none"),
                    status="not_run",
                    skip_reason="aborted after earlier failure (--fail-fast)",
                    argv=expand_argv(list(step["argv"]), profile, snap_dir),
                )
            )
            continue

        group = step.get("shared", {}).get("group") if args.runner == "shared" else None
        if group is not None:
            if step["id"] not in shared_results:
                shared_results.update(
                    run_shared_group(
                        group,
                        shared_groups[group],
                        profile=profile,
                        snap_dir=snap_dir,
                        dry_run=args.dry_run,
                        timings=args.timings,
                    )
                )
            result = shared_results[step["id"]]
        else:
            result = run_step(
                step, profile=profile, snap_dir=snap_dir, dry_run=args.dry_run, timings=args.timings
            )
        results.append(result)
        if result.status == "failed" and fail_fast:
            aborted = True

    finished_at = datetime.now(timezone.utc).isoformat()
    duration_s = round(time.perf_counter() - wall_start, 3)

    counts = {
        "passed": sum(1 for r in results if r.status == "passed"),
        "failed": sum(1 for r in results if r.status == "failed"),
        "skipped": sum(1 for r in results if r.status == "skipped"),
        "not_run": sum(1 for r in results if r.status == "not_run"),
    }

    summary: dict[str, Any] = {
        "stamp": stamp,
        "tier": selected_tier,
        "mode": mode_name,
        "profile": profile,
        "storage": storage,
        "local_cache": local_cache,
        "started_at": started_at,
        "finished_at": finished_at,
        "duration_s": duration_s,
        "manifest": repo_relative(MANIFEST_PATH),
        "git": {
            "commit": _git("rev-parse", "HEAD"),
            "branch": _git("rev-parse", "--abbrev-ref", "HEAD"),
            "dirty": bool(_git("status", "--porcelain")),
        },
        "counts": counts,
        "steps": [step_to_dict(r) for r in results],
        "snapshot_dir": repo_relative(snap_dir),
        "summary_json": repo_relative(snap_dir / "summary.json"),
        "summary_md": repo_relative(snap_dir / "summary.md"),
    }

    if args.runner != "legacy":
        summary["runner"] = args.runner
    if scope_names is not None:
        summary["scopes"] = scope_names

    timings: dict[str, Any] | None = None
    if args.timings:
        timings = collect_step_timings(snap_dir, results)
        timings_path = snap_dir / "timings.json"
        timings_path.write_text(json.dumps(timings, indent=2) + "\n", encoding="utf-8")
        summary["timings_json"] = repo_relative(timings_path)

    summary_json_path = snap_dir / "summary.json"
    summary_md_path = snap_dir / "summary.md"
    summary_json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    write_summary_md(summary, summary_md_path, timings)

    print_synthetic_report(summary)

    exit_code = 0 if counts["failed"] == 0 else 1
    # Compare against the pre-resolved baseline (before rewriting `latest`).
    if baseline_path is not None:
        exit_code = max(exit_code, compare_summaries(summary, baseline_path))

    # Update latest only after compare, so `--compare latest` means previous run.
    if not args.dry_run:
        update_latest_pointer(stamp)
    return exit_code


def _git(*git_argv: str) -> str | None:
    try:
        proc = subprocess.run(
            ["git", *git_argv],
            cwd=ROOT,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        if proc.returncode != 0:
            return None
        return (proc.stdout or "").strip() or None
    except OSError:
        return None


if __name__ == "__main__":
    sys.exit(main())
