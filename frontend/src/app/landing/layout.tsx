import type { Metadata } from "next";
import { getDomainConfig } from "@/lib/domain-config";

/** Per-request HTML so `cookies().get("papposhop-locale")` in root layout is not served from a shared static cache. */
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getDomainConfig();
  return {
    title: "Our Story & How PappoShop Works",
    description:
      cfg.region === "eu"
        ? "How PappoShop connects Roma artisans with customers across the EU. Categories, services, mission, and community waitlist."
        : "How PappoShop works: discover handmade products and local services from Roma entrepreneurs in North Macedonia, Albania, and Serbia.",
    alternates: { canonical: `${cfg.baseUrl}/landing` },
  };
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
