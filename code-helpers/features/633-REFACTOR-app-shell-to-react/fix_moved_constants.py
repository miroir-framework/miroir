"""#633: point the logger constants of modules moved into packages/miroir-react/src at the package's own.

In the app, `packageName` came from `src/constants.ts` and `cleanLevel` from `4_view/constants.ts`. In
miroir-react they come from `src/constants.ts` and `src/viewConstants.ts` (#592 D3). Rewrites the two
import lines of each file given, whatever relative path they used.

Usage: python code-helpers/features/633-REFACTOR-app-shell-to-react/fix_moved_constants.py <file> [...]
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

REACT_SRC = Path(__file__).resolve().parents[3] / "packages/miroir-react/src"
IMPORT = re.compile(r"""^import \{ (packageName|cleanLevel) \} from ['"](?:\.\./|\./)+constants(?:\.js)?['"];?$""", re.M)


def relative(file: Path, target: str) -> str:
    rel = os.path.relpath(REACT_SRC / target, file.parent).replace(os.sep, "/")
    return rel if rel.startswith(".") else f"./{rel}"


def main() -> None:
    for name in sys.argv[1:]:
        file = Path(name).resolve()
        text = file.read_text(encoding="utf-8")
        new = IMPORT.sub(
            lambda m: f'import {{ {m.group(1)} }} from "'
            + relative(file, "constants.js" if m.group(1) == "packageName" else "viewConstants.js")
            + '";',
            text,
        )
        if new != text:
            file.write_text(new, encoding="utf-8")
            print(f"{name}: constants imports rewritten")


if __name__ == "__main__":
    main()
