export interface Product {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  currency: string;
  category: string;
  artisan: string;
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
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSupabaseProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name || "",
    description: row.description || "",
    longDescription: row.long_description || "",
    price: Number(row.price) || 0,
    currency: row.currency || "EUR",
    category: row.category || "",
    artisan: row.artisan || "",
    country: row.country || "",
    image: row.image || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    inStock: row.in_stock !== false,
  };
}
