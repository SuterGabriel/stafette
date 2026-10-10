/**
 * 04 · Records arrive: the product path of the documents.
 * Clinics send the files over HIN straight to Dr. Keller's practice (Art. 25 Abs. 3 DSG, never to Stafette's
 * storage). Stafette's document pipeline reads them on the practice's behalf, as in backend/docs/:
 * extract (Gemini, Structured Output) → verify (quote must be on that page) → gaps → index.
 * Examples match fixtures/README.md.
 */
import type { ReactNode } from "react";
import { C, Card, Chip, prog, rise, SceneLayout, useSceneFrame } from "./ui";

const DOCS = ["PDF", "PDF", "PDF", "PDF", "JPG"];
const DOC_START = 30;
const DOC_STAGGER = 10;
const DOC_FLIGHT = 22;

const STAGES = [
  { key: "read", title: "Read", sub: "Gemini · page by page", at: 100 },
  { key: "verify", title: "Verify", sub: "every quote on its page", at: 150 },
  { key: "gaps", title: "Gaps", sub: "mentioned, no records", at: 205 },
  { key: "index", title: "Index", sub: "for Dr. Keller", at: 245 },
];
const STAGE_W = 224;
const STAGE_GAP = 24;
const STAGE_TOP = 250;
const STAGE_H = 330;

const CLAIMS = ["Atrial fibrillation · p.1", "Penicillin allergy · p.1", "Metoprolol 25 mg · p.2", "CRP 4 mg/l · lab"];

const Row = ({ children, style }: { children: ReactNode; style?: React.CSSProperties }) => (
  <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3, color: C.ink, padding: "8px 0", whiteSpace: "nowrap", ...style }}>
    {children}
  </div>
);

