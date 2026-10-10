"""OpenAI-compatible shim between gradbot and Gemini.

gradbot speaks the OpenAI chat-completions format. Gemini's OpenAI-compatible
endpoint differs in two ways that break tool calls on the phone:

1. Streamed tool_call deltas come without the `index` field, so gradbot fails to
   parse them ("missing field `index`") and the agent goes silent after "Ja".
2. Gemini attaches a thought signature (`extra_content.google.thought_signature`)
   to each tool call and expects it back in the next request, or it may reject
   the continuation.

This router forwards gradbot's requests to Gemini, adds the missing `index`,
remembers each signature by tool-call id and puts it back into the following
request. gradbot is pointed at it in voice/bridge.py; Gemini stays the model.
"""

from __future__ import annotations

import json
import logging
import os

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse

log = logging.getLogger(__name__)

router = APIRouter(prefix="/llm/v1", tags=["llm"])

_signatures: dict[str, dict] = {}       # tool_call id -> extra_content from Gemini


def local_base_url() -> str:
    return f"http://127.0.0.1:{os.environ.get('PORT', '8000')}/llm/v1"


def _upstream() -> tuple[str, str]:
    base = os.environ.get("LLM_BASE_URL", "").strip().rstrip("/")
    key = (os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENAI_API_KEY") or "").strip()
    return f"{base}/chat/completions", key


def fix_request(body: dict) -> dict:
    """Put remembered thought signatures back onto earlier tool calls."""
    for message in body.get("messages", []):
        for call in message.get("tool_calls") or []:
            sig = _signatures.get(call.get("id", ""))
            if sig and "extra_content" not in call:
                call["extra_content"] = sig
    return body


def fix_chunk(chunk: dict, ids: dict[str, int] | None = None) -> dict:
    """Add the missing `index` to tool_call deltas and remember their signatures.

    `ids` lives for one streamed response: every new tool-call id gets the next index, so two
    tool calls arriving in separate chunks stay two calls (gradbot merges deltas by index).
    A delta without id continues the previous call.
    """
    ids = {} if ids is None else ids
    for choice in chunk.get("choices", []):
        part = choice.get("delta") or choice.get("message") or {}
        for i, call in enumerate(part.get("tool_calls") or []):
            if "index" not in call:
                if call.get("id"):
                    ids.setdefault(call["id"], len([k for k in ids if k != "_last"]))
                    ids["_last"] = ids[call["id"]]
                    call["index"] = ids[call["id"]]
                else:
                    call["index"] = ids.get("_last", i)
            call.setdefault("type", "function")
            extra = call.pop("extra_content", None)
            if extra and call.get("id"):
                _signatures[call["id"]] = extra
    return chunk


def _caller_allowed(request: Request) -> bool:
    """The shim is reachable through ngrok; only gradbot, which sends our own key, may use it."""
    expected = os.environ.get("OPENAI_API_KEY", "").strip()
    return bool(expected) and request.headers.get("authorization", "") == f"Bearer {expected}"


@router.post("/chat/completions")
async def chat_completions(request: Request):
    if not _caller_allowed(request):
        return JSONResponse({"error": "forbidden"}, status_code=403)
    url, key = _upstream()
    body = fix_request(await request.json())
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}

    if not body.get("stream"):
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(url, headers=headers, json=body)
        data = r.json()
        return JSONResponse(fix_chunk(data) if r.status_code == 200 else data, status_code=r.status_code)

    client = httpx.AsyncClient(timeout=httpx.Timeout(60, read=120))
    upstream = await client.send(client.build_request("POST", url, headers=headers, json=body), stream=True)

    async def relay():
        try:
            if upstream.status_code != 200:
                text = (await upstream.aread()).decode("utf-8", "replace")
                log.warning("LLM upstream %s: %s", upstream.status_code, text[:300])
                yield f"data: {text}\n\n"
                return
            ids: dict[str, int] = {}
            async for line in upstream.aiter_lines():
                if line.startswith("data: ") and line[6:].strip() != "[DONE]":
                    try:
                        line = "data: " + json.dumps(fix_chunk(json.loads(line[6:]), ids), ensure_ascii=False)
                    except json.JSONDecodeError:
                        pass
                yield line + "\n"
        finally:
            await upstream.aclose()
            await client.aclose()

    return StreamingResponse(relay(), status_code=upstream.status_code, media_type="text/event-stream")
