"""The Gemini shim adds what gradbot needs and returns what Gemini needs."""

from fastapi.testclient import TestClient

import main
from voice import llm_proxy


def test_tool_call_delta_gets_index_and_signature_is_kept() -> None:
    chunk = {"choices": [{"delta": {"role": "assistant", "tool_calls": [
        {"id": "call_1", "function": {"name": "request_records", "arguments": "{}"},
         "extra_content": {"google": {"thought_signature": "sig-abc"}}}]}}]}
    call = llm_proxy.fix_chunk(chunk)["choices"][0]["delta"]["tool_calls"][0]
    assert call["index"] == 0 and call["type"] == "function" and "extra_content" not in call

    body = {"messages": [{"role": "assistant", "tool_calls": [{"id": "call_1", "type": "function",
                                                                "function": {"name": "request_records", "arguments": "{}"}}]}]}
    sent = llm_proxy.fix_request(body)["messages"][0]["tool_calls"][0]
    assert sent["extra_content"] == {"google": {"thought_signature": "sig-abc"}}


def test_two_tool_calls_in_separate_chunks_stay_two_calls() -> None:
    """Gemini sent request_records and confirm_channel in two chunks; both got index 0 and gradbot glued them."""
    ids: dict[str, int] = {}

    def delta(**call) -> dict:
        return llm_proxy.fix_chunk({"choices": [{"delta": {"tool_calls": [call]}}]}, ids)["choices"][0]["delta"]["tool_calls"][0]

    first = delta(id="call_a", function={"name": "request_records", "arguments": "{\"scope\":"})
    more = delta(function={"arguments": "[\"reports\"]}"})            # continuation without id
    second = delta(id="call_b", function={"name": "confirm_channel", "arguments": "{}"})
    assert (first["index"], more["index"], second["index"]) == (0, 0, 1)


def test_shim_refuses_callers_without_our_key(monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "our-key")
    client = TestClient(main.app)
    assert client.post("/llm/v1/chat/completions", json={"messages": []}).status_code == 403
    assert client.post("/llm/v1/chat/completions", json={"messages": []},
                       headers={"Authorization": "Bearer someone-else"}).status_code == 403
