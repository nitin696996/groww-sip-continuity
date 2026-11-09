"use client";

import { useState } from "react";
import {
  Battery,
  ChevronLeft,
  MoreVertical,
  Signal,
  Wifi,
} from "lucide-react";
import { ACTION_DATE, ACTION_SKIP, ACTION_UPI } from "@/lib/prompt";
import { streamAssistant } from "@/lib/assistant-client";
import { fmtInr as inr } from "@/lib/sip";
import { useStudio, type Sheet } from "@/lib/studio-context";

const CHIPS = [
  "Does skipping November affect my ₹7,500 already invested?",
  "Will I be charged a penalty for this failed debit?",
  "Should I switch to a Small Cap fund for higher returns?",
];

function Num({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`num ${className}`}>{children}</span>;
}

function AnswerBody({
  text,
  onAction,
}: {
  text: string;
  onAction: (s: Sheet) => void;
}) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <p className="text-[13px] leading-5 text-[#1E2232]">
      {parts.map((p, i) => {
        if (p === ACTION_SKIP)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onAction("skip")}
              className="mx-0.5 inline rounded-md bg-[#00D09C] px-2 py-0.5 text-[12px] font-semibold text-[#04342A]"
            >
              Skip Nov Safely
            </button>
          );
        if (p === ACTION_DATE)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onAction("date")}
              className="mx-0.5 inline rounded-md border border-[#E5E7EB] bg-white px-2 py-0.5 text-[12px] font-semibold text-[#1E2232]"
            >
              Change SIP Date
            </button>
          );
        if (p === ACTION_UPI)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onAction("upi")}
              className="mx-0.5 inline rounded-md bg-[#00D09C] px-2 py-0.5 text-[12px] font-semibold text-[#04342A]"
            >
              Retry via UPI
            </button>
          );
        return <span key={i}>{p}</span>;
      })}
    </p>
  );
}

