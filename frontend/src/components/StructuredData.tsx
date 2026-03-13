import Script from "next/script";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PappoCrafts",
  url: "https://pappo.org",
  description:
    "PappoCrafts is a marketplace for unique handmade products crafted by Roma artisans across the Western Balkans. Discover pottery, textiles, jewelry, woodwork, and more — each piece tells a story of tradition and craftsmanship.",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PappoCrafts",
  url: "https://pappo.org",
};

export default function StructuredData() {
  const jsonLd = JSON.stringify([organizationSchema, websiteSchema]);

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}
