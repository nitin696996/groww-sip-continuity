"use client";

import { Inspector } from "@/components/Inspector";
import { SipPhone } from "@/components/SipPhone";
import { BASELINE, TARGET } from "@/lib/kpi";
import { SCENARIOS } from "@/lib/sip";
import { useStudio } from "@/lib/studio-context";

export function Studio() {
  const s = useStudio();

  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#1E2232]">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="mb-5">
          <p className="text-[12px] font-medium text-[#00B386]">Groww · SIP operations</p>
          <h1 className="text-[22px] font-semibold tracking-tight">
            Smart SIP Continuity & Recovery
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-5 text-[#6B7280]">
            One SIP, three moments: 3 days before debit, debit failed today, or money already left the bank. Existing units stay invested in all three. Goal: 12-month first-SIP continuation from{" "}
            <span className="num text-[#1E2232]">{(BASELINE * 100).toFixed(0)}%</span> toward{" "}
            <span className="num text-[#1E2232]">{(TARGET * 100).toFixed(0)}%</span>.
          </p>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="w-full shrink-0 lg:w-[420px]">
            <p className="mb-1 text-[11px] uppercase tracking-wide text-[#6B7280]">
              Same SIP, three moments
            </p>
            <p className="mb-3 text-[12px] leading-4 text-[#6B7280]">
              Before debit: skip or move date. Failed debit: UPI retry or skip. Bank already took the money: wait. Buttons on the card finish that moment.
            </p>
            <div className="mb-4 flex flex-col gap-2">
              {SCENARIOS.map((sc) => {
                const on = s.scenario === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => s.setScenario(sc.id)}
                    className={`rounded-xl border px-3 py-2.5 text-left ${
                      on ? "border-[#00D09C] bg-white" : "border-[#E5E7EB] bg-white"
                    }`}
                  >
                    <p className="text-[13px] font-semibold text-[#1E2232]">{sc.label}</p>
                    <p className="mt-1 text-[12px] leading-4 text-[#6B7280]">{sc.when}</p>
                    {on && (
                      <p className="mt-1 text-[12px] leading-4 text-[#1E2232]">{sc.doNext}</p>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center lg:justify-start">
              <SipPhone />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <Inspector />
          </div>
        </div>
      </div>
    </div>
  );
}
