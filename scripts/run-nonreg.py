#!/usr/bin/env python3
"""Repo-wide non-regression runner for Miroir.

Reads scripts/nonreg-manifest.json, runs selected tiers, writes a timestamped
snapshot under test-results/nonreg/<stamp>/, and prints a synthetic summary.

Examples:
  python scripts/run-nonreg.py --tier default --run-all
  python scripts/run-nonreg.py --tier unit --fail-fast
  npm run nonreg -- --tier default --run-all
  python scripts/run-nonreg.py --compare test-results/nonreg/<stamp>/summary.json
"""

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Literal

ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = ROOT / "scripts" / "nonreg-manifest.json"
RESULTS_ROOT = ROOT / "test-results" / "nonreg"

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


def load_manifest() -> dict[str, Any]:
    with MANIFEST_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


def expand_argv(argv: list[str], profile: str) -> list[str]:
    return [part.replace("{profile}", profile) for part in argv]


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


def step_in_tier(step_tier: str, selected: TierName) -> bool:
    return TIER_ORDER[step_tier] <= TIER_ORDER[selected]


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


def run_step(
    step: dict[str, Any],
    *,
    profile: str,
    snap_dir: Path,
    dry_run: bool,
) -> StepResult:
    step_id = step["id"]
    argv = resolve_argv(expand_argv(list(step["argv"]), profile))
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
    result.log_file = str(log_path.relative_to(ROOT)).replace("\\", "/")

    if dry_run:
        result.status = "skipped"
        result.skip_reason = "dry-run"
        log_path.write_text(f"DRY-RUN: {' '.join(argv)}\n", encoding="utf-8")
        return result

    print(f"\n=== [{tier}] {step_id} ===", flush=True)
    print(f"$ {' '.join(argv)}", flush=True)
    started = time.perf_counter()
    try:
        # Windows: npm/npx resolve to *.cmd; CreateProcess cannot launch .cmd without a shell.
        if os.name == "nt":
            proc = subprocess.run(
                subprocess.list2cmdline(argv),
                cwd=ROOT,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                shell=True,
            )
        else:
            proc = subprocess.run(
                argv,
                cwd=ROOT,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                shell=False,
            )
    except OSError as exc:
        result.status = "failed"
        result.exit_code = 127
        result.duration_s = round(time.perf_counter() - started, 3)
        result.error_tail = str(exc)
        log_path.write_text(f"OSError: {exc}\nargv: {argv}\n", encoding="utf-8")
        print(f"FAILED (spawn): {exc}", flush=True)
        return result

    duration = time.perf_counter() - started
    combined = (proc.stdout or "") + ("\n" if proc.stderr else "") + (proc.stderr or "")
    log_path.write_text(combined, encoding="utf-8")
    result.exit_code = proc.returncode
    result.duration_s = round(duration, 3)
    result.vitest = parse_vitest_counts(combined)
    if proc.returncode == 0:
        result.status = "passed"
        print(f"PASSED ({result.duration_s}s)", flush=True)
    else:
        result.status = "failed"
        result.error_tail = tail_text(combined)
        print(f"FAILED exit={proc.returncode} ({result.duration_s}s)", flush=True)
    return result


