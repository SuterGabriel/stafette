"""HTTP endpoints of the document pipeline (owner: Manuel).

Add endpoints here, e.g. POST /docs/ingest. main.py already includes this
router, so nobody else needs to touch main.py.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/docs", tags=["documents"])
