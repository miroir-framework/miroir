"""#330 Slice 0: list the cases of the two #284 UI tests, and check their coverage.

A case is an entry of a suite's `tests: { "<key>": { props: …, tests: async … } }` map.

Usage:
    python3 list_wizard_cases.py           # print the cases as markdown table rows
    python3 list_wizard_cases.py --check   # fail when a case of wizard-coverage.md has no "covered by"
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parents[2]
TEST_DIR = REPO / "packages/miroir-standalone-app/tests/4_view/issues/284-openapi-connection-wizard"
FILES = ["wizardWalk.284.integ.test.tsx", "multistepBranch.284.integ.test.tsx"]
COVERAGE = HERE / "wizard-coverage.md"

CASE_START = re.compile(r'^\s+"([A-Za-z0-9-]+)": \{\s*$')


def list_cases(path: pathlib.Path) -> list[tuple[str, int]]:
    """(case key, line) for every entry followed by a `props:` line, which excludes OpenAPI fixture keys."""
    lines = path.read_text(encoding="utf-8").splitlines()
    cases = []
    for index, line in enumerate(lines):
        match = CASE_START.match(line)
        if match and index + 1 < len(lines) and lines[index + 1].strip().startswith("props:"):
            cases.append((match.group(1), index + 1))
    return cases


def check() -> int:
    rows = [line for line in COVERAGE.read_text(encoding="utf-8").splitlines() if line.startswith("| `")]
    uncovered = [row for row in rows if row.rstrip().rstrip("|").split("|")[-1].strip() == ""]
    for row in uncovered:
        print("not covered:", row)
    return 1 if uncovered else 0


def main() -> int:
    if "--check" in sys.argv:
        return check()
    for file_name in FILES:
        for key, line in list_cases(TEST_DIR / file_name):
            print(f"| `{file_name}` L{line} | `{key}` | | |")
    return 0


if __name__ == "__main__":
    sys.exit(main())
