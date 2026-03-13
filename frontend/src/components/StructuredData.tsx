import Script from "next/script";
import { getDomainConfig, type DomainConfig } from "@/lib/domain-config";

function buildSchemas(cfg: DomainConfig) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PappoShop",
    alternateName: ["Pappo Shop", "PappoShop.org"],
    url: cfg.baseUrl,
    logo: `${cfg.baseUrl}/pappocrafts-logo.png`,
    description:
      cfg.region === "balkans"
        ? "PappoShop is a social enterprise marketplace connecting Roma artisans and entrepreneurs across the Western Balkans with customers who value authenticity, craftsmanship, and social impact."
        : "PappoShop is a social enterprise marketplace bringing authentic handmade products from Roma artisans in the Balkans to customers across the European Union.",
    sameAs: [cfg.alternateUrl],
    contactPoint: {
      "@type": "ContactPoint",
      email: "petrica@redi-ngo.eu",
      contactType: "customer service",
      availableLanguage: cfg.languages.map((l) => l.toUpperCase()),
    },
    areaServed: cfg.areaServed,
    foundingDate: "2024",
    knowsLanguage: cfg.languages,
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PappoShop",
    alternateName: "Pappo Shop",
    url: cfg.baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${cfg.baseUrl}/shop?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: cfg.languages,
  };

  const onlineStoreSchema = {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "PappoShop",
    url: `${cfg.baseUrl}/shop`,
    description:
      cfg.region === "balkans"
        ? "Online marketplace for handmade products and services from Roma entrepreneurs in Serbia, Albania, Bosnia, Kosovo, North Macedonia, and Montenegro."
        : "Online marketplace delivering authentic handmade products from Roma artisans in the Balkans to customers across the European Union. Free EU shipping over €75.",
    currenciesAccepted: "EUR",
    paymentAccepted: "Credit Card, Bank Transfer, Cash on Delivery",
    areaServed: cfg.areaServed,
    availableLanguage: cfg.languages.map((code) => ({
      "@type": "Language",
      alternateName: code,
    })),
  };

  const breadcrumbHomeSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: cfg.baseUrl },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${cfg.baseUrl}/shop` },
      { "@type": "ListItem", position: 3, name: "Services", item: `${cfg.baseUrl}/services` },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is PappoShop?",
        acceptedAnswer: {
          "@type": "Answer",
          text: cfg.region === "balkans"
            ? "PappoShop is an online marketplace for unique handmade products and services from Roma entrepreneurs across the Western Balkans, including Serbia, Albania, Bosnia, Kosovo, North Macedonia, and Montenegro."
            : "PappoShop is an online marketplace bringing authentic handmade products from Roma artisans in the Balkans to customers across the European Union, with free shipping on orders over €75.",
        },
      },
      {
        "@type": "Question",
        name: "What products can I buy on PappoShop?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "You can find handmade pottery and ceramics, textiles, jewelry, woodwork, leather goods, traditional clothing, furniture, home decor, beauty products, eco products, and agricultural products — all crafted by skilled Roma artisans.",
        },
      },
      {
        "@type": "Question",
        name: "Which countries does PappoShop ship to?",
        acceptedAnswer: {
          "@type": "Answer",
          text: cfg.region === "balkans"
            ? "PappoShop ships across the Western Balkans (Serbia, Albania, Bosnia, Kosovo, North Macedonia, Montenegro) and to all EU countries, the UK, US, Canada, and Switzerland."
            : "PappoShop delivers to all EU countries including Germany, France, Netherlands, Austria, Italy, Spain, Belgium, Ireland, Sweden, Poland, and more. We also ship to the UK, US, Canada, and Switzerland.",
        },
      },
      {
        "@type": "Question",
        name: "How does PappoShop support Roma communities?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Every purchase on PappoShop directly supports Roma entrepreneurs and their families. We provide a platform for artisans to sell their products and services, preserving centuries-old craft traditions while creating sustainable livelihoods.",
        },
      },
      {
        "@type": "Question",
        name: "What payment methods does PappoShop accept?",
        acceptedAnswer: {
          "@type": "Answer",
          text: cfg.region === "balkans"
            ? "PappoShop accepts online payment via credit/debit card (Stripe), bank transfer, and cash on delivery for select regions in the Western Balkans."
            : "PappoShop accepts secure online payment via credit/debit card through Stripe, as well as bank transfer. All transactions are processed in EUR.",
        },
      },
    ],
  };

  return [organizationSchema, websiteSchema, onlineStoreSchema, breadcrumbHomeSchema, faqSchema];
}

export default async function StructuredData() {
  const cfg = await getDomainConfig();
  const schemas = buildSchemas(cfg);
  const jsonLd = JSON.stringify(schemas);

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}
