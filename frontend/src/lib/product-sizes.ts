export const PRODUCT_SIZE_OPTIONS = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type ProductSize = (typeof PRODUCT_SIZE_OPTIONS)[number];

const PRODUCT_SIZE_TAG_PREFIX = "__sizes:";

export function normalizeProductSizes(value: unknown): ProductSize[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(PRODUCT_SIZE_OPTIONS);
  const sizes: ProductSize[] = [];
  for (const item of value) {
    const size = String(item ?? "").trim().toUpperCase();
    if (allowed.has(size) && !sizes.includes(size as ProductSize)) {
      sizes.push(size as ProductSize);
    }
  }
  return PRODUCT_SIZE_OPTIONS.filter((size) => sizes.includes(size));
}

export function isProductSizeTag(tag: unknown): boolean {
  return typeof tag === "string" && tag.trim().toLowerCase().startsWith(PRODUCT_SIZE_TAG_PREFIX);
}

export function productSizesFromTags(tags: unknown): ProductSize[] {
  if (!Array.isArray(tags)) return [];
  for (const tag of tags) {
    if (typeof tag !== "string") continue;
    const normalized = tag.trim();
    if (!normalized.toLowerCase().startsWith(PRODUCT_SIZE_TAG_PREFIX)) continue;
    const raw = normalized.slice(PRODUCT_SIZE_TAG_PREFIX.length).split(",");
    return normalizeProductSizes(raw);
  }
  return [];
}

export function productSizesFromRow(row: {
  available_sizes?: unknown;
  sizes?: unknown;
  tags?: unknown;
  description?: unknown;
  long_description?: unknown;
}): ProductSize[] {
  const direct = normalizeProductSizes(row.available_sizes ?? row.sizes);
  if (direct.length) return direct;
  return productSizesFromTags(row.tags);
}

export function productSizesDbPayload(sizes: unknown): {
  available_sizes: ProductSize[];
  sizes: ProductSize[];
} {
  const normalized = normalizeProductSizes(sizes);
  return {
    available_sizes: normalized,
    sizes: normalized,
  };
}

export function productTagsWithSizes(tags: unknown, sizes: unknown): string[] {
  const visibleTags = Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === "string" && !isProductSizeTag(tag))
    : [];
  const normalizedSizes = normalizeProductSizes(sizes);
  if (normalizedSizes.length === 0) return visibleTags;
  return [...visibleTags, `${PRODUCT_SIZE_TAG_PREFIX}${normalizedSizes.join(",")}`];
}
