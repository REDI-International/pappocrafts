import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Handmade Products from Roma Artisans",
  description:
    "Browse unique handmade products from Roma entrepreneurs across Serbia, Albania, Bosnia, Kosovo, North Macedonia, and Montenegro. Pottery, textiles, jewelry, furniture, clothing, and more.",
  keywords: [
    "handmade products", "buy handmade online", "Roma artisans shop",
    "Western Balkans marketplace", "handcrafted pottery", "handmade jewelry",
    "traditional Balkan textiles", "artisan woodwork", "fair trade products",
    "ručni rad Srbija", "zanatski proizvodi", "kupovina online",
    "artizanë shqiptare", "punë dore Ballkan",
    "rukotvorine Bosna", "рачна изработка Македонија",
  ],
  alternates: {
    canonical: "https://pappo.org/shop",
  },
  openGraph: {
    title: "Shop Handmade Products | PappoShop",
    description:
      "Unique handmade products from Roma entrepreneurs in the Western Balkans — pottery, textiles, jewelry, furniture, and more.",
    url: "https://pappo.org/shop",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
