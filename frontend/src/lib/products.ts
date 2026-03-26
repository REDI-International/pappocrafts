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
  image: string;
  tags: string[];
  inStock: boolean;
}

export const categories = [
  "All",
  "Pottery & Ceramics",
  "Textiles & Weaving",
  "Jewelry & Metalwork",
  "Woodwork & Carving",
  "Leather Goods",
  "Food & Spices",
  "Furniture",
  "Machines",
  "Home Decor",
  "Art & Paintings",
  "Beauty & Personal Care",
  "Traditional Clothing",
  "Handmade Accessories",
  "Eco Products",
  "Natural Products",
  "Agricultural Products",
  "Other",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSupabaseProduct(row: any): Product {
  const artisan = row.artisan || "";
  const businessName =
    (typeof row.business_name === "string" && row.business_name.trim()) ? row.business_name.trim() : artisan;
  const businessSlug = typeof row.business_slug === "string" ? row.business_slug.trim() : "";
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
    image: row.image || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    inStock: row.in_stock !== false,
  };
}
