"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useLayoutEffect,
  type ReactNode,
} from "react";
import {
  translations,
  isSelectableLocale,
  type SelectableLocale,
  type TranslationKey,
} from "./translations";
import {
  getRegionForLocale,
  getShippingZoneForLocale,
  getRegionConfig,
  getShippingRate,
  calculateShipping,
  type PricingRegion,
  type ShippingZone,
} from "./pricing";
import { UNITS_PER_ONE_EUR, amountInListingCurrencyToEur } from "./eur-fallback-rates";

export type CurrencyCode = "EUR" | "RSD" | "ALL" | "BAM" | "MKD" | "TRY";

interface LocaleConfig {
  code: SelectableLocale;
  name: string;
  flag: string;
  defaultCurrency: CurrencyCode;
}

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
  symbolPosition: "before" | "after";
  decimals: number;
}

export const currencies: CurrencyConfig[] = [
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺", symbolPosition: "before", decimals: 2 },
  { code: "RSD", symbol: "RSD", name: "Serbian Dinar", flag: "🇷🇸", symbolPosition: "after", decimals: 0 },
  { code: "ALL", symbol: "L", name: "Albanian Lek", flag: "🇦🇱", symbolPosition: "after", decimals: 0 },
  { code: "BAM", symbol: "KM", name: "Bosnian Mark", flag: "🇧🇦", symbolPosition: "after", decimals: 2 },
  { code: "MKD", symbol: "ден", name: "Macedonian Denar", flag: "🇲🇰", symbolPosition: "after", decimals: 0 },
  { code: "TRY", symbol: "₺", name: "Turkish Lira", flag: "🇹🇷", symbolPosition: "before", decimals: 2 },
];

export const locales: LocaleConfig[] = [
  { code: "en", name: "English", flag: "🇬🇧", defaultCurrency: "EUR" },
  { code: "sr", name: "Srpski", flag: "🇷🇸", defaultCurrency: "RSD" },
  { code: "sq", name: "Shqip", flag: "🇦🇱", defaultCurrency: "ALL" },
  { code: "mk", name: "Македонски", flag: "🇲🇰", defaultCurrency: "MKD" },
];

const FALLBACK_RATES: Record<string, number> = { ...UNITS_PER_ONE_EUR };