def write_summary_md(summary: dict[str, Any], path: Path) -> None:
    lines = [
        f"# Non-reg snapshot `{summary['stamp']}`",
        "",
        f"- Tier: `{summary['tier']}`",
        f"- Mode: `{summary['mode']}`",
        f"- Profile: `{summary['profile']}`",
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
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def print_synthetic_report(summary: dict[str, Any]) -> None:
    print("\n" + "=" * 72)
    print("NON-REG SYNTHETIC SUMMARY")
    print("=" * 72)
    print(
        f"tier={summary['tier']} mode={summary['mode']} profile={summary['profile']} "
        f"duration={summary['duration_s']}s"
    )
    print(
        f"passed={summary['counts']['passed']}  "
        f"failed={summary['counts']['failed']}  "
        f"skipped={summary['counts']['skipped']}  "
        f"not_run={summary['counts']['not_run']}"
    )
    print("-" * 72)
    for step in summary["steps"]:
        mark = {
            "passed": "PASS",
            "failed": "FAIL",
            "skipped": "SKIP",
            "not_run": "----",
        }[step["status"]]
        extra = ""
        if step["status"] == "skipped" and step.get("skip_reason"):
            extra = f" ({step['skip_reason']})"
        elif step["status"] == "failed":
            extra = f" exit={step.get('exit_code')}"
        dur = f" {step['duration_s']}s" if step.get("duration_s") is not None else ""
        print(f"  [{mark}] {step['id']}{dur}{extra}")
    print("-" * 72)
    print(f"snapshot: {summary['snapshot_dir']}")
    print(f"summary:  {summary['summary_json']}")
    print("=" * 72)


def compare_summaries(current: dict[str, Any], baseline_path: Path) -> int:
    with baseline_path.open(encoding="utf-8") as fh:
        baseline = json.load(fh)

    def by_id(steps: Iterable[dict[str, Any]]) -> dict[str, dict[str, Any]]:
        return {s["id"]: s for s in steps}

    cur = by_id(current["steps"])
    base = by_id(baseline["steps"])
    all_ids = sorted(set(cur) | set(base))

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
    print(f"baseline: {baseline_path}")
    print(f"current:  {current.get('summary_json', '(in-memory)')}")
    print(f"new failures ({len(new_fails)}): {', '.join(new_fails) or '—'}")
    print(f"fixed ({len(fixed)}): {', '.join(fixed) or '—'}")
    print(f"still failing ({len(still_failing)}): {', '.join(still_failing) or '—'}")
    print(f"newly skipped ({len(newly_skipped)}): {', '.join(newly_skipped) or '—'}")
    print(f"added steps ({len(added_now)}): {', '.join(added_now) or '—'}")
    print(f"missing steps ({len(missing_now)}): {', '.join(missing_now) or '—'}")
    print("=" * 72)
    return 1 if new_fails or still_failing else 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Run Miroir repo non-regression tiers.")
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
    p.add_argument(
        "--profile",
        default=None,
        help="Integration profile (default: manifest defaultProfile)",
    )
    p.add_argument(
        "--only",
        default=None,
        help="Comma-separated step ids to run (still filtered by --tier)",
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="List/expand steps without executing",
    )
    p.add_argument(
        "--compare",
        metavar="SUMMARY_JSON",
        help="Compare the latest snapshot (or --compare-with-current) against this baseline",
    )
    p.add_argument(
        "--compare-only",
        nargs=2,
        metavar=("CURRENT", "BASELINE"),
        help="Compare two existing summary.json files without running",
    )
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    manifest = load_manifest()
    profile = args.profile or manifest.get("defaultProfile") or "emulatedServer-sql"

    if args.compare_only:
        current_path = Path(args.compare_only[0])
        baseline_path = Path(args.compare_only[1])
        with current_path.open(encoding="utf-8") as fh:
            current = json.load(fh)
        current["summary_json"] = str(current_path)
        return compare_summaries(current, baseline_path)

    selected_tier: TierName = args.tier  # type: ignore[assignment]
    fail_fast = bool(args.fail_fast)
    # Default to run-all when neither flag is set.
    mode_name = "fail-fast" if fail_fast else "run-all"

    only_ids = None
    if args.only:
        only_ids = {s.strip() for s in args.only.split(",") if s.strip()}

    steps = [
        s
        for s in manifest["steps"]
        if step_in_tier(s["tier"], selected_tier)
        and (only_ids is None or s["id"] in only_ids)
    ]
    if not steps:
        print("No steps selected.", file=sys.stderr)
        return 2

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    snap_dir = RESULTS_ROOT / stamp
    snap_dir.mkdir(parents=True, exist_ok=True)
    (snap_dir / "logs").mkdir(exist_ok=True)

    started_at = datetime.now(timezone.utc).isoformat()
    wall_start = time.perf_counter()
    results: list[StepResult] = []
    aborted = False

    for step in steps:
        if aborted:
            results.append(
                StepResult(
                    id=step["id"],
                    title=step["title"],
                    tier=step["tier"],
                    requires=step.get("requires", "none"),
                    status="not_run",
                    skip_reason="aborted after earlier failure (--fail-fast)",
                    argv=expand_argv(list(step["argv"]), profile),
                )
            )
            continue

        result = run_step(step, profile=profile, snap_dir=snap_dir, dry_run=args.dry_run)
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
        "started_at": started_at,
        "finished_at": finished_at,
        "duration_s": duration_s,
        "manifest": str(MANIFEST_PATH.relative_to(ROOT)).replace("\\", "/"),
        "git": {
            "commit": _git("rev-parse", "HEAD"),
            "branch": _git("rev-parse", "--abbrev-ref", "HEAD"),
            "dirty": bool(_git("status", "--porcelain")),
        },
        "counts": counts,
        "steps": [asdict(r) for r in results],
        "snapshot_dir": str(snap_dir.relative_to(ROOT)).replace("\\", "/"),
        "summary_json": str((snap_dir / "summary.json").relative_to(ROOT)).replace("\\", "/"),
        "summary_md": str((snap_dir / "summary.md").relative_to(ROOT)).replace("\\", "/"),
    }

    summary_json_path = snap_dir / "summary.json"
    summary_md_path = snap_dir / "summary.md"
    summary_json_path.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    write_summary_md(summary, summary_md_path)

    # Convenience pointer to latest run
    latest_link = RESULTS_ROOT / "latest"
    try:
        if latest_link.is_symlink() or latest_link.exists():
            if latest_link.is_dir() and not latest_link.is_symlink():
                pass
            else:
                latest_link.unlink()
        # Relative symlink when possible
        try:
            latest_link.symlink_to(stamp, target_is_directory=True)
        except OSError:
            (RESULTS_ROOT / "latest.txt").write_text(stamp + "\n", encoding="utf-8")
    except OSError:
        (RESULTS_ROOT / "latest.txt").write_text(stamp + "\n", encoding="utf-8")

    print_synthetic_report(summary)

    exit_code = 0 if counts["failed"] == 0 else 1
    if args.compare:
        exit_code = max(exit_code, compare_summaries(summary, Path(args.compare)))
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
