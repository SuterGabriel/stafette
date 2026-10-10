/**
 * Mock state for running the dashboard without a backend.
 * Mirrors the demo story: Anna switches to Dr. Keller, the agent finds Dr. Brunner.
 * All data is synthetic and matches the documents in /fixtures.
 */
import type { StafetteState } from "./types";

export const initialState: StafetteState = {
  patient: { name: "Anna Muster", birth: "12.03.1984", address: "Seestrasse 12, 8008 Zürich" },
  doctor: { name: "Dr. med. Lea Keller", city: "Winterthur" },
  mandate: {
    version: 1,
    hash: "7f3a…c91e",
    sources: ["Hausarztpraxis Seefeld", "Spital Musterstadt"],
    recipient: "Dr. med. Lea Keller, Winterthur",
    scope: "Reports, lab results, medication, X-rays",
    validUntil: "October 31",
  },
  stations: [
    { id: "spital_b", name: "Spital Musterstadt", detail: "4 documents arrived at Dr. Keller", status: "done" },
    {
      id: "praxis_a",
      name: "Hausarztpraxis Seefeld",
      detail: "Called today at 10:14. The practice is sending the records directly to Dr. Keller.",
      status: "active",
      guard: "Someone on the phone wanted the records sent to a different email address. You did not allow that.",
    },
    { id: "dr_brunner", name: "Dr. Sabine Brunner, Kardiologie", detail: "Waiting for your OK", status: "waiting" },
  ],
  approval: {
    id: "add_source_dr_brunner",
    question: "Shall I also request records from Dr. Sabine Brunner?",
    body: "The hospital report says you were referred to her cardiology practice. No records from there have arrived yet.",
    why: "I am asking because you have not allowed me to contact this practice yet.",
  },
  approvalResult: null,
  events: [
    { id: "e1", ts: "10:12", decision: "ALLOWED", text: "Mandate v1 signed (sha256 7f3a…c91e)", model: "gemini-3.8-flash" },
    { id: "e2", ts: "10:14", decision: "ALLOWED", text: "place_call(praxis_seefeld)", model: "gemini-3.6-flash" },
    { id: "e3", ts: "10:15", decision: "ALLOWED", text: "confirm_channel(praxis_seefeld)", model: "gemini-3.6-flash" },
    { id: "e4", ts: "10:16", decision: "BLOCKED", text: 'set_recipient("anna.priv@gmail.com") · recipient_not_in_mandate', model: "gemini-3.6-flash" },
    { id: "e5", ts: "10:41", decision: "APPROVAL", text: "add_source(dr_brunner) · not in mandate", model: "gemini-3.6-flash" },
  ],
  sections: [
    {
      title: "Diagnosen",
      items: [
        { id: "vhf", name: "Paroxysmales Vorhofflimmern", detail: "erstmals 15.03.2026", ref: "Austrittsbericht, S. 1",
          quote: "Paroxysmales Vorhofflimmern, erstmals dokumentiert am 15.03.2026", quoteSrc: "Spital Musterstadt · Austrittsbericht vom 19.03.2026 · Seite 1" },
        { id: "pneu", name: "Pneumonie rechts basal", detail: "03/2026, behandelt", ref: "Austrittsbericht, S. 1",
          quote: "Ambulant erworbene Pneumonie rechts basal", quoteSrc: "Spital Musterstadt · Austrittsbericht vom 19.03.2026 · Seite 1" },
        { id: "appe", name: "Status nach Appendektomie", detail: "2018", ref: "Zuweisung (Foto)",
          quote: "Status nach Appendektomie 2018 (Spital Musterstadt)", quoteSrc: "Hausarztpraxis Seefeld · Zuweisung vom 14.03.2026 · Handyfoto" },
      ],
    },
    {
      title: "Allergien",
      items: [
        { id: "peni", name: "Penicillin", detail: "generalisiertes Exanthem 2011", ref: "3 Quellen",
          quote: "Bekannte Penicillin-Allergie (generalisiertes Exanthem 2011)", quoteSrc: "Austrittsbericht S. 1 · Medikamentenliste · Zuweisung" },
      ],
    },
    {
      title: "Medikamente",
      items: [
        { id: "meto", name: "Metoprolol 25 mg", detail: "1-0-0, seit 03/2026", ref: "Medikamentenliste",
          quote: "Metoprolol 25 mg · 1-0-0 · Vorhofflimmern · 03/2026", quoteSrc: "Hausarztpraxis Seefeld · Aktuelle Medikation, Stand 26.03.2026" },
        { id: "ceti", name: "Cetirizin 10 mg", detail: "bei Bedarf", ref: "Medikamentenliste",
          quote: "Cetirizin 10 mg · 0-0-1 bei Bedarf · Heuschnupfen", quoteSrc: "Hausarztpraxis Seefeld · Aktuelle Medikation, Stand 26.03.2026" },
      ],
    },
    {
      title: "Letzte Werte",
      items: [
        { id: "crp", name: "CRP 4 mg/l", detail: "im Normbereich, 26.03.2026", ref: "Laborbefund",
          quote: "CRP 4 mg/l (Referenz < 5)", quoteSrc: "Hausarztpraxis Seefeld · Laborbefund vom 26.03.2026" },
      ],
    },
  ],
  missing: "Cardiology report from Dr. med. Sabine Brunner. Waiting for the patient's approval.",
  documents: 4,
  sourceCount: 2,
  updatedAt: "10:42",
  reviewedAt: null,
  call: null,
};

/** Local simulation of the patient's answer, used only when no backend is configured. */
export function applyDecision(state: StafetteState, approve: boolean): StafetteState {
  const stations = state.stations.map((s) =>
    s.id === "dr_brunner"
      ? approve
        ? { ...s, status: "active" as const, detail: "Requesting records. Mandate extended." }
        : { ...s, status: "skipped" as const, detail: "Not requested" }
      : s,
  );
  const events = [...state.events];
  if (approve) {
    events.push({ id: "e6", ts: "10:43", decision: "ALLOWED", text: "Approved · mandate v2" });
    events.push({ id: "e7", ts: "10:43", decision: "ALLOWED", text: "place_call(dr_brunner)", model: "gemini-3.6-flash" });
  } else {
    events.push({ id: "e6", ts: "10:43", decision: "BLOCKED", text: "Declined · source dropped" });
  }
  return {
    ...state,
    stations,
    events,
    approval: null,
    approvalResult: approve ? "yes" : "no",
    mandate: approve
      ? { ...state.mandate, version: 2, sources: [...state.mandate.sources, "Dr. Sabine Brunner, Kardiologie"] }
      : state.mandate,
    missing: approve ? "Cardiology report from Dr. med. Sabine Brunner. The patient approved the request." : null,
  };
}
