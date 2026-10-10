"""Gradium quick test: key works, German voices, opener rendered as WAV.

    uv run python scripts/gradium_check.py                 # list voices (German first)
    uv run python scripts/gradium_check.py --voice <uid>   # render the opener with this voice

The WAV lands in backend/out/ (git-ignored). The key is never printed.
"""

from __future__ import annotations

import argparse
import asyncio
import inspect
import os
from pathlib import Path

import gradium
from dotenv import load_dotenv

BACKEND = Path(__file__).resolve().parents[1]
OUT = BACKEND / "out"

# Fixed opener from docs/POLICY.md (never phrased by the LLM).
OPENER = (
    "Grüezi, hier ist ein KI-Assistent der Firma Staffette. Ich rufe im Auftrag von Anna Muster an, "
    "wegen der Übermittlung ihrer Unterlagen an ihre neue Hausärztin. "
    "Darf ich das Gespräch für eine Notiz transkribieren?"
)

GERMAN_HINTS = ("de", "german", "deutsch", "swiss", "schweiz", "ch")


async def _call(fn, *args, **kwargs):
    result = fn(*args, **kwargs)
    return await result if inspect.isawaitable(result) else result


def _voices(payload) -> list[dict]:
    """Flatten whatever shape voice_get returns into a list of voice dicts."""
    if isinstance(payload, list):
        return [v for item in payload for v in _voices(item)]
    if isinstance(payload, dict):
        if "uid" in payload:
            return [payload]
        return [v for value in payload.values() for v in _voices(value)]
    return []


def _is_german(v: dict) -> bool:
    text = " ".join(str(v.get(k, "")) for k in ("name", "language", "languages", "description", "tags", "accent")).lower()
    return any(h in text.split() or h in text for h in GERMAN_HINTS if len(h) > 2) or "de" in str(v.get("language", "")).lower()


async def main() -> None:
    load_dotenv(BACKEND / ".env")
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", help="voice uid to render the opener with")
    parser.add_argument("--text", help="render this sentence instead of the opener")
    parser.add_argument("--tag", default="", help="suffix for the output file name")
    args = parser.parse_args()

    key = os.environ.get("GRADIUM_API_KEY", "").strip()
    if not key:
        raise SystemExit("GRADIUM_API_KEY fehlt in backend/.env")
    print(f"Key gefunden ({len(key)} Zeichen, beginnt mit {key[:4]}…)")
    client = gradium.GradiumClient(api_key=key)

    voice = args.voice or os.environ.get("GRADIUM_VOICE_ID", "").strip()
    if not voice:
        voices = _voices(await _call(client.voice_get, include_catalog=True))
        german = [v for v in voices if _is_german(v)]
        print(f"\n{len(voices)} Stimmen insgesamt, {len(german)} davon vermutlich deutsch:\n")
        for v in german + [v for v in voices if v not in german][:10]:
            mark = "★" if v in german else " "
            lang = v.get("language") or v.get("languages") or ""
            desc = str(v.get("description") or "")[:70]
            print(f" {mark} {v.get('uid')}  {v.get('name', '')!s:<22} {lang!s:<10} {desc}")
        print("\nNächster Schritt: uv run python scripts/gradium_check.py --voice <uid>")
        return

    OUT.mkdir(exist_ok=True)
    setup = gradium.TTSSetup(model_name="default", voice_id=voice, output_format="wav")
    result = await _call(client.tts, setup, args.text or OPENER)
    wav = getattr(result, "raw_data", None)
    if not wav:
        raise SystemExit(f"Keine Audiodaten erhalten: {result!r}")
    target = OUT / (f"say_{args.tag}.wav" if args.text else f"opener_{voice}.wav")
    target.write_bytes(wav)
    print(f"Gerendert: {target} ({len(wav) // 1024} KB)")


if __name__ == "__main__":
    asyncio.run(main())
