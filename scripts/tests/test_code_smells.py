"""#340: the smell runner (scripts/code_smells.py) without ESLint: text checks, diff filtering, report."""

from __future__ import annotations

import re
import subprocess
from collections import Counter
from pathlib import Path

import pytest

import code_smells
from code_smells import Finding

ROOT = Path(__file__).resolve().parents[2]
ESLINT = ROOT / "node_modules" / "eslint" / "bin" / "eslint.js"
SKILL = ROOT / ".agents" / "skills" / "miroir-code-quality"


def _checklist_ids() -> list[str]:
    return re.findall(r"^\| \d+ \| `([a-z-]+)` \|", (SKILL / "SKILL.md").read_text(encoding="utf-8"), re.MULTILINE)


def test_the_runner_orders_smells_as_the_skill_checklist() -> None:
    ids = _checklist_ids()
    assert len(ids) == len(set(ids))
    assert [smell for smell in ids if smell in code_smells.SMELL_ORDER] == code_smells.SMELL_ORDER
    assert set(code_smells.RULE_SMELLS.values()) <= set(ids)


def test_every_lens_smell_has_a_checklist_row_and_a_reference_entry() -> None:
    lens = "".join(
        (ROOT / "eslint-rules" / name).read_text(encoding="utf-8") for name in ("smell-lens.config.mjs", "smells.mjs")
    )
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
    assert code_smells.smell_of("miroir/action-result", "[action-result] throw in a function") == "action-result"
    assert code_smells.smell_of("miroir/component-io", "Unexpected use of 'fetch'. [component-io] fetch in a component") == "component-io"
    assert code_smells.smell_of("preserve-caught-error", "There is no `cause` attached to the symptom error being thrown.") == "swallowed-error"
    assert code_smells.smell_of("miroir/layers", "layer 1 imports layer 3") == "upward-import"
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
    # Lines 20-22 of the old file are cut between new lines 21 and 22; the deleted file has no new lines.
    assert code_smells.parse_added_lines(diff) == ({"packages/a/src/x.ts": {4, 5, 12}}, {}, {"packages/a/src/x.ts": {21}})


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
    assert code_smells.parse_added_lines(diff) == ({"packages/a/src/y.ts": {2, 3}}, {"packages/a/src/y.ts": {1}}, {})


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


def test_keep_added_keeps_a_construct_the_change_touches() -> None:
    path = "packages/a/src/x.ts"
    # A parameter list over lines 20-26 gets a sixth parameter on line 25; ESLint reports the whole list.
    long_list = Finding("long-parameter-list", path, 20, "m", 7)
    assert code_smells.keep_added([long_list], {path: {25}}) == [long_list]
    # Lines cut between 31 and 32, inside a catch block over lines 30-34: the rethrow is gone.
    catch = Finding("swallowed-error", path, 30, "m", 5)
    one_line = Finding("type-escape", path, 31, "m")
    assert code_smells.keep_added([catch, one_line], {}, {path: {31}}) == [catch]
    # A cut right before or right after the block leaves it as it was.
    assert code_smells.keep_added([catch], {}, {path: {29, 34}}) == []


def test_a_finding_inside_a_touched_construct_stays_when_the_change_adds_it() -> None:
    path = "packages/a/src/x.ts"
    memo = Finding("unstable-deps", path, 10, "React Hook useMemo has a missing dependency: 'a'.", 90)
    catch = Finding("swallowed-error", path, 120, "This catch only logs.", 4)
    other_catch = Finding("swallowed-error", path, 200, "This catch only logs.", 4)
    base = Counter({(path, "unstable-deps", memo.message): 1, (path, "swallowed-error", catch.message): 1})
    # The memo already missed `a`; the file has one swallowing catch more than before.
    assert code_smells.already_there([memo, catch], [memo, catch, other_catch], base) == [memo]


