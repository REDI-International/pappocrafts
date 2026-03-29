/** Max gallery size for product listings (DB + forms). */
export const MAX_PRODUCT_IMAGES = 5;

export function normalizeProductImageUrls(input: unknown): string[] {
  if (input == null) return [];
  const raw = Array.isArray(input) ? input : typeof input === "string" ? [input] : [];
  return raw
    .map((u) => String(u ?? "").trim())
    .filter((u) => u.length > 0)
    .slice(0, MAX_PRODUCT_IMAGES);
}

/** Persisted row: `image` + `images` → ordered unique URLs for forms. */
export function galleryFromProductRow(row: {
  image?: string | null;
  images?: unknown;
}): string[] {
  const fromArr = Array.isArray(row.images)
    ? row.images.map((u) => String(u ?? "").trim()).filter((u) => u.length > 0)
    : [];
  if (fromArr.length) return normalizeProductImageUrls(fromArr);
  const one = String(row.image ?? "").trim();
  return one ? [one] : [];
}

export function productImageDbPayload(urls: string[]): { image: string; images: string[] } {
  const images = normalizeProductImageUrls(urls);
  return { image: images[0] ?? "", images };
}

/** Five slots for forms (pad / trim). */
export function imageSlotsForForm(urls: string[]): string[] {
  const g = normalizeProductImageUrls(urls);
  const slots = [...g, "", "", "", "", ""].slice(0, MAX_PRODUCT_IMAGES);
  return slots;
}
