"""#664 D3, D10: the npm publish workflow can only publish when a maintainer starts it and asks for it, and no
other code of the repository runs `npm publish` for real.

The workflow is checked as data: it cannot run outside GitHub Actions."""

from __future__ import annotations

import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github" / "workflows" / "publish-npm.yml"
PUBLISH_MODULE = "ci/release/release_lib/publish.py"


def workflow() -> dict:
    return yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))


def triggers(data: dict) -> dict:
    return data.get("on", data.get(True))  # YAML 1.1 reads a bare `on` key as true


def job() -> dict:
    jobs = workflow()["jobs"]
    assert list(jobs) == ["publish"]
    return jobs["publish"]


def step(name: str) -> dict:
    found = [s for s in job()["steps"] if s.get("name") == name]
    assert len(found) == 1, name
    return found[0]


def test_only_a_maintainer_starts_it() -> None:
    assert list(triggers(workflow())) == ["workflow_dispatch"]


def test_a_run_is_a_dry_run_unless_asked() -> None:
    publish = triggers(workflow())["workflow_dispatch"]["inputs"]["publish"]
    assert (publish["type"], publish["default"]) == ("boolean", False)


def test_the_job_has_only_what_publishing_needs() -> None:
    data = workflow()
    assert data["permissions"] == {}
    assert job()["permissions"] == {"contents": "write", "id-token": "write"}
    assert job()["environment"] == "npm-publish"
    assert data["concurrency"] == {"group": "npm-publish", "cancel-in-progress": False}


def test_only_the_guarded_steps_publish_and_record() -> None:
    steps = job()["steps"]
    really = [s for s in steps if "--yes" in s.get("run", "") or "--record" in s.get("run", "")]
    assert [s["name"] for s in really] == ["Publish", "Record the release (tag and release branch)"]
    assert all(s["if"] == "${{ inputs.publish }}" for s in really)
    assert "--yes" not in step("Publish (dry run)")["run"]
    names = [s["name"] for s in steps]
    assert names.index("Publish") < names.index("Record the release (tag and release branch)")


def test_every_publish_signs_provenance() -> None:
    assert "--provenance" in step("Publish")["run"]
    assert "--provenance" in step("Publish (dry run)")["run"]


def test_the_token_reaches_only_the_publish_step() -> None:
    holders = [s["name"] for s in job()["steps"] if "secrets." in str(s)]
    assert holders == ["Publish"]


# an npm argument list starting with publish (Python), or a shell command line running npm publish
PY_PUBLISH = re.compile(r"""\[\s*["']publish["']|(?:["']npm["']|executable\(["']npm["']\))\s*,\s*["']publish["']""")
SHELL_PUBLISH = re.compile(r"^\s*(?:-\s*)?(?:run:\s*)?(?:\S+=\S+\s+)*npm\s+publish\b")


def test_no_other_code_runs_npm_publish() -> None:
    """Outside the publish module, `npm publish` appears only as a dry run, in docs, or in tests."""
    offenders = []
    for folder in ("ci", "scripts", ".github"):
        for path in (ROOT / folder).rglob("*"):
            rel = path.relative_to(ROOT).as_posix()
            if not path.is_file() or path.suffix not in {".py", ".sh", ".yml", ".yaml", ".js", ".mjs", ".ts"}:
                continue
            if rel == PUBLISH_MODULE or "/tests/" in f"/{rel}" or "__pycache__" in rel:
                continue
            for number, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
                pattern = PY_PUBLISH if path.suffix == ".py" else SHELL_PUBLISH
                if pattern.search(line) and "--dry-run" not in line and not line.lstrip().startswith("#"):
                    offenders.append(f"{rel}:{number}: {line.strip()}")
    assert offenders == []
