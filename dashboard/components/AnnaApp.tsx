"use client";
/**
 * The patient's app (Anna). Three screens:
 *   1. Start: say or type the goal
 *   2. Mandate: plain-language summary of what the agent may do, then sign
 *   3. Progress: timeline of sources, the one open question, optional protocol
 * Screens 1–2 are local UI state; screen 3 renders the live StafetteState.
 */
import { useState } from "react";
import type { StafetteState, Station } from "@/lib/types";
import { Logo } from "./Logo";
import { CheckIcon, MicIcon, ShieldIcon } from "./Icons";

type Screen = "start" | "heard" | "mandate" | "progress";

type Props = {
  state: StafetteState;
  onDecide: (approve: boolean) => void;
  onReset: () => void;
};

export function AnnaApp({ state, onDecide, onReset }: Props) {
  const [screen, setScreen] = useState<Screen>("start");
  const [showLog, setShowLog] = useState(false);

  const restart = () => {
    setScreen("start");
    setShowLog(false);
    onReset();
  };

  return (
    <div className="phone">
      <header className="phone-head">
        <Logo />
        {screen !== "progress" && (
          <div className="steps" aria-label={screen === "mandate" ? "Schritt 2 von 2" : "Schritt 1 von 2"}>
            <span className="on" />
            <span className={screen === "mandate" ? "on" : ""} />
          </div>
        )}
      </header>

      {screen === "start" && (
        <>
          <div className="phone-body phone-body--start">
            <h1 className="h1">Neue Hausärztin? Ich hole Ihre Unterlagen.</h1>
            <p className="muted">Sagen Sie mir, zu wem Sie wechseln und wo Sie bisher in Behandlung waren.</p>
          </div>
          <footer className="phone-foot">
            <button className="btn btn--accent" onClick={() => setScreen("heard")}>
              <MicIcon /> Sprechen
            </button>
            <button className="btn btn--soft" onClick={() => setScreen("heard")}>
              Schreiben
            </button>
          </footer>
        </>
      )}

      {screen === "heard" && (
        <>
          <div className="phone-body">
            <div className="eyebrow">Sie haben gesagt</div>
            <p className="said">
              „Ich wechsle zu Dr. Keller in Winterthur. Ich war bei der Hausarztpraxis Seefeld und letztes Jahr im Spital
              Musterstadt.“
            </p>
            <div className="eyebrow">Ich habe verstanden</div>
            <dl className="rows">
              <div className="row">
                <dt>Neue Hausärztin</dt>
                <dd>{state.doctor.name}</dd>
              </div>
              <div className="row">
                <dt>Bisher bei</dt>
                <dd>
                  {state.mandate.sources.map((s) => (
                    <div key={s}>{s}</div>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
          <footer className="phone-foot">
            <button className="btn btn--ink" onClick={() => setScreen("mandate")}>
              Stimmt, weiter
            </button>
            <button className="btn btn--ghost" onClick={() => setScreen("start")}>
              Nochmals sagen
            </button>
          </footer>
        </>
      )}

      {screen === "mandate" && (
        <>
          <div className="phone-body">
            <h1 className="h1 h1--sm">Das darf ich für Sie tun</h1>
            <p className="muted">Nicht mehr und nicht weniger. Alles andere frage ich Sie zuerst.</p>
            <dl className="list">
              <div>
                <dt>Anfragen bei</dt>
                <dd>
                  {state.mandate.sources.map((s) => (
                    <div key={s}>{s}</div>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Senden nur an</dt>
                <dd>{state.mandate.recipient}</dd>
              </div>
              <div>
                <dt>Welche Unterlagen</dt>
                <dd>{state.mandate.scope}</dd>
              </div>
              <div className="split">
                <div>
                  <dt>Gültig bis</dt>
                  <dd>{state.mandate.validUntil}</dd>
                </div>
                <div className="right">
                  <dt>Danach</dt>
                  <dd>alles gelöscht</dd>
                </div>
              </div>
            </dl>
            <p className="note">
              Die Praxen bekommen diese Vollmacht als PDF mit Ihrer Unterschrift. Die Unterlagen gehen direkt an Dr.
              Keller, nicht an uns.
            </p>
          </div>
          <footer className="phone-foot">
            <button className="btn btn--ink" onClick={() => setScreen("progress")}>
              Unterschreiben und starten
            </button>
            <button className="btn btn--ghost" onClick={() => setScreen("heard")}>
              Zurück
            </button>
          </footer>
        </>
      )}

      {screen === "progress" && (
        <div className="phone-body phone-body--scroll">
          <h1 className="h1 h1--xs">Ihre Unterlagen für Dr. Keller</h1>
          <p className="muted small">
            {doneLabel(state.stations)} · aktualisiert {state.updatedAt}
          </p>

          {state.approval && (
            <section className="ask" aria-live="polite">
              <h2>{state.approval.question}</h2>
              <p>{state.approval.body}</p>
              <p className="why">{state.approval.why}</p>
              <div className="ask-btns">
                <button className="btn btn--accent btn--sm" onClick={() => onDecide(true)}>
                  Ja, anfragen
                </button>
                <button className="btn btn--outline-light btn--sm" onClick={() => onDecide(false)}>
                  Nein
                </button>
              </div>
            </section>
          )}

          {state.approvalResult === "yes" && (
            <div className="confirm">
              <CheckIcon /> Dr. Brunner wird angefragt.
            </div>
          )}

          <ol className="timeline">
            {state.stations.map((s, i) => (
              <li key={s.id} className={`stop stop--${s.status}`}>
                <div className="stop-rail">
                  <span className="dot">{s.status === "done" && <CheckIcon size={12} />}</span>
                  {i < state.stations.length - 1 && <span className="line" />}
                </div>
                <div className="stop-body">
                  <div className="stop-name">{s.name}</div>
                  <div className="stop-detail">{s.detail}</div>
                  {s.guard && (
                    <div className="guard">
                      <ShieldIcon />
                      <div>
                        <strong>Bitte abgelehnt</strong>
                        <span>{s.guard}</span>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>

          <p className="rules">
            Ich darf nur diese Stellen kontaktieren und nur an Dr. Keller senden, bis {state.mandate.validUntil}. Danach
            lösche ich alles.
          </p>

          <div className="phone-links">
            <button className="link" onClick={() => setShowLog((v) => !v)}>
              {showLog ? "Protokoll ausblenden" : "Protokoll anzeigen"}
            </button>
            <button className="link link--muted" onClick={restart}>
              Demo neu starten
            </button>
          </div>

          {showLog && (
            <div className="log" role="log">
              {state.events.map((e) => (
                <div key={e.id} className="log-row">
                  <span className="log-ts">{e.ts}</span>
                  <span className={`log-tag log-tag--${e.decision.toLowerCase()}`}>{e.decision}</span>
                  <span>
                    {e.text}
                    {e.model && <span className="log-model"> · {e.model}</span>}
                  </span>
                </div>
              ))}
              <div className="log-foot">Vollmacht v{state.mandate.version} · sha256 {state.mandate.hash}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function doneLabel(stations: Station[]) {
  const relevant = stations.filter((s) => s.status !== "skipped");
  const done = relevant.filter((s) => s.status === "done").length;
  return `${done} von ${relevant.length} Stellen erledigt`;
}
