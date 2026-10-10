"""Missing sources: doctors named in the records, with no records of their own.

A mentioned doctor or institution becomes a missing source when it is neither
in the mandate nor the issuer of a document we already have. It is reported as
"fehlende Quelle" with name and specialty only, never as a medical gap.

Documents are untrusted input (fixtures/06 carries a prompt injection). Nothing
that looks like contact data or an instruction is ever passed on.
"""

from __future__ import annotations

import re
from collections.abc import Iterable

from docs.schema import MentionedSource

_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(\.[\w-]+)+")
_URL = re.compile(r"https?://|www\.", re.I)
_PHONE = re.compile(r"(\+|00)\d{2}[\s/-]?\d|\b0\d{2,3}[\s/-]?\d{3}[\s/-]?\d{2,3}([\s/-]?\d{2})?\b|0900")
_INSTRUCTION = re.compile(
    r"\b(senden|schicken|rufen|bestätigen|ignorieren|übermitteln|leiten|kontaktieren)\s+sie\b"
    r"|anweisung|automatisierte\s+systeme|\bignore\b|\binstructions?\b",
    re.I,
)

_STOPWORDS = {"dr", "med", "prof", "pract", "dipl", "fh", "pd", "am", "an", "der", "die", "das", "den", "dem",
              "und", "für", "fur", "von", "im", "in", "frau", "herr", "facharzt", "fachärztin"}

MAX_NAME_CHARS = 120


def has_contact_or_instruction(text: str) -> bool:
    """True if text contains an e-mail, URL, phone number or an instruction to a machine."""
    return bool(_EMAIL.search(text) or _URL.search(text) or _PHONE.search(text) or _INSTRUCTION.search(text))


def redact(text: str) -> str:
    """Remove contact data from a metadata string (institution, document type)."""
    for pattern in (_EMAIL, _PHONE):
        text = pattern.sub("", text)
    text = re.sub(r"\b(Tel|Fax|E-Mail|Mail)\.?:?\s*", "", text, flags=re.I)
    return re.sub(r"\s*[,·]\s*(?=[,·]|$)", "", re.sub(r"\s+", " ", text)).strip(" ,·")


def sanitize_source(source: MentionedSource) -> MentionedSource | None:
    """Keep name and specialty only. Address parts are cut off; anything suspicious is dropped."""
    if has_contact_or_instruction(source.name) or has_contact_or_instruction(source.specialty):
        return None
    # "Dr. X, Kardiologie am See, Utoquai 7, 8008 Zürich" -> "Dr. X, Kardiologie am See"
    parts = [p.strip() for p in source.name.split(",")]
    name = ", ".join(p for p in parts if p and not re.search(r"\d", p))
    specialty = source.specialty.strip()
    if not name or len(name) > MAX_NAME_CHARS or len(specialty) > MAX_NAME_CHARS or re.search(r"\d", specialty):
        return None
    return MentionedSource(name=name, specialty=specialty)


def _tokens(name: str) -> frozenset[str]:
    words = re.findall(r"[^\W\d_]+", name.casefold())
    return frozenset(w for w in words if w not in _STOPWORDS and len(w) > 1)


def _source_name(source: object) -> str:
    return source if isinstance(source, str) else getattr(source, "name", "")


def _covered(name: str, known: Iterable[frozenset[str]]) -> bool:
    """A mentioned name is covered when all words of a known source appear in it, or vice versa."""
    t = _tokens(name)
    return bool(t) and any(k and (k <= t or t <= k) for k in known)


def find_missing(mentioned: Iterable[MentionedSource], mandate_sources: Iterable[object],
                 document_sources: Iterable[str]) -> list[MentionedSource]:
    """Mentioned sources that are neither in the mandate nor already delivered documents.

    mandate_sources: names (str) or objects with a .name, e.g. policy.schema.Source.
    document_sources: issuing institutions of the documents we have.
    """
    known = [_tokens(_source_name(s)) for s in mandate_sources] + [_tokens(s) for s in document_sources]
    sources = [s for s in map(sanitize_source, mentioned) if s is not None]
    # "Dr. Huber" alone is covered when another page names him as "Dr. Huber, Hausarztpraxis Seefeld".
    known += [_tokens(s.name) for s in sources if _covered(s.name, known)]
    missing: list[MentionedSource] = []
    for source in sources:
        if _covered(source.name, known):
            continue
        # The same doctor may be named on several pages; report once.
        if _covered(source.name, [_tokens(m.name) for m in missing]):
            continue
        missing.append(source)
    return missing


def missing_text(missing: list[MentionedSource]) -> str | None:
    """One neutral line for Dr. Keller's sheet (state.missing). No assessment, no advice."""
    if not missing:
        return None
    parts = [f"{m.name} ({m.specialty})" if m.specialty and m.specialty not in m.name else m.name for m in missing]
    return "Fehlende Quelle erkannt: " + "; ".join(parts) + ". Erwähnt, keine Unterlagen vorhanden."
