import type { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { Inter, Playfair_Display } from "next/font/google";
import { CartProvider } from "@/lib/cart-context";
import { LocaleProvider } from "@/lib/locale-context";
import { isSelectableLocale, type SelectableLocale } from "@/lib/translations";
import { SiteSettingsProvider } from "@/lib/site-settings-context";
import PostHogProvider from "@/components/PostHogProvider";
import Analytics from "@/components/Analytics";
import StructuredData from "@/components/StructuredData";
import CookieConsent from "@/components/CookieConsent";
import { getDomainConfig } from "@/lib/domain-config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
});

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getDomainConfig();
  const langMap = Object.fromEntries(cfg.languages.map((l) => [l, cfg.baseUrl]));

  return {
    metadataBase: new URL(cfg.baseUrl),
    icons: {
      icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon" }],
    },
    title: {
      default: cfg.title,
      template: "%s | PappoShop",
    },
    description: cfg.description,
    keywords: cfg.keywords,
    authors: [{ name: "PappoShop", url: cfg.baseUrl }],
    creator: "PappoShop",
    publisher: "PappoShop",
    alternates: {
      canonical: cfg.baseUrl,
      languages: { ...langMap, "x-default": cfg.baseUrl },
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
      title: cfg.title,
      description: cfg.description,
      type: "website",
      locale: cfg.ogLocale,
      alternateLocale: cfg.alternateLocales,
      siteName: cfg.siteName,
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: cfg.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: cfg.title,
      description: cfg.description,
      images: ["/og-image.png"],
    },
    category: "shopping",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("papposhop-locale")?.value;
  const initialLocale: SelectableLocale | undefined = isSelectableLocale(rawLocale) ? rawLocale : undefined;
  const htmlLang = initialLocale ?? "en";

  return (
    <html lang={htmlLang} suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} antialiased`}>
        <StructuredData />
        <Analytics />
        <Suspense fallback={null}>
          <PostHogProvider>
            <SiteSettingsProvider>
              <LocaleProvider initialLocale={initialLocale}>
                <CartProvider>{children}</CartProvider>
              </LocaleProvider>
            </SiteSettingsProvider>
          </PostHogProvider>
        </Suspense>
        <CookieConsent />
      </body>
    </html>
  );
}
