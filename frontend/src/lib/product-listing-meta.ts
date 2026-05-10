/**
 * Special product `tags[]` entries for PDP UI (not shown as plain chips):
 * - `__seller_gender:f|m` (also `female` / `male`) → entrepreneur badge
 * - `__sizes:S,M,L` → size selector
 * Any other `__*` tag is hidden from chip display.
 */
export type ParsedSellerGender = "f" | "m" | null;

export interface ParsedProductMetaTags {
  /** Tags shown as chips (excludes meta keys). */
  displayTags: string[];
  sellerGender: ParsedSellerGender;
  /** Size labels in order, e.g. ["S","M","L","XL"]. */
  sizes: string[];
}

export function parseProductMetaTags(tags: readonly string[] | null | undefined): ParsedProductMetaTags {
  let sellerGender: ParsedSellerGender = null;
  const sizes: string[] = [];
  const displayTags: string[] = [];

  if (!tags?.length) {
    return { displayTags, sellerGender, sizes };
  }

  for (const raw of tags) {
    const t = typeof raw === "string" ? raw.trim() : "";
    if (!t) continue;

    const genderMatch = /^__seller_gender:(.+)$/i.exec(t);
    if (genderMatch) {
      const v = genderMatch[1].trim().toLowerCase();
      if (v === "f" || v === "female") sellerGender = "f";
      else if (v === "m" || v === "male") sellerGender = "m";
      continue;
    }

    const sizesMatch = /^__sizes:(.+)$/i.exec(t);
    if (sizesMatch) {
      sizesMatch[1].split(",").forEach((part) => {
        const x = part.trim();
        if (x) sizes.push(x);
      });
      continue;
    }

    if (t.startsWith("__")) continue;

    displayTags.push(t);
  }

  return { displayTags, sellerGender, sizes };
}
