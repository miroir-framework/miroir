"""Acceptance helpers of the agent cost benchmark (#550) that need no server."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agent_bench.acceptance import adapter_miroir  # noqa: E402
from agent_bench.acceptance.__main__ import check  # noqa: E402

LOAN = adapter_miroir.LOAN_ENTITY


def loan(uuid: str) -> dict:
    return {"uuid": uuid, "parentUuid": LOAN, "user": "u"}


def test_loan_uuids_reads_a_list():
    assert adapter_miroir._loan_uuids([loan("a"), loan("b")]) == {"a", "b"}


def test_loan_uuids_reads_a_grouping_per_user():
    assert adapter_miroir._loan_uuids({"user1": [loan("a")], "user2": {"b": loan("b")}}) == {"a", "b"}


def test_loan_uuids_ignores_other_instances():
    assert adapter_miroir._loan_uuids([{"uuid": "x", "parentUuid": "not-a-loan"}, loan("a")]) == {"a"}


def test_check_turns_an_exception_into_a_failed_check():
    def broken():
        raise LookupError("no Query named OverdueLoans")

    result = check("overdue", broken)
    assert result == {"name": "overdue", "passed": False, "detail": "LookupError: no Query named OverdueLoans"}


class FakeClient:
    def __init__(self, instances: dict[str, list[dict]]):
        self.instances = instances

    def call(self, name: str, arguments: dict) -> dict:
        items = self.instances.get(arguments["parentUuid"], [])
        return {"content": [{"type": "text", "text": json.dumps({"status": "success", "result": {"instances": items}})}]}


def test_miroir_tests_naming_matches_the_query_name_in_any_case():
    adapter = adapter_miroir.MiroirAdapter(
        FakeClient(
            {
                adapter_miroir.QUERY_ENTITY: [{"uuid": "q1", "name": "OverdueLoans"}],
                adapter_miroir.MIROIR_TEST_ENTITY: [
                    {"uuid": "t1", "name": "checks", "definition": {"resultAccessPath": ["overdueLoans"]}},
                    {"uuid": "t2", "name": "uses the uuid", "definition": {"storedQuery": "q1"}},
                    {"uuid": "t3", "name": "unrelated", "definition": {}},
                ],
            }
        )
    )
    assert adapter.miroir_tests_naming("OverdueLoans") == ["checks", "uses the uuid"]


def test_new_miroir_tests_ignore_the_library_s_own_tests():
    own = sorted(adapter_miroir.baseline_uuids(adapter_miroir.MIROIR_TEST_ENTITY))
    assert own, "the Library ships MiroirTests"
    adapter = adapter_miroir.MiroirAdapter(
        FakeClient(
            {
                adapter_miroir.MIROIR_TEST_ENTITY: [
                    {"uuid": own[0], "name": "runner.lendDocument", "definition": {"actionType": "lendDocument"}},
                    {"uuid": "new-test", "name": "lendingLimit", "definition": {"actionType": "lendDocument"}},
                ],
            }
        )
    )
    assert adapter.new_miroir_tests_naming("lendDocument") == ["lendingLimit"]
