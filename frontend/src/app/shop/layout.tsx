import type { Metadata } from "next";
import { getDomainConfig } from "@/lib/domain-config";

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getDomainConfig();

  const isEU = cfg.region === "eu";

  return {
    title: isEU
      ? "Shop Handmade Products from Roma Artisans | EU Delivery"
      : "Shop Handmade Products from Roma Artisans",
    description: isEU
      ? "Browse authentic handmade products from Roma artisans — delivered across the European Union. Pottery, textiles, jewelry, furniture, clothing, and more. Free EU shipping over €75."
      : "Browse unique handmade products from Roma entrepreneurs across Serbia, Albania, Bosnia, Kosovo, North Macedonia, and Montenegro. Pottery, textiles, jewelry, furniture, clothing, and more.",
    keywords: isEU
      ? [
          "handmade products Europe", "buy handmade EU", "artisan marketplace",
          "handcrafted pottery", "handmade jewelry Europe", "fair trade EU",
          "artisan furniture Europe", "traditional crafts", "ethical shopping",
          "kunsthandwerk", "fait main", "handgemaakt", "artigianato",
        ]
      : [
          "handmade products", "buy handmade online", "Roma artisans shop",
          "Western Balkans marketplace", "handcrafted pottery", "handmade jewelry",
          "traditional Balkan textiles", "artisan woodwork", "fair trade products",
          "ručni rad Srbija", "zanatski proizvodi", "kupovina online",
          "artizanë shqiptare", "punë dore Ballkan",
          "rukotvorine Bosna", "рачна изработка Македонија",
        ],
    alternates: { canonical: `${cfg.baseUrl}/shop` },
    openGraph: {
      title: `Shop Handmade Products | PappoShop`,
      description: isEU
        ? "Authentic handmade products from Roma artisans — delivered across the EU. Free shipping over €75."
        : "Unique handmade products from Roma entrepreneurs in the Western Balkans.",
      url: `${cfg.baseUrl}/shop`,
      type: "website",
      images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
