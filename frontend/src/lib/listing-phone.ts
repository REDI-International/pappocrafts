/** Fallback used in DB backfill and when legacy rows lack a number. */
export const DEFAULT_LISTING_PHONE = "+38976805651";

export function normalizeListingPhone(raw: unknown): string {
  return String(raw ?? "").trim();
}

/** Minimum length after trim (allows short local formats; blocks empty). */
export function isValidListingPhone(phone: string): boolean {
  const t = phone.trim();
  return t.length >= 6;
}
