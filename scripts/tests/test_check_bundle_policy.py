"""Tests for scripts/check_bundle_policy.py (#326 Slice 12).

The fixture `fixtures/bundle_policy/bundle-report.json` is the standalone build's real report trimmed to a few
packages, chunks and findings; each test copies it, changes one thing, and runs the checker's command line.
"""

from __future__ import annotations

import copy
import json
from pathlib import Path

import pytest

import check_bundle_policy as checker

FIXTURE = Path(__file__).parent / "fixtures" / "bundle_policy" / "bundle-report.json"


@pytest.fixture
def report() -> dict:
    return json.loads(FIXTURE.read_text(encoding="utf-8"))


@pytest.fixture
def policy(report: dict) -> dict:
    return checker.init(report, {})


def run(tmp_path: Path, report: dict, policy: dict | None, *extra: str) -> tuple[int, dict]:
    """Runs the command line on copies of the report and the policy; returns the exit code and the policy file."""
    report_path = tmp_path / "bundle-report.json"
    policy_path = tmp_path / "bundle-policy.json"
    report_path.write_text(json.dumps(report), encoding="utf-8")
    if policy is not None:
        policy_path.write_text(json.dumps(policy), encoding="utf-8")
    code = checker.main([str(report_path), str(policy_path), *extra])
    written = json.loads(policy_path.read_text(encoding="utf-8")) if policy_path.exists() else {}
    return code, written


def violations(report: dict, policy: dict) -> list[str]:
    return [str(violation) for violation in checker.check(report, policy)]


def package(report: dict, name: str) -> dict:
    return next(entry for entry in report["packages"] if entry["name"] == name)


def test_init_writes_a_policy_the_report_passes(tmp_path: Path, report: dict) -> None:
    code, written = run(tmp_path, report, None, "--init")
    assert code == 0
    assert "react-dom" in written["eager"] and "mongodb" in written["lazy"]
    assert written["eagerGzipBaseline"] == report["totals"]["eager"]["gzipBytes"]
    assert written["forbiddenEager"] == ["@testing-library/*"]
    assert "miroir-standalone-app" not in written["eager"] + written["lazy"]  # the app itself is not listed
    assert "(bundler runtime)" not in written["eager"] + written["lazy"]


def test_init_keeps_the_tolerance_and_forbidden_list(tmp_path: Path, report: dict, policy: dict) -> None:
    policy.update({"eagerGzipTolerance": 0.05, "forbiddenEager": ["msw"], "eager": [], "lazy": []})
    _, written = run(tmp_path, report, policy, "--init")
    assert (written["eagerGzipTolerance"], written["forbiddenEager"]) == (0.05, ["msw"])
    assert written["eager"] == checker.init(report, {})["eager"]


def test_the_trimmed_real_report_passes_its_own_policy(tmp_path: Path, report: dict, policy: dict) -> None:
    assert run(tmp_path, report, policy)[0] == 0


def test_a_new_package_fails_with_its_import_chain(report: dict, policy: dict) -> None:
    policy["lazy"].remove("mongodb")
    [message] = violations(report, policy)
    assert message.startswith("[allowlist] mongodb is new in the build and loads on demand")
    assert package(report, "mongodb")["via"] in message


def test_a_lazy_package_that_loads_with_the_page_fails(report: dict, policy: dict) -> None:
    package(report, "mongodb")["loadKind"] = "eager"
    [message] = violations(report, policy)
    assert "mongodb is listed lazy but now loads with the page" in message


def test_an_eager_package_now_lazy_must_move_to_lazy(report: dict, policy: dict) -> None:
    package(report, "zod")["loadKind"] = "lazy"
    assert violations(report, policy) == ['[allowlist] zod now loads only on demand: move it to "lazy" in the policy']


def test_a_listed_package_that_left_the_build_must_be_removed(report: dict, policy: dict) -> None:
    report["packages"] = [entry for entry in report["packages"] if entry["name"] != "zod"]
    assert violations(report, policy) == ["[allowlist] zod is no longer in the build: remove it from the policy"]


def test_a_package_listed_twice_fails(report: dict, policy: dict) -> None:
    policy["lazy"].append("zod")
    assert violations(report, policy) == ["[allowlist] zod is listed both eager and lazy: keep one"]


def test_a_node_built_in_emptied_for_the_browser_counts_as_a_package(report: dict, policy: dict) -> None:
    assert "node:fs via miroir-store-indexedDb" in policy["eager"]
    assert "node:fs via mongodb" in policy["lazy"]
    assert not any(name.startswith("node:") and "node-fetch" in name for name in policy["eager"] + policy["lazy"])
    finding = copy.deepcopy(next(f for f in report["findings"] if f["importerPackage"] == "miroir-store-indexedDb"))
    finding.update(module="path")
    report["findings"].append(finding)
    [message] = violations(report, policy)
    assert message.startswith("[allowlist] node:path via miroir-store-indexedDb is new in the build and loads with the page")


def test_testing_library_loading_with_the_page_fails_even_when_listed(report: dict, policy: dict) -> None:
    package(report, "@testing-library/dom")["loadKind"] = "eager"
    policy["lazy"].remove("@testing-library/dom")
    policy["eager"].append("@testing-library/dom")
    [message] = violations(report, policy)
    assert message.startswith("[forbidden] @testing-library/dom loads with the page")
    assert "@testing-library/*" in message


@pytest.mark.parametrize(
    ("factor", "expected"),
    [(1.019, None), (0.981, None), (1.021, "over the baseline"), (0.979, "under the baseline")],
)
def test_the_eager_gzip_size_stays_within_two_percent_of_the_baseline(
    report: dict, policy: dict, factor: float, expected: str | None
) -> None:
    size = policy["eagerGzipBaseline"]
    report["totals"]["eager"]["gzipBytes"] = round(size * factor)
    found = violations(report, policy)
    if expected is None:
        assert found == []
        return
    [message] = found
    assert message.startswith("[budget]") and expected in message
    assert str(size) in message and str(round(size * factor)) in message


def test_below_the_band_the_message_gives_the_new_baseline(report: dict, policy: dict) -> None:
    report["totals"]["eager"]["gzipBytes"] = 1000
    [message] = violations(report, policy)
    assert "lower eagerGzipBaseline to 1000" in message


def test_a_missing_report_asks_for_a_build(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert checker.main([str(tmp_path / "none.json"), str(tmp_path / "policy.json")]) == 2
    assert "build the app first" in capsys.readouterr().err


def test_the_command_line_prints_each_violation_and_exits_1(
    tmp_path: Path, report: dict, policy: dict, capsys: pytest.CaptureFixture[str]
) -> None:
    policy["lazy"].remove("mongodb")
    assert run(tmp_path, report, policy)[0] == 1
    output = capsys.readouterr().out
    assert "[allowlist] mongodb is new in the build" in output and "1 violation(s)" in output

