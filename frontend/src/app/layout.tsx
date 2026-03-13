import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { LocaleProvider } from "@/lib/locale-context";
import { SiteSettingsProvider } from "@/lib/site-settings-context";
import PostHogProvider from "@/components/PostHogProvider";
import Analytics from "@/components/Analytics";
import StructuredData from "@/components/StructuredData";
import CookieConsent from "@/components/CookieConsent";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pappo.org"),
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon" }],
  },
  title: {
    default: "PappoShop — Handmade by Roma Artisans in the Balkans",
    template: "%s | PappoShop",
  },
  description:
    "Discover unique handmade products and services from Roma entrepreneurs across the Western Balkans — Serbia, Albania, Bosnia, Kosovo, North Macedonia, Montenegro. Pottery, textiles, jewelry, traditional clothing, furniture, and more.",
  keywords: [
    "handmade products", "Roma artisans", "Western Balkans", "marketplace",
    "handcrafted", "pottery", "textiles", "jewelry", "woodwork", "craftsmanship",
    "traditional clothing", "furniture", "home decor", "eco products",
    "Serbia", "Albania", "Bosnia", "Kosovo", "North Macedonia", "Montenegro",
    "ručni rad", "zanatstvo", "Balkanski proizvodi",
    "artizanë", "punë dore", "prodhime ballkanike",
    "Roma entrepreneurs", "social enterprise", "fair trade Balkans",
    "buy handmade Balkans", "kupovina online Balkan",
    "papposhop", "pappo shop", "pappo.org",
  ],
  authors: [{ name: "PappoShop", url: "https://pappo.org" }],
  creator: "PappoShop",
  publisher: "PappoShop",
  alternates: {
    canonical: "https://pappo.org",
    languages: {
      "en": "https://pappo.org",
      "sr": "https://pappo.org",
      "sq": "https://pappo.org",
      "bs": "https://pappo.org",
      "mk": "https://pappo.org",
      "tr": "https://pappo.org",
      "x-default": "https://pappo.org",
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    title: "PappoShop — Handmade by Roma Artisans in the Balkans",
    description:
      "Discover unique handmade products and services from Roma entrepreneurs across Serbia, Albania, Bosnia, Kosovo, North Macedonia, and Montenegro.",
    type: "website",
    locale: "en_US",
    alternateLocale: ["sr_RS", "sq_AL", "bs_BA", "mk_MK", "tr_TR"],
    siteName: "PappoShop",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PappoShop — Handmade by Roma Artisans in the Western Balkans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PappoShop — Handmade by Roma Artisans in the Balkans",
    description:
      "Unique handmade products from Roma entrepreneurs in Serbia, Albania, Bosnia, Kosovo, North Macedonia, and Montenegro.",
    images: ["/og-image.png"],
  },
  category: "shopping",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <StructuredData />
        <Analytics />
        <Suspense fallback={null}>
          <PostHogProvider>
            <SiteSettingsProvider><LocaleProvider><CartProvider>{children}</CartProvider></LocaleProvider></SiteSettingsProvider>
          </PostHogProvider>
        </Suspense>
        <CookieConsent />
      </body>
    </html>
  );
}
