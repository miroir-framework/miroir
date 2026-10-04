"""#340: the smell runner (scripts/code_smells.py) without ESLint: text checks, diff filtering, report."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

import pytest

import code_smells
from code_smells import Finding

ROOT = Path(__file__).resolve().parents[2]
SKILL = ROOT / ".agents" / "skills" / "miroir-code-quality"


def _checklist_ids() -> list[str]:
    return re.findall(r"^\| \d+ \| `([a-z-]+)` \|", (SKILL / "SKILL.md").read_text(encoding="utf-8"), re.MULTILINE)


def test_the_runner_orders_smells_as_the_skill_checklist() -> None:
    ids = _checklist_ids()
    assert len(ids) == len(set(ids))
    assert [smell for smell in ids if smell in code_smells.SMELL_ORDER] == code_smells.SMELL_ORDER
    assert set(code_smells.RULE_SMELLS.values()) <= set(ids)


def test_every_lens_smell_has_a_checklist_row_and_a_reference_entry() -> None:
    lens = (ROOT / "eslint-rules" / "smell-lens.config.mjs").read_text(encoding="utf-8")
    lens_ids = set(re.findall(r'smell\(\s*"([a-z-]+)"', lens)) | set(re.findall(r'"\[([a-z-]+)\]', lens))
    assert lens_ids and lens_ids <= set(_checklist_ids())
    headings = {
        (md.name, heading)
        for md in SKILL.glob("*.md")
        for heading in re.findall(r"^## ([a-z-]+)$", md.read_text(encoding="utf-8"), re.MULTILINE)
    }
    links = re.findall(r"\]\(([a-z]+\.md)#([a-z-]+)\)", (SKILL / "SKILL.md").read_text(encoding="utf-8"))
    assert {smell for _, smell in links} == set(_checklist_ids())
    assert [link for link in links if link not in headings] == []


def test_smell_of_reads_the_bracketed_id_of_custom_messages_only() -> None:
    assert code_smells.smell_of("no-restricted-syntax", "[module-state] Module-level `let`") == "module-state"
    assert code_smells.smell_of("no-restricted-globals", "[component-io] fetch in a component") == "component-io"
    # A rule's own message can hold brackets that are not smell ids.
    assert code_smells.smell_of("react-hooks/exhaustive-deps", "missing dependency: [items]") == "unstable-deps"
    assert code_smells.smell_of("no-mixed-operators", "Unexpected mix of '??' and '=='") == "precedence-trap"
    assert code_smells.smell_of("some/other-rule", "message") == "some/other-rule"
    assert code_smells.smell_of(None, "Parsing error: ';' expected") == "parse-error"


def test_parse_added_lines_reads_unified_zero_context_hunks() -> None:
    diff = "\n".join(
        [
            "diff --git a/packages/a/src/x.ts b/packages/a/src/x.ts",
            "--- a/packages/a/src/x.ts",
            "+++ b/packages/a/src/x.ts",
            "@@ -3,0 +4,2 @@ export function f() {",
            "+  const a = 1;",
            "+  const b = 2;",
            "@@ -10 +12 @@",
            "-old",
            "+new",
            "@@ -20,3 +21,0 @@",
            "-gone",
            "diff --git a/packages/a/src/old.ts b/packages/a/src/old.ts",
            "--- a/packages/a/src/old.ts",
            "+++ /dev/null",
            "@@ -1,2 +0,0 @@",
        ]
    )
    assert code_smells.parse_added_lines(diff) == ({"packages/a/src/x.ts": {4, 5, 12}}, {})


def test_parse_added_lines_tells_moved_lines_from_new_ones() -> None:
    moved, new, reset = code_smells.MOVED, "\x1b[32m", "\x1b[m"
    diff = "\n".join(
        [
            "\x1b[1mdiff --git a/packages/a/src/y.ts b/packages/a/src/y.ts\x1b[m",
            "\x1b[1m--- a/packages/a/src/y.ts\x1b[m",
            "\x1b[1m+++ b/packages/a/src/y.ts\x1b[m",
            "\x1b[36m@@ -0,0 +1,3 @@\x1b[m",
            f"{moved}+{reset}{moved}const viewParams = results as unknown as ViewParams;{reset}",
            f"{new}+{reset}{new}++counter;{reset}",  # reads "+++" inside a hunk: still a line, not a header
            f"{new}+{reset}",
        ]
    )
    assert code_smells.parse_added_lines(diff) == ({"packages/a/src/y.ts": {2, 3}}, {"packages/a/src/y.ts": {1}})


def test_commented_out_code_finds_runs_of_code_lines_and_leaves_prose() -> None:
    text = "\n".join(
        [
            "// Explains why the cache is per deployment.",  # 1 prose
            "// See docs/reference/testing.md for the profiles.",  # 2 prose
            "const a = 1;",  # 3
            "// const b = f(a);",  # 4 run start
            "// if (b) {",  # 5
            "//   activityId: b.id,",  # 6 object property continues the run
            "//",  # 7 empty comment line inside the run
            "// }",  # 8
            "export const c = 2;",  # 9
            "// TODO: fix(this);",  # 10 marker comments are prose
            "// return x;",  # 11
            "// return y;",  # 12 only two code lines: too short to report
        ]
    )
    assert code_smells.commented_out_code(text) == [(4, 5)]


def test_logger_name_mismatches_report_copied_logger_names() -> None:
    text = (
        "import { MiroirLoggerFactory } from 'miroir-core';\n"
        'const loggerName: string = getLoggerName(packageName, cleanLevel, "Other");\n'
        'const second = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Sample");\n'
    )
    assert code_smells.logger_name_mismatches("packages/a/src/Sample.ts", text) == [(2, "Other")]
    named_with_extension = 'const n = getLoggerName(packageName, cleanLevel, "index.tsx");\n'
    assert code_smells.logger_name_mismatches("packages/a/src/index.tsx", named_with_extension) == []


def test_keep_added_keeps_findings_that_cover_an_added_line() -> None:
    path = "packages/a/src/x.ts"
    added = {path: {10, 11}}
    on_added = Finding("type-escape", path, 10, "m")
    elsewhere = Finding("type-escape", path, 3, "m")
    run_overlapping = Finding("dead-code", path, 8, "4 lines", 4)
    run_before = Finding("dead-code", path, 1, "3 lines", 3)
    whole_file = Finding("duplicated-logic", path, 1, "twin", 0)
    other_file = Finding("duplicated-logic", "packages/b/src/x.ts", 1, "twin", 0)
    findings = [on_added, elsewhere, run_overlapping, run_before, whole_file, other_file]
    assert code_smells.keep_added(findings, added) == [on_added, run_overlapping, whole_file]


def test_drilled_props_are_props_passed_on_as_is_in_many_files(tmp_path: Path) -> None:
    for name in "ABCDE":
        _write(tmp_path, f"packages/a/src/{name}.tsx", "<Child deploymentUuid={props.deploymentUuid} className={className} />\n")
    _write(tmp_path, "packages/a/src/F.tsx", "<Child\n  badges={badges}\n/>\n")
    text = "<Child deploymentUuid={deploymentUuid} />\n<Other badges={badges} />\n"
    assert code_smells.drilled_props("packages/a/src/G.tsx", text, tmp_path) == [(1, "deploymentUuid", 6)]


def test_render_orders_by_impact_and_groups_by_message() -> None:
    findings = [
        Finding("dead-code", "packages/a/src/x.ts", 5, "3 lines of commented-out code", 3),
        Finding("swallowed-error", "packages/a/src/x.ts", 9, "[swallowed-error] This catch only logs."),
        Finding("swallowed-error", "packages/a/src/y.ts", 2, "[swallowed-error] This catch only logs."),
        Finding("swallowed-error", "packages/a/src/y.ts", 7, "[swallowed-error] Empty .catch handler."),
    ]
    report = code_smells.render(findings, "test", limit=2)
    assert report.index("### swallowed-error") < report.index("### dead-code")
    assert report.count("This catch only logs.") == 1
    assert "[swallowed-error]" not in report
    assert "- `packages/a/src/y.ts:2`" in report
    assert "Empty .catch handler." not in report  # over the limit of 2
    assert "… 1 more (raise --limit)" in report
    assert "| swallowed-error | 3 |" in report
    assert code_smells.render([], "test", limit=2) == "No smell found (test).\n"
    assert "2 more on lines the change moves" in code_smells.render(findings, "test", limit=2, moved=2)


def _write(root: Path, path: str, text: str) -> None:
    (root / path).parent.mkdir(parents=True, exist_ok=True)
    (root / path).write_text(text, encoding="utf-8")


def test_twins_finds_near_identical_files_in_other_packages(tmp_path: Path) -> None:
    body = "".join(f"export const v{i} = {i};\n" for i in range(40))
    _write(tmp_path, "packages/a/src/tools/Helper.ts", body)
    _write(tmp_path, "packages/b/src/other/Helper.ts", body + "export const extra = 1;\n")
    _write(tmp_path, "packages/c/src/Helper.ts", "export const unrelated = true;\n")
    _write(tmp_path, "packages/a/src/more/Helper.ts", body)  # same package: not a twin
    assert [other for other, _ in code_smells.twins("packages/a/src/tools/Helper.ts", tmp_path)] == [
        "packages/b/src/other/Helper.ts"
    ]
    _write(tmp_path, "packages/a/src/constants.ts", 'export const cleanLevel = "4";\n')
    _write(tmp_path, "packages/b/src/constants.ts", 'export const cleanLevel = "4";\n')
    assert code_smells.twins("packages/a/src/constants.ts", tmp_path) == []  # too small to matter


def test_expand_keeps_typescript_sources_only(tmp_path: Path) -> None:
    for path in [
        "packages/a/src/x.ts",
        "packages/a/src/View.tsx",
        "packages/a/src/types.d.ts",
        "packages/a/dist/x.ts",
        "packages/a/src/preprocessor-generated/gen.ts",
        "packages/a/src/data.json",
    ]:
        _write(tmp_path, path, "")
    assert code_smells.expand(["packages/a"], tmp_path) == ["packages/a/src/View.tsx", "packages/a/src/x.ts"]


def test_paths_outside_the_repository_or_missing_are_input_errors(tmp_path: Path, capsys: pytest.CaptureFixture[str]) -> None:
    root = tmp_path / "repo"
    _write(root, "packages/a/src/x.ts", "")
    _write(tmp_path, "sibling/src/y.ts", "")
    for path, error in [("..", "outside the repository"), (str(tmp_path / "sibling"), "outside the repository"), ("packages/b", "no such file")]:
        with pytest.raises(SystemExit) as exited:
            code_smells.main(["--root", str(root), path])
        assert exited.value.code == 2
        assert error in capsys.readouterr().err


def test_diff_scope_covers_commits_working_tree_and_untracked_files(tmp_path: Path) -> None:
    def git(*args: str) -> None:
        subprocess.run(["git", *args], cwd=tmp_path, check=True, capture_output=True)

    git("init", "-q", "-b", "base")
    git("config", "user.email", "test@example.com")
    git("config", "user.name", "test")
    _write(tmp_path, "packages/a/src/x.ts", "line1\nline2\n")
    hook = "export function useViewParams(results: unknown) {\n  return results as unknown as ViewParams;\n}\n"
    _write(tmp_path, "packages/a/src/Panel.tsx", f"// panel\n{hook}")
    git("add", ".")
    git("commit", "-q", "-m", "base")
    git("checkout", "-q", "-b", "feature")
    _write(tmp_path, "packages/a/src/x.ts", "line1\nadded\nline2\n")
    _write(tmp_path, "packages/a/src/Panel.tsx", "// panel\n")
    _write(tmp_path, "packages/a/src/useViewParams.ts", f"import x from 'y';\n\n{hook}")  # moved, not new
    git("add", ".")
    git("commit", "-q", "-am", "feature")
    _write(tmp_path, "packages/a/src/x.ts", "line1\nadded\nline2\nworking\n")
    _write(tmp_path, "packages/a/src/New.tsx", "a\nb\n")
    _write(tmp_path, "packages/a/src/notes.md", "not a source\n")
    added, moved = code_smells.diff_scope("base", tmp_path)
    assert added["packages/a/src/x.ts"] == {2, 4}
    assert {1, 2} <= added["packages/a/src/New.tsx"]
    assert "packages/a/src/notes.md" not in added
    assert added["packages/a/src/useViewParams.ts"] == {1, 2}
    assert moved == {"packages/a/src/useViewParams.ts": {3, 4, 5}}
