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


def test_tests_naming_matches_the_needle_in_any_case():
    adapter = adapter_miroir.MiroirAdapter(
        FakeClient(
            {
                adapter_miroir.MIROIR_TEST_ENTITY: [
                    {"uuid": "t1", "name": "checks", "definition": {"resultAccessPath": ["overdueLoans"]}},
                    {"uuid": "t3", "name": "unrelated", "definition": {}},
                ],
            }
        )
    )
    assert adapter.new_tests_naming("OVERDUE") == ["checks"]


def test_tests_naming_counts_changed_library_tests_and_ignores_unchanged_ones():
    own = adapter_miroir.baseline_instances(adapter_miroir.MIROIR_TEST_ENTITY)
    lend_tests = sorted(uuid for uuid, test in own.items() if "lendDocument" in json.dumps(test))
    assert len(lend_tests) >= 2, "the Library ships MiroirTests of lendDocument"
    unchanged = own[lend_tests[0]]
    changed = {**own[lend_tests[1]], "description": "now also checks the lending limit"}
    adapter = adapter_miroir.MiroirAdapter(
        FakeClient({adapter_miroir.MIROIR_TEST_ENTITY: [unchanged, changed, {"uuid": "new", "name": "limit", "definition": {"a": "lendDocument"}}]})
    )
    assert adapter.new_tests_naming("lendDocument") == [changed["name"], "limit"]


def test_instance_list_raises_on_a_failed_entry():
    import pytest
    from agent_bench.acceptance.adapter_miroir import _instance_list

    with pytest.raises(RuntimeError, match="applyTo is not an array"):
        _instance_list({"queryFailure": "FailedTransformer", "innerError": {"failureMessage": "filterList: applyTo is not an array"}})
