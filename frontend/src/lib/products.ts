import { galleryFromProductRow } from "@/lib/product-images";

export interface Product {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  currency: string;
  category: string;
  artisan: string;
  /** Public shop label (business or maker). */
  businessName: string;
  /** Stable filter for “all products from this business” when set. */
  businessSlug: string;
  country: string;
  /** Listing contact phone (E.164 or local format). */
  phone: string;
  /** Primary image (first in `images`). */
  image: string;
  /** Gallery URLs in order (max 5). */
  images: string[];
  tags: string[];
  inStock: boolean;
}

/** Canonical order: crafts & fashion → home & living → food & nature → electronics & auto (filters / URLs use these English strings). */
export const categories = [
  "All",
  "Pottery & Ceramics",
  "Textiles & Weaving",
  "Jewelry & Metalwork",
  "Woodwork & Carving",
  "Leather Goods",
  "Traditional Clothing",
  "Handmade Accessories",
  "Art & Paintings",
  "Home Decor",
  "Furniture",
  "Food & Spices",
  "Eco Products",
  "Natural Products",
  "Agricultural Products",
  "Beauty & Personal Care",
  "Machines",
  "Electronics",
  "Auto",
];

/** Emoji per category for the same horizontal chip strip pattern as the services page. */
const SHOP_CATEGORY_ICONS: Partial<Record<string, string>> = {
  All: "🔍",
  "Pottery & Ceramics": "🏺",
  "Textiles & Weaving": "🧶",
  "Jewelry & Metalwork": "💍",
  "Woodwork & Carving": "🪵",
  "Leather Goods": "👜",
  "Traditional Clothing": "👗",
  "Handmade Accessories": "🎀",
  "Art & Paintings": "🖼️",
  "Home Decor": "🏡",
  Furniture: "🪑",
  "Food & Spices": "🫙",
  "Eco Products": "♻️",
  "Natural Products": "🌿",
  "Agricultural Products": "🌾",
  "Beauty & Personal Care": "✨",
  Machines: "⚙️",
  Electronics: "💻",
  Auto: "🚗",
};

export const shopCategoryChips = categories.map((name) => ({
  name,
  icon: SHOP_CATEGORY_ICONS[name] ?? "📦",
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSupabaseProduct(row: any): Product {
  const artisan = row.artisan || "";
  const businessName =
    (typeof row.business_name === "string" && row.business_name.trim()) ? row.business_name.trim() : artisan;
  const businessSlug = typeof row.business_slug === "string" ? row.business_slug.trim() : "";
  const images = galleryFromProductRow(row);
  const image = images[0] || String(row.image || "").trim() || "";
  return {
    id: row.id,
    name: row.name || "",
    description: row.description || "",
    longDescription: row.long_description || "",
    price: Number(row.price) || 0,
    currency: row.currency || "EUR",
    category: row.category || "",
    artisan,
    businessName,
    businessSlug,
    country: row.country || "",
    phone: typeof row.phone === "string" && row.phone.trim() ? row.phone.trim() : "",
    image,
    images: images.length ? images : image ? [image] : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    inStock: row.in_stock !== false,
  };
}
