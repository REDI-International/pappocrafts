import type { CurrencyCode } from "@/lib/locale-context";

export const LISTING_COUNTRIES = ["Albania", "Serbia", "North Macedonia"] as const;
export type ListingCountry = (typeof LISTING_COUNTRIES)[number];

const COUNTRY_CURRENCY: Record<ListingCountry, CurrencyCode> = {
  Albania: "ALL",
  Serbia: "RSD",
  "North Macedonia": "MKD",
};

export function currencyForListingCountry(country: string): CurrencyCode {
  const normalized = String(country || "").trim() as ListingCountry;
  return COUNTRY_CURRENCY[normalized] || "EUR";
}
