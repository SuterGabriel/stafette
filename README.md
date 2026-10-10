# Stafette

> {Tech: Europe} Agentic AI Hack · Zürich · Samstag, 10. Oktober 2026

**Ein Agent, der beim Arztwechsel deine Unterlagen einsammelt – und dabei nie mehr tun kann, als du ihm erlaubt hast.**

*Deine Krankengeschichte – gesammelt, nicht gespeichert.* Stafette = Bote, der eine Depesche überbringt (FR estafette, IT staffetta).

> Name noch nicht auf Domain/Marke geprüft (nic.ch, swissreg.ch). Siehe [RESEARCH.md](RESEARCH.md#4-name-und-logo).

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
| Gradium | Echtzeit-STT/TTS am Telefon, semantisches Turn-Taking, Schweizer Stimme |
| Entire | Ganzes Projekt mit Checkpoints gebaut, Spur im Demo gezeigt |
| Vertrauen | Prompt Injection am Telefon scheitert hörbar, Agent kennt keine Diagnosen |
| Business | Zahlender Kunde: die neue Praxis (MPA-Zeit), später Befüllung des E-GD |

## Dateien

- [ARCHITECTURE.md](ARCHITECTURE.md) – Diagramme: System, Agent-Schleife, Plan-Board, Lücken-Szene, Anruf, Datenfluss
- [STACK.md](STACK.md) – Stack, Partner-Integration, Setup-Checkliste
- [POLICY.md](POLICY.md) – Vollmacht, Tools, Policy Engine, Testfälle
- [DEMO.md](DEMO.md) – Vorgehen in zwei Strängen, Zeitplan, Streichliste, Fallbacks
- [PITCH.md](PITCH.md) – Pitch-Skript, Kernbotschaften, Jury-Fragen
- [RESEARCH.md](RESEARCH.md) – Markt, Konkurrenz, Recht, Stack-Prüfung, Name und Logo

## Team

| Wer | Fokus |
|---|---|
| Gabriel | Voice-Pipeline, Guardrails, Backend |
| Teammate | Dashboard, Dokument-Pipeline, Pitch |
| (Matchmaking 10:00) | Ggf. Frontend/Design oder Business |

## Regeln für uns

- **Keine echten Patientendaten.** Nur synthetische Dokumente.
- Agent stellt sich zu Beginn jedes Anrufs als KI vor (EDÖB: Recht zu wissen, ob man mit einer Maschine spricht).
- Keine Aufnahme oder Transkription ohne Zustimmung (Art. 179ter StGB); der Agent fragt zu Beginn.
- Der Anruf kündigt an, die Freigabe läuft über die unterschriebene Vollmacht.
- Wir sagen „Inhaltsverzeichnis mit Fundstellen“, nicht „Diagnose-Zusammenfassung“ (sonst Medizinprodukt).
- Ab 17:30 keine neuen Features mehr, nur noch Demo proben.
