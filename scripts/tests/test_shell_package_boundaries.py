"""#633: the app shell moves from miroir-standalone-app to miroir-react.

- miroir-react never imports its own entry ("miroir-react") from its sources: the moved modules import the
  module that declares each symbol. A self-import is an entry cycle, and tsup would resolve it to dist.
- miroir-sandbox builds from library packages: no `@miroir-app` alias into miroir-standalone-app sources in
  its Vite config, its tsconfig or its sources.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REACT_SRC = ROOT / "packages/miroir-react/src"
SANDBOX = ROOT / "packages/miroir-sandbox"

SELF_IMPORT = re.compile(r"""(?:from\s*|import\s*\(\s*|^\s*import\s+)['"]miroir-react(?:/[^'"]*)?['"]""", re.M)
COMMENT = re.compile(r"/\*.*?\*/|//[^\n]*", re.S)


def test_no_self_import() -> None:
    offenders = [
        str(path.relative_to(ROOT))
        for path in sorted(REACT_SRC.rglob("*"))
        if path.suffix in (".ts", ".tsx") and SELF_IMPORT.search(COMMENT.sub("", path.read_text(encoding="utf-8")))
    ]
    assert offenders == [], f"import the declaring module instead of the package entry: {offenders}"


def test_sandbox_has_no_app_alias() -> None:
    files = [SANDBOX / "vite.config.js", SANDBOX / "tsconfig.json"] + [
        path for path in sorted((SANDBOX / "src").rglob("*")) if path.suffix in (".ts", ".tsx")
    ]
    offenders = [
        str(path.relative_to(ROOT))
        for path in files
        if "@miroir-app" in path.read_text(encoding="utf-8") or "miroir-standalone-app/src" in path.read_text(encoding="utf-8")
    ]
    assert offenders == [], f"the sandbox must import library packages, not the app's sources: {offenders}"
