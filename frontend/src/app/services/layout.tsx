import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Local Services from Roma Entrepreneurs in the Balkans",
  description:
    "Find trusted local services from Roma professionals across Serbia, Albania, Bosnia, Kosovo, North Macedonia, and Montenegro. Home repair, cleaning, pet care, beauty, tutoring, transport, and IT services.",
  keywords: [
    "local services Balkans", "Roma service providers", "handyman Serbia",
    "cleaning services Balkans", "home repair Albania", "pet care Balkans",
    "tutoring services", "transport services", "beauty services",
    "usluge Srbija", "majstori Balkan", "čišćenje kuće",
    "shërbime lokale Shqipëri", "riparime shtëpie",
    "usluge Bosna", "услуги Македонија",
  ],
  alternates: {
    canonical: "https://pappo.org/services",
  },
  openGraph: {
    title: "Local Services from Roma Entrepreneurs | PappoShop",
    description:
      "Trusted local services from Roma professionals across the Western Balkans. Home repair, cleaning, beauty, tutoring, and more.",
    url: "https://pappo.org/services",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
