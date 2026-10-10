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


def test_shim_refuses_callers_without_our_key(monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "our-key")
    client = TestClient(main.app)
    assert client.post("/llm/v1/chat/completions", json={"messages": []}).status_code == 403
    assert client.post("/llm/v1/chat/completions", json={"messages": []},
                       headers={"Authorization": "Bearer someone-else"}).status_code == 403
