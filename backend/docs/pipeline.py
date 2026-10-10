"""Records in, Dr. Keller's sheet out: an Inhaltsverzeichnis mit Fundstellen.

extract (model) -> verify (page text) -> drop contacts/instructions -> group by
category -> sections in the exact shape of state.Section / dashboard/lib/types.ts.

    from docs.pipeline import process, publish
    result = process(paths, mandate_sources=["Hausarztpraxis Seefeld", "Spital Musterstadt"])
    publish(result)   # store.set_documents(...) + one BLOCKED event per rejected claim
"""

from __future__ import annotations

import re
from collections.abc import Iterable
from pathlib import Path

from contracts import MODEL_READER
from docs import extract
from docs.gaps import find_missing, has_contact_or_instruction, missing_text, sanitize_source
from docs.schema import CATEGORIES, Claim, MentionedSource, Rejected
from docs.verify import verify
from state import Finding, Section, store

UNSAFE_REASON = "Kontaktdaten oder Anweisung im Dokument, nicht übernommen"
UNSAFE_LABEL = "(Angabe nicht übernommen)"


def _is_unsafe(c: Claim) -> bool:
    return any(has_contact_or_instruction(t) for t in (c.claim, c.detail, c.verbatim_quote))


def _safe_rejected(r: Rejected) -> dict:
    """Rejected claims are logged, so they must not carry contact data either."""
    claim = UNSAFE_LABEL if has_contact_or_instruction(r.claim) else r.claim
    return r.model_copy(update={"claim": claim}).model_dump()


def _claim_tokens(name: str) -> frozenset[str]:
    return frozenset(re.findall(r"[^\W_]+", name.casefold()))


def _same(a: str, b: str) -> bool:
    """'Penicillin' ~ 'Penicillin-Allergie', 'Spital Musterstadt' ~ 'Spital Musterstadt, Radiologie'."""
    ta, tb = _claim_tokens(a), _claim_tokens(b)
    return bool(ta and tb) and (ta <= tb or tb <= ta)


def _display_quote(quote: str) -> str:
    """Verbatim, only whitespace collapsed and a leading list number ('1. ') dropped."""
    return re.sub(r"^\d{1,2}\.\s+", "", re.sub(r"\s+", " ", quote).strip())


def _group(claims: list[Claim]) -> list[list[Claim]]:
    """Same finding from several pages or documents: 'Penicillin' and 'Penicillin-Allergie' fold together."""
    groups: list[list[Claim]] = []
    for c in claims:
        for members in groups:
            if any(_same(c.claim, o.claim) for o in members):
                members.append(c)
                break
        else:
            groups.append([c])
    return groups


def _doc_label(c: Claim) -> str:
    return f"{c.source_type} (Foto)" if c.is_photo else f"{c.source_type}, S. {c.page}"


def _quote_src(c: Claim) -> str:
    parts = [c.institution, f"{c.source_type} vom {c.document_date}" if c.document_date else c.source_type]
    parts.append(f"Handyfoto, {c.verification}" if c.is_photo else f"Seite {c.page}")
    return " · ".join(p for p in parts if p)


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.casefold()).strip("-") or "angabe"


def _finding(members: list[Claim], used_ids: set[str]) -> Finding:
    # Text-verified quotes before photo quotes, then document order.
    primary = min(members, key=lambda c: c.is_photo)
    others = list(dict.fromkeys(_doc_label(c) for c in members if c.source_document_id != primary.source_document_id))
    documents = {c.source_document_id for c in members}

    fid, n = _slug(primary.claim), 2
    while fid in used_ids:
        fid, n = f"{_slug(primary.claim)}-{n}", n + 1
    used_ids.add(fid)

    quote_src = _quote_src(primary)
    if others:
        quote_src += " · auch in: " + ", ".join(others)
    return Finding(
        id=fid,
        name=primary.claim,
        detail=primary.detail,
        ref=f"{len(documents)} Quellen" if len(documents) > 1 else _doc_label(primary),
        quote=_display_quote(primary.verbatim_quote),
        quote_src=quote_src,
    )


