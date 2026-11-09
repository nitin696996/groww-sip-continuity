"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  sipForScenario,
  type ProviderId,
  type RecoveryState,
  type Scenario,
  type SipState,
} from "./sip";
import type { GuardrailStatus } from "./guardrails";

export type Sheet = null | "upi" | "skip" | "date";

export type Telemetry = {
  ttftMs: number | null;
  provider: string;
  model: string;
  guardrail: GuardrailStatus | "—";
  fallback: boolean;
};

type Studio = {
  scenario: Scenario;
  setScenario: (s: Scenario) => void;
  sip: SipState;
  recovery: RecoveryState;
  sheet: Sheet;
  setSheet: (s: Sheet) => void;
  confirmUpi: () => void;
  confirmSkip: () => void;
  confirmDate: () => void;
  provider: ProviderId;
  setProvider: (p: ProviderId) => void;
  telemetry: Telemetry;
  setTelemetry: (t: Telemetry) => void;
};

const Ctx = createContext<Studio | null>(null);

export function SipStudioProvider({ children }: { children: ReactNode }) {
  const [scenario, setScenarioState] = useState<Scenario>("A");
  const [sip, setSip] = useState<SipState>(() => sipForScenario("A"));
  const [recovery, setRecovery] = useState<RecoveryState>("failed");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [provider, setProvider] = useState<ProviderId>("groq");
  const [telemetry, setTelemetry] = useState<Telemetry>({
    ttftMs: null,
    provider: "mock",
    model: "deterministic",
    guardrail: "—",
    fallback: true,
  });

  const setScenario = useCallback((s: Scenario) => {
    setScenarioState(s);
    setSip(sipForScenario(s));
    setRecovery(s === "C" ? "pending_allotment" : "failed");
    setSheet(null);
  }, []);

  const confirmUpi = useCallback(() => {
    setRecovery("paid_upi");
    setSip((prev) => ({
      ...prev,
      consecutive_failures: 0,
      npci_code: null,
      instalments_paid: 4,
      invested_value: 10000,
    }));
    setSheet(null);
  }, []);

  const confirmSkip = useCallback(() => {
    setRecovery("nov_skipped");
    setSip((prev) => ({ ...prev, next_debit_date: "05 Dec" }));
    setSheet(null);
  }, []);

  const confirmDate = useCallback(() => {
    setRecovery("date_shifted");
    setSip((prev) => ({
      ...prev,
      sip_day: 10,
      next_debit_date: "10 Nov",
      debit_date: "10 Nov",
    }));
    setSheet(null);
  }, []);

  const value = useMemo<Studio>(
    () => ({
      scenario,
      setScenario,
      sip,
      recovery,
      sheet,
      setSheet,
      confirmUpi,
      confirmSkip,
      confirmDate,
      provider,
      setProvider,
      telemetry,
      setTelemetry,
    }),
    [
      scenario,
      setScenario,
      sip,
      recovery,
      sheet,
      confirmUpi,
      confirmSkip,
      confirmDate,
      provider,
      telemetry,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStudio outside provider");
  return ctx;
}
