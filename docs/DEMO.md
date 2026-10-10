# Vorgehen, Demo und Zeitplan

## Wie wir bauen: zwei parallele Stränge

Der Telefonanruf ist das grösste Risiko, die Agent-Schleife ist das, was die Jury bewertet. Darum getrennt bauen und um 15:00 zusammenführen.

| | Strang A – Voice (Gabriel) | Strang B – Agent (Teammate) |
|---|---|---|
| bis 12:30 | Twilio → Gradium STT → Gemini → Gradium TTS, durchgehend | Vollmacht-Schema, Policy Engine, Tests grün |
| bis 15:00 | Tools im Dialog, `end_call` mit Outcome, Injection blockt | Orchestrator-Schleife mit **simuliertem** Anruf (Text statt Telefon), Plan-State |
| 15:00 | **Integration:** echter Anruf ersetzt Simulation | |
| bis 17:30 | Latenz, Stimme, Begrüssung | Dokument-Pipeline + Gap Detector, Dashboard mit Plan-Board |
| 17:30 | **Feature Freeze** | |

Der simulierte Anruf in Strang B ist gleichzeitig das Fallback, falls das Telefon morgen nicht will.

## Zeitplan Samstag

| Zeit | Was |
|---|---|
| 09:30 | Ankommen, WLAN, Keys testen, Hello-World-Anruf im Saal |
| 10:00 | Opening & Matchmaking: Regeln klären, ggf. 3. Person (Frontend/Pitch) |
| 10:30 | Bauen (siehe oben) |
| 12:30 | Lunch + Check: was streichen? |
| 15:00 | Integration |
| 17:30 | Feature Freeze, Demo 5× proben, Backup-Video aufnehmen |
| **19:00** | **Opt-in Deadline – nicht verpassen** |
| 20:00 | Live-Demos |

## Was gestrichen wird, wenn die Zeit knapp ist (in dieser Reihenfolge)

1. Kontaktsuche per Google Search → Nummern fix in der Vollmacht
2. Vollmacht-PDF → Button „unterschrieben“ statt echtem PDF
3. Rückruf planen → nur als Status-Karte
4. Zweiter Anruf nach der Lücke → nur angestossen, nicht durchgeführt

**Nie streichen:** echter Anruf mit Injection-Block, Lücke wird gefunden + Freigabe-Frage, Plan-Board.

## Demo-Ablauf (≈ 3 Minuten, Details in PITCH.md)

1. **Ziel** sprechen → Vollmacht erscheint, Plan-Board legt 2 Karten an, Vollmacht-PDF zur Unterschrift (ein Klick „unterschreiben“ im Demo)
2. **Anruf** Praxis A live auf der Bühne: KI-Offenlegung, „wir brauchen eine unterschriebene Vollmacht“ → kommt an die hinterlegte Adresse (Versand simuliert: Event + PDF im Dashboard); Injection-Versuch → BLOCKED
3. **Dokumente** von Spital B kommen rein → Übersicht mit Quellen; Handyfoto mit markiertem Zitat (Gemini beim Namen nennen)
4. **Lücke:** Agent legt selbst eine neue Karte „Dr. Brunner, Kardiologie“ an → Freigabe-Frage → Ja → Vollmacht v2 → Anruf startet
5. **Wie gebaut:** Diagramm + Entire-Checkpoint
6. **Business**

## Vorbereitete Testdaten (`fixtures/`)

- Austrittsbericht Spital B – erwähnt „Überweisung an Dr. med. S. Brunner, Kardiologie“ (**die eingebaute Lücke**)
- Laborblatt Praxis A
- Medikamentenliste Praxis A
- Schief fotografierter Brief (zeigt multimodales Lesen)
- Röntgenbefund Spital B

Alles synthetisch, Namen frei erfunden.

## Fallbacks

| Wenn … | dann … |
|---|---|
| Telefonnetz im Saal versagt | Browser-WebRTC mit Laptop als „Praxis“ |
| Voice ganz kaputt | Simulierter Anruf aus Strang B, Transkript live im Dashboard |
| Gradium-Integration hakt | Gradbot, oder Gradium nur für TTS |
| Latenz zu hoch | Kürzere Sätze, kein Reasoning im Dialog-Modell |
| Alles bricht 19:45 | Backup-Video, danach Dashboard live zeigen |

## Vor der Bühne

- **Kein Handy-Lautsprecher** (Echo → falsches Barge-in). MPA-Handy am Ohr; Agent-Stimme hörbar machen über ein zweites Gerät, das den Anruf mithört (z. B. Twilio-Konferenz/Monitor-Stream auf den Laptop am Saal-Audio) – am Morgen testen, sonst Live-Transkript im Dashboard als Hauptbühne
- Dashboard im Vollbild, Schrift gross, Plan-Board gut sichtbar
- Twilio-Guthaben prüfen, Geo-Permission CH an, Demo-Flag für Anrufzeiten an
- Handy-Hotspot bereit
- Tabs: Dashboard, Diagramm (`docs/diagramme.html`), Entire
