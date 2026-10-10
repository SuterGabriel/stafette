"use client";
/**
 * Connects the dashboard to the Stafette backend.
 *
 * - With NEXT_PUBLIC_API_URL set: loads GET /state, then listens to GET /events (SSE).
 *   Each SSE message is `{"state": StafetteState}`. Answers go to POST /approvals/:id.
 * - Without it: runs fully on mock data, so the frontend can be built and demoed alone.
 * - With it but the backend unreachable: falls back to mock data (`offline`) so the demo
 *   stays clickable, and switches back to live as soon as the event stream connects.
 */
import { useCallback, useEffect, useState } from "react";
import { applyDecision, initialState } from "./mock";
import type { StafetteState } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL;

export function useStafette() {
  const [state, setState] = useState<StafetteState>(initialState);
  const [connected, setConnected] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!API) return;
    let es: EventSource | null = null;

    const loadState = () =>
      fetch(`${API}/state`)
        .then((r) => r.json())
        .then((s: StafetteState) => {
          setState(s);
          setOffline(false);
        })
        .catch(() => setOffline(true));

    loadState();
    es = new EventSource(`${API}/events`);
    es.onopen = () => {
      setConnected(true);
      loadState();
    };
    es.onerror = () => setConnected(false);
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.state) setState(data.state as StafetteState);
      } catch {
        /* ignore malformed messages */
      }
    };
    return () => es?.close();
  }, []);

  const decide = useCallback(
    async (approve: boolean) => {
      const approvalId = state.approval?.id;
      if (!approvalId) return;
      if (API && !offline) {
        await fetch(`${API}/approvals/${approvalId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approve }),
        });
      } else {
        setState((s) => applyDecision(s, approve));
      }
    },
    [state.approval?.id, offline],
  );

  const reset = useCallback(async () => {
    if (API && !offline) {
      await fetch(`${API}/reset`, { method: "POST" }).catch(() => {});
    } else {
      setState(initialState);
    }
  }, [offline]);

  /** Anna signed: the agent starts calling (live). Offline the mock story is already "running". */
  const start = useCallback(async () => {
    if (API && !offline) {
      await fetch(`${API}/agent/start`, { method: "POST" }).catch(() => {});
    }
  }, [offline]);

  /** Records arrived at Dr. Keller: the backend reads them and fills the sheet. */
  const ingest = useCallback(async () => {
    if (API && !offline) {
      await fetch(`${API}/agent/ingest`, { method: "POST" }).catch(() => {});
    }
  }, [offline]);

  return { state, decide, reset, start, ingest, live: Boolean(API), connected, offline };
}
