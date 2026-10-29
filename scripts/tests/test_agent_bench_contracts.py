"""Contracts of the agent cost benchmark (#550, Slice 0).

Locks the Library facts the acceptance scenarios rely on, so a change to the Library data cannot silently change
the expected results, and checks that the task prompts and the arm pages carry the contracts of analysis D11.
"""

from __future__ import annotations

import re

import pytest

from agent_bench import task
from agent_bench.acceptance import scenarios


def by_name(counts: dict[str, int]) -> dict[str, int]:
    names = scenarios.user_names()
    return {names[user]: count for user, count in counts.items()}


def test_overdue_loans_before_the_fixed_cutoff():
    overdue = scenarios.overdue_loans("2026-07-02")
    users = {loan.user for loan in scenarios.loans() if loan.uuid in overdue}
    assert (len(overdue), len(users)) == (21, 5)


def test_a_loan_started_on_the_cutoff_is_not_overdue():
    """With the cutoff 2026-07-02, the loan of 2026-07-01 is overdue, the one of 2026-07-02 is not."""
    started = {loan.start.date().isoformat(): loan.uuid for loan in scenarios.open_loans()}
    overdue = scenarios.overdue_loans("2026-07-02")
    assert (started["2026-07-01"] in overdue, started["2026-07-02"] in overdue) == (True, False)


def test_later_july_loans_are_not_overdue():
    july = {loan.uuid for loan in scenarios.open_loans() if loan.start.strftime("%Y-%m") == "2026-07"}
    assert len(july) == 20 and len(july & scenarios.overdue_loans("2026-07-02")) == 1


def test_returned_loans_are_never_overdue():
    returned = {loan.uuid for loan in scenarios.loans() if loan.end is not None}
    assert returned and not returned & scenarios.overdue_loans("2026-08-01")


def test_open_loans_per_user_split_the_users_around_the_limit():
    assert by_name(scenarios.open_loans_per_user()) == {
        "Laurence Jambois": 9,
        "Pierre Martin": 8,
        "François Dupont": 8,
        "Jeanne Dielman": 8,
        "Marie Martin": 7,
    }


def test_one_user_is_below_the_limit():
    assert [scenarios.user_names()[u] for u in scenarios.users_below_limit()] == ["Marie Martin"]


@pytest.mark.parametrize(
    "feature, arm, identifiers",
    [
        ("overdue-loans", "miroir-mcp", ["OverdueLoans", "startedBefore", "overdueLoans", "OverdueLoansPerUser", "MiroirTest"]),
        ("overdue-loans", "miroir-files", ["OverdueLoans", "startedBefore", "overdueLoans", "OverdueLoansPerUser", "MiroirTest"]),
        ("overdue-loans", "conventional", ["/api/loans/overdue", "startedBefore", "/loans/overdue", "uuid", "Vitest"]),
        ("lending-limit", "miroir-mcp", ["lendDocument", "Lending", "error", "MiroirTest"]),
        ("lending-limit", "miroir-files", ["lendDocument", "Lending", "error", "MiroirTest"]),
        ("lending-limit", "conventional", ["POST /api/loans", "409", "Vitest"]),
    ],
)
def test_prompt_carries_the_contract_of_its_arm(feature, arm, identifiers):
    prompt = task.task_prompt(feature, arm)
    assert [name for name in identifiers if name not in prompt] == []


def test_feature_parameters_are_the_ones_the_scenarios_use():
    assert scenarios.STARTED_BEFORE in task.task_prompt("overdue-loans", "conventional")
    assert f"at most {scenarios.LENDING_LIMIT} Books" in task.task_description("lending-limit")


@pytest.mark.parametrize("feature", task.FEATURES)
def test_every_arm_gets_the_same_description_and_no_other_arm_contract(feature):
    prompts = {arm: task.task_prompt(feature, arm) for arm in task.ARMS}
    description = task.task_description(feature)
    assert all(prompt.startswith(description) for prompt in prompts.values())
    assert "Vitest" not in prompts["miroir-mcp"] and "MiroirTest" not in prompts["conventional"]


@pytest.mark.parametrize("arm", task.ARMS)
def test_arm_page_is_one_page_and_names_no_harness_path(arm):
    page = task.agents_md(arm)
    assert len(page.splitlines()) <= 60
    assert not re.search(r"agent_bench|reference/|acceptance", page)


def test_task_hash_changes_with_the_arm():
    assert task.task_hash("overdue-loans", "miroir-mcp") != task.task_hash("overdue-loans", "miroir-files")
