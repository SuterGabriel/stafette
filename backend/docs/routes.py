"""HTTP endpoints of the document pipeline (owner: Manuel).

main.py already includes this router, so nobody else needs to touch main.py.

    curl -X POST localhost:8000/docs/ingest                       # all fixtures
    curl -X POST localhost:8000/docs/ingest -H 'Content-Type: application/json' \
         -d '{"files": ["01_austrittsbericht_spital_musterstadt.pdf"]}'
"""

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel

from docs.pipeline import process, publish
from state import store

router = APIRouter(prefix="/docs", tags=["documents"])

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures"
DOCUMENT_TYPES = {".pdf", ".jpg", ".jpeg", ".png"}


class IngestRequest(BaseModel):
    files: list[str] | None = None  # file names in fixtures/; None = all


@router.post("/ingest")
async def ingest(req: IngestRequest | None = None) -> dict:
    """Read fixture documents, fill Dr. Keller's sheet and push it to the dashboard."""
    available = {p.name: p for p in FIXTURES.iterdir() if p.suffix.lower() in DOCUMENT_TYPES}
    names = sorted(available) if req is None or req.files is None else req.files
    unknown = [n for n in names if n not in available]
    if unknown or not names:
        raise HTTPException(status_code=404, detail=f"unbekannte Dokumente: {unknown}")

    mandate_sources = list(store.state.mandate.sources)
    result = await run_in_threadpool(process, [available[n] for n in names], mandate_sources)
    publish(result)
    return {k: result[k] for k in ("missing", "missing_sources", "mentioned_sources", "rejected",
                                   "documents", "source_count")} | {"findings": sum(len(s["items"]) for s in result["sections"])}