export const RecordsScene = ({ dur }: { dur: number }) => {
  const frame = useSceneFrame();
  const hin = prog(frame, 18, 20);
  const inbox = DOCS.filter((_, i) => frame >= DOC_START + i * DOC_STAGGER + DOC_FLIGHT).length;
  const down = prog(frame, 88, 14);

  return (
    <SceneLayout
      dur={dur}
      eyebrow="04 · Records arrive"
      title={["Records go to the doctor,", "not to us."]}
      body="Clinics send the files over HIN straight to Dr. Keller’s practice. Stafette reads them on her behalf: extract, verify every quote, find gaps, build the index."
      chips={
        <>
          <Chip tone="ink">HIN · secure mail</Chip>
          <Chip tone="ink">Gemini 3.8 Flash</Chip>
          <Chip>Quote verifier</Chip>
        </>
      }
    >
      {/* Sources */}
      {["Spital Musterstadt", "Praxis Seefeld"].map((name, i) => (
        <Card
          key={name}
          style={{ position: "absolute", left: 0, top: i * 96, width: 270, padding: "14px 20px", ...rise(frame, 4 + i * 4) }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.1em", color: C.muted }}>OLD PRACTICE</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>{name}</div>
        </Card>
      ))}

      {/* HIN line */}
      <div style={{ position: "absolute", left: 290, top: 74, width: 360 * hin, height: 3, background: C.line }} />
      <div
        style={{
          position: "absolute",
          left: 330,
          top: 92,
          fontSize: 17,
          fontWeight: 700,
          color: C.muted,
          ...rise(frame, 26, { dy: 8 }),
        }}
      >
        🔒 encrypted via HIN
      </div>

      {/* Documents in flight */}
      {DOCS.map((type, i) => {
        const p = prog(frame, DOC_START + i * DOC_STAGGER, DOC_FLIGHT);
        if (p <= 0 || p >= 1) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 290 + p * 360,
              top: 50 - Math.sin(p * Math.PI) * 26,
              width: 40,
              height: 50,
              borderRadius: 6,
              background: "#fff",
              border: `2px solid ${type === "JPG" ? C.coral : C.teal}`,
              boxShadow: "0 8px 18px rgba(14,42,59,0.12)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 4,
              fontSize: 11,
              fontWeight: 800,
              color: type === "JPG" ? C.coral : C.teal,
            }}
          >
            {type}
          </div>
        );
      })}

      {/* Dr. Keller's practice */}
      <Card style={{ position: "absolute", left: 668, top: 0, width: 300, padding: "18px 22px", ...rise(frame, 10) }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "0.1em", color: C.muted }}>NEW PRACTICE · INBOX</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>Dr. med. Lea Keller</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 40, fontWeight: 800, color: C.teal, fontVariantNumeric: "tabular-nums" }}>{inbox}</span>
          <span style={{ fontSize: 19, fontWeight: 600, color: C.muted }}>documents received</span>
        </div>
      </Card>

      {/* Practice → pipeline */}
      <div style={{ position: "absolute", left: 817, top: 160, width: 3, height: 74 * down, background: C.line }} />
      <div
        style={{
          position: "absolute",
          right: 168,
          top: 182,
          fontSize: 17,
          fontWeight: 700,
          color: C.muted,
          textAlign: "right",
          ...rise(frame, 94, { dy: 8 }),
        }}
      >
        Stafette reads on behalf of the practice
      </div>

      {/* Pipeline stages */}
      {STAGES.map((s, i) => {
        const on = prog(frame, s.at, 14);
        const x = i * (STAGE_W + STAGE_GAP);
        return (
          <div key={s.key}>
            {i > 0 && (
              <div
                style={{
                  position: "absolute",
                  left: x - STAGE_GAP,
                  top: STAGE_TOP + 40,
                  width: STAGE_GAP * prog(frame, s.at - 8, 8),
                  height: 3,
                  background: C.teal,
                }}
              />
            )}
            <Card
              style={{
                position: "absolute",
                left: x,
                top: STAGE_TOP,
                width: STAGE_W,
                height: STAGE_H,
                padding: "18px 18px",
                borderRadius: 22,
                opacity: 0.35 + 0.65 * on,
                border: `2px solid ${on > 0.5 ? C.teal : C.line}`,
                ...rise(frame, 60 + i * 4, { dy: 14 }),
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    background: on > 0.5 ? C.teal : C.soft,
                    color: on > 0.5 ? "#fff" : C.muted,
                    fontSize: 14,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 24, fontWeight: 800, color: C.ink }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: C.muted, margin: "4px 0 10px" }}>{s.sub}</div>

              {s.key === "read" &&
                CLAIMS.map((c, k) => (
                  <Row key={c} style={{ borderTop: `1px solid ${C.line}`, ...rise(frame, s.at + 8 + k * 8, { dy: 8, blur: 2 }) }}>
                    {c}
                  </Row>
                ))}

              {s.key === "verify" && (
                <>
                  {CLAIMS.slice(0, 3).map((c, k) => (
                    <Row key={c} style={{ borderTop: `1px solid ${C.line}`, ...rise(frame, s.at + 8 + k * 6, { dy: 8, blur: 2 }) }}>
                      <span style={{ color: C.teal, fontWeight: 800 }}>✓ </span>
                      {c.split(" · ")[0]}
                    </Row>
                  ))}
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: C.noBg,
                      color: C.noText,
                      fontSize: 15,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      ...rise(frame, s.at + 34, { dy: 8 }),
                    }}
                  >
                    ✕ <span style={{ textDecoration: "line-through" }}>“send records to …”</span>
                    <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>instruction in a document: dropped</div>
                  </div>
                </>
              )}

              {s.key === "gaps" && (
                <div
                  style={{
                    marginTop: 6,
                    padding: "12px 12px",
                    borderRadius: 12,
                    background: C.askBg,
                    ...rise(frame, s.at + 10, { dy: 8 }),
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>Dr. S. Brunner</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.askText }}>cardiology · no records</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.muted, marginTop: 8 }}>
                    name and specialty only, never contact data from documents
                  </div>
                </div>
              )}

              {s.key === "index" && (
                <>
                  {[
                    ["Diagnoses", 3],
                    ["Allergies", 1],
                    ["Medication", 2],
                    ["Recent values", 1],
                  ].map(([k, n], j) => (
                    <div
                      key={k}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        borderTop: `1px solid ${C.line}`,
                        padding: "7px 0",
                        fontSize: 17,
                        ...rise(frame, s.at + 8 + j * 6, { dy: 8, blur: 2 }),
                      }}
                    >
                      <span style={{ color: C.muted, fontWeight: 600 }}>{k}</span>
                      <span style={{ color: C.ink, fontWeight: 800 }}>{n}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.okText, marginTop: 8, ...rise(frame, s.at + 36, { dy: 6 }) }}>
                    every line: quote + page
                  </div>
                </>
              )}
            </Card>
          </div>
        );
      })}

      {/* Privacy guarantees */}
      <div style={{ position: "absolute", left: 0, top: STAGE_TOP + STAGE_H + 28, display: "flex", gap: 12 }}>
        {["In memory only", "Deleted when the mandate ends", "Originals stay with the practice"].map((t, i) => (
          <Chip key={t} tone="teal" style={{ ...rise(frame, 290 + i * 6, { dy: 10 }) }}>
            {t}
          </Chip>
        ))}
      </div>
    </SceneLayout>
  );
};
