"""Tests for scripts/check_bundle_policy.py (#326 Slice 12) and the `bundle` job of pr-checks.yml that runs it (Slice 14).

The fixture `fixtures/bundle_policy/bundle-report.json` is the standalone build's real report trimmed to a few
packages, chunks and findings; each test copies it, changes one thing, and runs the checker's command line.
"""

from __future__ import annotations

import copy
import json
import os
import subprocess
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



# Slice 14: the `bundle` job of pr-checks.yml.

REPO_ROOT = Path(__file__).resolve().parents[2]
APPS = ("miroir-standalone-app", "miroir-standalone-app-electron")


def _pr_checks() -> dict:
    yaml = pytest.importorskip("yaml")
    return yaml.safe_load((REPO_ROOT / ".github" / "workflows" / "pr-checks.yml").read_text(encoding="utf-8"))


def _step(job: dict, step_id: str) -> dict:
    return next(step for step in job["steps"] if step.get("id") == step_id)


def _git(repo: Path, *args: str) -> None:
    subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True)


def _gate(tmp_path: Path, changed: str, event: str = "pull_request") -> str:
    """Runs the path gate's script on a two-commit repository whose last commit changes `changed`."""
    repo = tmp_path / "repo"
    (repo / Path(changed).parent).mkdir(parents=True, exist_ok=True)
    _git(tmp_path, "init", "-q", str(repo))
    _git(repo, "commit", "-q", "--allow-empty", "-m", "base", "--no-gpg-sign")
    (repo / changed).write_text("changed\n", encoding="utf-8")
    _git(repo, "add", "-A")
    _git(repo, "commit", "-q", "-m", "change", "--no-gpg-sign")
    step = _step(_pr_checks()["jobs"]["bundle-paths"], "paths")
    output = tmp_path / "github_output"
    assert step["env"] == {"EVENT_NAME": "${{ github.event_name }}"}
    env = {**os.environ, "EVENT_NAME": event, "GITHUB_OUTPUT": str(output)}
    subprocess.run(["bash", "-eo", "pipefail", "-c", step["run"]], cwd=repo, env=env, check=True)
    return output.read_text(encoding="utf-8").strip()


@pytest.fixture
def git_identity(monkeypatch: pytest.MonkeyPatch) -> None:
    for name, value in {"GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t"}.items():
        monkeypatch.setenv(name, value)


@pytest.mark.parametrize(
    ("changed", "expected"),
    [
        ("packages/miroir-core/src/index.ts", "run=true"),
        ("package-lock.json", "run=true"),
        ("package.json", "run=true"),
        (".npmrc", "run=true"),
        ("tsconfig.json", "run=true"),
        ("scripts/patch-tsup-baseurl.cjs", "run=true"),
        ("scripts/check_bundle_policy.py", "run=true"),
        (".github/workflows/pr-checks.yml", "run=true"),
        ("docs/guides/why-miroir.md", "run=false"),
        ("scripts/check_dependency_policy.py", "run=false"),
        ("docs/tsconfig.json", "run=false"),
    ],
)
def test_the_bundle_job_runs_only_when_the_pr_changes_what_it_builds(
    tmp_path: Path, git_identity: None, changed: str, expected: str
) -> None:
    assert _gate(tmp_path, changed) == expected


def test_the_bundle_job_always_runs_when_started_by_hand(tmp_path: Path, git_identity: None) -> None:
    assert _gate(tmp_path, "docs/guides/why-miroir.md", event="workflow_dispatch") == "run=true"


def test_the_bundle_job_is_skipped_by_the_gate() -> None:
    jobs = _pr_checks()["jobs"]
    assert jobs["bundle"]["needs"] == "bundle-paths"
    assert jobs["bundle"]["if"] == "needs.bundle-paths.outputs.run == 'true'"
    assert jobs["bundle-paths"]["outputs"]["run"] == "${{ steps.paths.outputs.run }}"


def test_the_bundle_job_guards_both_apps_and_uploads_their_reports() -> None:
    job = _pr_checks()["jobs"]["bundle"]
    scripts = "\n".join(step.get("run", "") for step in job["steps"])
    assert "npm ci" in scripts
    for app in APPS:
        assert any(line.strip().startswith("npm run build") and app in line.split() for line in scripts.splitlines())
        policy = f"packages/{app}/bundle-policy.json"
        assert (REPO_ROOT / policy).exists()
        assert f"check_bundle_policy.py packages/{app}/" in scripts and policy in scripts
    upload = next(step for step in job["steps"] if step.get("uses", "").startswith("actions/upload-artifact@"))
    paths = upload["with"]["path"]
    assert "packages/miroir-standalone-app/dist/.vite/bundle-report.*" in paths
    assert "packages/miroir-standalone-app-electron/dist/bundle-report.json" in paths
    assert "*.map" in paths
    assert upload["with"]["include-hidden-files"] is True  # dist/.vite is a hidden directory
    assert upload["if"] == "${{ !cancelled() }}"  # the reports matter most when a guard fails
