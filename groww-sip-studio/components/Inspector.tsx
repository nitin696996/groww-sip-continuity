"use client";

import { useMemo, useState } from "react";
import { EVAL_COUNTS, GOLDEN_EVALS, judgeEval } from "@/lib/evals";
import { streamAssistant } from "@/lib/assistant-client";
import { contextPayload } from "@/lib/sip";
import { useStudio } from "@/lib/studio-context";

type Tab = "telemetry" | "evals";

type EvalRow = {
  id: string;
  pass: boolean | null;
  latency: number | null;
  excerpt: string;
};

export function Inspector() {
  const s = useStudio();
  const [tab, setTab] = useState<Tab>("telemetry");
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<EvalRow[]>(
    GOLDEN_EVALS.map((e) => ({ id: e.id, pass: null, latency: null, excerpt: "" })),
  );
  const payload = useMemo(
    () => contextPayload(s.sip, s.scenario, s.recovery),
    [s.sip, s.scenario, s.recovery],
  );

  async function runEvals() {
    setRunning(true);
    const next: EvalRow[] = [];
    for (const ev of GOLDEN_EVALS) {
      const t0 = Date.now();
      try {
        const result = await streamAssistant({
          message: ev.prompt,
          sip: s.sip,
          scenario: s.scenario,
          recovery: s.recovery,
          provider: s.provider,
          simulateTimeout: ev.simulateTimeout,
        });
        const pass = judgeEval(ev.id, result.text, result.meta);
        next.push({
          id: ev.id,
          pass,
          latency: Date.now() - t0,
          excerpt: result.text.slice(0, 140),
        });
        if (!ev.simulateTimeout) {
          s.setTelemetry({
            ttftMs: result.meta.ttftMs,
            provider: result.meta.provider,
            model: result.meta.model,
            guardrail: result.meta.guardrail,
            fallback: result.meta.fallback,
          });
        }
      } catch {
        next.push({ id: ev.id, pass: false, latency: Date.now() - t0, excerpt: "request failed" });
      }
      setRows([...next, ...GOLDEN_EVALS.slice(next.length).map((e) => ({ id: e.id, pass: null, latency: null, excerpt: "" }))]);
    }
    setRunning(false);
  }

  const guard = s.telemetry.guardrail;
  const guardClass =
    guard === "BLOCKED_SEBI_RIA"
      ? "bg-[#FEE2E2] text-[#DC2626]"
      : guard === "PASS"
        ? "bg-[#D1FAE5] text-[#065F46]"
        : "bg-[#F3F4F6] text-[#6B7280]";

  return (
    <div className="flex min-h-[820px] flex-col rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="border-b border-[#E5E7EB] px-4 py-3">
        <p className="text-[11px] uppercase tracking-wide text-[#6B7280]">PM architecture</p>
        <h2 className="text-[16px] font-semibold text-[#1E2232]">Eval-gated assistant</h2>
      </div>

      <div className="flex border-b border-[#E5E7EB] text-[13px]">
        {(
          [
            ["telemetry", "Live telemetry"],
            ["evals", "Eval suite"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 py-2.5 ${tab === id ? "border-b-2 border-[#00D09C] font-semibold text-[#1E2232]" : "text-[#6B7280]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "telemetry" && (
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => s.setProvider("groq")}
              className={`rounded-lg border px-3 py-1.5 text-[12px] ${s.provider === "groq" ? "border-[#00D09C] bg-[#ECFDF5] font-semibold text-[#1E2232]" : "border-[#E5E7EB] text-[#6B7280]"}`}
            >
              Groq
            </button>
            <button
              type="button"
              onClick={() => s.setProvider("openrouter")}
              className={`rounded-lg border px-3 py-1.5 text-[12px] ${s.provider === "openrouter" ? "border-[#00D09C] bg-[#ECFDF5] font-semibold text-[#1E2232]" : "border-[#E5E7EB] text-[#6B7280]"}`}
            >
              OpenRouter
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <Metric label="TTFT (ms)" value={s.telemetry.ttftMs == null ? "—" : String(s.telemetry.ttftMs)} />
            <Metric label="Provider used" value={s.telemetry.provider} />
            <div className="rounded-lg border border-[#E5E7EB] p-2">
              <p className="text-[10px] uppercase tracking-wide text-[#6B7280]">Guardrail</p>
              <p className={`mt-1 inline-block rounded px-1.5 py-0.5 font-mono text-[11px] ${guardClass}`}>
                {s.telemetry.guardrail}
              </p>
            </div>
            <Metric label="Deterministic fallback ready" value="TRUE" />
          </div>

          <div>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-[#6B7280]">Injected context payload</p>
            <pre className="overflow-auto rounded-lg border border-[#E5E7EB] bg-[#F6F7F9] p-3 font-mono text-[11px] leading-5 text-[#1E2232]">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {tab === "evals" && (
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#6B7280]">
                {GOLDEN_EVALS.length} golden cases · keyword + guardrail judge
              </p>
              <p className="mt-1 text-[11px] text-[#9CA3AF]">
                {EVAL_COUNTS["SEBI safety"]} safety · {EVAL_COUNTS.Grounding} grounding ·{" "}
                {EVAL_COUNTS.Operational} operational · {EVAL_COUNTS.Resilience} resilience
              </p>
            </div>
            <button
              type="button"
              disabled={running}
              onClick={() => void runEvals()}
              className="rounded-lg bg-[#00D09C] px-3 py-2 text-[13px] font-semibold text-[#04342A] disabled:opacity-60"
            >
              {running ? "Running…" : "Run All Evals"}
            </button>
          </div>
          <div className="overflow-auto rounded-lg border border-[#E5E7EB]">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#F6F7F9] text-[11px] uppercase text-[#6B7280]">
                <tr>
                  <th className="px-3 py-2">Case</th>
                  <th className="px-3 py-2">Expected</th>
                  <th className="px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {GOLDEN_EVALS.map((ev) => {
                  const row = rows.find((r) => r.id === ev.id);
                  return (
                    <tr key={ev.id} className="border-t border-[#E5E7EB] align-top">
                      <td className="px-3 py-2 text-[#1E2232]">
                        {ev.name}
                        <span className="mt-1 block text-[10px] uppercase tracking-wide text-[#9CA3AF]">
                          {ev.category}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[#6B7280]">{ev.expected}</td>
                      <td className="px-3 py-2">
                        {row?.pass == null ? (
                          <span className="text-[#9CA3AF]">queued</span>
                        ) : (
                          <span className={row.pass ? "font-semibold text-[#059669]" : "font-semibold text-[#DC2626]"}>
                            {row.pass ? "PASS" : "FAIL"}
                            {row.latency != null && (
                              <span className="ml-2 font-mono font-normal text-[#6B7280]">{row.latency}ms</span>
                            )}
                          </span>
                        )}
                        {row?.excerpt ? (
                          <p className="mt-1 font-mono text-[10px] leading-4 text-[#6B7280]">{row.excerpt}</p>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E5E7EB] p-2">
      <p className="text-[10px] uppercase tracking-wide text-[#6B7280]">{label}</p>
      <p className="num mt-1 text-[15px] text-[#1E2232]">{value}</p>
    </div>
  );
}
