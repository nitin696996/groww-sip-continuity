import type { GuardrailStatus } from "./guardrails";
import { contextPayload, type ProviderId, type RecoveryState, type Scenario, type SipState } from "./sip";

export type StreamMeta = {
  ttftMs: number;
  provider: string;
  model: string;
  guardrail: GuardrailStatus;
  fallback: boolean;
};

export type StreamResult = { text: string; meta: StreamMeta };

export async function streamAssistant(opts: {
  message: string;
  sip: SipState;
  scenario: Scenario;
  recovery: RecoveryState;
  provider: ProviderId;
  simulateTimeout?: boolean;
  onToken?: (full: string) => void;
  signal?: AbortSignal;
}): Promise<StreamResult> {
  const res = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: opts.signal,
    body: JSON.stringify({
      messages: [{ role: "user", content: opts.message }],
      sipState: contextPayload(opts.sip, opts.scenario, opts.recovery),
      provider: opts.provider,
      simulateTimeout: opts.simulateTimeout ?? false,
    }),
  });
  if (!res.ok || !res.body) throw new Error(`assistant ${res.status}`);

  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let text = "";
  let meta: StreamMeta = {
    ttftMs: 0,
    provider: "mock",
    model: "deterministic",
    guardrail: "PASS",
    fallback: true,
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const raw = line.slice(5).trim();
      if (!raw || raw === "[DONE]") continue;
      let ev: ({ type: "meta" } & StreamMeta) | { type: "token"; text: string } | { type: "done" };
      try {
        ev = JSON.parse(raw);
      } catch {
        continue;
      }
      if (ev.type === "meta") {
        meta = {
          ttftMs: ev.ttftMs,
          provider: ev.provider,
          model: ev.model,
          guardrail: ev.guardrail,
          fallback: ev.fallback,
        };
      } else if (ev.type === "token") {
        text += ev.text;
        opts.onToken?.(text);
      }
    }
  }
  return { text, meta };
}
