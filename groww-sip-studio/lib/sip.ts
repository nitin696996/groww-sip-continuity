export type Scenario = "A" | "B" | "C";
export type RecoveryState =
  | "failed"
  | "paid_upi"
  | "nov_skipped"
  | "date_shifted"
  | "pending_allotment";

export type ProviderId = "groq" | "openrouter";

export type SipState = {
  sip_id: string;
  fund_name: string;
  plan: string;
  instalment_month: number;
  tenure_months: number;
  instalments_paid: number;
  sip_amount: number;
  invested_value: number;
  current_value: number;
  return_pct: number;
  existing_units: number;
  consecutive_failures: number;
  npci_code: string | null;
  debit_date: string;
  next_debit_date: string;
  bank: string;
  sip_day: number;
  units_locked: boolean;
};

export const FUND = {
  name: "Parag Parikh Flexi Cap Fund",
  plan: "Direct Growth",
} as const;

export const BASE_SIP: SipState = {
  sip_id: "SIP-PPFCF-88421",
  fund_name: FUND.name,
  plan: FUND.plan,
  instalment_month: 3,
  tenure_months: 12,
  instalments_paid: 3,
  sip_amount: 2500,
  invested_value: 7500,
  current_value: 7685,
  return_pct: 2.47,
  existing_units: 104.28,
  consecutive_failures: 1,
  npci_code: "NPCI_NACH_ERR_51",
  debit_date: "05 Nov",
  next_debit_date: "05 Dec",
  bank: "HDFC Bank",
  sip_day: 5,
  units_locked: true,
};

export function sipForScenario(scenario: Scenario): SipState {
  if (scenario === "B") {
    return {
      ...BASE_SIP,
      consecutive_failures: 0,
      npci_code: null,
      debit_date: "05 Nov",
      next_debit_date: "05 Nov",
    };
  }
  if (scenario === "C") {
    return {
      ...BASE_SIP,
      consecutive_failures: 0,
      npci_code: null,
      debit_date: "05 Nov",
      next_debit_date: "05 Dec",
    };
  }
  return { ...BASE_SIP };
}

export function defaultRecovery(scenario: Scenario): RecoveryState {
  if (scenario === "C") return "pending_allotment";
  if (scenario === "B") return "failed";
  return "failed";
}

export function contextPayload(
  sip: SipState,
  scenario: Scenario,
  recovery: RecoveryState,
) {
  return {
    sip_id: sip.sip_id,
    instalment_month: sip.instalment_month,
    instalments_paid: sip.instalments_paid,
    consecutive_failures: sip.consecutive_failures,
    existing_units: sip.existing_units,
    npci_code: sip.npci_code,
    sip_amount: sip.sip_amount,
    invested_value: sip.invested_value,
    current_value: sip.current_value,
    return_pct: sip.return_pct,
    debit_date: sip.debit_date,
    next_debit_date: sip.next_debit_date,
    sip_day: sip.sip_day,
    bank: sip.bank,
    scenario,
    recovery,
  };
}

export const SCENARIOS: {
  id: Scenario;
  label: string;
  when: string;
  doNext: string;
}[] = [
  {
    id: "A",
    label: "Debit failed today",
    when: "Bank returned the 05 Nov ₹2,500 NACH (insufficient balance).",
    doNext: "Pay the same instalment via UPI, or skip November. Existing units stay invested.",
  },
  {
    id: "B",
    label: "Debit in 3 days",
    when: "The 05 Nov SIP has not run yet. Salary may land after the 5th.",
    doNext: "Skip this month, or move the SIP date to the 10th. Nothing has been deducted.",
  },
  {
    id: "C",
    label: "Money left the bank",
    when: "₹2,500 already left HDFC. Units are still being allotted by ICCL/RTA.",
    doNext: "Wait. Do not pay a second time. Existing units are already invested.",
  },
];

export const INR = new Intl.NumberFormat("en-IN");
export const fmtInr = (n: number) => `₹${INR.format(n)}`;