def build_sections(claims: list[Claim]) -> list[Section]:
    """Fixed category order, empty categories left out."""
    used_ids: set[str] = set()
    sections = []
    for title in CATEGORIES:
        in_category = [c for c in claims if c.category == title]
        if in_category:
            sections.append(Section(title=title, items=[_finding(g, used_ids) for g in _group(in_category)]))
    return sections


def _unique_sources(sources: Iterable[MentionedSource]) -> list[MentionedSource]:
    """Sanitized, one entry per doctor/institution; the most complete name wins."""
    unique: list[MentionedSource] = []
    for s in sources:
        clean = sanitize_source(s)
        if clean is None:
            continue
        for i, u in enumerate(unique):
            if _same(clean.name, u.name):
                longer = clean if len(clean.name) > len(u.name) else u
                unique[i] = MentionedSource(name=longer.name, specialty=u.specialty or clean.specialty)
                break
        else:
            unique.append(clean)
    return unique


def _distinct(names: Iterable[str]) -> list[str]:
    distinct: list[str] = []
    for n in names:
        if not any(_same(n, d) for d in distinct):
            distinct.append(n)
    return distinct


def process(paths: list[str | Path], mandate_sources: Iterable[object]) -> dict:
    """Read, verify and index the records.

    Returns {sections, missing, mentioned_sources, rejected} plus missing_sources
    (for add_source), claims (verified, with photo bbox), documents and source_count.
    """
    mandate_sources = list(mandate_sources)
    documents = extract.extract_all(list(paths))

    kept, rejected = verify([c for d in documents for c in d.claims])
    safe = []
    for c in kept:
        if _is_unsafe(c):
            rejected.append(Rejected(claim=UNSAFE_LABEL, source_document_id=c.source_document_id,
                                     page=c.page, reason=UNSAFE_REASON))
        else:
            safe.append(c)

    mentioned = _unique_sources(m for d in documents for m in d.mentioned_sources)
    issuers = [d.institution for d in documents if d.institution]
    missing = find_missing(mentioned, mandate_sources, issuers)

    return {
        "sections": [s.model_dump(by_alias=True) for s in build_sections(safe)],
        "missing": missing_text(missing),
        "missing_sources": [m.model_dump() for m in missing],
        "mentioned_sources": [m.model_dump() for m in mentioned],
        "rejected": [_safe_rejected(r) for r in rejected],
        "claims": [c.model_dump(exclude={"file"}) for c in safe],
        "documents": len(documents),
        "source_count": len(_distinct(issuers)),
    }


def publish(result: dict) -> None:
    """Hand the result to the dashboard (backend/docs/README.md) and log every rejected claim."""
    store.set_documents(sections=result["sections"], missing=result["missing"],
                        documents=result["documents"], source_count=result["source_count"])
    for r in result["rejected"]:
        store.add_event("BLOCKED", f"Angabe verworfen ({r['source_document_id']}, S. {r['page']}): {r['reason']}",
                        model=MODEL_READER)


if __name__ == "__main__":
    # Fill docs/cache/ for the demo:  uv run python -m docs.pipeline
    import json
    import time

    fixtures = Path(__file__).resolve().parents[2] / "fixtures"
    paths = sorted(p for p in fixtures.iterdir() if p.suffix.lower() in {".pdf", ".jpg", ".jpeg", ".png"})
    start = time.perf_counter()
    result = process(paths, ["Hausarztpraxis Seefeld", "Spital Musterstadt"])
    summary = {s["title"]: [i["name"] for i in s["items"]] for s in result["sections"]}
    print(json.dumps(summary, ensure_ascii=False, indent=1))
    print("missing:", result["missing"])
    print("rejected:", result["rejected"])
    print(f"{result['documents']} Dokumente in {time.perf_counter() - start:.1f} s")
