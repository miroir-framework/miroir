"""Reads a `claude -p --output-format stream-json --verbose` transcript (#550): measures and isolation checks.

A transcript is one JSON object per line. The `system`/`init` event says what the agent was given (tools, MCP
servers, skills, plugins, model); the `result` event carries usage, list cost, duration and turns.
"""

from __future__ import annotations

import json
import re
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

MCP_SERVER = "miroir"
UUID = re.compile(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}")
# Paths the agent must never see: reading one makes the run invalid.
HIDDEN_PATHS = ("agent_bench", "reference/", "acceptance/")


@dataclass
class Transcript:
    events: list[dict] = field(default_factory=list)

    @classmethod
    def read(cls, path: Path) -> "Transcript":
        return cls.parse(path.read_text(encoding="utf-8").splitlines())

    @classmethod
    def parse(cls, lines: Iterable[str]) -> "Transcript":
        events = []
        for line in lines:
            line = line.strip()
            if not line.startswith("{"):
                continue
            events.append(json.loads(line))
        return cls(events)

    def first(self, type_: str, subtype: str | None = None) -> dict | None:
        for event in self.events:
            if event.get("type") == type_ and (subtype is None or event.get("subtype") == subtype):
                return event
        return None

    @property
    def init(self) -> dict | None:
        return self.first("system", "init")

    @property
    def result(self) -> dict | None:
        found = [event for event in self.events if event.get("type") == "result"]
        return found[-1] if found else None


def measures(transcript: Transcript) -> dict:
    """The measures of analysis D17 that the transcript gives. Missing events give `stopReason: no_result`."""
    init = transcript.init or {}
    result = transcript.result
    if result is None:
        return {"stopReason": "no_result", "model": init.get("model"), "claudeCodeVersion": init.get("claude_code_version")}
    usage = result.get("usage", {})
    return {
        "model": init.get("model"),
        "claudeCodeVersion": init.get("claude_code_version"),
        "durationMs": result.get("duration_ms"),
        "apiDurationMs": result.get("duration_api_ms"),
        "turns": result.get("num_turns"),
        "stopReason": stop_reason(result),
        "inputTokens": usage.get("input_tokens", 0),
        "outputTokens": usage.get("output_tokens", 0),
        "cacheReadTokens": usage.get("cache_read_input_tokens", 0),
        "cacheCreationTokens": usage.get("cache_creation_input_tokens", 0),
        "costUsd": result.get("total_cost_usd"),
        "result": result.get("result"),
    }


def stop_reason(result: dict) -> str:
    """`success`, or the error subtype Claude Code reports (`error_max_turns`, `error_max_budget_usd`, ...)."""
    subtype = result.get("subtype", "unknown")
    if subtype == "success" and result.get("is_error"):
        return f"error_{result.get('terminal_reason') or 'unknown'}"
    return subtype


def isolation_problems(transcript: Transcript, allowed_tools: list[str], mcp: bool) -> list[str]:
    """What the agent was given beyond its arm: an empty list means the run is isolated."""
    init = transcript.init
    if init is None:
        return ["no init event"]
    problems = []
    for tool in init.get("tools", []):
        is_arm_mcp_tool = mcp and tool.startswith(f"mcp__{MCP_SERVER}__")
        if tool not in allowed_tools and not is_arm_mcp_tool:
            problems.append(f"tool {tool}")
    for server in init.get("mcp_servers", []):
        name = server.get("name") if isinstance(server, dict) else server
        if not mcp or name != MCP_SERVER:
            problems.append(f"MCP server {name}")
        elif isinstance(server, dict) and server.get("status") not in (None, "connected"):
            problems.append(f"MCP server {name} {server.get('status')}")
    if mcp and not any(
        (s.get("name") if isinstance(s, dict) else s) == MCP_SERVER for s in init.get("mcp_servers", [])
    ):
        problems.append(f"MCP server {MCP_SERVER} missing")
    problems += [f"skill {skill}" for skill in init.get("skills", [])]
    problems += [f"slash command {command}" for command in init.get("slash_commands", [])]
    problems += [
        f"plugin {plugin.get('name')}"
        for plugin in init.get("plugins", [])
        if isinstance(plugin, dict) and plugin.get("path") != "builtin"
    ]
    return problems


def _content_items(event: dict) -> list:
    message = event.get("message") or {}
    content = message.get("content")
    return content if isinstance(content, list) else []


def tool_uses(transcript: Transcript) -> list[dict]:
    return [
        item
        for event in transcript.events
        if event.get("type") == "assistant"
        for item in _content_items(event)
        if isinstance(item, dict) and item.get("type") == "tool_use"
    ]


def _result_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "".join(part.get("text", "") for part in content if isinstance(part, dict))
    return ""


def tool_results(transcript: Transcript) -> list[str]:
    return [
        _result_text(item.get("content"))
        for event in transcript.events
        if event.get("type") == "user"
        for item in _content_items(event)
        if isinstance(item, dict) and item.get("type") == "tool_result"
    ]


def tool_traffic(transcript: Transcript) -> str:
    """Tool inputs (as JSON) and tool outputs: what the agent exchanged with its tools."""
    inputs = [json.dumps(use.get("input", {}), ensure_ascii=False) for use in tool_uses(transcript)]
    return "".join(inputs + tool_results(transcript))


def uuid_char_share(transcript: Transcript) -> float | None:
    """Characters of UUIDs over characters of tool traffic; None when the agent used no tool."""
    traffic = tool_traffic(transcript)
    if not traffic:
        return None
    return round(sum(len(match) for match in UUID.findall(traffic)) / len(traffic), 4)


def tool_call_counts(transcript: Transcript) -> Counter[str]:
    return Counter(use.get("name", "?") for use in tool_uses(transcript))


def hidden_path_reads(transcript: Transcript) -> list[str]:
    """Tool calls whose input names a harness, reference or acceptance path."""
    found = []
    for use in tool_uses(transcript):
        text = json.dumps(use.get("input", {}), ensure_ascii=False)
        found += [f"{use.get('name')} {hidden}" for hidden in HIDDEN_PATHS if hidden in text]
    return found
