import type { Metadata } from "next";
import ShopPage from "@/components/ShopPage";
import { generateShopListingMetadata } from "@/lib/shop-listing-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return generateShopListingMetadata();
}

export default function Home() {
  return <ShopPage />;
}
