"use client";
/**
 * Connects the dashboard to the Stafette backend.
 *
 * - With NEXT_PUBLIC_API_URL set: loads GET /state, then listens to GET /events (SSE).
 *   Each SSE message is `{"state": StafetteState}`. Answers go to POST /approvals/:id.
 * - Without it: runs fully on mock data, so the frontend can be built and demoed alone.
 * - With it but the backend unreachable: falls back to mock data (`offline`) so the demo
 *   stays clickable, and switches back to live as soon as the event stream connects.
 *
 * The event stream is read with fetch instead of EventSource, because EventSource cannot
 * send headers: every request carries `ngrok-skip-browser-warning`, otherwise ngrok's free
 * domain answers a hosted dashboard (Vercel) with its HTML warning page.
 */
import { useCallback, useEffect, useState } from "react";
import { applyDecision, initialState } from "./mock";
import type { StafetteState } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL;
const HEADERS = { "ngrok-skip-browser-warning": "true" };
const RETRY_MS = 1500;

function api(path: string, init: RequestInit = {}) {
  return fetch(`${API}${path}`, { ...init, headers: { ...HEADERS, ...init.headers } });
}

/** Reads `data: {...}` messages from a Server-Sent Events response body. */
async function readEvents(body: ReadableStream<Uint8Array>, onState: (s: StafetteState) => void) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
    let end: number;
    while ((end = buffer.indexOf("\n\n")) >= 0) {
      const message = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const data = message
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (!data) continue; // keepalive comment
      try {
        const parsed = JSON.parse(data);
        if (parsed.state) onState(parsed.state as StafetteState);
      } catch {
        /* ignore malformed messages */
      }
    }
  }
}

export function useStafette() {
  const [state, setState] = useState<StafetteState>(initialState);
  const [connected, setConnected] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!API) return;
    const abort = new AbortController();

    const onState = (s: StafetteState) => {
      setState(s);
      setOffline(false);
    };

    const loadState = () =>
      api("/state", { signal: abort.signal })
        .then((r) => {
          if (!r.ok) throw new Error(`GET /state ${r.status}`);
          return r.json();
        })
        .then(onState)
        .catch(() => {
          if (!abort.signal.aborted) setOffline(true);
        });

    // Keep one stream open; reconnect after a drop, like EventSource would.
    const stream = async () => {
      while (!abort.signal.aborted) {
        try {
          const r = await api("/events", { signal: abort.signal, headers: { Accept: "text/event-stream" } });
          if (!r.ok || !r.body) throw new Error(`GET /events ${r.status}`);
          setConnected(true);
          loadState();
          await readEvents(r.body, onState);
        } catch {
          if (abort.signal.aborted) return;
        }
        setConnected(false);
        await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
      }
    };

    loadState();
    stream();
    return () => abort.abort();
  }, []);

  const decide = useCallback(
    async (approve: boolean) => {
      const approvalId = state.approval?.id;
      if (!approvalId) return;
      if (API && !offline) {
        await api(`/approvals/${approvalId}`, {
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
      await api("/reset", { method: "POST" }).catch(() => {});
    } else {
      setState(initialState);
    }
  }, [offline]);

  /** Anna signed: the agent starts calling (live). Offline the mock story is already "running". */
  const start = useCallback(async () => {
    if (API && !offline) {
      await api("/agent/start", { method: "POST" }).catch(() => {});
    }
  }, [offline]);

  /** Records arrived at Dr. Keller: the backend reads them and fills the sheet. */
  const ingest = useCallback(async () => {
    if (API && !offline) {
      await api("/agent/ingest", { method: "POST" }).catch(() => {});
    }
  }, [offline]);

  return { state, decide, reset, start, ingest, live: Boolean(API), connected, offline };
}
