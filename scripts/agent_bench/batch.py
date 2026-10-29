"""Runs of the agent cost benchmark (#550), one after the other, each scored by acceptance and recorded.

    python scripts/agent_bench/batch.py --pilot                      # one run per arm and feature
    python scripts/agent_bench/batch.py --run-indexes 1 2 3 4 5      # the full runs

Sequential: the runs share the `bench-agent` store. Each run's `run.json` gets `acceptance: {passed, total}`, the
acceptance report goes next to it (`acceptance.json`), then the run is recorded in miroir-app-meta
(`agent-run:record`). Prints one line per run.
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[1]
FEATURES = ("overdue-loans", "lending-limit")
ARMS = ("miroir-mcp", "miroir-files", "conventional")
DEFAULT_RUNS_DIR = Path("/mnt/project-files/issue-550/runs")


def score(run_dir: Path) -> dict:
    run = json.loads((run_dir / "run.json").read_text(encoding="utf-8"))
    target = ["--store", str(run_dir / "store")] if run["arm"] == "miroir-mcp" else ["--workspace", run["workspace"]]
    logs = run_dir / "acceptance"
    logs.mkdir(exist_ok=True)
    out = subprocess.run(
        [sys.executable, str(HERE / "acceptance"), "--arm", run["arm"], "--feature", run["feature"], *target, "--logs", str(logs)],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    (run_dir / "acceptance.json").write_text(out.stdout, encoding="utf-8")
    (run_dir / "acceptance.stderr").write_text(out.stderr, encoding="utf-8")
    checks = json.loads(out.stdout)["checks"]
    run["acceptance"] = {"passed": sum(item["passed"] for item in checks), "total": len(checks)}
    (run_dir / "run.json").write_text(json.dumps(run, indent=2) + "\n", encoding="utf-8")
    return run


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--pilot", action="store_true")
    parser.add_argument("--run-indexes", type=int, nargs="*", default=[0])
    parser.add_argument("--runs-dir", type=Path, default=DEFAULT_RUNS_DIR)
    args = parser.parse_args(argv)

    for index in args.run_indexes:
        for feature in FEATURES:
            for arm in ARMS:
                before = set(args.runs_dir.iterdir())
                command = [sys.executable, str(HERE / "run.py"), "--arm", arm, "--feature", feature, "--run-index", str(index)]
                subprocess.run(command + (["--pilot"] if args.pilot else []) + ["--runs-dir", str(args.runs_dir)], cwd=REPO_ROOT, check=False)
                new = sorted(path for path in set(args.runs_dir.iterdir()) - before if (path / "run.json").exists())
                if not new:
                    print(f"{feature} {arm} {index}: no run.json", flush=True)
                    continue
                try:
                    run = score(new[-1])
                except (json.JSONDecodeError, KeyError) as error:
                    print(f"{new[-1].name}: acceptance failed ({error}), see acceptance.stderr", flush=True)
                    continue
                subprocess.run(["npm", "run", "-s", "agent-run:record", "-w", "miroir-app-meta", "--", str(new[-1] / "run.json")], cwd=REPO_ROOT, check=False)
                print(f"{run['runId']}: ${run['costUsd']:.2f}, {run['turns']} turns, acceptance {run['acceptance']['passed']}/{run['acceptance']['total']}, valid {run['valid']}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