def test_an_eslint_message_covers_the_lines_of_its_node() -> None:
    message = {"ruleId": "lens/max-params", "message": "Function has too many parameters (6).", "line": 3, "endLine": 9}
    assert code_smells.eslint_finding("packages/a/src/x.ts", message) == Finding(
        "long-parameter-list", "packages/a/src/x.ts", 3, "Function has too many parameters (6).", 7
    )
    parse_error = {"ruleId": None, "fatal": True, "message": "Parsing error: ';' expected\nmore", "line": 4}
    assert code_smells.eslint_finding("packages/a/src/x.ts", parse_error) == Finding(
        "parse-error", "packages/a/src/x.ts", 4, "Parsing error: ';' expected"
    )


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
    fetch = Finding("component-io", "packages/a/src/V.tsx", 3, "Unexpected use of 'fetch'. [component-io] fetch in a view.")
    assert "\nUnexpected use of 'fetch'. fetch in a view.\n" in code_smells.render([fetch], "test", limit=2)


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
    _write(tmp_path, "packages/a/src/Panel.tsx", "// panel\n")  # the hook moves out: lines cut after line 1
    _write(tmp_path, "packages/a/src/useViewParams.ts", f"import x from 'y';\n\n{hook}")  # moved, not new
    git("add", ".")
    git("commit", "-q", "-am", "feature")
    _write(tmp_path, "packages/a/src/x.ts", "line1\nadded\nline2\nworking\n")
    _write(tmp_path, "packages/a/src/New.tsx", "a\nb\n")
    _write(tmp_path, "packages/a/src/notes.md", "not a source\n")
    added, moved, cuts = code_smells.diff_scope("base", tmp_path)
    assert added["packages/a/src/x.ts"] == {2, 4}
    assert {1, 2} <= added["packages/a/src/New.tsx"]
    assert "packages/a/src/notes.md" not in added
    assert added["packages/a/src/useViewParams.ts"] == {1, 2}
    assert moved == {"packages/a/src/useViewParams.ts": {3, 4, 5}}
    assert cuts == {"packages/a/src/Panel.tsx": {1}}


def _git(root: Path, *args: str) -> None:
    subprocess.run(["git", *args], cwd=root, check=True, capture_output=True)


@pytest.mark.skipif(not ESLINT.is_file(), reason="ESLint is not installed: run npm ci")
def test_diff_reports_the_smells_a_change_adds_inside_existing_constructs(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    _git(tmp_path, "init", "-q", "-b", "base")
    _git(tmp_path, "config", "user.email", "test@example.com")
    _git(tmp_path, "config", "user.name", "test")
    params = "".join(f"  {p}: number,\n" for p in "abcde")
    domain = (
        f"export function place(\n{params}): number {{\n  return a + b + c + d + e;\n}}\n\n"
        "export function load(read: () => number, log: Console): number {\n"
        "  try {\n    return read();\n  } catch (error) {\n    log.warn(error);\n    throw error;\n  }\n}\n"
    )
    hooks = (
        'import { useEffect, useMemo } from "react";\n\n'
        "export function useProbe(a: string, b: string, log: Console): string {\n"
        "  useEffect(() => {\n    log.info(a);\n  }, [a, log]);\n"
        "  return useMemo(() => {\n    const label = a + b;\n    return label;\n  }, [a]);\n}\n"
    )
    _write(tmp_path, "packages/a/src/domain.ts", domain)
    _write(tmp_path, "packages/a/src/useProbe.ts", hooks)
    _git(tmp_path, "add", ".")
    _git(tmp_path, "commit", "-q", "-m", "base")
    _git(tmp_path, "checkout", "-q", "-b", "feature")
    # A sixth parameter on its own line, a rethrow removed, `b` read in an effect that does not list it, and an edit
    # inside a memo that already missed `b`.
    domain = domain.replace("  e: number,\n", "  e: number,\n  f: number,\n").replace("c + d + e;", "c + d + e + f;")
    _write(tmp_path, "packages/a/src/domain.ts", domain.replace("    throw error;\n", ""))
    hooks = hooks.replace("    log.info(a);\n", "    log.info(a);\n    log.info(b);\n")
    _write(tmp_path, "packages/a/src/useProbe.ts", hooks.replace("const label = a + b;", "const label = `${a}${b}`;"))
    code_smells.main(["--root", str(tmp_path), "--diff", "base"])
    report = capsys.readouterr().out
    for smell in ["swallowed-error", "unstable-deps", "long-parameter-list"]:
        assert f"| {smell} | 1 |" in report, report
    assert "missing dependency: 'b'" in report
    assert "1 more in code that had them before the change" in report
