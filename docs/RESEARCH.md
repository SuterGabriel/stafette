# Research (as of October 9, 2026)

Four parallel research tracks: market, law, tech stack, name and logo. **[B]** = backed by a source, **[E]** = estimate. Not legal advice.

## The key points in 7 items

1. **In Switzerland, nobody actively collects the records.** Compassana and Well (both from insurers) are storage apps where you upload yourself or doctors send files. [B]
2. **Internationally it exists, funded through B2B, not by patients.** PicnicHealth (over USD 100M), Ciitizen (sold to Invitae for USD 325M, later spun off again). [B]
3. **The industry's biggest risk is misuse of purpose.** In January 2026, Epic sued Health Gorilla because customers posed as treating providers and pulled almost 300,000 records. [B] Our provable mandate is exactly the answer to that. [E]
4. **The phone is not legally enough for the release.** The call announces; the release needs a written mandate/confidentiality waiver with a copy of an ID (FMH standard, the Swiss Medical Association), and the records go **directly to the new practice**. [B/E]
5. **AI disclosure is effectively mandatory.** The EDÖB (Swiss Federal Data Protection and Information Commissioner) derives from the current DSG (Swiss Federal Act on Data Protection) a right to know whether you are talking to a machine. Recordings only with consent (Art. 179ter StGB, the Swiss Criminal Code). [B]
6. **Stay administrative, otherwise it's a medical device.** Transferring, filing, index with sources: not a medical device. Clinical summary that supports diagnosis/therapy: at least Class IIa. [B]
7. **Name: Stafette.** No conflict found in health tech, meaning "messenger who delivers a dispatch". Relai is out (Zurich Bitcoin app). Check domain and trademark manually before the pitch. [B/E]

---

## 1. Market and competition

### International

| Company | What | Who pays | Lesson |
|---|---|---|---|
| PicnicHealth (now picnic.ai) | Collects records for patients, free | Pharma/life sciences via datasets [E] | Patient doesn't pay, B2B carries it |
| Ciitizen | Patient records platform | 2021 to Invitae for USD 325M, spun off again end of 2023 | Not viable alone inside the group [E] |
| Datavant/Ciox | Release of information, >50M records/year | Not backed | Huge, but institutional |
| Particle Health | EHR data broker, Series B USD 25M | Digital health companies | Dispute with Epic |
| Health Gorilla | Data broker | - | **Epic lawsuit 01/2026 over purpose misuse** |

