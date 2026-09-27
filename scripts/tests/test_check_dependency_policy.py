"""check_dependency_policy: nothing enters the build unless someone chose it (#326)."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

from check_dependency_policy import check_classification, check_lockfile, check_specs, check_workflows, main, spec_problem

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "scripts" / "check_dependency_policy.py"


def _write(path: Path, content: dict | str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content if isinstance(content, str) else json.dumps(content, indent=2), encoding="utf-8")


@pytest.fixture
def repo(tmp_path: Path) -> Path:
    """A two-package workspace shaped like this repo's, every spec pinned."""
    _write(
        tmp_path / "package.json",
        {
            "name": "miroir-framework",
            "workspaces": ["packages/*"],
            "overrides": {"yaml": "2.8.1"},
            "devDependencies": {"lerna": "9.0.5", "typescript": "npm:@typescript/typescript6@6.0.3"},
        },
    )
    _write(tmp_path / ".npmrc", "save-exact=true\n")
    _write(
        tmp_path / "packages/miroir-core/package.json",
        {"name": "miroir-core", "dependencies": {"zod": "3.25.76"}, "devDependencies": {"vitest": "3.2.4"}},
    )
    _write(
        tmp_path / "packages/miroir-react/package.json",
        {
            "name": "miroir-react",
            "dependencies": {"miroir-core": "*", "@mui/material": "5.18.0"},
            "peerDependencies": {"react": ">=18.0.0", "@mui/material": ">=5.0.0"},
        },
    )
    _write(
        tmp_path / "package-lock.json",
        {
            "lockfileVersion": 3,
            "packages": {
                "": {"name": "miroir-framework"},
                "node_modules/lerna": {"version": "9.0.5"},
                "node_modules/typescript": {"name": "@typescript/typescript6", "version": "6.0.3"},
                "node_modules/zod": {"version": "3.25.76"},
                "node_modules/vitest": {"version": "3.2.4", "optionalDependencies": {"fsevents": "~2.3.3"}},
                "node_modules/fsevents": {"version": "2.3.3", "os": ["darwin"], "optional": True},
                "node_modules/@mui/material": {"version": "5.17.1"},
                "packages/miroir-react/node_modules/@mui/material": {"version": "5.18.0"},
            },
        },
    )
    _write(tmp_path / ".github/workflows/ci.yml", "jobs:\n  a:\n    steps:\n      - run: npm ci\n")
    return tmp_path


def _set(repo: Path, package: str, section: str, name: str, spec: str) -> None:
    path = repo / "package.json" if package == "." else repo / "packages" / package / "package.json"
    manifest = json.loads(path.read_text(encoding="utf-8"))
    manifest.setdefault(section, {})[name] = spec
    _write(path, manifest)


def test_a_pinned_workspace_passes(repo: Path) -> None:
    assert check_specs(repo) == []


@pytest.mark.parametrize("spec", ["^1.2.3", "~1.2.3", "*", "1.x", ">=1.2.3", "1.2.3 - 1.4.0", "^1.0.0 || ^2.0.0", "latest"])
def test_a_floating_third_party_spec_is_a_violation(repo: Path, spec: str) -> None:
    _set(repo, "miroir-core", "dependencies", "zod", spec)
    [violation] = check_specs(repo)
    assert violation.where == "packages/miroir-core/package.json"
    assert f'dependencies.zod "{spec}"' in violation.message


@pytest.mark.parametrize("section", ["devDependencies", "optionalDependencies"])
def test_every_install_section_is_checked(repo: Path, section: str) -> None:
    _set(repo, "miroir-core", section, "left-pad", "^1.3.0")
    assert [v.message.split(":")[0] for v in check_specs(repo)] == [f'{section}.left-pad "^1.3.0"']


def test_root_overrides_are_checked_including_nested_ones(repo: Path) -> None:
    _set(repo, ".", "overrides", "yaml", "^2.4.2")
    _set(repo, ".", "overrides", "vite", {"esbuild": "~0.25.0"})  # type: ignore[arg-type]
    messages = [v.message for v in check_specs(repo)]
    assert any(m.startswith('overrides.yaml "^2.4.2"') for m in messages)
    assert any(m.startswith('overrides.vite > esbuild "~0.25.0"') for m in messages)


def test_an_alias_is_checked_on_its_version(repo: Path) -> None:
    _set(repo, ".", "devDependencies", "typescript", "npm:@typescript/typescript6@^6.0.2")
    [violation] = check_specs(repo)
    assert "typescript" in violation.message


def test_peer_dependency_ranges_pass(repo: Path) -> None:
    assert not [v for v in check_specs(repo) if "react" in v.message]


def test_internal_packages_use_star(repo: Path) -> None:
    _set(repo, "miroir-react", "dependencies", "miroir-core", "^0.5.0-rc.1")
    [violation] = check_specs(repo)
    assert 'dependencies.miroir-core "^0.5.0-rc.1": internal packages use "*"' in violation.message


@pytest.mark.parametrize("npmrc", [None, "", "save-exact=false\n"])
def test_the_root_npmrc_must_save_exact_versions(repo: Path, npmrc: str | None) -> None:
    if npmrc is None:
        (repo / ".npmrc").unlink()
    else:
        _write(repo / ".npmrc", npmrc)
    [violation] = check_specs(repo)
    assert violation.where == ".npmrc"


