"""#639: the two startup calls import no store package and read no `process.env`; the hosts pass
their stores. The packages that carry the calls declare no store as a runtime dependency (a store
in devDependencies is for their tests).

Scope of the claim: the calls' own source files. Core classes they build (`RestClientStub`) read
`process.env` as before.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
CALL_SOURCES = [
    "packages/miroir-localcache-redux/src/startMiroirPlatform.ts",
    "packages/miroir-react/src/startMiroirClient.ts",
]
CALL_PACKAGES = ["miroir-localcache-redux", "miroir-react"]

# static `from "..."` and dynamic `import("...")` specifiers
SPECIFIER = re.compile(r"""(?:\bfrom\s+|\bimport\s*\(\s*)["']([^"']+)["']""")
STORE = re.compile(r"^miroir-store-")


@pytest.mark.parametrize("source", CALL_SOURCES)
def test_a_startup_call_imports_no_store_and_reads_no_environment(source):
    text = (REPO_ROOT / source).read_text(encoding="utf-8")
    specifiers = SPECIFIER.findall(text)
    assert specifiers, f"no import found in {source}: the pattern is stale"
    assert [s for s in specifiers if STORE.match(s)] == []
    assert "process.env" not in text


@pytest.mark.parametrize("package", CALL_PACKAGES)
def test_a_startup_call_package_declares_no_store_at_runtime(package):
    manifest = json.loads((REPO_ROOT / "packages" / package / "package.json").read_text(encoding="utf-8"))
    runtime = {**manifest.get("dependencies", {}), **manifest.get("peerDependencies", {})}
    assert sorted(name for name in runtime if STORE.match(name)) == []
