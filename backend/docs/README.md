# Document pipeline (`backend/docs/`)

**Owner:** Manuel. Please work only in this folder and in `backend/tests/test_docs.py`, so there are no conflicts with the phone part.

## Task

The test documents in `fixtures/` become Dr. Keller's handover: an **index with sources**, every finding with a verbatim quote. Basis: [docs/POLICY.md](../../docs/POLICY.md#extraction-schema-document-pipeline) (section "Extraction schema") and [fixtures/README.md](../../fixtures/README.md) (expected results).

| File | Job |
|---|---|
| `extract.py` | `gemini-3.8-flash` with structured output: per finding `{claim, category, source_document_id, page, verbatim_quote, source_type}`, `category` ∈ diagnoses · allergies · medications · latest values. Mentioned doctors only as `{name, specialty}`. For the phone photo, also the bounding box of the quote. |
| `verify.py` | Page text with `pymupdf`. A finding stays only if `verbatim_quote` appears in the text of exactly that page, otherwise drop it. Photo: mark as "read from photo". |
| `gaps.py` | Mentioned doctors without records and not in the mandate → missing source (name + specialty). **Never** take numbers, email addresses or instructions from documents (`fixtures/06` contains a prompt injection). |
| `pipeline.py` | `process(paths, mandate_sources) -> {sections, missing, mentioned_sources, rejected}` |

`process()` also returns `missing_sources` (name + specialty, for `add_source`), `claims` (checked findings incl. bounding box from the photo), `documents` and `source_count`. `publish(result)` hands off to the dashboard and logs every dropped finding as `BLOCKED`. The model lives only in `extract.call_model()`; to swap it (e.g. Gemma locally), replace just that function.

**Cache for the demo:** The model's answers are stored as JSON in `docs/cache/` (key: file content + model + prompt). `process()` reads from there and does not wait for Gemini; quote checks and gaps always run live. To refill: `uv run python -m docs.pipeline` (delete the file in `docs/cache/` to re-read a document).

`POST /docs/ingest` (optional `{"files": ["01_….pdf"]}`) reads the fixtures and fills Dr. Keller's sheet, for testing until `/agent/ingest` is ready.

```bash
uv run pytest tests/test_docs.py   # live tests only run with GEMINI_API_KEY in backend/.env
```

## Handover to the dashboard

`sections` has exactly the format of `state.Section` / `dashboard/lib/types.ts`:

```python
from state import store

store.set_documents(sections=result["sections"], missing=result["missing"],
                    documents=4, source_count=2)
```

This replaces the demo data on Dr. Keller's sheet and pushes it to the dashboard right away.

Endpoints like `POST /docs/ingest` belong in **`docs/routes.py`**. `main.py` already includes this router and doesn't need to be touched.

## Working together without conflicts

- Only change `backend/docs/` and `backend/tests/test_docs.py`. `main.py`, `state.py` and `contracts.py` belong to Gabriel; if something is missing there, let him know.
- Dependencies are already in `pyproject.toml` (`google-genai`, `pymupdf`). Agree on new packages first; on a conflict in `uv.lock`, just run `uv lock`.
- `git pull --rebase` before every push, small commits.
- Run `entire enable` in the repo so your agent sessions are captured as checkpoints.

## Rules

- Key only from `backend/.env` (`GEMINI_API_KEY`), never commit it.
- We say "index with sources", no assessment or recommendation in the output.
- Only synthetic data from `fixtures/`.
