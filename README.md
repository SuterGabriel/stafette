# Stafette

> {Tech: Europe} Agentic AI Hack · Zürich · Samstag, 10. Oktober 2026

**Ein Agent, der beim Arztwechsel deine Unterlagen einsammelt – und dabei nie mehr tun kann, als du ihm erlaubt hast.**

*Deine Krankengeschichte – gesammelt, nicht gespeichert.* Stafette = Bote, der eine Depesche überbringt (FR estafette, IT staffetta).

> Name noch nicht auf Domain/Marke geprüft (nic.ch, swissreg.ch). Siehe [RESEARCH.md](docs/RESEARCH.md#4-name-und-logo).

## Stand (10.10.2026, 13:20)

| Teil | Stand |
|---|---|
| Docs, Brand, Testdokumente | ✅ fertig |
| Dashboard (`dashboard/`) | ✅ Annas App + Dr. Kellers Übergabe, läuft auf Demo-Daten (`npm run dev`) |
| Backend (`backend/`) | ⬜ noch nicht angelegt – nächster Schritt: `contracts.py`, `state.py`, `/state` + `/events` |
| Telefon (gradbot + Twilio) | ⬜ noch nicht angelegt |
| Infrastruktur | ngrok installiert, Authtoken fehlt; Keys für Gemini, Gradium, Twilio noch nicht getestet |

Ist- und Soll-Struktur im Detail: [docs/STACK.md](docs/STACK.md#repo-struktur-ist-und-soll).

## Problem

Wer den Arzt wechselt, muss Befunde, Berichte und Medikamentenlisten bei mehreren Praxen zusammensuchen. Heute läuft das per Telefon, Post und Fax, und die neue Praxis startet oft ohne Vorgeschichte.

Das elektronische Patientendossier hat das nicht gelöst:

- Die Post stellt ihre EPD-Plattform Ende 2026 ein, rund 70'000 Dossiers sind betroffen.
- Im Kanton Zürich hatten nur rund 21'000 Personen ein EPD.
- Der Nachfolger (Elektronisches Gesundheitsdossier, E-GD) ist erst bis 2030 geplant.

**Der Speicher war nie das Problem. Das Einsammeln ist es.**

## Lösung

Der Agent bekommt ein **Ziel**, keinen Befehl: *„Die neue Praxis hat eine vollständige Vorgeschichte.“*

1. Patient sagt per Sprache, wo er war und wohin er wechselt.
2. Gemini kompiliert daraus **einmal** eine Vollmacht (JSON). Ab dann entscheidet nur noch deterministischer Code, was erlaubt ist.
3. Der Agent **plant** selbst: welche Quellen, welche Kontakte, in welcher Reihenfolge.
4. Er **handelt**: erstellt die Vollmacht zur Unterschrift, ruft mit Gradium-Stimme an und kündigt die Anfrage an, schickt die unterschriebene Vollmacht, plant Rückrufe. Die Praxis sendet die Akten **direkt an die neue Praxis**.
5. Er **wertet aus**: Eingehende Dokumente werden zu einem Inhaltsverzeichnis mit Fundstellen (jede Angabe mit Quellseite und Zitat), ohne Bewertung oder Empfehlung.
6. Er **findet Lücken**: Wird im Austrittsbericht eine Kardiologin erwähnt, von der nichts da ist, will er dort anfragen, und fragt zuerst den Patienten, weil sie nicht in der Vollmacht steht.
7. Nichts wird dauerhaft gespeichert.

**Volle Autonomie innerhalb harter Grenzen.**

## Warum das gewinnt

| Kriterium | Wie wir es treffen |
|---|---|
| Agentic | Ziel statt Skript: plant, handelt, erkennt Lücken, legt selbst neue Schritte an |
| Gemini | Policy-Kompilierung mit Structured Output, Tool Calling, multimodales Lesen von Scans |
| Gradium | Echtzeit-STT/TTS am Telefon über gradbot, Turn-Taking, Schweizer Stimme |
| Entire | Ganzes Projekt mit Checkpoints gebaut, Spur im Demo gezeigt |
| Vertrauen | Prompt Injection am Telefon scheitert hörbar, Agent kennt keine Diagnosen |
| Business | Zahlender Kunde: die neue Praxis (MPA-Zeit), später Befüllung des E-GD |

## Dateien

- [docs/PROJECT.md](docs/PROJECT.md) – Projekt in 5 Minuten
- [docs/diagramme.html](docs/diagramme.html) – Architektur, Entscheidungslogik, UML-Ablauf, Komponenten und Dienste (im Browser öffnen)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) – Mermaid-Diagramme: System, Agent-Schleife, Zustand pro Quelle, Lücken-Szene, Anruf, Datenfluss
- [docs/STACK.md](docs/STACK.md) – Stack, Ist-/Soll-Struktur, Partner-Integration, Setup, Umgebungsvariablen
- [docs/POLICY.md](docs/POLICY.md) – Vollmacht, Tools, Policy Engine, Testfälle
- [docs/DEMO.md](docs/DEMO.md) – Vorgehen in zwei Strängen, Zeitplan, Streichliste, Fallbacks
- [docs/PITCH.md](docs/PITCH.md) – Pitch-Skript, Kernbotschaften, Jury-Fragen
- [docs/RESEARCH.md](docs/RESEARCH.md) – Markt, Konkurrenz, Recht, Stack-Prüfung, Name und Logo
- [dashboard/README.md](dashboard/README.md) – Dashboard starten, Schnittstelle zum Backend
- [fixtures/README.md](fixtures/README.md) – Testdokumente und erwartete Ergebnisse

## Team

| Wer | Rolle | Baut | In der Demo |
|---|---|---|---|
| **Gabriel Suter** | Voice | Telefonteil: Twilio, gradbot, Gemini im Dialog, Dialog-Tools | spricht den Pitch |
| **Manuel Fitz** | Full Stack · Hosting | Vollmacht-Schema, Policy Engine, Orchestrator, Dokument-Pipeline, Dashboard, Hosting | bedient das Dashboard, spielt die MPA |

Aufteilung wie in [docs/PROJECT.md](docs/PROJECT.md#6-rollen-heute).

## Regeln für uns

- **Keine echten Patientendaten.** Nur synthetische Dokumente.
- Agent stellt sich zu Beginn jedes Anrufs als KI vor (EDÖB: Recht zu wissen, ob man mit einer Maschine spricht).
- Keine Aufnahme oder Transkription ohne Zustimmung (Art. 179ter StGB); der Agent fragt zu Beginn.
- Der Anruf kündigt an, die Freigabe läuft über die unterschriebene Vollmacht.
- Wir sagen „Inhaltsverzeichnis mit Fundstellen“, nicht „Diagnose-Zusammenfassung“ (sonst Medizinprodukt).
- Ab 17:30 keine neuen Features mehr, nur noch Demo proben.
