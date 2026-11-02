"""#636: in production mode, the miroir-server release serves the client built into release/client after
every API route. Same conditions as test_server_release_smoke.py, plus a copied client
(`npm run build:release -w miroir-server`).
"""

from __future__ import annotations

import pytest

from test_server_release_smoke import ASSET, RELEASE_CLIENT_INDEX, get, pytestmark as release_conditions, started_server

pytestmark = [
    *release_conditions,
    pytest.mark.skipif(not RELEASE_CLIENT_INDEX.exists(), reason="release/client not copied: npm run build:release -w miroir-server"),
]


@pytest.fixture(scope="module")
def production_release_server(tmp_path_factory):
    yield from started_server(tmp_path_factory.mktemp("release-prod") / "server.log", node_env="production")


def test_production_serves_the_client_after_the_api(production_release_server):
    index_html = RELEASE_CLIENT_INDEX.read_bytes()
    for route in ("/", "/some/client/route"):
        status, body, _ = get(route)
        assert status == 200
        assert body == index_html
    status, _, content_type = get("/capabilities")
    assert status == 200
    assert "application/json" in content_type
    status, _, _ = get(f"/assets/{ASSET}")
    assert status == 200