@pytest.mark.parametrize(
    "spec",
    [
        "3.25.76",
        "0.5.0-rc.1",
        "npm:typescript@7.0.2",
        "file:vendor/xlsx-0.20.3.tgz",
        "https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz",
        "github:owner/repo#0123456789abcdef0123456789abcdef01234567",
    ],
)
def test_pinned_spec_forms_pass(spec: str) -> None:
    assert spec_problem(spec) is None


def test_a_git_branch_reference_is_a_violation() -> None:
    assert spec_problem("github:owner/repo#main") is not None


def test_cli_exit_codes(repo: Path, capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["--root", str(repo), "--rule", "specs"]) == 0
    _set(repo, "miroir-core", "dependencies", "zod", "^3.25.76")
    assert main(["--root", str(repo), "--rule", "specs"]) == 1
    assert '[specs] packages/miroir-core/package.json: dependencies.zod "^3.25.76"' in capsys.readouterr().out


@pytest.mark.parametrize("tool", ["electron", "electron-builder", "happy-dom", "vite", "vitest", "vite-plugin-node", "@vitejs/plugin-react"])
def test_a_build_or_test_tool_in_dependencies_is_a_violation(repo: Path, tool: str) -> None:
    _set(repo, "miroir-core", "dependencies", tool, "1.0.0")
    [violation] = check_classification(repo)
    assert (violation.where, violation.message) == (
        "packages/miroir-core/package.json",
        f"{tool} is a build or test tool: move it to devDependencies",
    )


def test_build_and_test_tools_in_dev_dependencies_pass(repo: Path) -> None:
    _set(repo, "miroir-core", "devDependencies", "vite", "7.3.1")
    _set(repo, "miroir-core", "devDependencies", "happy-dom", "20.7.0")
    assert check_classification(repo) == []


def test_a_runtime_package_named_like_a_tool_passes(repo: Path) -> None:
    _set(repo, "miroir-core", "dependencies", "electron-squirrel-startup", "1.0.1")
    assert check_classification(repo) == []


def test_a_lockfile_that_installs_the_pinned_versions_passes(repo: Path) -> None:
    assert check_lockfile(repo) == []


def test_a_pinned_spec_the_lockfile_does_not_install_is_a_violation(repo: Path) -> None:
    _set(repo, "miroir-core", "dependencies", "zod", "3.25.75")
    [violation] = check_lockfile(repo)
    assert violation.message == 'dependencies.zod "3.25.75" but package-lock.json installs 3.25.76'


def test_the_nested_copy_counts_for_its_package(repo: Path) -> None:
    _set(repo, "miroir-react", "dependencies", "@mui/material", "5.17.1")
    [violation] = check_lockfile(repo)
    assert violation.where == "packages/miroir-react/package.json"


def test_a_missing_platform_package_is_a_violation(repo: Path) -> None:
    lock = json.loads((repo / "package-lock.json").read_text(encoding="utf-8"))
    lock["packages"]["node_modules/vitest"]["optionalDependencies"]["@rollup/rollup-linux-x64-gnu"] = "4.59.0"
    _write(repo / "package-lock.json", lock)
    [violation] = check_lockfile(repo)
    assert "node_modules/vitest lacks 1 package(s) (@rollup/rollup-linux-x64-gnu)" in violation.message


def test_a_missing_dependency_is_a_violation(repo: Path) -> None:
    lock = json.loads((repo / "package-lock.json").read_text(encoding="utf-8"))
    lock["packages"]["node_modules/lerna"]["dependencies"] = {"nx": "22.5.0"}
    _write(repo / "package-lock.json", lock)
    [violation] = check_lockfile(repo)
    assert "node_modules/lerna lacks 1 package(s) (nx)" in violation.message


@pytest.mark.parametrize(
    "command", ["npm install", "npm i --no-audit", "npm install --no-save left-pad", "cd x && npm add y"]
)
def test_npm_install_in_a_workflow_is_a_violation(repo: Path, command: str) -> None:
    _write(repo / ".github/workflows/ci.yml", f"jobs:\n  a:\n    steps:\n      - run: {command}\n")
    [violation] = check_workflows(repo)
    assert violation.where == ".github/workflows/ci.yml:4"


def test_npm_install_in_a_composite_action_is_a_violation(repo: Path) -> None:
    _write(repo / ".github/actions/setup/action.yml", "runs:\n  steps:\n    - run: |\n        npm install\n")
    [violation] = check_workflows(repo)
    assert violation.where == ".github/actions/setup/action.yml:4"


def test_npm_ci_and_comments_pass(repo: Path) -> None:
    _write(repo / ".github/workflows/ci.yml", "# npm install used to run here\njobs:\n  a:\n    steps:\n      - run: npm ci  # not npm install\n")
    assert check_workflows(repo) == []


@pytest.mark.parametrize("rule", ["specs", "classification", "lockfile", "workflows"])
def test_this_repository_follows_the_rule(rule: str) -> None:
    result = subprocess.run([sys.executable, str(SCRIPT), "--rule", rule], cwd=REPO_ROOT, capture_output=True, text=True)
    assert result.returncode == 0, result.stdout
