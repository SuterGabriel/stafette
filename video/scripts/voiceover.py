"""Render the TechStack voiceover with Gradium: one WAV per scene, plus a manifest with durations.

    cd video
    uv run --project ../backend python scripts/voiceover.py                     # voice from script.json
    uv run --project ../backend python scripts/voiceover.py --voice <uid>       # other voice
    uv run --project ../backend python scripts/voiceover.py --samples <uid> ... # first line per voice, to compare

Reads GRADIUM_API_KEY from backend/.env (never printed). Writes public/voice/<scene>.wav and
src/tech/voiceover.json, which the TechStackVoiceover composition reads.
"""

from __future__ import annotations

import argparse
import asyncio
import inspect
import io
import json
import os
import struct
import wave
from pathlib import Path

import gradium
from dotenv import load_dotenv

VIDEO = Path(__file__).resolve().parents[1]
SCRIPT = VIDEO / "voiceover" / "script.json"
OUT = VIDEO / "public" / "voice"
MANIFEST = VIDEO / "src" / "tech" / "voiceover.json"


async def _call(fn, *args, **kwargs):
    result = fn(*args, **kwargs)
    return await result if inspect.isawaitable(result) else result


def _fix_header(wav: bytes) -> bytes:
    """Gradium streams WAV with 0xFFFFFFFF as RIFF and data size; write the real sizes."""
    data = wav.find(b"data")
    if wav[:4] != b"RIFF" or data < 0:
        return wav
    body = len(wav) - (data + 8)
    return wav[:4] + struct.pack("<I", len(wav) - 8) + wav[8 : data + 4] + struct.pack("<I", body) + wav[data + 8 :]


def _seconds(wav: bytes) -> float:
    with wave.open(io.BytesIO(wav)) as w:
        return w.getnframes() / w.getframerate()


async def _render(client: gradium.GradiumClient, voice: str, text: str) -> bytes:
    setup = gradium.TTSSetup(model_name="default", voice_id=voice, output_format="wav")
    result = await _call(client.tts, setup, text)
    wav = getattr(result, "raw_data", None)
    if not wav:
        raise SystemExit(f"Keine Audiodaten erhalten: {result!r}")
    return _fix_header(wav)


async def main() -> None:
    load_dotenv(VIDEO.parent / "backend" / ".env")
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", help="voice uid, overrides script.json")
    parser.add_argument("--samples", nargs="+", metavar="UID", help="render the first line with each voice")
    args = parser.parse_args()

    key = os.environ.get("GRADIUM_API_KEY", "").strip()
    if not key:
        raise SystemExit("GRADIUM_API_KEY fehlt in backend/.env")
    client = gradium.GradiumClient(api_key=key)
    script = json.loads(SCRIPT.read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)

    if args.samples:
        samples = VIDEO / "out" / "voice-samples"
        samples.mkdir(parents=True, exist_ok=True)
        text = script["lines"][1]["text"]
        for uid in args.samples:
            wav = await _render(client, uid, text)
            (samples / f"{uid}.wav").write_bytes(wav)
            print(f"Probe {uid}: {_seconds(wav):.1f} s")
        print(f"Hörproben in {samples}")
        return

    voice = args.voice or script["voice"]
    lines = []
    for line in script["lines"]:
        wav = await _render(client, voice, line["text"])
        name = f"{line['scene'].lower()}.wav"
        (OUT / name).write_bytes(wav)
        seconds = round(_seconds(wav), 2)
        lines.append({"scene": line["scene"], "file": f"voice/{name}", "seconds": seconds})
        print(f"{line['scene']:<9} {seconds:5.1f} s")

    MANIFEST.write_text(json.dumps({"voice": voice, "lines": lines}, indent=2) + "\n", encoding="utf-8")
    print(f"Gesamt {sum(l['seconds'] for l in lines):.1f} s gesprochen · Manifest: {MANIFEST.relative_to(VIDEO)}")


if __name__ == "__main__":
    asyncio.run(main())