interface LocaleContextValue {
  locale: SelectableLocale;
  localeConfig: LocaleConfig;
  setLocale: (locale: SelectableLocale) => void;
  t: (key: TranslationKey) => string;
  currency: CurrencyCode;
  currencyConfig: CurrencyConfig;
  setCurrency: (code: CurrencyCode) => void;
  exchangeRates: Record<string, number>;
  ratesSource: "loading" | "live" | "fallback" | "cached";
  formatPrice: (eurPrice: number) => string;
  formatRegionalPrice: (eurBasePrice: number) => string;
  /** Price stored in DB with `storedCurrency` → formatted in the visitor’s selected currency. */
  formatProductRegionalPrice: (amount: number, storedCurrency?: string | null) => string;
  /** EUR equivalent for cart, checkout, and Stripe (listing currency → EUR). */
  getProductEurEquivalent: (amount: number, storedCurrency?: string | null) => number;
  getRegionalEurPrice: (eurBasePrice: number) => number;
  currencySymbol: string;
  region: PricingRegion;
  shippingZone: ShippingZone;
  regionLabel: string;
  getShippingCost: (orderTotalEur: number, weightKg?: number) => { cost: number; isFree: boolean; freeAbove: number | null };
  shippingEstimate: string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const LOCALE_COOKIE = "papposhop-locale";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function writeLocaleCookie(code: SelectableLocale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE}=${code};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};SameSite=Lax`;
}

/** Client-only: cookie may exist when localStorage was cleared (e.g. Safari ITP) or cache served HTML without reading the cookie on the server. */
function readLocaleFromDocumentCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const row = document.cookie.split("; ").find((r) => r.startsWith(`${LOCALE_COOKIE}=`));
  const raw = row?.slice(LOCALE_COOKIE.length + 1)?.trim();
  return raw || undefined;
}

export function LocaleProvider({
  children,
  initialLocale: initialLocaleProp,
}: {
  children: ReactNode;
  /** From server `cookies()` so the first HTML paint matches the user’s language (not only after useEffect). */
  initialLocale?: SelectableLocale;
}) {
  const [locale, setLocaleState] = useState<SelectableLocale>(() => {
    if (initialLocaleProp && locales.some((l) => l.code === initialLocaleProp)) return initialLocaleProp;
    return "en";
  });
  const [currency, setCurrencyState] = useState<CurrencyCode>("EUR");
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [ratesSource, setRatesSource] = useState<"loading" | "live" | "fallback" | "cached">("loading");

  const localeConfig = locales.find((l) => l.code === locale) || locales[0];
  const currencyConfig = currencies.find((c) => c.code === currency) || currencies[0];
  const region = getRegionForLocale(locale);
  const shippingZone = getShippingZoneForLocale(locale);
  const regionConfig = getRegionConfig(region);
  const shippingRate = getShippingRate(shippingZone);

  // Fetch live exchange rates on mount
  useEffect(() => {
    let cancelled = false;

    async function loadRates() {
      try {
        const res = await fetch("/api/exchange-rates");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (!cancelled && data.rates) {
          setExchangeRates({ ...FALLBACK_RATES, ...data.rates, EUR: 1 });
          setRatesSource(data.source === "live" ? "live" : data.source === "cached" ? "cached" : "fallback");
        }
      } catch {
        if (!cancelled) {
          setExchangeRates(FALLBACK_RATES);
          setRatesSource("fallback");
        }
      }
    }

    loadRates();
    return () => { cancelled = true; };
  }, []);

  // Before paint: align React locale with the browser cookie (not only localStorage). Fixes “How it works” staying English when LS was cleared or HTML was cached without server cookie.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    setLocaleState((current) => {
      const fromCookieRaw = readLocaleFromDocumentCookie();
      if (isSelectableLocale(fromCookieRaw)) {
        const next = fromCookieRaw;
        localStorage.setItem("papposhop-locale", next);
        document.documentElement.lang = next;
        return next;
      }
      if (initialLocaleProp && locales.some((l) => l.code === initialLocaleProp)) {
        localStorage.setItem("papposhop-locale", initialLocaleProp);
        document.documentElement.lang = initialLocaleProp;
        return initialLocaleProp;
      }
      const ls = (localStorage.getItem("papposhop-locale") || localStorage.getItem("pappocrafts-locale")) as SelectableLocale | null;
      const localeOk = ls && locales.some((l) => l.code === ls);
      if (localeOk) {
        writeLocaleCookie(ls);
        document.documentElement.lang = ls;
        return ls;
      }
      return current;
    });
  }, [initialLocaleProp]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedCurrency = (localStorage.getItem("papposhop-currency") || localStorage.getItem("pappocrafts-currency")) as CurrencyCode | null;
    const currencyOk = savedCurrency && currencies.some((c) => c.code === savedCurrency);
    if (currencyOk) {
      setCurrencyState(savedCurrency);
    } else {
      const lc = locales.find((l) => l.code === locale);
      if (lc) {
        setCurrencyState(lc.defaultCurrency);
        localStorage.setItem("papposhop-currency", lc.defaultCurrency);
      }
    }
  }, [locale]);

  const setLocale = useCallback((code: SelectableLocale) => {
    setLocaleState(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("papposhop-locale", code);
      writeLocaleCookie(code);
      document.documentElement.lang = code;
    }
  }, []);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("papposhop-currency", code);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[locale]?.[key] || translations.en[key] || key;
    },
    [locale]
  );

  const formatCurrency = useCallback(
    (eurAmount: number): string => {
      const rate = exchangeRates[currency] || FALLBACK_RATES[currency] || 1;
      const converted = eurAmount * rate;

      const formatted = currencyConfig.decimals === 0
        ? Math.round(converted).toLocaleString()
        : converted.toFixed(currencyConfig.decimals);

      return currencyConfig.symbolPosition === "before"
        ? `${currencyConfig.symbol}${formatted}`
        : `${formatted} ${currencyConfig.symbol}`;
    },
    [currency, currencyConfig, exchangeRates]
  );

  const formatPrice = formatCurrency;

  /** Services / legacy EUR-stored amounts: value is already EUR before applying the visitor’s currency. */
  const getRegionalEurPrice = useCallback((eurBasePrice: number): number => eurBasePrice, []);

  const formatRegionalPrice = useCallback(
    (eurBasePrice: number): string => formatCurrency(eurBasePrice),
    [formatCurrency]
  );

  const formatProductRegionalPrice = useCallback(
    (amount: number, storedCurrency?: string | null): string =>
      formatCurrency(amountInListingCurrencyToEur(amount, storedCurrency)),
    [formatCurrency]
  );

  const getProductEurEquivalent = useCallback(
    (amount: number, storedCurrency?: string | null): number =>
      amountInListingCurrencyToEur(amount, storedCurrency),
    []
  );

  const getShippingCost = useCallback(
    (orderTotalEur: number, weightKg: number = 1) =>
      calculateShipping(orderTotalEur, shippingZone, weightKg),
    [shippingZone]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      localeConfig,
      setLocale,
      t,
      currency,
      currencyConfig,
      setCurrency,
      exchangeRates,
      ratesSource,
      formatPrice,
      formatRegionalPrice,
      formatProductRegionalPrice,
      getProductEurEquivalent,
      getRegionalEurPrice,
      currencySymbol: currencyConfig.symbol,
      region,
      shippingZone,
      regionLabel: regionConfig.label,
      getShippingCost,
      shippingEstimate: shippingRate.estimatedDays,
    }),
    [locale, localeConfig, setLocale, t, currency, currencyConfig, setCurrency, exchangeRates, ratesSource, formatPrice, formatRegionalPrice, formatProductRegionalPrice, getProductEurEquivalent, getRegionalEurPrice, region, shippingZone, regionConfig, getShippingCost, shippingRate]
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
