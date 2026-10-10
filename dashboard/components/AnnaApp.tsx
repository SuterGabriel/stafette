"use client";
/**
 * The patient's app (Anna). Three screens:
 *   1. Start: say or type the goal
 *   2. Mandate: plain-language summary of what the agent may do, then sign
 *   3. Progress: timeline of sources, the one open question, optional protocol
 * Screens 1–2 are local UI state; screen 3 renders the live StafetteState.
 * Motion via Magic UI (components/ui): screens and new stations blur in,
 * the approval card carries a border beam so the agent's question stands out.
 */
import { useState } from "react";
import { useReducedMotion } from "motion/react";
import type { CallView, StafetteState, Station } from "@/lib/types";
import { Logo } from "./Logo";
import { CheckIcon, MicIcon, ShieldIcon } from "./Icons";
import { BlurFade } from "./ui/blur-fade";
import { BorderBeam } from "./ui/border-beam";
import { NumberTicker } from "./ui/number-ticker";
import { PulsatingButton } from "./ui/pulsating-button";
import { TypingAnimation } from "./ui/typing-animation";

type Screen = "start" | "heard" | "mandate" | "progress";

type Props = {
  state: StafetteState;
  onDecide: (approve: boolean) => void;
  onReset: () => void;
  /** Anna signed the mandate: the agent starts working (live: first call). */
  onStart?: () => void;
};

export function AnnaApp({ state, onDecide, onReset, onStart }: Props) {
  const [screen, setScreen] = useState<Screen>("start");
  const [showLog, setShowLog] = useState(true);
  const reduceMotion = useReducedMotion();
  const progress = countDone(state.stations);

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
          <div className="steps" aria-label={screen === "mandate" ? "Step 2 of 2" : "Step 1 of 2"}>
            <span className="on" />
            <span className={screen === "mandate" ? "on" : ""} />
          </div>
        )}
      </header>

      {screen === "start" && (
        <BlurFade key="start" className="screen">
          <div className="phone-body phone-body--start">
            <h1 className="h1">New family doctor? I&apos;ll collect your records.</h1>
            <p className="muted">Tell me who you are switching to and where you have been treated so far.</p>
          </div>
          <footer className="phone-foot">
            <PulsatingButton
              className="btn btn--accent"
              pulseColor="rgb(11 117 119 / 0.35)"
              distance="6px"
              duration="2s"
              onClick={() => setScreen("heard")}
            >
              <span className="btn-label">
                <MicIcon /> Speak
              </span>
            </PulsatingButton>
            <button className="btn btn--soft" onClick={() => setScreen("heard")}>
              Type
            </button>
          </footer>
        </BlurFade>
      )}

      {screen === "heard" && (
        <BlurFade key="heard" className="screen">
          <div className="phone-body">
            <div className="eyebrow">You said</div>
            <p className="said">
              <TypingAnimation duration={22} cursorStyle="line" className="leading-[inherit] tracking-normal">
                “I&apos;m switching to Dr. Keller in Winterthur. I was with Hausarztpraxis Seefeld and last year at
                Spital Musterstadt.”
              </TypingAnimation>
            </p>
            <div className="eyebrow">I understood</div>
            <dl className="rows">
              <div className="row">
                <dt>New family doctor</dt>
                <dd>{state.doctor.name}</dd>
              </div>
              <div className="row">
                <dt>Treated at</dt>
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
              Correct, continue
            </button>
            <button className="btn btn--ghost" onClick={() => setScreen("start")}>
              Say it again
            </button>
          </footer>
        </BlurFade>
      )}

      {screen === "mandate" && (
        <BlurFade key="mandate" className="screen">
          <div className="phone-body">
            <h1 className="h1 h1--sm">What I may do for you</h1>
            <p className="muted">No more, no less. For anything else I ask you first.</p>
            <dl className="list">
              <div>
                <dt>Request from</dt>
                <dd>
                  {state.mandate.sources.map((s) => (
                    <div key={s}>{s}</div>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Send only to</dt>
                <dd>{state.mandate.recipient}</dd>
              </div>
              <div>
                <dt>Which records</dt>
                <dd>{state.mandate.scope}</dd>
              </div>
              <div className="split">
                <div>
                  <dt>Valid until</dt>
                  <dd>{state.mandate.validUntil}</dd>
                </div>
                <div className="right">
                  <dt>Afterwards</dt>
                  <dd>everything deleted</dd>
                </div>
              </div>
            </dl>
            <p className="note">
              The practices receive this mandate as a PDF with your signature. The records go directly to Dr. Keller,
              not to us.
            </p>
          </div>
          <footer className="phone-foot">
            <button
              className="btn btn--ink"
              onClick={() => {
                onStart?.();
                setScreen("progress");
              }}
            >
              Sign and start
            </button>
            <button className="btn btn--ghost" onClick={() => setScreen("heard")}>
              Back
            </button>
          </footer>
        </BlurFade>
      )}

      {screen === "progress" && (
        <BlurFade key="progress" className="phone-body phone-body--scroll">
          <h1 className="h1 h1--xs">Your records for Dr. Keller</h1>
          <p className="muted small">
            <NumberTicker value={progress.done} /> von {progress.total}{" "}
            places done · updated {state.updatedAt}
          </p>

          {state.approval && (
            <BlurFade key={state.approval.id}>
              <section className="ask" aria-live="polite">
                {!reduceMotion && (
                  <BorderBeam size={120} duration={5} borderWidth={2} colorFrom="#ff7a59" colorTo="#7fd3c9" />
                )}
                <h2>{state.approval.question}</h2>
                <p>{state.approval.body}</p>
                <p className="why">{state.approval.why}</p>
                <div className="ask-btns">
                  <button className="btn btn--accent btn--sm" onClick={() => onDecide(true)}>
                    Yes, request
                  </button>
                  <button className="btn btn--outline-light btn--sm" onClick={() => onDecide(false)}>
                    No
                  </button>
                </div>
              </section>
            </BlurFade>
          )}

          {state.approvalResult === "yes" && (
            <BlurFade className="confirm">
              <CheckIcon /> Mandate extended. I&apos;m requesting the records.
            </BlurFade>
          )}

          {state.call && <CallCard call={state.call} />}

          <ol className="timeline">
            {state.stations.map((s, i) => (
              <li key={s.id}>
                <BlurFade delay={i * 0.08} className={`stop stop--${s.status}`}>
                  <div className="stop-rail">
                    <span className="dot">{s.status === "done" && <CheckIcon size={12} />}</span>
                    {i < state.stations.length - 1 && <span className="line" />}
                  </div>
                  <div className="stop-body">
                    <div className="stop-name">{s.name}</div>
                    <div className="stop-detail">{s.detail}</div>
                    {s.guard && (
                      <BlurFade className="guard">
                        <ShieldIcon />
                        <div>
                          <strong>Request refused</strong>
                          <span>{s.guard}</span>
                        </div>
                      </BlurFade>
                    )}
                  </div>
                </BlurFade>
              </li>
            ))}
          </ol>

          <p className="rules">
            I may only contact these places and only send to Dr. Keller, until {state.mandate.validUntil}. Then I delete
            everything.
          </p>

          <div className="phone-links">
            <button className="link" onClick={() => setShowLog((v) => !v)}>
              {showLog ? "Hide protocol" : "Show protocol"}
            </button>
            <button className="link link--muted" onClick={restart}>
              Restart demo
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
              <div className="log-foot">Mandate v{state.mandate.version} · sha256 {state.mandate.hash}</div>
            </div>
          )}
        </BlurFade>
      )}
    </div>
  );
}

