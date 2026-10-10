/**
 * Shared types between the Stafette backend and the dashboard.
 *
 * The backend pushes the full `StafetteState` over Server-Sent Events
 * (GET /events, each message: `data: {"state": StafetteState}`).
 * The dashboard never computes policy decisions itself; it only renders them.
 */

export type Decision = "ALLOWED" | "BLOCKED" | "APPROVAL";

/** One entry in the technical protocol (shown to the jury, hidden from patients by default). */
export type StafetteEvent = {
  id: string;
  ts: string; // "10:14"
  decision: Decision;
  text: string; // e.g. 'set_recipient("anna.priv@gmail.com") · recipient_not_in_mandate'
  model?: string; // e.g. "gemini-3.6-flash"
};

export type StationStatus = "done" | "active" | "waiting" | "skipped";

/** One source of records (a practice, a hospital) on the patient's timeline. */
export type Station = {
  id: string;
  name: string;
  detail: string;
  status: StationStatus;
  /** Plain-language note when the agent refused something during a call. */
  guard?: string;
};

/** A question only the patient can answer (e.g. adding a source to the mandate). */
export type PendingApproval = {
  id: string;
  question: string;
  body: string;
  why: string;
};

export type Mandate = {
  version: number;
  hash: string;
  sources: string[];
  recipient: string;
  scope: string;
  validUntil: string;
};

/** One verified finding for the new doctor. Every finding carries its verbatim source quote. */
export type Finding = {
  id: string;
  name: string;
  detail: string;
  ref: string;
  quote: string;
  quoteSrc: string;
};

export type Section = {
  title: string;
  items: Finding[];
};

/** One line of the live call: what the agent said or what the practice said. */
export type CallLine = { who: "agent" | "practice"; text: string };

/** The call in progress, shown live in Anna's app. Never contains medical content. */
export type CallView = {
  sourceName: string;
  status: "ringing" | "connected" | "ended" | "failed";
  outcome?: string | null;
  lines: CallLine[];
  /** Played by the test-mode script (same tools and policy), no real phone call. */
  simulated?: boolean;
};

export type StafetteState = {
  patient: { name: string; birth: string; address: string };
  doctor: { name: string; city: string };
  mandate: Mandate;
  stations: Station[];
  approval: PendingApproval | null;
  approvalResult: "yes" | "no" | null;
  events: StafetteEvent[];
  sections: Section[];
  missing: string | null;
  documents: number;
  sourceCount: number;
  updatedAt: string;
  /** Time Dr. Keller confirmed the handover summary, e.g. "10:52"; null until then. */
  reviewedAt?: string | null;
  /** Live call, set by the backend while the agent is on the phone. */
  call?: CallView | null;
  /** Test mode on: calls are simulated instead of dialled. */
  simulateCalls?: boolean;
};
