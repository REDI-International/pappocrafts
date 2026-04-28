import { isProductSizeTag } from "@/lib/product-sizes";

export type ProductSellerGender = "M" | "F";

const PRODUCT_GENDER_TAG_PREFIX = "__seller_gender:";

export function normalizeProductSellerGender(value: unknown): ProductSellerGender | null {
  const gender = String(value ?? "").trim().toUpperCase();
  if (gender === "M" || gender === "MALE") return "M";
  if (gender === "F" || gender === "FEMALE") return "F";
  return null;
}

function genderFromTag(tag: string): ProductSellerGender | null {
  const normalized = tag.trim().toLowerCase();
  if (normalized === `${PRODUCT_GENDER_TAG_PREFIX}m`) return "M";
  if (normalized === `${PRODUCT_GENDER_TAG_PREFIX}f`) return "F";
  return null;
}

export function isProductGenderTag(tag: unknown): boolean {
  return typeof tag === "string" && tag.trim().toLowerCase().startsWith(PRODUCT_GENDER_TAG_PREFIX);
}

export function visibleProductTags(tags: unknown): string[] {
  return Array.isArray(tags)
    ? tags.filter((tag): tag is string => typeof tag === "string" && !isProductGenderTag(tag) && !isProductSizeTag(tag))
    : [];
}

export function productTagsWithGender(tags: unknown, gender: unknown): string[] {
  const visibleTags = visibleProductTags(tags);
  const normalizedGender = normalizeProductSellerGender(gender);
  if (!normalizedGender) return visibleTags;
  return [...visibleTags, `${PRODUCT_GENDER_TAG_PREFIX}${normalizedGender.toLowerCase()}`];
}

export function productGenderFromRow(row: { seller_gender?: unknown; tags?: unknown }): ProductSellerGender | null {
  const directGender = normalizeProductSellerGender(row.seller_gender);
  if (directGender) return directGender;
  if (!Array.isArray(row.tags)) return null;
  for (const tag of row.tags) {
    if (typeof tag !== "string") continue;
    const gender = genderFromTag(tag);
    if (gender) return gender;
  }
  return null;
}
