"""Document pipeline against fixtures/README.md, "Erwartete Ergebnisse".

verify and gaps run offline on the real fixture PDFs. Tests that call Gemini
are skipped when GEMINI_API_KEY is missing.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from docs.schema import VERIFIED_PHOTO, VERIFIED_TEXT, Claim
from docs.verify import normalize, page_text, verify

FIXTURES = Path(__file__).resolve().parents[2] / "fixtures"
DOC_01 = str(FIXTURES / "01_austrittsbericht_spital_musterstadt.pdf")
DOC_02 = str(FIXTURES / "02_laborbefund_praxis_seefeld.pdf")
DOC_03 = str(FIXTURES / "03_medikamentenliste_praxis_seefeld.pdf")
DOC_05 = str(FIXTURES / "05_zuweisung_praxis_seefeld_handyfoto.jpg")
DOC_06 = str(FIXTURES / "06_optional_therapiebericht_mit_injection.pdf")


def claim(quote: str, file: str, page: int = 1, *, name: str = "x", category: str = "Diagnosen",
          is_photo: bool = False, bbox: list[int] | None = None) -> Claim:
    return Claim(claim=name, category=category, source_document_id=Path(file).name[:2], page=page,
                 verbatim_quote=quote, source_type="Test", file=file, is_photo=is_photo, bbox=bbox)


# --- verify ------------------------------------------------------------------

@pytest.mark.parametrize("quote,file,page", [
    ("Ambulant erworbene Pneumonie rechts basal", DOC_01, 1),
    ("Paroxysmales Vorhofflimmern, erstmals dokumentiert am 15.03.2026", DOC_01, 1),
    ("Penicillin-Allergie (generalisiertes Exanthem 2011)", DOC_01, 1),
    ("Status nach Appendektomie 2018", DOC_01, 1),
    ("Metoprolol 25 mg 1-0-0", DOC_01, 2),
    ("Metoprolol 25 mg 1-0-0", DOC_03, 1),
    ("Penicillin – generalisiertes Exanthem (2011)", DOC_03, 1),
    ("CRP 4 mg/l < 5", DOC_02, 1),
])
def test_expected_quotes_are_on_their_page(quote: str, file: str, page: int) -> None:
    kept, rejected = verify([claim(quote, file, page)])
    assert rejected == []
    assert kept[0].verification == VERIFIED_TEXT and not kept[0].requires_human_review


def test_whitespace_and_dashes_are_normalized() -> None:
    # Line break inside the quote on the page, en dash vs hyphen, double spaces from the model.
    assert normalize("  Metoprolol\n25 mg   1–0–0 ") == "Metoprolol 25 mg 1-0-0"
    kept, _ = verify([claim("wir die  Patientin an Dr. med. Sabine Brunner,\nKardiologie am See", DOC_01, 2)])
    assert len(kept) == 1


def test_quote_not_on_page_is_rejected() -> None:
    kept, rejected = verify([claim("Diabetes mellitus Typ 2", DOC_01, 1, name="Diabetes")])
    assert kept == []
    assert rejected[0].claim == "Diabetes" and "nicht auf Seite 1" in rejected[0].reason


def test_quote_from_other_page_is_rejected() -> None:
    # Metoprolol 25 mg 1-0-0 is on page 2, not page 1.
    kept, rejected = verify([claim("Metoprolol 25 mg 1-0-0", DOC_01, 1)])
    assert kept == [] and len(rejected) == 1


def test_missing_page_and_empty_quote_are_rejected() -> None:
    kept, rejected = verify([claim("Status nach Appendektomie 2018", DOC_01, 3), claim("  ", DOC_01, 1)])
    assert kept == []
    assert [r.reason for r in rejected] == ["Seite 3 existiert nicht", "kein wörtliches Zitat"]


def test_photo_claims_are_marked_not_text_checked() -> None:
    kept, rejected = verify([
        claim("Status nach Appendektomie 2018", DOC_05, is_photo=True, bbox=[400, 100, 430, 700]),
        claim("Penicillin", DOC_05, is_photo=True, bbox=[500, 900, 400, 100]),  # invalid box
    ])
    assert rejected == []
    assert all(c.verification == VERIFIED_PHOTO and c.requires_human_review for c in kept)
    assert kept[0].bbox == [400, 100, 430, 700]
    assert kept[1].bbox is None


def test_page_text_reads_fixture() -> None:
    assert "Kardiologie am See" in (page_text(DOC_01, 2) or "")
    assert page_text(DOC_01, 0) is None
