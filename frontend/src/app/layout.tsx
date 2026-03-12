import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { LocaleProvider } from "@/lib/locale-context";
import { SiteSettingsProvider } from "@/lib/site-settings-context";
import PostHogProvider from "@/components/PostHogProvider";
import Analytics from "@/components/Analytics";
import StructuredData from "@/components/StructuredData";
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
  title: "PappoCrafts — Handmade by Roma Artisans in the Balkans",
  description:
    "Discover unique handmade products crafted by Roma entrepreneurs across the Western Balkans. Pottery, textiles, jewelry, woodwork, and more — each piece tells a story.",
  keywords: [
    "handmade", "Roma artisans", "Balkans", "marketplace", "pottery",
    "textiles", "jewelry", "woodwork", "Western Balkans", "craftsmanship",
  ],
  authors: [{ name: "PappoCrafts", url: "https://pappo.org" }],
  creator: "PappoCrafts",
  publisher: "PappoCrafts",
  alternates: {
    canonical: "https://pappo.org",
  },
  robots: {
    googleBot: {
      "max-image-preview": "large",
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    title: "PappoCrafts — Handmade by Roma Artisans in the Balkans",
    description: "Discover unique handmade products crafted by Roma entrepreneurs across the Western Balkans.",
    type: "website",
    locale: "en_US",
    siteName: "PappoCrafts",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PappoCrafts — Handmade by Roma Artisans in the Balkans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PappoCrafts — Handmade by Roma Artisans in the Balkans",
    description: "Discover unique handmade products crafted by Roma entrepreneurs across the Western Balkans.",
    images: ["/og-image.png"],
  },
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
      </body>
    </html>
  );
}
