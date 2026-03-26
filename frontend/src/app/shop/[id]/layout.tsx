import type { Metadata } from "next";
import Script from "next/script";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDomainConfig } from "@/lib/domain-config";

type Props = {
  params: Promise<{ id: string }>;
};

interface ProductData {
  name: string;
  description: string | null;
  category: string | null;
  artisan: string;
  country: string;
  image: string | null;
  price: number;
  in_stock: boolean;
}

async function getProduct(id: string): Promise<ProductData | null> {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("products")
      .select("name, description, category, artisan, country, image, price, in_stock")
      .eq("id", id)
      .eq("approval_status", "approved")
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [product, cfg] = await Promise.all([getProduct(id), getDomainConfig()]);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const isEU = cfg.region === "eu";
  const regionLabel = isEU ? "Europe" : "the Western Balkans";
  const title = `${product.name} by ${product.artisan} — Handmade in ${product.country}`;
  const description = product.description
    ? `${product.description} Handcrafted by ${product.artisan} from ${product.country}. Buy authentic handmade ${product.category?.toLowerCase()} from ${regionLabel} on PappoShop.`
    : `Buy ${product.name} — authentic handmade ${product.category?.toLowerCase()} crafted by ${product.artisan} from ${product.country}. Shop unique artisan products from ${regionLabel}.`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.artisan,
      product.country,
      product.category,
      "handmade",
      "artisan",
      isEU ? "Europe" : "Western Balkans",
      "buy online",
      `handmade ${product.category?.toLowerCase() ?? "product"}`,
    ].filter((k): k is string => !!k),
    alternates: {
      canonical: `${cfg.baseUrl}/shop/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `${cfg.baseUrl}/shop/${id}`,
      type: "website",
      images: product.image
        ? [{ url: product.image, width: 800, height: 800, alt: product.name }]
        : [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.image ? [product.image] : ["/og-image.png"],
    },
  };
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, cfg] = await Promise.all([getProduct(id), getDomainConfig()]);

  const shippingDest =
    cfg.region === "eu"
      ? [
          { "@type": "DefinedRegion", addressCountry: "DE" },
          { "@type": "DefinedRegion", addressCountry: "FR" },
          { "@type": "DefinedRegion", addressCountry: "NL" },
          { "@type": "DefinedRegion", addressCountry: "AT" },
          { "@type": "DefinedRegion", addressCountry: "IT" },
          { "@type": "DefinedRegion", addressCountry: "ES" },
          { "@type": "DefinedRegion", addressCountry: "BE" },
          { "@type": "DefinedRegion", addressCountry: "PL" },
          { "@type": "DefinedRegion", addressCountry: "SE" },
        ]
      : [
          { "@type": "DefinedRegion", addressCountry: "RS" },
          { "@type": "DefinedRegion", addressCountry: "AL" },
          { "@type": "DefinedRegion", addressCountry: "BA" },
          { "@type": "DefinedRegion", addressCountry: "MK" },
          { "@type": "DefinedRegion", addressCountry: "ME" },
        ];

  const jsonLd = product
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description:
          product.description ||
          `Handmade ${product.category?.toLowerCase()} by ${product.artisan} from ${product.country}`,
        image: product.image || undefined,
        brand: { "@type": "Brand", name: product.artisan },
        manufacturer: {
          "@type": "Organization",
          name: product.artisan,
          address: { "@type": "PostalAddress", addressCountry: product.country },
        },
        category: product.category || undefined,
        url: `${cfg.baseUrl}/shop/${id}`,
        offers: {
          "@type": "Offer",
          url: `${cfg.baseUrl}/shop/${id}`,
          priceCurrency: "EUR",
          price: product.price.toFixed(2),
          availability: product.in_stock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          seller: {
            "@type": "Organization",
            name: "PappoShop",
            url: cfg.baseUrl,
          },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingDestination: shippingDest,
          },
        },
      })
    : null;

  return (
    <>
      {jsonLd && (
        <Script
          id={`product-jsonld-${id}`}
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      {children}
    </>
  );
}
