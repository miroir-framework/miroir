#!/usr/bin/env python3
"""One-time Spotify OAuth2 Authorization Code helper.

Provisions a refresh token for the Miroir Spotify example app. The Miroir
server only performs refresh-token grants; this script is the out-of-band
consent step (open a browser, log in, copy the refresh token).
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import secrets
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse
from urllib.request import Request, urlopen

AUTHORIZE_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
DEFAULT_REDIRECT_URI = "http://127.0.0.1:8888/callback"
DEFAULT_SCOPES = "playlist-read-private playlist-read-collaborative"
DEFAULT_TIMEOUT_SECONDS = 300
CALLBACK_HTML = """<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Spotify authorization</title></head>
<body>
  <p>You can close this tab and return to the terminal.</p>
</body>
</html>
"""
SERVER_LAUNCH_CMD = (
    "node packages/miroir-server/release/index.js"
    " --secret spotifyClientId=<your-client-id>"
    " --secret spotifyClientSecret=<your-client-secret>"
    " --secret spotifyRefreshToken=<paste-refresh-token-here>"
)


def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "One-time Spotify OAuth2 Authorization Code helper. Obtains a "
            "refresh token for the Miroir Spotify example app. The Miroir "
            "server only performs refresh-token grants; this script is the "
            "out-of-band consent step."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Credentials: pass --client-id / --client-secret, or set "
            "SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.\n"
            "Register the exact --redirect-uri in the Spotify Developer "
            "Dashboard app settings before running this script."
        ),
    )
    parser.add_argument(
        "--client-id",
        default=os.environ.get("SPOTIFY_CLIENT_ID"),
        help="Spotify app client id (env: SPOTIFY_CLIENT_ID)",
    )
    parser.add_argument(
        "--client-secret",
        default=os.environ.get("SPOTIFY_CLIENT_SECRET"),
        help="Spotify app client secret (env: SPOTIFY_CLIENT_SECRET)",
    )
    parser.add_argument(
        "--redirect-uri",
        default=DEFAULT_REDIRECT_URI,
        help=f"Must match the Dashboard redirect URI (default: {DEFAULT_REDIRECT_URI})",
    )
    parser.add_argument(
        "--scopes",
        default=DEFAULT_SCOPES,
        help=f"Space-separated OAuth scopes (default: {DEFAULT_SCOPES})",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_TIMEOUT_SECONDS,
        help=f"Seconds to wait for the browser callback (default: {DEFAULT_TIMEOUT_SECONDS})",
    )
    return parser.parse_args(argv)


def require_credentials(client_id: Optional[str], client_secret: Optional[str]) -> tuple[str, str]:
    missing = []
    if not client_id:
        missing.append("--client-id or SPOTIFY_CLIENT_ID")
    if not client_secret:
        missing.append("--client-secret or SPOTIFY_CLIENT_SECRET")
    if missing:
        print(
            "Missing Spotify credentials: " + "; ".join(missing) + ".",
            file=sys.stderr,
        )
        sys.exit(2)
    return client_id, client_secret


def parse_redirect_uri(redirect_uri: str) -> tuple[str, int, str]:
    parsed = urlparse(redirect_uri)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        print(
            f"Invalid --redirect-uri {redirect_uri!r}: expected http(s) URL with a host.",
            file=sys.stderr,
        )
        sys.exit(2)
    if parsed.scheme == "https":
        print(
            "This helper serves a plain HTTP callback listener; use an http:// redirect URI "
            "(default http://127.0.0.1:8888/callback).",
            file=sys.stderr,
        )
        sys.exit(2)
    port = parsed.port
    if port is None:
        port = 80 if parsed.scheme == "http" else 443
    path = parsed.path if parsed.path else "/"
    return parsed.hostname, port, path


def build_authorize_url(client_id: str, redirect_uri: str, scopes: str, state: str) -> str:
    query = urlencode(
        {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": scopes,
            "state": state,
            # Force the consent screen so Spotify is more likely to issue a refresh token.
            "show_dialog": "true",
        }
    )
    return f"{AUTHORIZE_URL}?{query}"


def _send_html(handler: BaseHTTPRequestHandler, status: int, body: str) -> None:
    payload = body.encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "text/html; charset=utf-8")
    handler.send_header("Content-Length", str(len(payload)))
    handler.end_headers()
    handler.wfile.write(payload)


def wait_for_callback(host: str, port: int, path: str, timeout_seconds: int) -> dict[str, list[str]]:
    result: dict[str, object] = {"query": None}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, fmt: str, *args: object) -> None:
            return

        def do_GET(self) -> None:
            parsed = urlparse(self.path)
            if parsed.path != path:
                self.send_error(404, "Not the OAuth callback path")
                return
            result["query"] = parse_qs(parsed.query, keep_blank_values=True)
            _send_html(self, 200, CALLBACK_HTML)
            threading.Thread(target=self.server.shutdown, daemon=True).start()

    server = HTTPServer((host, port), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        thread.join(timeout_seconds)
        if thread.is_alive():
            server.shutdown()
            thread.join(5)
            print(
                f"Timed out after {timeout_seconds}s waiting for the Spotify redirect. "
                "Make sure the redirect URI is registered in the Developer Dashboard "
                "and that you completed login in the browser.",
                file=sys.stderr,
            )
            sys.exit(1)
    finally:
        server.server_close()

    query = result["query"]
    if not isinstance(query, dict):
        print("No OAuth callback was received.", file=sys.stderr)
        sys.exit(1)
    return query


def first_query_value(query: dict[str, list[str]], key: str) -> Optional[str]:
    values = query.get(key)
    if not values:
        return None
    return values[0]


def exchange_code(client_id: str, client_secret: str, code: str, redirect_uri: str) -> dict:
    body = urlencode(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        }
    ).encode("utf-8")
    basic = base64.b64encode(f"{client_id}:{client_secret}".encode("utf-8")).decode("ascii")
    request = Request(
        TOKEN_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Basic {basic}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    try:
        with urlopen(request) as response:
            status = getattr(response, "status", 200)
            raw = response.read()
    except HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        print(f"Token exchange failed: HTTP {exc.code}\n{err_body}", file=sys.stderr)
        sys.exit(1)
    except URLError as exc:
        print(f"Token exchange failed: {exc.reason}", file=sys.stderr)
        sys.exit(1)

    if status < 200 or status >= 300:
        print(
            f"Token exchange failed: HTTP {status}\n{raw.decode('utf-8', errors='replace')}",
            file=sys.stderr,
        )
        sys.exit(1)

    try:
        payload = json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        print(
            f"Token exchange failed: response was not JSON\n{raw.decode('utf-8', errors='replace')}",
            file=sys.stderr,
        )
        sys.exit(1)

    if not isinstance(payload, dict) or not payload.get("refresh_token"):
        redacted = dict(payload) if isinstance(payload, dict) else payload
        if isinstance(redacted, dict) and "access_token" in redacted:
            redacted["access_token"] = "<redacted>"
        print(
            f"Token exchange failed: HTTP {status}, missing refresh_token\n"
            f"{json.dumps(redacted, indent=2)}",
            file=sys.stderr,
        )
        sys.exit(1)
    return payload


def print_success(payload: dict) -> None:
    token_type = payload.get("token_type", "(unknown)")
    expires_in = payload.get("expires_in", "(unknown)")
    scope = payload.get("scope", "(none returned)")
    refresh_token = payload["refresh_token"]
    print()
    print(f"Authorization succeeded: token_type={token_type} expires_in={expires_in} scope={scope}")
    print()
    print("---------- refresh token (copy this) ----------")
    print(refresh_token)
    print("-----------------------------------------------")
    print()
    print("Launch the Miroir server with these secrets (replace the placeholders):")
    print(f"  {SERVER_LAUNCH_CMD}")
    print()
    print(
        "Note: Spotify may rotate refresh tokens. If the server later fails auth, "
        "re-run this script and update spotifyRefreshToken."
    )


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)
    client_id, client_secret = require_credentials(args.client_id, args.client_secret)
    host, port, path = parse_redirect_uri(args.redirect_uri)
    # Rebuild so host/port/path we bind match the URI we send to Spotify.
    redirect_uri = urlunparse(("http", f"{host}:{port}", path, "", "", ""))

    print("Register this exact redirect URI in the Spotify Developer Dashboard app settings:")
    print(f"  {redirect_uri}")
    print(
        "Log in with the Spotify account that owns (or collaborates on) the playlists "
        "you want to browse. Spotify's Feb-2026 rules return playlist contents only "
        "for playlists that authenticated user owns or collaborates on."
    )
    print()

    state = secrets.token_urlsafe(16)
    authorize_url = build_authorize_url(client_id, redirect_uri, args.scopes, state)
    print("Open this URL if the browser does not start:")
    print(authorize_url)
    print()
    try:
        webbrowser.open(authorize_url)
    except Exception as exc:  # noqa: BLE001 — opening a browser is best-effort
        print(f"Could not open a browser automatically ({exc}). Use the URL above.", file=sys.stderr)

    print(f"Waiting up to {args.timeout}s for the callback on {host}:{port}{path} ...")
    query = wait_for_callback(host, port, path, args.timeout)

    error = first_query_value(query, "error")
    if error:
        description = first_query_value(query, "error_description") or ""
        extra = f" ({description})" if description else ""
        print(f"Spotify authorization failed: {error}{extra}", file=sys.stderr)
        sys.exit(1)

    returned_state = first_query_value(query, "state")
    if returned_state != state:
        print("OAuth callback state mismatch; aborting.", file=sys.stderr)
        sys.exit(1)

    code = first_query_value(query, "code")
    if not code:
        print("OAuth callback did not include an authorization code.", file=sys.stderr)
        sys.exit(1)

    payload = exchange_code(client_id, client_secret, code, redirect_uri)
    print_success(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