const CALL_STATUS: Record<CallView["status"], string> = {
  ringing: "Ringing …",
  connected: "In call",
  ended: "Call ended",
  failed: "Call failed",
};

const CALL_OUTCOME: Record<string, string> = {
  requested: "the practice is sending the records",
  needs_consent: "the practice is waiting for the mandate",
  closed: "nobody reached",
  refused: "the practice refuses",
  callback: "call back agreed",
};

/** The agent's phone call, live: status plus the last lines of the conversation. */
function CallCard({ call }: { call: CallView }) {
  const live = call.status === "ringing" || call.status === "connected";
  const outcome = call.status === "ended" && call.outcome ? ` · ${CALL_OUTCOME[call.outcome] ?? call.outcome}` : "";
  return (
    <BlurFade className={`call call--${call.status}`}>
      <div className="call-head" aria-live="polite">
        <span className={`call-dot ${live ? "call-dot--live" : ""}`} />
        <div>
          <div className="call-title">
            {live ? "On the phone with" : "Call with"} {call.sourceName}
          </div>
          <div className="call-status">
            {CALL_STATUS[call.status]}
            {outcome}
            {call.simulated && " · test mode"}
          </div>
        </div>
      </div>
      {call.lines.length > 0 && (
        <div className="call-lines">
          {call.lines.slice(-6).map((line, i) => (
            <p key={`${i}-${line.text.slice(0, 12)}`} className={`call-line call-line--${line.who}`}>
              <span>{line.who === "agent" ? "AI" : "Practice"}</span>
              {line.text}
            </p>
          ))}
        </div>
      )}
    </BlurFade>
  );
}

function countDone(stations: Station[]) {
  const relevant = stations.filter((s) => s.status !== "skipped");
  return { done: relevant.filter((s) => s.status === "done").length, total: relevant.length };
}
