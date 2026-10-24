"""Transcript measures of the agent cost benchmark (#550, Slice 8): UUID share, tool calls, hidden paths."""

from __future__ import annotations

from agent_bench import transcript

UUID = "e8ba151b-d68e-4cc3-9a83-3459d309ccf5"


def assistant(*items):
    return {"type": "assistant", "message": {"content": list(items)}}


def user(*items):
    return {"type": "user", "message": {"content": list(items)}}


def tool_use(name, input_):
    return {"type": "tool_use", "id": "t", "name": name, "input": input_}


def tool_result(content):
    return {"type": "tool_result", "tool_use_id": "t", "content": content}


def test_uuid_share_counts_tool_inputs_and_outputs_only():
    # input JSON {"u": "<36 chars>"} is 45 characters; output is 36 characters of padding
    record = transcript.Transcript(
        [
            assistant({"type": "text", "text": UUID * 10}, tool_use("mcp__miroir__getInstance", {"u": UUID})),
            user(tool_result([{"type": "text", "text": "x" * 36}])),
        ]
    )
    assert transcript.uuid_char_share(record) == round(36 / (45 + 36), 4)


def test_no_tool_traffic_gives_no_share():
    assert transcript.uuid_char_share(transcript.Transcript([assistant({"type": "text", "text": UUID})])) is None


def test_tool_calls_are_counted_per_tool():
    record = transcript.Transcript(
        [assistant(tool_use("Read", {}), tool_use("Edit", {})), assistant(tool_use("Read", {}))]
    )
    assert transcript.tool_call_counts(record) == {"Read": 2, "Edit": 1}


def test_reading_a_reference_solution_is_reported():
    record = transcript.Transcript(
        [assistant(tool_use("Read", {"file_path": "/home/user/miroir/scripts/agent_bench/reference/miroir/q.json"}))]
    )
    assert transcript.hidden_path_reads(record) == ["Read agent_bench", "Read reference/"]


def test_ordinary_reads_are_not_reported():
    record = transcript.Transcript([assistant(tool_use("Read", {"file_path": "library/model/q.json"}))])
    assert transcript.hidden_path_reads(record) == []
