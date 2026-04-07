import type { SelectableLocale } from "./translations";

export type ShippingZone = "domestic" | "balkans" | "turkey" | "eu" | "international";
export type PricingRegion = "balkans" | "turkey" | "western_europe" | "international";

interface RegionConfig {
  region: PricingRegion;
  priceMultiplier: number;
  label: string;
  description: string;
}

interface ShippingRate {
  zone: ShippingZone;
  label: string;
  baseCost: number;        // EUR, first item / flat rate
  perKgCost: number;       // EUR per additional kg
  freeAbove: number | null; // EUR order total for free shipping (null = never free)
  estimatedDays: string;
}

export const regionConfigs: RegionConfig[] = [
  {
    region: "balkans",
    priceMultiplier: 0.75,
    label: "Western Balkans",
    description: "Lower prices for local customers in Albania, Serbia, and North Macedonia",
  },
  {
    region: "turkey",
    priceMultiplier: 0.80,
    label: "Turkey",
    description: "Adjusted pricing for the Turkish market",
  },
  {
    region: "western_europe",
    priceMultiplier: 1.0,
    label: "Western Europe",
    description: "Standard pricing for EU / UK / Switzerland customers",
  },
  {
    region: "international",
    priceMultiplier: 1.05,
    label: "International",
    description: "Worldwide pricing with additional handling",
  },
];

export const shippingRates: ShippingRate[] = [
  {
    zone: "domestic",
    label: "Domestic (same country)",
    baseCost: 3.00,
    perKgCost: 0.50,
    freeAbove: 40,
    estimatedDays: "2-4 business days",
  },
  {
    zone: "balkans",
    label: "Western Balkans (cross-border)",
    baseCost: 5.00,
    perKgCost: 1.00,
    freeAbove: 60,
    estimatedDays: "3-7 business days",
  },
  {
    zone: "turkey",
    label: "Turkey",
    baseCost: 8.00,
    perKgCost: 1.50,
    freeAbove: 80,
    estimatedDays: "5-10 business days",
  },
  {
    zone: "eu",
    label: "European Union",
    baseCost: 10.00,
    perKgCost: 2.00,
    freeAbove: 100,
    estimatedDays: "5-10 business days",
  },
  {
    zone: "international",
    label: "Rest of World",
    baseCost: 18.00,
    perKgCost: 3.50,
    freeAbove: null,
    estimatedDays: "10-21 business days",
  },
];

const localeToRegion: Record<SelectableLocale, PricingRegion> = {
  en: "western_europe",
  sr: "balkans",
  sq: "balkans",
  mk: "balkans",
};

const localeToShippingZone: Record<SelectableLocale, ShippingZone> = {
  en: "eu",
  sr: "balkans",
  sq: "balkans",
  mk: "balkans",
};

export function getRegionForLocale(locale: SelectableLocale): PricingRegion {
  return localeToRegion[locale] || "western_europe";
}

export function getShippingZoneForLocale(locale: SelectableLocale): ShippingZone {
  return localeToShippingZone[locale] || "eu";
}

export function getRegionConfig(region: PricingRegion): RegionConfig {
  return regionConfigs.find((r) => r.region === region) || regionConfigs[2];
}

export function getShippingRate(zone: ShippingZone): ShippingRate {
  return shippingRates.find((r) => r.zone === zone) || shippingRates[3];
}

export function getRegionalPrice(baseEurPrice: number, region: PricingRegion): number {
  const config = getRegionConfig(region);
  return baseEurPrice * config.priceMultiplier;
}

export function calculateShipping(
  orderTotalEur: number,
  zone: ShippingZone,
  weightKg: number = 1
): { cost: number; isFree: boolean; freeAbove: number | null } {
  const rate = getShippingRate(zone);
  if (rate.freeAbove !== null && orderTotalEur >= rate.freeAbove) {
    return { cost: 0, isFree: true, freeAbove: rate.freeAbove };
  }
  const cost = rate.baseCost + Math.max(0, weightKg - 1) * rate.perKgCost;
  return { cost, isFree: false, freeAbove: rate.freeAbove };
}

export function calculateMargin(
  basePrice: number,
  region: PricingRegion,
  zone: ShippingZone,
  weightKg: number = 1
): {
  sellingPrice: number;
  shippingCost: number;
  platformFee: number;
  artisanPayout: number;
  margin: number;
  marginPct: number;
} {
  const sellingPrice = getRegionalPrice(basePrice, region);
  const shipping = calculateShipping(sellingPrice, zone, weightKg);
  const platformFee = sellingPrice * 0.08;
  const artisanPayout = sellingPrice - platformFee;

  return {
    sellingPrice,
    shippingCost: shipping.cost,
    platformFee,
    artisanPayout,
    margin: platformFee,
    marginPct: (platformFee / sellingPrice) * 100,
  };
}
