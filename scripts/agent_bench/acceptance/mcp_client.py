"""Minimal MCP client over streamable HTTP (#550 acceptance): initialize, list tools, call a tool.

Standard library only, so the acceptance scenarios need no package install. Answers may come as JSON or as a
server-sent event stream; both are read.
"""

from __future__ import annotations

import itertools
import json
import urllib.request

PROTOCOL_VERSION = "2025-03-26"


class McpError(RuntimeError):
    pass


class McpClient:
    def __init__(self, url: str, timeout_s: float = 120.0):
        self.url = url
        self.timeout_s = timeout_s
        self.session_id: str | None = None
        self._ids = itertools.count(1)

    def _post(self, payload: dict) -> dict | None:
        headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
        if self.session_id:
            headers["Mcp-Session-Id"] = self.session_id
        request = urllib.request.Request(self.url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        # Loopback only: bypass the container's outbound proxy.
        opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
        with opener.open(request, timeout=self.timeout_s) as response:
            self.session_id = response.headers.get("Mcp-Session-Id", self.session_id)
            body = response.read().decode("utf-8")
            if not body.strip():
                return None
            if response.headers.get("Content-Type", "").startswith("text/event-stream"):
                messages = [json.loads(line[5:]) for line in body.splitlines() if line.startswith("data:")]
                answers = [m for m in messages if m.get("id") == payload.get("id")]
                return answers[-1] if answers else None
            return json.loads(body)

    def request(self, method: str, params: dict | None = None) -> dict:
        answer = self._post({"jsonrpc": "2.0", "id": next(self._ids), "method": method, "params": params or {}})
        if answer is None:
            raise McpError(f"{method}: no answer")
        if "error" in answer:
            raise McpError(f"{method}: {answer['error']}")
        return answer["result"]

    def initialize(self) -> "McpClient":
        self.request(
            "initialize",
            {"protocolVersion": PROTOCOL_VERSION, "capabilities": {}, "clientInfo": {"name": "agent-bench-acceptance", "version": "1"}},
        )
        self._post({"jsonrpc": "2.0", "method": "notifications/initialized"})
        return self

    def tools(self) -> list[dict]:
        return self.request("tools/list")["tools"]

    def call(self, name: str, arguments: dict) -> dict:
        """The tool result; `isError` is set when the tool reports a failure."""
        return self.request("tools/call", {"name": name, "arguments": arguments})


def result_json(result: dict):
    """The first text content of a tool result, parsed as JSON when it is JSON."""
    for part in result.get("content", []):
        if part.get("type") == "text":
            try:
                return json.loads(part["text"])
            except json.JSONDecodeError:
                return part["text"]
    return result.get("structuredContent")
