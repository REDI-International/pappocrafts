import type { Metadata } from "next";
import { cookies } from "next/headers";
import ShopPage from "@/components/ShopPage";
import { generateShopListingMetadata } from "@/lib/shop-listing-metadata";
import { INTRO_COOKIE } from "@/components/IntroEntryLayer";

export async function generateMetadata(): Promise<Metadata> {
  return generateShopListingMetadata();
}

export default async function Home() {
  const cookieStore = await cookies();
  const hasIntroCookie = Boolean(cookieStore.get(INTRO_COOKIE)?.value);
  return <ShopPage showIntro={!hasIntroCookie} />;
}
