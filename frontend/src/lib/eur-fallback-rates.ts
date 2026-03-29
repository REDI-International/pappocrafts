/**
 * Units of each currency per 1 EUR (ECB / Frankfurter style).
 * Must match `LocaleProvider` display conversion: eurAmount * rate = amount in that currency.
 */
export const UNITS_PER_ONE_EUR: Record<string, number> = {
  EUR: 1,
  RSD: 117.2,
  ALL: 100.5,
  BAM: 1.956,
  MKD: 61.5,
  TRY: 38.5,
};

const ALLOWED = new Set(Object.keys(UNITS_PER_ONE_EUR));

export function isListingCurrency(code: string): boolean {
  return ALLOWED.has(code.trim().toUpperCase());
}

/** Amount in `currencyCode` → EUR (for cart totals, Stripe, shipping). */
export function convertListedPriceToEur(amount: number, currencyCode: string): number {
  const c = currencyCode.trim().toUpperCase();
  if (!Number.isFinite(amount) || amount < 0) return 0;
  if (c === "EUR") return round2(amount);
  const unitsPerEur = UNITS_PER_ONE_EUR[c];
  if (!unitsPerEur || unitsPerEur <= 0) {
    throw new Error(`Unsupported currency: ${currencyCode}`);
  }
  return round2(amount / unitsPerEur);
}

/**
 * Catalogue row: `amount` stored in `currencyCode` → EUR equivalent.
 * Unknown currency is treated as EUR (legacy rows).
 */
export function amountInListingCurrencyToEur(amount: number, currencyCode: string | null | undefined): number {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  const c = (String(currencyCode || "EUR").trim().toUpperCase() || "EUR");
  if (c === "EUR") return round2(amount);
  if (!isListingCurrency(c)) return round2(amount);
  try {
    return convertListedPriceToEur(amount, c);
  } catch {
    return round2(amount);
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
