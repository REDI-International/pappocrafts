import type { Metadata } from "next";
import { getDomainConfig } from "@/lib/domain-config";

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getDomainConfig();

  const isEU = cfg.region === "eu";

  return {
    title: isEU
      ? "Local Services from Roma Entrepreneurs | Available Across Europe"
      : "Local Services from Roma Entrepreneurs in the Balkans",
    description: isEU
      ? "Find trusted services from Roma professionals — available across the EU and the Western Balkans. Home repair, cleaning, pet care, beauty, tutoring, transport, and IT services."
      : "Find trusted local services from Roma professionals across Serbia, Albania, Bosnia, Kosovo, North Macedonia, and Montenegro. Home repair, cleaning, pet care, beauty, tutoring, transport, and IT services.",
    keywords: isEU
      ? [
          "local services Europe", "Roma service providers EU", "handyman EU",
          "cleaning services", "home repair Europe", "pet care services",
          "tutoring services", "transport services", "beauty services",
          "Dienstleistungen", "services à domicile", "servizi locali",
        ]
      : [
          "local services Balkans", "Roma service providers", "handyman Serbia",
          "cleaning services Balkans", "home repair Albania", "pet care Balkans",
          "tutoring services", "transport services", "beauty services",
          "usluge Srbija", "majstori Balkan", "čišćenje kuće",
          "shërbime lokale Shqipëri", "riparime shtëpie",
          "usluge Bosna", "услуги Македонија",
        ],
    alternates: { canonical: `${cfg.baseUrl}/services` },
    openGraph: {
      title: "Local Services from Roma Entrepreneurs | PappoShop",
      description: isEU
        ? "Trusted services from Roma professionals — available across Europe."
        : "Trusted local services from Roma professionals across the Western Balkans.",
      url: `${cfg.baseUrl}/services`,
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