Sources: [picnic.ai](https://picnic.ai/news-and-insights/series-c), [Mercom](https://mercomcapital.com/invitae-acquires-electronic-medical-records-company-ciitizen-for-325-million/), [TipRanks](https://www.tipranks.com/news/the-fly/invitae-divests-ciitizen-platform-implements-further-cost-cuts), [Fierce Healthcare](https://www.fiercehealthcare.com/tech/ciox-health-datavant-combine-7b-deal-to-create-one-largest-health-data-networks), [Techleap](https://finder.techleap.nl/news/feed/particle-health-raises-10m-amid-epic-lawsuit), [STAT](https://www.statnews.com/2026/01/13/epic-health-gorilla-lawsuit-patient-records-health-data-interoperability/)

### Switzerland

- **Compassana** (Medbase, Hirslanden, Groupe Mutuel, Helsana, Swica, LUKS) and **Well** (CSS, Visana, Medi24, Zur Rose): storage apps, don't actively collect. [B] [compassana.ch](https://compassana.ch/en/blog/press-release-simply-smart-compassana-patient-app-now-publicly-available), [Netzwoche](https://www.netzwoche.ch/news/2022-01-20/aerztinnen-und-aertze-koennen-ueber-well-app-neu-medizinische-dokumente-teilen)
- **Swiss eHealth Barometer 2026:** external connectivity only 42/100 points (internal 68), falling since 2024. 55–70% of doctors want software that automates referrals, for example. Only 18% of practice doctors are connected to the EPD (Swiss electronic patient record), and 22% of those use it actively. [B] [Final report](https://www.e-health-suisse.ch/payload/api/documents/file/Swiss%20eHealth%20Barometer%202026_Schlussbericht_GFP_final.pdf)
- HIN (the Swiss secure email network for healthcare) is the standard for secure mail (around 40M emails in 2021). [B] [HIN annual report 2021](https://www.hin.ch/wp-content/uploads/2022/05/hin-gb2021-de.pdf)
- **Gap:** No Swiss figures found on duration or MPA (medical practice assistant) effort per records transfer. Mark as an assumption in the pitch or back it with our own practice interviews.

### Who pays

- **Patient: difficult.** A copy of the medical record is generally free (max. CHF 300 for disproportionate effort). [B] [FMH guide](https://leitfaden.fmh.ch/rechtlicher-leitfaden/3-grundlagen-der-behandlung/36-auskunft-herausgabe-kg.pdf?c=59632)
- **New practice: most likely first customer** (saves MPA time). [E]
- **Insurers:** already own Compassana and Well, possible partners/buyers. [B/E]
- **Cantons / E-GD (the planned national electronic health record):** the federal government pays for the system, the cantons for operation, launch 2030 at the earliest. The National Council passed the E-GD law on September 15, 2026, 134 to 53. [B] [FOPH fact sheet](https://www.bag.admin.ch/dam/de/sd-web/oYIkdbqeq7iB/260722__FB_das%20Wichtigste%20auf%20einen%20Blick.pdf), [Netzwoche](https://www.netzwoche.ch/news/2026-05-11/nationalratskommission-will-e-gd-kuenftig-zentral-organisieren)

### Post Sanela

- Shutting down end of 2026, around 70,000 private users, data can be moved to the health folder of the Post app. [B] [Post](https://site.post.ch/en/about-us/media/press-releases/swiss-post-shifts-its-focus-to-the-electronic-health-record-ehr)
- The EDI expects Post/Sanela to inform users and cover transfer costs; on August 24, 2026 the SGK-N demanded a free migration without data loss. [B] [cash.ch](https://www.cash.ch/news/post-schliesst-plattform-fur-e-patientendossier-per-ende-jahr-948468)
- Mainly affects German-speaking Switzerland: Zurich (no longer considering mandatory connection from 2027), Basel-Stadt (no successor solution named), Ticino (with Post Sanela since 12/2024). Full list not found. [B]
- A move of Sanela records to CARA is **not backed**. Post had already terminated its contract with CARA in February 2025. [B] [Canton of Vaud](https://www.vd.ch/actualites/communiques-de-presse-de-letat-de-vaud/detail/communique/dossier-electronique-du-patient-cara-prend-acte-de-la-resiliation-de-ses-rapports-commerciaux-avec-poste-ch)
- At the end of 2025, only around 1.3% in Zurich had an EPD. [E, from RRB 2026/476]

---

## 2. Law (not legal advice)

| Topic | Situation | Consequence for us |
|---|---|---|
| Right of access (Art. 25 DSG, DSV 16–19) | Free, usually 30 days, written request, identification required. Para. 3: health data can be disclosed via a healthcare professional named by the patient. [B] | Records go directly to the new practice |
| Representation | FMH: written mandate, no older than 6 months, copy of ID; for questions the practice calls the number it has on file. The FMH guide also calls the right "strictly personal" → gray area. [B] | Mandate as PDF, signed by the patient |
| Professional secrecy (Art. 321 StGB) | Release only with informed consent; FMH recommends written form. [B] | Call = announcement, not release |
| Zurich PatG § 15 | Consent to informing the previously treating doctors is presumed. [B] | Supports doctor-to-doctor transfer |
| Recording (Art. 179ter StGB) | A criminal offense without consent; the business-dealings exception (orders, reservations) is an uncertain fit. [B/E] | Ask for consent at the start, otherwise notes only |
| AI disclosure | EDÖB: right to know whether you are talking to a machine. No AI law; consultation draft on the Council of Europe convention due by end of 2026. [B] | First sentence: "I'm an AI assistant …" |
| Medical device (MDCG 2019-11, Rule 11) | Transferring/archiving: no. Preparing data for diagnosis/therapy decisions: ≥ IIa, then also high-risk under the EU AI Act. LLM summaries = gray area (Innovation Sandbox ZH). [B] | Purpose: **index with sources**, no assessment |
| Cloud/abroad (Art. 9, 16 DSG) | Health data is particularly sensitive. Cantonal data protection officers require additional measures (own keys) for US cloud and professional secrecy. [B] | Next stage: Gemma 4 locally / CH hosting |

Sources: [DSG](https://www.fedlex.admin.ch/eli/cc/2022/491/de), [DSV](https://www.fedlex.admin.ch/eli/cc/2022/568/de), [FMH access instructions](https://fmh.ch/files/pdf29/anleitung-auskunft-und-herausgabegesuche-ueber-personendaten.pdf), [FMH professional secrecy](https://contens30.fmh.ch/files/pdf7/06-berufsgeheimnis-2020-de-v2.pdf), [PatG ZH](https://www.lexfind.ch/tolv/129554/de), [Art. 179quinquies](https://www.droit-bilingue.ch/de-en/3/31/311.0-179quinquies-223.html), [EDÖB](https://www.edoeb.admin.ch/en/update-current-legislation-directly-applicable-ai), [FOJ AI](https://www.bj.admin.ch/de/kuenstliche-intelligenz), [MDCG 2019-11](https://ec.europa.eu/docsroom/documents/37581/attachments/1/translations/en/renditions/native), [Innovation Sandbox ZH](https://www.zh.ch/de/wirtschaft-arbeit/wirtschaftsstandort/innovation-sandbox/phase-ii/medizinische-dokumentation/3-besonderheiten-bei-medizinprodukten.html), [DPO ZH cloud](https://docs.datenschutz.ch/u/d/publikationen/formulare-merkblaetter/merkblatt_cloud_produkte_von_us_unternehmen.pdf)

---

## 3. Tech stack (verified)

> **Decision on hack day (October 10):** phone part on gradbot instead of Pipecat, see [STACK.md](STACK.md). The Pipecat rows below stay as research.

| Item | Result |
|---|---|
| Dialog + tools | `gemini-3.6-flash` (GA, Pipecat default). [B] [Changelog](https://ai.google.dev/gemini-api/docs/changelog) |
| Extraction + structured output | `gemini-3.8-flash` (GA since September 2, 2026, strongest Flash). PDFs up to 50 MB / 1000 pages. [B] [Docs](https://ai.google.dev/gemini-api/docs/document-processing) |
| Real-time audio | `gemini-3.8-live` (GA since September 15, 2026). [B] |
| Watch out | `gemini-flash-latest` points to **3.5**, not 3.6. `gemini-3.7-flash` is deprecated. [B] |
| Live API vs. pipeline | Live API needs 16/24 kHz PCM, Twilio delivers 8 kHz μ-law; forum reports 5–6 s latency with Twilio (older model). **Use the cascaded pipeline**: debuggable, Gradium voice, transcripts for the dashboard. [B/E] |
| Pipecat + Gradium | Official: `pipecat-ai[gradium]` → `GradiumSTTService`, `GradiumTTSService`. STT: `de`, `en`, `fr`, `es`, `pt`, `any`. [B] [Pipecat](https://docs.pipecat.ai/api-reference/server/services/stt/gradium), [Gradium](https://docs.gradium.ai/integrations/agent-frameworks/pipecat) |
| Pipecat + Gemini | `pipecat-ai[google]` → `GoogleLLMService`; model via `settings=GoogleLLMService.Settings(model=...)` (`model=` deprecated). [B] |
| Pipecat + Twilio | `TwilioFrameSerializer` + `FastAPIWebsocketTransport` (`add_wav_header=False`); starter: [pipecat-examples/twilio-chatbot](https://github.com/pipecat-ai/pipecat-examples/tree/main/twilio-chatbot). No ready-made Gradium-Twilio starter → swap STT/TTS in the example. [B] |
| Swiss voice | Gradium sample voice Swiss German: `vox_emb_ybLDszpRN8R26pPr` (Standard German with a Swiss accent). STT has no `de-CH`. [B] [gradium.ai](https://gradium.ai/voices/accents/swiss-german) |
| Gradbot | `pip install gradbot`, Twilio Media Streams built in, recommended for prototypes only. [B] [GitHub](https://github.com/gradium-ai/gradbot) |
| Twilio CH number | Needs a Regulatory Bundle with CH address/ID, CH mobile is SMS only. **Too risky before Saturday.** Trial: max. 5 verified recipients, voice only in the sign-up country. → **Upgrade today and buy an instantly available number without a bundle**, enable geo permissions for CH. [B/E] [Twilio CH](https://www.twilio.com/en-us/guidelines/ch/regulatory), [Trials](https://www.twilio.com/docs/usage/trials) |
| Gemini CLI | Being discontinued, replaced by **Antigravity CLI (`agy`)**. [B] [Google Blog](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/) |
| Entire | `entire enable --agent antigravity`, Gemini CLI is not supported. Checkpoints on entire.io after push. [B] [Docs](https://docs.entire.io/quickstart) |
| Voice pitfalls | Local `SileroVADAnalyzer`, `stop_secs=0.2`, interruptions on. **Speaker causes echo and false barge-in** → phone at the ear or a headset. ngrok URL changes. Hotspot as backup. [B/E] [Pipecat Speech Input](https://docs.pipecat.ai/guides/learn/speech-input) |

---

## 4. Name and logo

### Name

**Recommendation: Stafette.** Multilingual (DE Stafette, FR estafette, IT staffetta), meaning "courier who delivers a dispatch" [B] ([Académie française](https://dictionnaire-academie.fr/article/A9E2696)). On the web mostly the SOLA-Stafette (running event), no health tech product found. [B]

| Name | Verdict |
|---|---|
| **Stafette** | Top. Domain/trademark **unclear**, check on nic.ch, swissreg.ch, EUIPO before the pitch (classes 9, 42, 44) |
| Anamna | Runner-up. Similar: Anamne (Japanese telemedicine startup) [B] |
| Relai | **Out.** Relai AG Zurich (Bitcoin app) [B]; there was also RelayHealth (McKesson) |
| Übergabe | Only as a tagline |
| Others | Estafette, Relaya, Anamio, Kontinu, Tessera, Akta, Passa … |

**Tagline:** *„Deine Krankengeschichte – gesammelt, nicht gespeichert.“* / *"Your history. Collected, not stored."*

**New tagline (decided October 10, 2026):** *"Switch doctors. Your medical history follows."*, subline *"An AI agent that collects your records, only with your permission."* (DE: *„Arzt wechseln. Ihre Krankengeschichte kommt mit.“*). Reason: the old tagline was only a privacy argument and named neither the situation (switching doctors) nor the promise.

### Logo: what the market does

Doctolib (kept blue), Ada (turquoise, blue, coral), Alan (soft, mascot, warm), OneDoc CH (teal `#02ae96`, "swiss made software" badge). Pattern [E]: wordmark instead of symbol, one cool main color with a warm accent, round shapes, trust via certification badges.

**Avoid:** cross, heart, stethoscope, ECG line, caduceus (actually the staff of Hermes). **Swiss cross:** prohibited in the medical field if it could be confused with the Red Cross emblem [B] ([IGE](https://www.ige.ch/de/etwas-schuetzen/herkunftsangaben/grundlegendes/swissness/schweizerkreuz)) → Swissness through text ("Swiss made").

### Three concepts for Stafette

| | A: The baton (favorite) | B: The seal | C: Ligature |
|---|---|---|---|
| Symbol | Two rounded bars, offset diagonally, overlapping at the moment of handover; overlap = third color = "verified" | Open circle that closes with a checkmark arrow (collected + complete) | Wordmark "stafette", the two "t"s share a crossbar like hands on the baton; app icon "tt" |
| Colors | `#0E2A3B` ink, `#0F8B8D` petrol, `#FF7A59` coral, `#F7F5F0` off-white | `#1B2A4A` night blue, `#6FAF8F` sage, `#EDE6DA` sand, `#F2B134` accent | `#12355B` deep blue, `#4FA3D9` sky blue, `#FFFFFF`, `#8A8F98` warm gray |
| Typeface | Manrope Semibold | Instrument Sans + Inter | DM Sans Medium (+ Fraunces for headlines) |

---

## 5. Comparison with the Perplexity research

Both research efforts reach the same core: pipeline instead of Live API, the call only announces, administrative language, the practice as first customer. Differences and what we adopt:

| Topic | Perplexity | Our research | Decision |
|---|---|---|---|
| Sanela options | Usable until **November 30, 2026**; transfer to CARA, Post app, download or deletion; without backup **irreversible deletion**; support until December 31, 2026; Sanela was in 18 cantons, ~1,300 institutions | CARA transfer not found backed | **Not confirmed by us.** The Sanela page on the shutdown names neither a date nor CARA ([post-sanela.ch](https://post-sanela.ch/en/general-public/your-epr/closing-the-epr)); but a form for switching the reference community exists ([PDF](https://www.post-sanela.ch/_Resources/Persistent/e/e/1/6/ee168de33d76a288f2d6202a231e590423a66df1/PSH_Formular_Einwilligungserklaerung_Wechsel_Stammgeneinschaft_02_2025_FR_RZ.pdf)). November 30 would be a strong pitch line. Only use it if you see the source yourselves. |
| Model for dialog | `gemini-3.8-flash` | `gemini-3.6-flash` (cheaper, Pipecat default) | Both work. 3.6 for the phone (latency/cost), 3.8 for compiler and extraction. |
| AI disclosure | No obligation backed | EDÖB: right to know whether you are talking to a machine | Our source is more specific; disclosure stays in either way. |
| Entire + Gemini CLI | Integration available as preview | Not supported, Gemini CLI is being discontinued | Doesn't matter: we use Antigravity. |
| Name | **Handova** (+ Anamora, Fidovia) | **Stafette** (+ Anamna) | See below. |

**Adopted:**

- **Mandate in three forms from one object:** versioned JSON (policy), readable PDF (for the practice), **hash** linking PDF, JSON and approval event. → POLICY.md
- **Extraction schema** with `verbatim_quote`, `page`, `source_document_id`, `requires_human_review`; the quote is searched for in the page text on the server, never confirmed by the model itself. → POLICY.md
- **Wording:** "missing source detected" instead of "medical gap"; "administrative handover overview"; the new practice confirms the overview.
- **Core line:** *"The model proposes actions; code decides whether they are allowed."* → PITCH.md
- **Evidence graph** as a visual: claim → quote → page → document → institution → approval, next to it doctor mentioned → missing source.
- **Positioning:** "E-GD readiness layer": we collect historical records *before* the migration, not a replacement for the E-GD.
- **Still test today (Gradium STT on the phone):** Swiss names and municipalities, "Krankengeschichte" (medical history), "Austrittsbericht" (discharge report), "Überweisungsschreiben" (referral letter), dates, phone numbers, spelled-out email addresses.
- **Twilio trial:** calls limited to 10 minutes, verified destinations only → upgrading stays the safe choice.
- **Keep the dashboard lean:** plan board, event log, overview. No elaborate Next.js project. *(Built as Anna's app + Dr. Keller's handover, see `dashboard/`.)*

**Not adopted:** Perplexity largely drops the real call ("simulated or controlled practice"). We keep the controlled live call to the teammate's phone, because it's the strongest stage moment, with the simulation from track B as fallback.

### Name: Stafette or Handova?

| | Stafette | Handova |
|---|---|---|
| Meaning | Real word: messenger with a dispatch, understood in DE/FR/IT | Made-up word from "handover", instantly clear in English |
| Conflict check | No health tech found (only SOLA-Stafette) | Not checked |
| Risk | Somewhat "Swiss", new internationally | Feels playful, spelling, the H is silent in French |
| Story | "The baton between your doctors" | "The verified medical handover agent" |

The recommendation stays **Stafette**, because it's been checked and the metaphor holds. From the Perplexity logo suggestion "Quoted Handover", one idea is worth taking: bring **quotation marks** into the logo, e.g. concept A (two overlapping bars) with a small quotation-mark shape in the overlap = "handed over and backed".

## 6. What we still change tomorrow morning

1. **Upgrade Twilio tonight, buy a number without a bundle, CH geo permissions on**, test call to the teammate's phone.
2. **Models fixed:** `gemini-3.6-flash` (dialog, orchestrator), `gemini-3.8-flash` (extraction, policy compiler). Not `gemini-flash-latest`.
3. **Antigravity CLI instead of Gemini CLI**, `entire enable --agent antigravity`.
4. **New step in the flow:** the agent creates the mandate/confidentiality waiver as a PDF, the patient signs, it goes to the practice by mail; records go **directly to the new practice**. The call announces and clarifies the route.
5. **Greeting:** AI disclosure + asking for consent to transcription.
6. **Wording:** "index with sources" instead of "medical summary".
7. **Demo without speaker echo:** MPA phone at the ear or a headset, agent audio via laptop/venue sound system.
8. **Test Gradium STT today with Swiss terms** (list in section 5), and build the mandate as JSON + PDF + hash.
