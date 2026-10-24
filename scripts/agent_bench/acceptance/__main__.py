"""Acceptance of one benchmark run (#550): the feature's scenarios, run on what the agent left.

    python scripts/agent_bench/acceptance --arm miroir-mcp --feature overdue-loans [--store DIR] [--apply-reference]
    python scripts/agent_bench/acceptance --arm miroir-files --feature overdue-loans --workspace DIR [--apply-reference]
    python scripts/agent_bench/acceptance --arm conventional --feature overdue-loans [--workspace DIR] [--apply-reference]

Miroir arms: the Library store of the run (`--store`, a copy of `.miroir/bench-agent/library` taken when the agent
stopped; for the files arm, `--workspace` puts the workspace's `library/` over a baseline store; the untouched
baseline without either) is put in place, the model is validated, then a fresh `miroir-server` answers the scenarios
through MCP. Conventional arm: a copy of the workspace (the baseline app without `--workspace`) gets a fresh database
from its own migrations and seed, is built and served, and answers the scenarios over HTTP. `--apply-reference` adds
the reference solution first, to check the scenarios.

The scenarios are the same for every arm; each adapter answers them in its own stack. Tests are checked for presence
(added or changed, naming the feature), not run (analysis D18).

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
from agent_bench.acceptance import adapter_conventional, adapter_miroir, scenarios  # noqa: E402
from agent_bench.acceptance.mcp_client import McpClient  # noqa: E402

REFERENCE_DIR = Path(__file__).resolve().parents[1] / "reference"
VALIDATE_STORE = Path(__file__).resolve().parent / "validate_store.mjs"
ARMS = ("miroir-mcp", "miroir-files", "conventional")
FEATURES = ("overdue-loans", "lending-limit")
LEND_DATE = "2026-08-01T00:00:00.000Z"
# what a test of the feature names, in any case
TEST_NEEDLES = {
    ("overdue-loans", "miroir"): "overdue",
    ("overdue-loans", "conventional"): "overdue",
    ("lending-limit", "miroir"): "lendDocument",
    ("lending-limit", "conventional"): "api/loans",
}


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


def test_check(adapter, needle: str) -> dict:
    def run():
        found = adapter.new_tests_naming(needle)
        return bool(found), f"tests added or changed that name {needle!r}: {found}"

    return check(f"a test added or changed names {needle!r}", run)


def overdue_loans_checks(adapter, needle: str) -> list[dict]:
    def overdue(started_before: str):
        def run():
            got, expected = adapter.overdue(started_before), scenarios.overdue_loans(started_before)
            return got == expected, f"{len(got)} returned, {len(expected)} expected, {len(got - expected)} unexpected, {len(expected - got)} missing"

        return run

    return [
        check("overdue loans started before 2026-07-02", overdue(scenarios.STARTED_BEFORE)),
        check("overdue loans started before 2026-08-01 (every open loan)", overdue("2026-08-01")),
        check("a returned loan never appears", overdue("2100-01-01")),
        check("the view shows the overdue loans", lambda: adapter.view_shows_overdue(scenarios.STARTED_BEFORE)),
        test_check(adapter, needle),
    ]


def lending_limit_checks(adapter, needle: str) -> list[dict]:
    """Who holds how many Books is read from the app, not from the baseline: the agent's own tests may have lent.

    In order, each check seeing the loans the previous ones accepted: every User at the limit is refused, then the
    User holding the fewest Books gets loans until the limit, each accepted, and one more, refused.
    """
    names = scenarios.user_names()
    book = scenarios.book_uuids()[0]

    def open_loans(user: str) -> int:
        return len([loan for loan in adapter.loans_of(user) if not loan.get("endDate")])

    def lend(user: str, accepted: bool):
        def run():
            before = open_loans(user)
            answer = adapter.lend(user, book, LEND_DATE)
            after = open_loans(user)
            expected_after = before + 1 if accepted else before
            return answer == accepted and after == expected_after, f"accepted: {answer}, open loans {before} -> {after}"

        return run

    held = {user: open_loans(user) for user in names}
    checks = [test_check(adapter, needle)] + [
        check(f"lending to {names[user]} ({count} open loans) is refused", lend(user, False))
        for user, count in sorted(held.items(), key=lambda item: names[item[0]])
        if count >= scenarios.LENDING_LIMIT
    ]
    below = [user for user, count in held.items() if count < scenarios.LENDING_LIMIT]
    if not below:
        return checks + [check("a User holds fewer Books than the limit", lambda: (False, f"open loans: {held}"))]
    user = min(below, key=lambda candidate: (held[candidate], names[candidate]))
    for count in range(held[user], scenarios.LENDING_LIMIT):
        checks.append(check(f"lending to {names[user]} holding {count} is accepted", lend(user, True)))
    checks.append(check(f"lending to {names[user]}, now at the limit, is refused", lend(user, False)))
    return checks


FEATURE_CHECKS = {"overdue-loans": overdue_loans_checks, "lending-limit": lending_limit_checks}


def accept_miroir(
    feature: str, store: Path | None, workspace: Path | None, apply_reference: bool, logs: Path
) -> list[dict]:
    adapter_miroir.materialize_store(logs / "materialize.log")
    if workspace is not None:
        # files arm: the reference goes in as file edits of the workspace, then the workspace goes back in the store
        if apply_reference:
            adapter_miroir.apply_files(REFERENCE_DIR / "miroir" / feature, workspace / "library")
        store = logs / "store-from-workspace"
        shutil.rmtree(store, ignore_errors=True)
        adapter_miroir.store_from_workspace(workspace / "library", adapter_miroir.LIBRARY_STORE, store)
    if store is not None:
        shutil.rmtree(adapter_miroir.LIBRARY_STORE)
        shutil.copytree(store, adapter_miroir.LIBRARY_STORE)
    if apply_reference and workspace is None:
        adapter_miroir.apply_files(REFERENCE_DIR / "miroir" / feature)

    checks = [check("the Library model is valid", lambda: validate_store(adapter_miroir.LIBRARY_STORE))]
    with miroir_server.MiroirServer(logs / "server.log"):
        adapter = adapter_miroir.MiroirAdapter(McpClient(miroir_server.mcp_url()).initialize())
        checks += FEATURE_CHECKS[feature](adapter, TEST_NEEDLES[(feature, "miroir")])
    return checks


def accept_conventional(feature: str, workspace: Path | None, apply_reference: bool, logs: Path) -> list[dict]:
    source = workspace or adapter_conventional.BASELINE_APP
    if apply_reference:
        # never change the run's workspace: the reference goes over a copy
        copy = logs / "workspace-with-reference"
        shutil.rmtree(copy, ignore_errors=True)
        adapter_conventional.copy_app(source, copy)
        adapter_conventional.apply_overlay(REFERENCE_DIR / "conventional" / feature, copy)
        source = copy
    with adapter_conventional.ConventionalApp(source, logs) as app:
        adapter = adapter_conventional.ConventionalAdapter(app)
        checks = [check("the app builds", adapter.model_check)]
        if app.built:
            checks += FEATURE_CHECKS[feature](adapter, TEST_NEEDLES[(feature, "conventional")])
    return checks


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--arm", required=True, choices=ARMS)
    parser.add_argument("--feature", required=True, choices=FEATURES)
    parser.add_argument("--store", type=Path, help="miroir-mcp: the run's Library store; the baseline when omitted")
    parser.add_argument("--workspace", type=Path, help="miroir-files, conventional: the run's workspace")
    parser.add_argument("--apply-reference", action="store_true")
    parser.add_argument("--logs", type=Path, help="where logs and copies go; a temporary folder when omitted")
    args = parser.parse_args(argv)
    if args.store and args.workspace:
        parser.error("--store and --workspace exclude each other")
    if args.arm == "conventional" and args.store:
        parser.error("the conventional arm takes --workspace")

    logs = args.logs or Path(tempfile.mkdtemp(prefix="agent-bench-acceptance-"))
    if args.arm == "conventional":
        checks = accept_conventional(args.feature, args.workspace, args.apply_reference, logs)
    else:
        checks = accept_miroir(args.feature, args.store, args.workspace, args.apply_reference, logs)
    passed = all(item["passed"] for item in checks)
    print(json.dumps({"passed": passed, "checks": checks}, indent=2))
    return 0 if passed else 1


if __name__ == "__main__":
    sys.exit(main())
