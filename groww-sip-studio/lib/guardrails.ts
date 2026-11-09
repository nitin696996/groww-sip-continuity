export type GuardrailStatus = "PASS" | "BLOCKED_SEBI_RIA";

const PREDICT =
  /predict|corpus|xirr|will give|25\s*%|higher returns|in 2027|future (return|nav)|project(ed)? (return|corpus)|nav movement/i;

const FUND =
  /small[-\s]?cap|mid[-\s]?cap|large[-\s]?cap|flexi cap|elss|index fund|mutual fund|\bfunds?\b|\bstocks?\b/i;

const ADVICE_VERB =
  /\bwhich\b|recommend|suggest|\bbest\b|compare|should i (buy|sell|switch|invest)|switch to/i;

export function sebiPrecheck(message: string): GuardrailStatus {
  if (PREDICT.test(message)) return "BLOCKED_SEBI_RIA";
  if (/\bwhich\b.{0,80}\bfunds?\b/i.test(message)) return "BLOCKED_SEBI_RIA";
  if (ADVICE_VERB.test(message) && FUND.test(message)) return "BLOCKED_SEBI_RIA";
  return "PASS";
}

export const SEBI_REFUSAL =
  "I cannot recommend funds or project returns under SEBI non-advisory rules. I can help you retry this ₹2,500 debit, skip November safely, or change the SIP date. Your 104.28 units stay invested. [Skip Nov Safely]";
