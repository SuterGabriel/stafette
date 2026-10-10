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
          <b>Praxis Dr. Keller</b>
        </span>
        <span className="small muted">HIN-Eingang</span>
      </header>

      <div className="phone-body phone-body--scroll keller">
        <div className="keller-meta">Übergabe via stafette · im Auftrag der Patientin</div>

        {empty ? (
          <BlurFade className="keller-empty">
            <h1 className="h1 h1--xs">{state.patient.name}</h1>
            <p className="muted small">geb. {state.patient.birth}</p>
            <div className="empty-box">
              <ClockIcon />
              <div>
                <strong>Noch keine Unterlagen eingegangen</strong>
                <span>Sobald die Praxen senden, erscheint hier das Inhaltsverzeichnis mit Fundstellen.</span>
              </div>
            </div>
            {onIngest && (
              <button className="btn btn--ink" onClick={ingest} disabled={reading}>
                {reading ? "Unterlagen werden gelesen …" : "Akten eingegangen"}
              </button>
            )}
          </BlurFade>
        ) : (
          <article className="sheet">
            <header className="sheet-head">
              <div>
                <h1>{state.patient.name}</h1>
                <div className="muted small">
                  geb. {state.patient.birth} · {state.patient.address}
                </div>
              </div>
              <div className="sheet-src">
                <div>
                  <b>
                    <NumberTicker value={state.documents} /> Dokumente
                  </b>{" "}
                  aus {state.sourceCount} Quellen
                </div>
              </div>
            </header>

            {state.sections.map((sec) => (
              <section key={sec.title} className="sheet-sec">
                <h2>{sec.title}</h2>
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
                          <span className="ref">{it.ref}</span>
                        </button>
                        {open && (
                          <BlurFade offset={4} blur="4px" duration={0.3}>
                            <blockquote className="quote">
                              <p>„{it.quote}“</p>
                              <cite>{it.quoteSrc}</cite>
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
                  <b>Noch ausstehend:</b> {state.missing}
                </span>
              </p>
            )}

            <div className="sheet-review">
              {reviewedAt ? (
                <BlurFade>
                  <div className="confirm" role="status">
                    <CheckIcon /> Von Dr. Keller geprüft · {reviewedAt}
                  </div>
                </BlurFade>
              ) : (
                <button
                  className="btn btn--ink"
                  onClick={() =>
                    setReviewedAt(new Date().toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }))
                  }
                >
                  Übersicht geprüft
                </button>
              )}
            </div>

            <footer className="sheet-foot">
              <span>Jede Angabe stammt wörtlich aus den Originaldokumenten. Keine Bewertung, keine Empfehlung.</span>
            </footer>
          </article>
        )}
      </div>
    </div>
  );
}
