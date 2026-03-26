/** URL-safe slug for business profile URLs (unique per entrepreneur). */
export function slugifyBusinessName(name: string): string {
  const s = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 72) || "business";
}
