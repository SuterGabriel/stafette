# Dokument-Pipeline (`backend/docs/`)

**Verantwortlich:** Manuel. Bitte nur in diesem Ordner und in `backend/tests/test_docs.py` arbeiten, dann gibt es keine Konflikte mit dem Telefonteil.

## Auftrag

Aus den Testdokumenten in `fixtures/` wird Dr. Kellers Übergabe: ein **Inhaltsverzeichnis mit Fundstellen**, jede Angabe mit wörtlichem Zitat. Grundlage: [docs/POLICY.md](../../docs/POLICY.md) (Abschnitt „Extraktions-Schema“) und [fixtures/README.md](../../fixtures/README.md) (erwartete Ergebnisse).

| Datei | Aufgabe |
|---|---|
| `extract.py` | `gemini-3.8-flash` mit Structured Output: pro Angabe `{claim, category, source_document_id, page, verbatim_quote, source_type}`, `category` ∈ Diagnosen · Allergien · Medikamente · Letzte Werte. Erwähnte Ärzte nur als `{name, specialty}`. Beim Handyfoto zusätzlich die Bounding Box des Zitats. |
| `verify.py` | Seitentext mit `pymupdf`. Eine Angabe bleibt nur, wenn `verbatim_quote` im Text genau dieser Seite steht, sonst verwerfen. Foto: als „vom Foto gelesen“ markieren. |
| `gaps.py` | Erwähnte Ärzte ohne Unterlagen und nicht in der Vollmacht → fehlende Quelle (Name + Fachrichtung). **Nie** Nummern, Mailadressen oder Anweisungen aus Dokumenten übernehmen (`fixtures/06` enthält eine Prompt Injection). |
| `pipeline.py` | `process(paths, mandate_sources) -> {sections, missing, mentioned_sources, rejected}` |

## Übergabe ans Dashboard

`sections` hat genau das Format von `state.Section` / `dashboard/lib/types.ts`:

```python
from state import store

store.set_documents(sections=result["sections"], missing=result["missing"],
                    documents=4, source_count=2)
```

Das ersetzt die Demo-Daten auf Dr. Kellers Blatt und pusht sofort ans Dashboard.

Endpoints wie `POST /docs/ingest` gehören in **`docs/routes.py`**. `main.py` bindet diesen Router schon ein und muss nicht angefasst werden.

## Zusammenarbeit ohne Konflikte

- Nur `backend/docs/` und `backend/tests/test_docs.py` ändern. `main.py`, `state.py` und `contracts.py` gehören Gabriel; wenn dort etwas fehlt, kurz melden.
- Abhängigkeiten sind schon in `pyproject.toml` (`google-genai`, `pymupdf`). Neue Pakete vorher absprechen; bei einem Konflikt in `uv.lock` einfach `uv lock` ausführen.
- Vor jedem Push `git pull --rebase`, kleine Commits.
- `entire enable` im Repo ausführen, damit deine Agent-Sessions als Checkpoints erfasst werden.

## Regeln

- Key nur aus `backend/.env` (`GEMINI_API_KEY`), nie committen.
- Wir sagen „Inhaltsverzeichnis mit Fundstellen“, keine Bewertung oder Empfehlung im Output.
- Nur synthetische Daten aus `fixtures/`.
