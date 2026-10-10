"""Data shapes of the document pipeline (docs/POLICY.md, "Extraktions-Schema").

The model only fills the *Model* classes. Document id, page and file are set by
our code, never by the model, so a claim cannot point at a page it was not read from.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Category = Literal["Diagnosen", "Allergien", "Medikamente", "Letzte Werte"]
CATEGORIES: tuple[str, ...] = ("Diagnosen", "Allergien", "Medikamente", "Letzte Werte")

VERIFIED_TEXT = "im Seitentext gefunden"
VERIFIED_PHOTO = "vom Foto gelesen"


# --- What the reader model returns (Structured Output) ----------------------

class ModelClaim(BaseModel):
    claim: str = Field(description="Kurzer Name der Angabe, z. B. 'Paroxysmales Vorhofflimmern' oder 'Metoprolol 25 mg'")
    detail: str = Field(description="Präzisierung aus dem Dokument (Datum, Dosierung, Wert, Referenz). Keine Bewertung. Leer, wenn nichts.")
    category: Category
    verbatim_quote: str = Field(description="Zusammenhängender Text exakt so, wie er auf der Seite steht")


class ModelPhotoClaim(ModelClaim):
    bbox: list[int] = Field(description="Bounding Box des Zitats im Bild: [ymin, xmin, ymax, xmax], normiert auf 0-1000")


class MentionedSource(BaseModel):
    """A doctor or institution named in a document. Name and specialty only, never contact data."""
    name: str = Field(description="Person und/oder Institution, z. B. 'Dr. med. Sabine Brunner, Kardiologie am See'")
    specialty: str = Field(description="Fachrichtung, z. B. 'Kardiologie'. Leer, wenn unbekannt.")


class ModelPage(BaseModel):
    institution: str = Field(description="Name der ausstellenden Institution, ohne Adresse und Telefonnummer")
    source_type: str = Field(description="Art des Dokuments, z. B. 'Austrittsbericht', 'Laborbefund'")
    document_date: str = Field(description="Datum des Dokuments als TT.MM.JJJJ, leer wenn keines")
    claims: list[ModelClaim]
    mentioned_sources: list[MentionedSource]


class ModelPhoto(ModelPage):
    claims: list[ModelPhotoClaim]  # type: ignore[assignment]


# --- What the pipeline works with -------------------------------------------

class Claim(BaseModel):
    claim: str
    detail: str = ""
    category: Category
    source_document_id: str
    page: int
    verbatim_quote: str
    source_type: str
    institution: str = ""
    document_date: str = ""
    file: str = ""
    is_photo: bool = False
    bbox: list[int] | None = None
    verification: str | None = None
    requires_human_review: bool = False


class DocumentExtraction(BaseModel):
    source_document_id: str
    file: str
    institution: str
    source_type: str
    document_date: str
    is_photo: bool
    claims: list[Claim]
    mentioned_sources: list[MentionedSource]


class Rejected(BaseModel):
    """A claim that did not make it into the overview. Carries no raw document text."""
    claim: str
    source_document_id: str
    page: int
    reason: str
