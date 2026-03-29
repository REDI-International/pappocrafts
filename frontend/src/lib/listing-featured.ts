/** Matches `tags` on products or `badges` on services (case-insensitive). */
export function hasFeaturedMarker(items: readonly string[] | null | undefined): boolean {
  if (!items?.length) return false;
  return items.some((s) => s.trim().toLowerCase() === "featured");
}
