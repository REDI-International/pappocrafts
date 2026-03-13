import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

type Props = {
  params: Promise<{ id: string }>;
};

async function getProduct(id: string) {
  try {
    const db = createAdminClient();
    const { data } = await db
      .from("products")
      .select("name, description, category, artisan, country, image, price")
      .eq("id", id)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const title = `${product.name} by ${product.artisan} — Handmade in ${product.country}`;
  const description = product.description
    ? `${product.description} Handcrafted by ${product.artisan} from ${product.country}. Buy authentic handmade ${product.category?.toLowerCase()} from the Western Balkans on PappoShop.`
    : `Buy ${product.name} — authentic handmade ${product.category?.toLowerCase()} crafted by ${product.artisan} from ${product.country}. Shop unique artisan products from the Western Balkans.`;

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
      "Western Balkans",
      "buy online",
      `handmade ${product.category?.toLowerCase()}`,
    ].filter(Boolean),
    alternates: {
      canonical: `https://pappo.org/shop/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://pappo.org/shop/${id}`,
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

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
