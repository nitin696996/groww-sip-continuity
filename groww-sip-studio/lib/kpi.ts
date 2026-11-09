/** 12-month first-SIP continuation. NACH share is reach of the *drop-off problem*, not of the whole book. */
export const BASELINE = 0.62;
export const TARGET = 0.78;
export const NACH_CHURN_SHARE = 0.505;
export const COHORT = 10_000;

export function continuationRate(dropReduction: number) {
  const recovered = BASELINE + NACH_CHURN_SHARE * dropReduction * (1 - BASELINE);
  return Math.min(TARGET, recovered);
}

export function recoveredLives(dropReduction: number) {
  return Math.round((continuationRate(dropReduction) - BASELINE) * COHORT);
}
