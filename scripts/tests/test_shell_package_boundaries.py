"""#633: the app shell moves from miroir-standalone-app to miroir-react.

- miroir-react never imports its own entry ("miroir-react") from its sources: the moved modules import the
  module that declares each symbol. A self-import is an entry cycle, and tsup would resolve it to dist.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REACT_SRC = ROOT / "packages/miroir-react/src"

SELF_IMPORT = re.compile(r"""(?:from\s*|import\s*\(\s*|^\s*import\s+)['"]miroir-react(?:/[^'"]*)?['"]""", re.M)
COMMENT = re.compile(r"/\*.*?\*/|//[^\n]*", re.S)


def test_no_self_import() -> None:
    offenders = [
        str(path.relative_to(ROOT))
        for path in sorted(REACT_SRC.rglob("*"))
        if path.suffix in (".ts", ".tsx") and SELF_IMPORT.search(COMMENT.sub("", path.read_text(encoding="utf-8")))
    ]
    assert offenders == [], f"import the declaring module instead of the package entry: {offenders}"
