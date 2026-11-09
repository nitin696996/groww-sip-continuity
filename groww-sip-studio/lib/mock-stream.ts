import { SEBI_REFUSAL } from "./guardrails";
import type { GuardrailStatus } from "./guardrails";

export const TIMEOUT_FALLBACK =
  "The live model timed out. Your 104.28 units stay invested. Use the recovery controls on this screen: retry ₹2,500 via UPI, or skip November with no Groww fee. Next NACH attempt is 05 Dec unless you change the SIP date. [Skip Nov Safely]";

const SKIP =
  "Skipping November does not sell or reduce your existing 104.28 units (₹7,500 invested). They stay allotted and compounding. This SIP stays active. Auto-cancel only after 3 consecutive failed debits. Next debit: 05 Dec. [Skip Nov Safely]";

const PENALTY =
  "Groww charges ₹0 for this NPCI_NACH_ERR_51 failed debit on 05 Nov. Your bank may still levy a standard NACH return charge. Existing 104.28 units are untouched. You can retry ₹2,500 via UPI or skip November. [Retry via UPI]";

const STRIKE =
  "One missed ₹2,500 debit does not cancel the SIP. Cancellation is only after 3 consecutive NACH failures. You are at 1 of 3. Existing 104.28 units remain invested. [Skip Nov Safely]";

const DATE =
  "You can move the SIP debit day to the 10th so it aligns with salary credit. Existing 104.28 units are unaffected. November can still be skipped with ₹0 Groww fee. [Change SIP Date]";

const AMOUNT =
  "Your monthly SIP is ₹2,500 (month 3 of 12). This failed debit is that same instalment. Existing 104.28 units stay invested. [Retry via UPI]";

const UNITS =
  "You currently hold 104.28 units from ₹7,500 invested, now worth ₹7,685 (+2.47%). Skipping or recovering a failed debit does not sell these units. [Skip Nov Safely]";

const FAILED =
  "The 05 Nov ₹2,500 debit failed with code NPCI_NACH_ERR_51 (insufficient balance). Existing 104.28 units stay invested. Retry via UPI or skip November with ₹0 Groww fee. [Retry via UPI]";

const NEXT =
  "Your next NACH debit is 05 Dec for ₹2,500. If you skip November, this SIP stays active and the schedule moves to 05 Dec. Existing 104.28 units remain invested. [Skip Nov Safely]";

const VALUE =
  "Your current value is ₹7,685 against ₹7,500 invested (+2.47%). Existing 104.28 units stay invested through any skip or recovery. I can help with the failed instalment, not return predictions. [Skip Nov Safely]";

const UPI =
  "Yes. You can pay the ₹2,500 November instalment now via UPI. This is a recovery payment for the same instalment, not a second SIP. Existing 104.28 units stay invested. [Retry via UPI]";

const GUARANTEE =
  "No one can guarantee returns or capital on a mutual fund SIP. What is certain: skipping November does not sell your existing 104.28 units (₹7,500 invested), and this is 1 of 3 allowed consecutive failures. [Skip Nov Safely]";

const INJECTION =
  "I cannot reveal internal instructions or system configuration. I can help with your SIP: retry this ₹2,500 instalment via UPI, skip November safely, or change your SIP date. Existing 104.28 units stay invested. [Skip Nov Safely]";

const GENERIC =
  "This SIP is month 3 of 12. Existing 104.28 units (₹7,500) stay invested. A failed NPCI_NACH_ERR_51 debit has ₹0 Groww penalty. You can retry via UPI, skip November, or move the debit date. [Skip Nov Safely]";

export function mockAnswer(message: string, guardrail: GuardrailStatus) {
  if (guardrail === "BLOCKED_SEBI_RIA") return SEBI_REFUSAL;
  const q = message.toLowerCase();
  if (q.includes("ignore") || q.includes("system prompt") || q.includes("previous instructions"))
    return INJECTION;
  if (q.includes("guarantee")) return GUARANTEE;
  if (q.includes("skip") && (q.includes("7500") || q.includes("7,500") || q.includes("invested") || q.includes("units")))
    return SKIP;
  if (q.includes("penalty") || q.includes("charged") || q.includes("fee") || q.includes("bounce"))
    return PENALTY;
  if (q.includes("upi") || q.includes("pay")) return UPI;
  if (q.includes("cancel") || q.includes("consecutive") || q.includes("strike")) return STRIKE;
  if (q.includes("npci") || q.includes("err_51") || q.includes("failed")) return FAILED;
  if (q.includes("date") || q.includes("10th") || q.includes("shift")) return DATE;
  if (q.includes("next")) return NEXT;
  if (q.includes("monthly") || q.includes("amount")) return AMOUNT;
  if (q.includes("units") || q.includes("hold")) return UNITS;
  if (q.includes("current value") || q.includes("value") || q.includes("return")) return VALUE;
  return GENERIC;
}

export function chunkText(text: string, size = 24) {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += size) parts.push(text.slice(i, i + size));
  return parts;
}
