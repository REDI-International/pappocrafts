import type { Metadata } from "next";
import { getServiceProvider } from "@/lib/services";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const provider = getServiceProvider(id);

  if (!provider) {
    return { title: "Service Provider Not Found" };
  }

  const title = `${provider.name} — ${provider.title} in ${provider.location}, ${provider.country}`;
  const description = provider.description
    ? `${provider.description} ${provider.category} services by ${provider.name} in ${provider.location}, ${provider.country}. Book trusted local services on PappoShop.`
    : `${provider.title} services by ${provider.name} in ${provider.location}, ${provider.country}. Trusted Roma professional on PappoShop.`;

  return {
    title,
    description,
    keywords: [
      provider.name,
      provider.title,
      provider.category,
      provider.location,
      provider.country,
      "local services",
      "Western Balkans",
      `${provider.category} ${provider.country}`,
    ],
    alternates: {
      canonical: `https://pappo.org/services/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `https://pappo.org/services/${id}`,
      type: "profile",
      images: provider.image
        ? [{ url: provider.image, width: 400, height: 400, alt: provider.name }]
        : [{ url: "/og-image.png", width: 1200, height: 630 }],
    },
  };
}

export default function ServiceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
