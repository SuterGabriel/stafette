"use client";
/**
 * What the new doctor receives: an administrative handover index.
 * Every line carries its source; clicking shows the verbatim quote.
 * Deliberately no assessment or recommendation (keeps it out of medical-device territory).
 * New lines blur in as documents arrive, so the sheet visibly fills during the demo.
 */
import { useState } from "react";
import type { StafetteState } from "@/lib/types";
import { Logo } from "./Logo";
import { CheckIcon, ClockIcon } from "./Icons";
import { BlurFade } from "./ui/blur-fade";
import { NumberTicker } from "./ui/number-ticker";

export function KellerSheet({ state, alwaysShowQuotes = false }: { state: StafetteState; alwaysShowQuotes?: boolean }) {
  const [openId, setOpenId] = useState<string | null>("vhf");
  // Local only for now; the backend can deliver it later via state.reviewedAt.
  const [reviewedAt, setReviewedAt] = useState<string | null>(state.reviewedAt ?? null);

  return (
    <div className="keller">
      <div className="keller-meta">
        <span className="keller-via">
          <Logo size={20} withText={false} />
          Übergabe via <b>stafette</b> · im Auftrag der Patientin
        </span>
        <span>Eingang 10.10.2026 · HIN</span>
      </div>

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
            <div>{state.mandate.sources.slice(0, state.sourceCount).join(" · ")}</div>
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
                        <span className="muted"> · {it.detail}</span>
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
            <button className="btn btn--ink btn--auto" onClick={() => setReviewedAt("10:52")}>
              Übersicht geprüft
            </button>
          )}
        </div>

        <footer className="sheet-foot">
          <span>Jede Angabe stammt wörtlich aus den Originaldokumenten. Keine Bewertung, keine Empfehlung.</span>
          <a href="#">Originaldokumente öffnen</a>
        </footer>
      </article>
    </div>
  );
}
