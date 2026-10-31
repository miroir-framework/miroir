"""#627: the packages to publish (#621) install without the example and fixture applications.

`dependencies` of these packages never name a `miroir-example-*` or `miroir-fixture-*` package, and their
`src/` never imports one (tsup would inline an imported devDependency). Tests may use them as
devDependencies.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]

PUBLISHED_PACKAGES = [
    "miroir-core",
    "miroir-mcp",
    "miroir-cli",
    "miroir-ai",
    "miroir-localcache-redux",
    "miroir-localcache-zustand",
]

APPLICATION_PACKAGE = re.compile(r"^miroir-(example|fixture)-")
# import / export ... from "<package>", import("<package>"), side-effect import "<package>"
IMPORT_OF_APPLICATION_PACKAGE = re.compile(
    r"""^\s*(?:import|export)\b[^'"]*?(?:from\s*)?['"](miroir-(?:example|fixture)-[^'"/]+)|"""
    r"""\bimport\(\s*['"](miroir-(?:example|fixture)-[^'"/]+)""",
    re.MULTILINE,
)


def application_dependencies(package: str) -> list[str]:
    manifest = json.loads((ROOT / "packages" / package / "package.json").read_text(encoding="utf-8"))
    return sorted(name for name in manifest.get("dependencies", {}) if APPLICATION_PACKAGE.match(name))


def application_imports(package: str) -> list[str]:
    found = []
    for path in sorted((ROOT / "packages" / package / "src").rglob("*.ts*")):
        text = path.read_text(encoding="utf-8")
        for match in IMPORT_OF_APPLICATION_PACKAGE.finditer(text):
            found.append(f"{path.relative_to(ROOT)}: {match.group(1) or match.group(2)}")
    return found


@pytest.mark.parametrize("package", PUBLISHED_PACKAGES)
def test_dependencies_name_no_example_or_fixture_package(package: str):
    assert application_dependencies(package) == []


@pytest.mark.parametrize("package", PUBLISHED_PACKAGES)
def test_src_imports_no_example_or_fixture_package(package: str):
    assert application_imports(package) == []


def test_the_import_pattern_ignores_comments_and_strings():
    text = '\n'.join(
        [
            '// } from "miroir-example-library";',
            'const folder = "miroir-example-library/assets";',
            'import { x } from "miroir-example-library";',
            'const m = await import("miroir-fixture-appForTest");',
        ]
    )
    assert [m.group(1) or m.group(2) for m in IMPORT_OF_APPLICATION_PACKAGE.finditer(text)] == [
        "miroir-example-library",
        "miroir-fixture-appForTest",
    ]
