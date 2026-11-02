"""#636: the miroir-server release binary answers its HTTP surface (REST, auth, capabilities, assets, MCP).

Starts `packages/miroir-server/release/index.js` on the `bench-agent` environment (plain HTTP on
loopback ports 3080 and 4080, every section a copy in `.miroir/bench-agent/`) through the agent-bench
launcher. Runs only with MIROIR_RELEASE_SMOKE=1, set by the `build-636-server-release` nonreg step
right after it builds the release, so `pytest scripts/tests` never starts a stale bundle or takes
ports a dev server uses. The production mode is in test_server_release_smoke_production.py.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "scripts"))

from agent_bench import miroir_server  # noqa: E402

RELEASE_ENTRY = REPO_ROOT / "packages" / "miroir-server" / "release" / "index.js"
RELEASE_CLIENT_INDEX = REPO_ROOT / "packages" / "miroir-server" / "release" / "client" / "index.html"
RELEASE_SMOKE = os.environ.get("MIROIR_RELEASE_SMOKE") == "1"
TLS_CERT = REPO_ROOT / "certs" / "localhost.pem"
LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
BOOK_ENTITY = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
ASSET = "images/miroir-logo.png"

pytestmark = [
    pytest.mark.skipif(not RELEASE_SMOKE, reason="set MIROIR_RELEASE_SMOKE=1 (build-636-server-release step)"),
    pytest.mark.skipif(not RELEASE_ENTRY.exists(), reason="release bundle not built: npm run build:server -w miroir-server"),
    pytest.mark.skipif(TLS_CERT.exists(), reason="certs/localhost.pem turns TLS on, the bench-agent URL is plain HTTP"),
]


def base_url() -> str:
    environment = json.loads((REPO_ROOT / "environments" / "bench-agent.json").read_text(encoding="utf-8"))
    return environment["server"]["rootApiUrl"].rstrip("/")


def get(path: str) -> tuple[int, bytes, str]:
    try:
        with urllib.request.urlopen(base_url() + path, timeout=30) as response:
            return response.status, response.read(), response.headers.get("content-type", "")
    except urllib.error.HTTPError as error:
        return error.code, error.read(), error.headers.get("content-type", "")


def tracked_changes() -> set[str]:
    """Tracked files with changes under packages/ (untracked files and other processes' new files aside)."""
    lines = subprocess.run(
        ["git", "status", "--porcelain", "--untracked-files=no", "--", "packages"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout.splitlines()
    return {line[3:] for line in lines}


def started_server(log_file: Path, node_env: str = "development"):
    """Starts the release on a fresh bench-agent state; yields it, then checks no clean tracked file changed."""
    before = tracked_changes()
    miroir_server.reset_state()
    server = miroir_server.MiroirServer(log_file, node_env=node_env)
    server.start()
    try:
        yield server
    finally:
        server.stop()
    newly_changed = sorted(tracked_changes() - before)
    assert newly_changed == [], f"the release binary changed tracked files: {newly_changed}"


@pytest.fixture(scope="module")
def release_server(tmp_path_factory):
    yield from started_server(tmp_path_factory.mktemp("release") / "server.log")


def test_capabilities_answers(release_server):
    status, body, _ = get("/capabilities")
    assert status == 200
    assert "mcp" in json.loads(body)["capabilities"]


def test_auth_status_is_disabled(release_server):
    status, body, _ = get("/auth/status")
    assert status == 200
    assert json.loads(body)["enabled"] is False


def test_rest_reads_library_books(release_server):
    status, body, _ = get(f"/CRUD/{LIBRARY_DEPLOYMENT}/data/entity/{BOOK_ENTITY}/all")
    assert status == 200
    assert BOOK_ENTITY in body.decode("utf-8")


def test_public_asset_is_served(release_server):
    status, body, _ = get(f"/assets/{ASSET}")
    assert status == 200
    assert body[:4] == b"\x89PNG"


def test_mcp_is_mounted_on_the_main_app(release_server):
    _, capabilities, _ = get("/capabilities")
    status, _, _ = get("/mcp")
    assert status == (405 if json.loads(capabilities)["capabilities"]["mcp"] else 404)


def test_dev_root_route(release_server):
    status, body, _ = get("/")
    assert status == 200
    assert body.decode("utf-8") == "App Works !!!!"

