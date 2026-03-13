import Script from "next/script";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "PappoShop",
  alternateName: ["Pappo Shop", "PappoShop.org"],
  url: "https://pappo.org",
  logo: "https://pappo.org/pappocrafts-logo.png",
  description:
    "PappoShop is a social enterprise marketplace connecting Roma artisans and entrepreneurs across the Western Balkans with customers who value authenticity, craftsmanship, and social impact.",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    email: "petrica@redi-ngo.eu",
    contactType: "customer service",
    availableLanguage: [
      "English", "Serbian", "Albanian", "Bosnian", "Macedonian", "Turkish",
    ],
  },
  areaServed: [
    { "@type": "Country", name: "Serbia" },
    { "@type": "Country", name: "Albania" },
    { "@type": "Country", name: "Bosnia and Herzegovina" },
    { "@type": "Country", name: "Kosovo" },
    { "@type": "Country", name: "North Macedonia" },
    { "@type": "Country", name: "Montenegro" },
  ],
  foundingDate: "2024",
  knowsLanguage: ["en", "sr", "sq", "bs", "mk", "tr"],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PappoShop",
  alternateName: "Pappo Shop",
  url: "https://pappo.org",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://pappo.org/shop?search={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
  inLanguage: ["en", "sr", "sq", "bs", "mk", "tr"],
};

const onlineStoreSchema = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "PappoShop",
  url: "https://pappo.org/shop",
  description:
    "Online marketplace for handmade products and services from Roma entrepreneurs in Serbia, Albania, Bosnia, Kosovo, North Macedonia, and Montenegro.",
  currenciesAccepted: "EUR",
  paymentAccepted: "Credit Card, Bank Transfer, Cash on Delivery",
  areaServed: [
    { "@type": "Country", name: "Serbia" },
    { "@type": "Country", name: "Albania" },
    { "@type": "Country", name: "Bosnia and Herzegovina" },
    { "@type": "Country", name: "Kosovo" },
    { "@type": "Country", name: "North Macedonia" },
    { "@type": "Country", name: "Montenegro" },
    { "@type": "Place", name: "European Union" },
  ],
  availableLanguage: [
    { "@type": "Language", name: "English", alternateName: "en" },
    { "@type": "Language", name: "Serbian", alternateName: "sr" },
    { "@type": "Language", name: "Albanian", alternateName: "sq" },
    { "@type": "Language", name: "Bosnian", alternateName: "bs" },
    { "@type": "Language", name: "Macedonian", alternateName: "mk" },
    { "@type": "Language", name: "Turkish", alternateName: "tr" },
  ],
};

const breadcrumbHomeSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://pappo.org",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Shop",
      item: "https://pappo.org/shop",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Services",
      item: "https://pappo.org/services",
    },
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
        text: "PappoShop is an online marketplace for unique handmade products and services from Roma entrepreneurs across the Western Balkans, including Serbia, Albania, Bosnia, Kosovo, North Macedonia, and Montenegro.",
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
        text: "PappoShop ships across the Western Balkans (Serbia, Albania, Bosnia, Kosovo, North Macedonia, Montenegro) and to all EU countries, the UK, US, Canada, and Switzerland.",
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
        text: "PappoShop accepts online payment via credit/debit card (Stripe), bank transfer, and cash on delivery for select regions in the Western Balkans.",
      },
    },
  ],
};

export default function StructuredData() {
  const jsonLd = JSON.stringify([
    organizationSchema,
    websiteSchema,
    onlineStoreSchema,
    breadcrumbHomeSchema,
    faqSchema,
  ]);

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: jsonLd }}
    />
  );
}
