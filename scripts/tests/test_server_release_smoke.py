"""#636: the miroir-server release binary answers its HTTP surface (REST, auth, capabilities, assets, MCP).

Starts `packages/miroir-server/release/index.js` on the `bench-agent` environment (plain HTTP on
loopback, every section a copy in `.miroir/bench-agent/`) through the agent-bench launcher. Skipped
when the release bundle is not built (`npm run build:server -w miroir-server`).
"""

from __future__ import annotations

import json
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
TLS_CERT = REPO_ROOT / "certs" / "localhost.pem"
LIBRARY_DEPLOYMENT = "f714bb2f-a12d-4e71-a03b-74dcedea6eb4"
BOOK_ENTITY = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"
ASSET = "images/miroir-logo.png"

pytestmark = [
    pytest.mark.skipif(not RELEASE_ENTRY.exists(), reason="release bundle not built: npm run build:server -w miroir-server"),
    pytest.mark.skipif(TLS_CERT.exists(), reason="certs/localhost.pem turns TLS on, the bench-agent URL is plain HTTP"),
]


def _base_url() -> str:
    environment = json.loads((REPO_ROOT / "environments" / "bench-agent.json").read_text(encoding="utf-8"))
    return environment["server"]["rootApiUrl"].rstrip("/")


def _get(path: str) -> tuple[int, bytes, str]:
    try:
        with urllib.request.urlopen(_base_url() + path, timeout=30) as response:
            return response.status, response.read(), response.headers.get("content-type", "")
    except urllib.error.HTTPError as error:
        return error.code, error.read(), error.headers.get("content-type", "")


def _tracked_changes() -> str:
    return subprocess.run(
        ["git", "status", "--porcelain", "--", "packages"],
        cwd=REPO_ROOT,
        capture_output=True,
        text=True,
        check=True,
    ).stdout


@pytest.fixture(scope="module")
def release_server(tmp_path_factory):
    before = _tracked_changes()
    miroir_server.reset_state()
    server = miroir_server.MiroirServer(tmp_path_factory.mktemp("release") / "server.log")
    server.start()
    try:
        yield server
    finally:
        server.stop()
    assert _tracked_changes() == before, "the release binary wrote tracked files under packages/"


def test_capabilities_answers(release_server):
    status, body, _ = _get("/capabilities")
    assert status == 200
    assert "mcp" in json.loads(body)["capabilities"]


def test_auth_status_is_disabled(release_server):
    status, body, _ = _get("/auth/status")
    assert status == 200
    assert json.loads(body)["enabled"] is False


def test_rest_reads_library_books(release_server):
    status, body, _ = _get(f"/CRUD/{LIBRARY_DEPLOYMENT}/data/entity/{BOOK_ENTITY}/all")
    assert status == 200
    assert BOOK_ENTITY in body.decode("utf-8")


def test_public_asset_is_served(release_server):
    status, body, _ = _get(f"/assets/{ASSET}")
    assert status == 200
    assert body[:4] == b"\x89PNG"


def test_mcp_is_mounted_on_the_main_app(release_server):
    _, capabilities, _ = _get("/capabilities")
    status, _, _ = _get("/mcp")
    assert status == (405 if json.loads(capabilities)["capabilities"]["mcp"] else 404)


def test_dev_root_route(release_server):
    status, body, _ = _get("/")
    assert status == 200
    assert body.decode("utf-8") == "App Works !!!!"


@pytest.fixture(scope="module")
def production_release_server(tmp_path_factory, release_server):
    """Production mode serves release/client; started after the development server has stopped."""
    if not RELEASE_CLIENT_INDEX.exists():
        pytest.skip("release/client not copied: npm run build:release -w miroir-server")
    release_server.stop()
    miroir_server.reset_state()
    server = miroir_server.MiroirServer(tmp_path_factory.mktemp("release-prod") / "server.log", node_env="production")
    server.start()
    try:
        yield server
    finally:
        server.stop()


def test_production_serves_the_client_after_the_api(production_release_server):
    index_html = RELEASE_CLIENT_INDEX.read_bytes()
    for route in ("/", "/some/client/route"):
        status, body, _ = _get(route)
        assert status == 200
        assert body == index_html
    status, body, content_type = _get("/capabilities")
    assert status == 200
    assert "application/json" in content_type
    status, _, _ = _get(f"/assets/{ASSET}")
    assert status == 200
