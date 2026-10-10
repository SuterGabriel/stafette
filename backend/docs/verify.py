"""Quote check: a claim stays only if its verbatim quote is on exactly that page.

The model never confirms itself. For PDFs the page text comes from pymupdf;
a photo has no text layer, so its claims are marked "vom Foto gelesen" and
flagged for human review instead.
"""

from __future__ import annotations

import re
import unicodedata
from functools import lru_cache

import pymupdf

from docs.schema import VERIFIED_PHOTO, VERIFIED_TEXT, Claim, Rejected

MIN_QUOTE_CHARS = 3

_DASHES = dict.fromkeys(map(ord, "‐‑‒–—―−"), "-")
_QUOTES = dict.fromkeys(map(ord, "„“”«»‚‘’\"'"), None)


def normalize(text: str) -> str:
    """Unify unicode forms, dashes and quote marks, collapse all whitespace."""
    text = unicodedata.normalize("NFKC", text).translate(_DASHES).translate(_QUOTES)
    return re.sub(r"\s+", " ", text).strip()


@lru_cache(maxsize=64)
def _pages(path: str) -> tuple[str, ...]:
    with pymupdf.open(path) as doc:
        return tuple(normalize(page.get_text()) for page in doc)


def page_text(path: str, page: int) -> str | None:
    """Normalized text of a 1-based page, or None if the page does not exist."""
    pages = _pages(path)
    return pages[page - 1] if 1 <= page <= len(pages) else None


def _valid_bbox(bbox: list[int] | None) -> bool:
    if bbox is None or len(bbox) != 4:
        return False
    ymin, xmin, ymax, xmax = bbox
    return 0 <= ymin < ymax <= 1000 and 0 <= xmin < xmax <= 1000


def verify(claims: list[Claim]) -> tuple[list[Claim], list[Rejected]]:
    """Split claims into kept (with verification note) and rejected (with reason)."""
    kept: list[Claim] = []
    rejected: list[Rejected] = []

    def reject(c: Claim, reason: str) -> None:
        rejected.append(Rejected(claim=c.claim, source_document_id=c.source_document_id, page=c.page, reason=reason))

    for c in claims:
        quote = normalize(c.verbatim_quote)
        if len(quote) < MIN_QUOTE_CHARS:
            reject(c, "kein wörtliches Zitat")
            continue
        if c.is_photo:
            bbox = c.bbox if _valid_bbox(c.bbox) else None
            kept.append(c.model_copy(update={"verification": VERIFIED_PHOTO, "requires_human_review": True, "bbox": bbox}))
            continue
        text = page_text(c.file, c.page)
        if text is None:
            reject(c, f"Seite {c.page} existiert nicht")
        elif quote not in text:
            reject(c, f"Zitat nicht auf Seite {c.page} gefunden")
        else:
            kept.append(c.model_copy(update={"verification": VERIFIED_TEXT, "requires_human_review": False}))
    return kept, rejected
