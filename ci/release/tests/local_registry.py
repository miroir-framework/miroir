"""#664: a local npm registry for the publish tests, serving the two calls they make.

`npm publish` PUTs a packument holding the new version and its tarball (`_attachments`); `npm view` GETs the
packument. Like npmjs.org, a PUT of a version that already exists is refused (403), an unknown package is a 404,
and `dist.integrity` is computed from the stored tarball, so a test compares what was really sent. Anything
else (search, login, dist-tag commands) is out of scope and answers 404.

Chosen over Verdaccio (analysis D4/plan slice 4): Verdaccio 6 pulls in critical advisories (handlebars) that the
dependency-policy audit gate refuses.
"""

from __future__ import annotations

import base64
import hashlib
import json
import threading
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any, Iterator
from urllib.parse import unquote


class _Store:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.packuments: dict[str, dict[str, Any]] = {}
        self.publish_order: list[str] = []


def _handler(store: _Store, base_url: list[str]):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_args: Any) -> None:  # quiet test output
            pass

        def _send(self, status: int, body: dict[str, Any]) -> None:
            data = json.dumps(body).encode("utf-8")
            self.send_response(status)
            self.send_header("content-type", "application/json")
            self.send_header("content-length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def _name(self) -> str:
            return unquote(self.path.split("?", 1)[0].lstrip("/"))

        def do_GET(self) -> None:  # noqa: N802
            with store.lock:
                packument = store.packuments.get(self._name())
            if packument is None:
                self._send(404, {"error": "not_found"})
                return
            self._send(200, packument)

        def do_PUT(self) -> None:  # noqa: N802
            if not self.headers.get("authorization"):
                self._send(401, {"error": "authentication required"})
                return
            body = json.loads(self.rfile.read(int(self.headers["content-length"])))
            name = body["name"]
            with store.lock:
                packument = store.packuments.setdefault(
                    name, {"_id": name, "name": name, "versions": {}, "dist-tags": {}, "time": {}}
                )
                for version, manifest in body["versions"].items():
                    if version in packument["versions"]:
                        self._send(403, {"error": f"cannot publish over the previously published version {version}"})
                        return
                    attachment = next(iter(body["_attachments"].values()))
                    data = base64.b64decode(attachment["data"])
                    integrity = "sha512-" + base64.b64encode(hashlib.sha512(data).digest()).decode("ascii")
                    manifest["dist"] = {
                        **manifest.get("dist", {}),
                        "integrity": integrity,
                        "tarball": f"{base_url[0]}{name}/-/{version}.tgz",
                    }
                    packument["versions"][version] = manifest
                    packument["time"][version] = f"order-{len(store.publish_order):04d}"
                    store.publish_order.append(f"{name}@{version}")
                packument["dist-tags"].update(body.get("dist-tags", {}))
            self._send(201, {"ok": True})

    return Handler


@contextmanager
def local_registry() -> Iterator[tuple[str, _Store]]:
    """A registry on a free localhost port; yields its URL (with a trailing slash) and its store."""
    store = _Store()
    base_url = [""]
    server = ThreadingHTTPServer(("127.0.0.1", 0), _handler(store, base_url))
    base_url[0] = f"http://127.0.0.1:{server.server_address[1]}/"
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield base_url[0], store
    finally:
        server.shutdown()
        server.server_close()
