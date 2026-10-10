"use client";
/**
 * What the new doctor receives, on her phone: an administrative handover index.
 * Every line carries its source; clicking shows the verbatim quote.
 * Deliberately no assessment or recommendation (keeps it out of medical-device territory).
 * Starts empty in the live demo; "Akten eingegangen" lets the backend read the records,
 * and new lines blur in as the sheet fills.
 */
import { useState } from "react";
import type { StafetteState } from "@/lib/types";
import { Logo } from "./Logo";
import { CheckIcon, ClockIcon } from "./Icons";
import { BlurFade } from "./ui/blur-fade";
import { NumberTicker } from "./ui/number-ticker";

// The pipeline writes German labels (the documents are German). The UI is English;
// the verbatim quotes stay in the original language on purpose.
const SECTION_TITLES: Record<string, string> = {
  Diagnosen: "Diagnoses",
  Allergien: "Allergies",
  Medikamente: "Medications",
  "Letzte Werte": "Latest values",
};

const DOC_WORDS: [RegExp, string][] = [
  [/\bAustrittsbericht\b/g, "Discharge report"],
  [/\bMedikamentenliste\b/g, "Medication list"],
  [/\bAktuelle Medikation\b/g, "Current medication"],
  [/\bLaborbefund\b/g, "Lab report"],
  [/\bRöntgenbefund\b/g, "X-ray report"],
  [/\bZuweisung\b/g, "Referral"],
  [/\bHandyfoto\b/g, "phone photo"],
  [/\(Foto\)/g, "(photo)"],
  [/\bSeite (\d+)/g, "page $1"],
  [/\bS\. (\d+)/g, "p. $1"],
  [/(\d+) Quellen\b/g, "$1 sources"],
  [/\bvom (\d)/g, "of $1"],
  [/\bStand (\d)/g, "as of $1"],
];

function sectionTitle(title: string) {
  return SECTION_TITLES[title] ?? title;
}

function docLabel(text: string) {
  return DOC_WORDS.reduce((t, [pattern, english]) => t.replace(pattern, english), text);
}

type Props = {
  state: StafetteState;
  alwaysShowQuotes?: boolean;
  /** Demo trigger: the practices' records arrive and are read (live backend). */
  onIngest?: () => Promise<void> | void;
};

export function KellerSheet({ state, alwaysShowQuotes = false, onIngest }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [reviewedAt, setReviewedAt] = useState<string | null>(state.reviewedAt ?? null);
  const [reading, setReading] = useState(false);
  const empty = state.sections.length === 0;

  const ingest = async () => {
    if (!onIngest) return;
    setReading(true);
    try {
      await onIngest();
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="phone phone--doc">
      <header className="phone-head">
        <span className="keller-via">
          <Logo size={20} withText={false} />
          <b>Dr. Keller&apos;s practice</b>
        </span>
        <span className="small muted">HIN inbox</span>
      </header>

      <div className="phone-body phone-body--scroll keller">
        <div className="keller-meta">Handover via stafette · on behalf of the patient</div>

        {empty ? (
          <BlurFade className="keller-empty">
            <h1 className="h1 h1--xs">{state.patient.name}</h1>
            <p className="muted small">born {state.patient.birth}</p>
            <div className="empty-box">
              <ClockIcon />
              <div>
                <strong>No records received yet</strong>
                <span>As soon as the practices send them, the index with sources appears here.</span>
              </div>
            </div>
            {onIngest && (
              <button className="btn btn--ink" onClick={ingest} disabled={reading}>
                {reading ? "Reading records …" : "Records received"}
              </button>
            )}
          </BlurFade>
        ) : (
          <article className="sheet">
            <header className="sheet-head">
              <div>
                <h1>{state.patient.name}</h1>
                <div className="muted small">
                  born {state.patient.birth} · {state.patient.address}
                </div>
              </div>
              <div className="sheet-src">
                <div>
                  <b>
                    <NumberTicker value={state.documents} /> documents
                  </b>{" "}
                  from {state.sourceCount} sources
                </div>
              </div>
            </header>

            {state.sections.map((sec) => (
              <section key={sec.title} className="sheet-sec">
                <h2>{sectionTitle(sec.title)}</h2>
                <div className="sheet-items">
                  {sec.items.map((it, i) => {
                    const open = alwaysShowQuotes || openId === it.id;
                    return (
                      <BlurFade key={it.id} delay={i * 0.06} inView>
                        <button
                          className="finding"
                          aria-expanded={open}
                          onClick={() => setOpenId(openId === it.id ? null : it.id)}
                        >
                          <span>
                            <b>{it.name}</b>
                            {it.detail && <span className="muted"> · {it.detail}</span>}
                          </span>
                          <span className="ref">{docLabel(it.ref)}</span>
                        </button>
                        {open && (
                          <BlurFade offset={4} blur="4px" duration={0.3}>
                            <blockquote className="quote">
                              <p>„{it.quote}“</p>
                              <cite>{docLabel(it.quoteSrc)}</cite>
                            </blockquote>
                          </BlurFade>
                        )}
                      </BlurFade>
                    );
                  })}
                </div>
              </section>
            ))}

            {state.missing && (
              <p className="missing">
                <ClockIcon />
                <span>
                  <b>Still missing:</b> {state.missing}
                </span>
              </p>
            )}

            <div className="sheet-review">
              {reviewedAt ? (
                <BlurFade>
                  <div className="confirm" role="status">
                    <CheckIcon /> Reviewed by Dr. Keller · {reviewedAt}
                  </div>
                </BlurFade>
              ) : (
                <button
                  className="btn btn--ink"
                  onClick={() =>
                    setReviewedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }))
                  }
                >
                  Summary reviewed
                </button>
              )}
            </div>

            <footer className="sheet-foot">
              <span>Every entry is quoted verbatim from the original documents. No assessment, no recommendation.</span>
            </footer>
          </article>
        )}
      </div>
    </div>
  );
}