function SheetCard({
  title,
  body,
  cta,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  cta: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end bg-[#1E2232]/40">
      <div className="rounded-t-2xl bg-white px-4 pb-6 pt-3">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#E5E7EB]" />
        <h3 className="text-[15px] font-semibold text-[#1E2232]">{title}</h3>
        <p className="mt-2 text-[13px] leading-5 text-[#6B7280]">{body}</p>
        <button
          type="button"
          onClick={onConfirm}
          className="mt-4 w-full rounded-xl bg-[#00D09C] py-3 text-[14px] font-semibold text-[#04342A]"
        >
          {cta}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full py-2 text-[13px] text-[#6B7280]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function SipPhone() {
  const s = useStudio();
  const [openAsk, setOpenAsk] = useState(false);
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask(message: string) {
    const q = message.trim();
    if (!q) return;
    setOpenAsk(true);
    setBusy(true);
    setAnswer("");
    try {
      const result = await streamAssistant({
        message: q,
        sip: s.sip,
        scenario: s.scenario,
        recovery: s.recovery,
        provider: s.provider,
        onToken: setAnswer,
      });
      setAnswer(result.text);
      s.setTelemetry({
        ttftMs: result.meta.ttftMs,
        provider: result.meta.provider,
        model: result.meta.model,
        guardrail: result.meta.guardrail,
        fallback: result.meta.fallback,
      });
    } catch {
      setAnswer("Could not reach the assistant. Deterministic recovery buttons on this screen still work.");
    } finally {
      setBusy(false);
    }
  }

  const sip = s.sip;
  const showFailed = s.scenario === "A" && s.recovery === "failed";

  return (
    <div className="relative h-[820px] w-[390px] overflow-hidden rounded-[28px] border border-[#D1D5DB] bg-[#F6F7F9] shadow-[0_12px_40px_rgba(30,34,50,0.12)]">
      <div className="flex items-center justify-between px-5 pt-2 text-[11px] text-[#1E2232]">
        <Num>9:41</Num>
        <div className="flex items-center gap-1">
          <Signal className="h-3 w-3" strokeWidth={1.5} />
          <Wifi className="h-3 w-3" strokeWidth={1.5} />
          <Battery className="h-3 w-3" strokeWidth={1.5} />
        </div>
      </div>

      <header className="flex items-center gap-2 border-b border-[#E5E7EB] bg-white px-2 py-2.5">
        <ChevronLeft className="h-5 w-5 text-[#1E2232]" strokeWidth={1.5} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-[#1E2232]">
            {sip.fund_name}
          </p>
          <p className="text-[11px] text-[#6B7280]">{sip.plan}</p>
        </div>
        <MoreVertical className="h-4 w-4 text-[#6B7280]" strokeWidth={1.5} />
      </header>

      <div className="h-[calc(820px-72px)] overflow-y-auto px-3 pb-6 pt-3">
        {showFailed && (
          <section className="mb-3 rounded-xl border border-[#FECACA] bg-white p-3">
            <span className="inline-block rounded-md bg-[#FEE2E2] px-2 py-1 text-[11px] font-medium text-[#DC2626]">
              <Num>NPCI_NACH_ERR_51</Num>: Insufficient Balance on Debit Date (
              <Num>05 Nov</Num>)
            </span>
            <ul className="mt-3 space-y-2 text-[12px] leading-5 text-[#1E2232]">
              <li>
                <span className="font-semibold">₹0 Groww Penalty: </span>
                Groww charges nothing for a failed SIP debit. (Your bank may levy a standard NACH return charge).
              </li>
              <li>
                <span className="font-semibold">100% Units Safe: </span>
                Your existing ₹7,500 (<Num>104.28</Num> units) remain fully invested and compounding.
              </li>
              <li>
                <span className="font-semibold">SIP Still Active: </span>
                1 missed debit does not cancel your SIP. Auto-cancellation only happens after 3 consecutive failures.
              </li>
            </ul>
            <button
              type="button"
              onClick={() => s.setSheet("upi")}
              className="mt-3 w-full rounded-xl bg-[#00D09C] py-2.5 text-[13px] font-semibold text-[#04342A]"
            >
              Retry ₹2,500 via UPI Now
            </button>
            <button
              type="button"
              onClick={() => s.setSheet("skip")}
              className="mt-2 w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 text-[13px] font-semibold text-[#1E2232]"
            >
              Safe-Skip Nov Instalment
            </button>
            <button
              type="button"
              onClick={() => setOpenAsk(true)}
              className="mt-3 w-full rounded-full border border-[#E5E7EB] bg-[#F6F7F9] py-1.5 text-[12px] text-[#5367FF]"
            >
              Ask Continuity Assistant about this instalment
            </button>
            <div className="mt-2 flex flex-col gap-1.5">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => ask(c)}
                  className="rounded-lg border border-[#E5E7EB] bg-white px-2 py-1.5 text-left text-[11px] leading-4 text-[#1E2232]"
                >
                  {c}
                </button>
              ))}
            </div>
          </section>
        )}

        {s.scenario === "B" && s.recovery === "failed" && (
          <section className="mb-3 rounded-xl border border-[#FDE68A] bg-[#FEF3C7] p-3">
            <p className="text-[13px] leading-5 text-[#92400E]">
              Upcoming <Num>₹2,500</Num> debit in 3 days (<Num>05 Nov</Num>). Tight month or delayed salary?
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => s.setSheet("skip")}
                className="flex-1 rounded-xl bg-[#00D09C] py-2 text-[12px] font-semibold text-[#04342A]"
              >
                Skip This Month (1-Tap)
              </button>
              <button
                type="button"
                onClick={() => s.setSheet("date")}
                className="flex-1 rounded-xl border border-[#E5E7EB] bg-white py-2 text-[12px] font-semibold text-[#1E2232]"
              >
                Shift SIP Date to 10th
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOpenAsk(true)}
              className="mt-3 w-full rounded-full border border-[#E5E7EB] bg-white py-1.5 text-[12px] text-[#5367FF]"
            >
              Ask Continuity Assistant about this instalment
            </button>
            <div className="mt-2 flex flex-col gap-1.5">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => ask(c)}
                  className="rounded-lg border border-[#FDE68A] bg-white px-2 py-1.5 text-left text-[11px] leading-4 text-[#1E2232]"
                >
                  {c}
                </button>
              ))}
            </div>
          </section>
        )}

        {s.scenario === "C" && (
          <section className="mb-3 rounded-xl border border-[#C7D2FE] bg-white p-3">
            <span className="inline-block rounded-md bg-[#EEF2FF] px-2 py-1 text-[11px] font-medium text-[#5367FF]">
              Allotment pending
            </span>
            <p className="mt-2 text-[13px] leading-5 text-[#1E2232]">
              <Num>₹2,500</Num> debited from HDFC Bank — awaiting ICCL/RTA unit allotment (Est.{" "}
              <Num>07 Nov</Num>).
            </p>
            <p className="mt-1 text-[12px] text-[#6B7280]">
              Do not make a second payment. Existing <Num>104.28</Num> units remain invested.
            </p>
          </section>
        )}

        {s.recovery === "paid_upi" && (
          <p className="mb-3 rounded-xl border border-[#A7F3D0] bg-white px-3 py-2 text-[13px] text-[#065F46]">
            Paid via Recovery UPI · November instalment recorded
          </p>
        )}
        {s.recovery === "nov_skipped" && (
          <p className="mb-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] text-[#1E2232]">
            Nov Skipped Safely · next debit <Num>{sip.next_debit_date}</Num> · ₹0 Groww fee
          </p>
        )}
        {s.recovery === "date_shifted" && (
          <p className="mb-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-[13px] text-[#1E2232]">
            SIP date moved to the <Num>10th</Num> · next debit <Num>{sip.next_debit_date}</Num>
          </p>
        )}

        <section className="rounded-xl border border-[#E5E7EB] bg-white p-3">
          <p className="text-[11px] uppercase tracking-wide text-[#6B7280]">SIP details</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-[#6B7280]">Monthly SIP</p>
              <p className="text-[16px] font-semibold text-[#1E2232]">
                <Num>{inr(sip.sip_amount)}</Num>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">Tenure</p>
              <p className="text-[16px] font-semibold text-[#1E2232]">
                Month <Num>{sip.instalment_month}</Num> of <Num>{sip.tenure_months}</Num>
              </p>
              <p className="text-[11px] text-[#6B7280]">
                <Num>{sip.instalments_paid}</Num> Instalments Paid
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">Invested value</p>
              <p className="text-[16px] font-semibold text-[#1E2232]">
                <Num>{inr(sip.invested_value)}</Num>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#6B7280]">Current value</p>
              <p className="text-[16px] font-semibold text-[#1E2232]">
                <Num>{inr(sip.current_value)}</Num>
              </p>
              <p className="text-[12px] font-medium text-[#059669]">
                <Num>+{sip.return_pct.toFixed(2)}%</Num>
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#F6F7F9] px-3 py-2">
            <div>
              <p className="text-[11px] text-[#6B7280]">Existing units</p>
              <p className="text-[14px] font-semibold text-[#1E2232]">
                <Num>{sip.existing_units.toFixed(2)}</Num> units
              </p>
            </div>
            <span className="rounded-full bg-[#D1FAE5] px-2 py-1 text-[11px] font-medium text-[#065F46]">
              Locked & Safe
            </span>
          </div>
        </section>

        {openAsk && (
          <section className="mt-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
            <p className="text-[12px] font-semibold text-[#1E2232]">Continuity assistant</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => ask(c)}
                  className="rounded-lg border border-[#E5E7EB] px-2 py-1.5 text-left text-[11px] leading-4 text-[#1E2232]"
                >
                  {c}
                </button>
              ))}
            </div>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void ask(input);
                setInput("");
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this instalment"
                className="min-w-0 flex-1 rounded-lg border border-[#E5E7EB] px-2 py-2 text-[12px] outline-none"
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-[#00D09C] px-3 text-[12px] font-semibold text-[#04342A] disabled:opacity-60"
              >
                Send
              </button>
            </form>
            {(answer || busy) && (
              <div className="mt-3 rounded-lg bg-[#F6F7F9] p-2">
                {answer ? (
                  <AnswerBody text={answer} onAction={s.setSheet} />
                ) : (
                  <p className="text-[12px] text-[#6B7280]">Writing…</p>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {s.sheet === "upi" && (
        <SheetCard
          title="Confirm UPI recovery"
          body="Pay ₹2,500 now via UPI for the 05 Nov instalment. Existing 104.28 units stay invested. This is a recovery payment, not a second SIP."
          cta="Pay ₹2,500"
          onConfirm={s.confirmUpi}
          onClose={() => s.setSheet(null)}
        />
      )}
      {s.sheet === "skip" && (
        <SheetCard
          title="Skip November instalment"
          body="No Groww penalty. Existing 104.28 units remain invested. Next NACH debit: 05 Dec. SIP stays active (1 of 3 consecutive failures)."
          cta="Confirm skip"
          onConfirm={s.confirmSkip}
          onClose={() => s.setSheet(null)}
        />
      )}
      {s.sheet === "date" && (
        <SheetCard
          title="Shift SIP date to 10th"
          body="Upcoming ₹2,500 debit moves from the 5th to the 10th to match salary credit. Existing units are not sold or switched."
          cta="Change date to 10th"
          onConfirm={s.confirmDate}
          onClose={() => s.setSheet(null)}
        />
      )}
    </div>
  );
}
