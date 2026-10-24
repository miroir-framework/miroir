"""Acceptance of one benchmark run (#550): the feature's scenarios, run on what the agent left.

    python scripts/agent_bench/acceptance --arm miroir-mcp --feature overdue-loans [--store DIR] [--apply-reference]

Miroir arms: the Library store of the run (`--store`, a copy of `.miroir/bench-agent/library` taken when the agent
stopped; the untouched baseline without it) is put in place, the model is validated, then a fresh `miroir-server`
answers the scenarios through MCP. `--apply-reference` adds the reference solution first, to check the scenarios.

Prints one JSON object: {"passed": bool, "checks": [{"name", "passed", "detail"}]}. Exit code 0 when every check passed.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from agent_bench import miroir_server  # noqa: E402
from agent_bench.acceptance import adapter_miroir, scenarios  # noqa: E402
from agent_bench.acceptance.mcp_client import McpClient  # noqa: E402

REFERENCE_DIR = Path(__file__).resolve().parents[1] / "reference"
VALIDATE_STORE = Path(__file__).resolve().parent / "validate_store.mjs"
FEATURES = ("overdue-loans",)


def check(name: str, run) -> dict:
    """Runs one check; an exception is a failed check, with its message as the detail."""
    try:
        passed, detail = run()
    except Exception as error:  # noqa: BLE001 - any failure of the agent's work is a failed check
        passed, detail = False, f"{type(error).__name__}: {error}"[:2000]
    return {"name": name, "passed": bool(passed), "detail": detail}


def validate_store(store: Path) -> tuple[bool, str]:
    out = subprocess.run(
        ["node", str(VALIDATE_STORE), str(store / "model"), str(store / "data")],
        cwd=miroir_server.REPO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )
    report = json.loads(out.stdout.strip().splitlines()[-1])
    return not report["errors"], json.dumps(report)[:2000]


def overdue_loans_checks(adapter: adapter_miroir.MiroirAdapter) -> list[dict]:
    def overdue(started_before: str):
        def run():
            got, expected = adapter.overdue(started_before), scenarios.overdue_loans(started_before)
            return got == expected, f"{len(got)} returned, {len(expected)} expected, {len(got - expected)} unexpected, {len(expected - got)} missing"

        return run

    def report():
        expected = scenarios.overdue_loans(scenarios.STARTED_BEFORE)
        sets = adapter.report_loan_sets("OverdueLoansPerUser", {"startedBefore": scenarios.STARTED_BEFORE})
        return expected in sets, f"loan counts per data entry: {[len(found) for found in sets]}, {len(expected)} expected"

    def miroir_test():
        names = adapter.miroir_tests_naming("OverdueLoans")
        return bool(names), f"MiroirTests naming the Query: {names}"

    return [
        check("overdue loans started before 2026-07-02", overdue(scenarios.STARTED_BEFORE)),
        check("overdue loans started before 2026-08-01 (every open loan)", overdue("2026-08-01")),
        check("a returned loan never appears", overdue("2100-01-01")),
        check("Report OverdueLoansPerUser shows the overdue loans", report),
        check("a MiroirTest names OverdueLoans", miroir_test),
    ]


FEATURE_CHECKS = {"overdue-loans": overdue_loans_checks}


def accept_miroir(feature: str, store: Path | None, apply_reference: bool, logs: Path) -> list[dict]:
    adapter_miroir.materialize_store(logs / "materialize.log")
    if store is not None:
        shutil.rmtree(adapter_miroir.LIBRARY_STORE)
        shutil.copytree(store, adapter_miroir.LIBRARY_STORE)
    if apply_reference:
        adapter_miroir.apply_files(REFERENCE_DIR / "miroir" / feature)

    checks = [check("the Library model is valid", lambda: validate_store(adapter_miroir.LIBRARY_STORE))]
    with miroir_server.MiroirServer(logs / "server.log"):
        adapter = adapter_miroir.MiroirAdapter(McpClient(miroir_server.mcp_url()).initialize())
        checks += FEATURE_CHECKS[feature](adapter)
    return checks


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--arm", required=True, choices=("miroir-mcp", "miroir-files"))
    parser.add_argument("--feature", required=True, choices=FEATURES)
    parser.add_argument("--store", type=Path, help="the run's Library store; the baseline when omitted")
    parser.add_argument("--apply-reference", action="store_true")
    parser.add_argument("--logs", type=Path, help="where server logs go; a temporary folder when omitted")
    args = parser.parse_args(argv)

    logs = args.logs or Path(tempfile.mkdtemp(prefix="agent-bench-acceptance-"))
    checks = accept_miroir(args.feature, args.store, args.apply_reference, logs)
    passed = all(item["passed"] for item in checks)
    print(json.dumps({"passed": passed, "checks": checks}, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
