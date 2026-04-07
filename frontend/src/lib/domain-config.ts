import { headers } from "next/headers";

export type DomainRegion = "balkans" | "eu";

export interface DomainConfig {
  region: DomainRegion;
  baseUrl: string;
  siteName: string;
  title: string;
  description: string;
  keywords: string[];
  areaServed: { "@type": string; name: string }[];
  ogLocale: string;
  alternateLocales: string[];
  languages: string[];
  alternateUrl: string;
}

const BALKANS_CONFIG: DomainConfig = {
  region: "balkans",
  baseUrl: "https://papposhop.org",
  siteName: "PappoShop",
  title: "PappoShop — Handmade by Roma Artisans in the Western Balkans",
  description:
    "Discover unique handmade products and services from Roma entrepreneurs in North Macedonia, Albania, and Serbia. Pottery, textiles, jewelry, traditional clothing, furniture, and more.",
  keywords: [
    "handmade products", "Roma artisans", "Western Balkans", "marketplace",
    "handcrafted", "pottery", "textiles", "jewelry", "woodwork", "craftsmanship",
    "traditional clothing", "furniture", "home decor", "eco products",
    "Serbia", "Albania", "North Macedonia",
    "ručni rad", "zanatstvo", "Balkanski proizvodi",
    "artizanë", "punë dore", "prodhime ballkanike",
    "Roma entrepreneurs", "social enterprise", "fair trade Balkans",
    "buy handmade Balkans", "kupovina online Balkan",
    "papposhop", "pappo shop", "papposhop.org",
  ],
  areaServed: [
    { "@type": "Country", name: "Serbia" },
    { "@type": "Country", name: "Albania" },
    { "@type": "Country", name: "North Macedonia" },
  ],
  ogLocale: "en_US",
  alternateLocales: ["sr_RS", "sq_AL", "mk_MK"],
  languages: ["en", "sr", "sq", "mk"],
  alternateUrl: "https://pappo.org",
};

const EU_CONFIG: DomainConfig = {
  region: "eu",
  baseUrl: "https://pappo.org",
  siteName: "PappoShop",
  title: "PappoShop — Authentic Handmade Products from Roma Artisans | Europe",
  description:
    "Shop authentic handmade products from Roma artisans — delivered across the European Union. Unique pottery, textiles, jewelry, furniture, home decor, and traditional crafts from the Balkans. Free EU shipping on orders over €75.",
  keywords: [
    "handmade products Europe", "artisan marketplace EU", "Roma artisans",
    "handcrafted pottery", "handmade jewelry Europe", "fair trade EU",
    "unique handmade gifts", "European marketplace", "artisan furniture",
    "traditional crafts Europe", "handmade textiles", "eco products EU",
    "buy handmade Europe", "artisan home decor", "ethical shopping EU",
    "Germany", "France", "Netherlands", "Austria", "Italy", "Spain",
    "Belgium", "Ireland", "Sweden", "Poland", "Czech Republic",
    "kunsthandwerk", "fait main", "handgemaakt", "artigianato",
    "Roma entrepreneurs", "social enterprise Europe",
    "papposhop", "pappo.org",
  ],
  areaServed: [
    { "@type": "Place", name: "European Union" },
    { "@type": "Country", name: "Germany" },
    { "@type": "Country", name: "France" },
    { "@type": "Country", name: "Netherlands" },
    { "@type": "Country", name: "Austria" },
    { "@type": "Country", name: "Italy" },
    { "@type": "Country", name: "Spain" },
    { "@type": "Country", name: "Belgium" },
    { "@type": "Country", name: "Ireland" },
    { "@type": "Country", name: "Sweden" },
    { "@type": "Country", name: "Poland" },
  ],
  ogLocale: "en_US",
  alternateLocales: ["de_DE", "fr_FR", "nl_NL", "it_IT", "es_ES", "pl_PL"],
  languages: ["en", "de", "fr", "nl", "it", "es"],
  alternateUrl: "https://papposhop.org",
};

/**
 * Detect the current domain at build/request time using Next.js `headers()`.
 * Falls back to the SITE_REGION env var, then to "eu" for pappo.org.
 */
export async function getDomainConfig(): Promise<DomainConfig> {
  let host = "";
  try {
    const h = await headers();
    host = h.get("x-forwarded-host") || h.get("host") || "";
  } catch {
    // Static generation — headers() unavailable
  }

  if (host.includes("papposhop.org")) return BALKANS_CONFIG;
  if (host.includes("pappo.org")) return EU_CONFIG;

  const region = process.env.SITE_REGION;
  if (region === "balkans") return BALKANS_CONFIG;

  return EU_CONFIG;
}

/**
 * Synchronous version for static/client contexts using env var only.
 */
export function getDomainConfigStatic(): DomainConfig {
  return process.env.SITE_REGION === "balkans" ? BALKANS_CONFIG : EU_CONFIG;
}

export { BALKANS_CONFIG, EU_CONFIG };
