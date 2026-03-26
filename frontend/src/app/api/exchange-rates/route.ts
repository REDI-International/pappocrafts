import { NextResponse } from "next/server";

const SUPPORTED_CURRENCIES = ["USD", "GBP", "RSD", "ALL", "BAM", "MKD", "TRY", "CHF"] as const;

interface CachedRates {
  rates: Record<string, number>;
  fetchedAt: number;
}

let cache: CachedRates | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const FALLBACK_RATES: Record<string, number> = {
  EUR: 1,
  USD: 1.08,
  GBP: 0.86,
  RSD: 117.2,
  ALL: 100.5,
  BAM: 1.956,
  MKD: 61.5,
  TRY: 38.5,
  CHF: 0.97,
};

function mergeRates(partial: Record<string, number>): Record<string, number> {
  return { ...FALLBACK_RATES, ...partial, EUR: 1 };
}

async function fetchLiveRates(): Promise<{ rates: Record<string, number>; live: boolean }> {
  const symbols = SUPPORTED_CURRENCIES.join(",");

  // Primary: Frankfurter API (ECB data, free, no key required)
  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=${symbols}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.rates && typeof data.rates === "object") {
        const merged = mergeRates(data.rates);
        const hasAny = Object.keys(data.rates as object).length > 0;
        return { rates: merged, live: hasAny };
      }
    }
  } catch {
    // fall through to fallback
  }

  // Fallback: Open Exchange Rates (exchangerate-api.com free tier)
  try {
    const res = await fetch(
      "https://open.er-api.com/v6/latest/EUR",
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.rates) {
        const filtered: Record<string, number> = {};
        for (const code of SUPPORTED_CURRENCIES) {
          const v = data.rates[code];
          if (typeof v === "number" && v > 0) filtered[code] = v;
        }
        return { rates: mergeRates(filtered), live: Object.keys(filtered).length > 0 };
      }
    }
  } catch {
    // fall through to hardcoded
  }

  return { rates: { ...FALLBACK_RATES }, live: false };
}

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.fetchedAt < CACHE_TTL) {
    return NextResponse.json(
      { rates: cache.rates, source: "cached", updated_at: new Date(cache.fetchedAt).toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
    );
  }

  const { rates, live } = await fetchLiveRates();

  cache = { rates, fetchedAt: now };

  return NextResponse.json(
    { rates, source: live ? "live" : "fallback", updated_at: new Date(now).toISOString() },
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" } }
  );
}
