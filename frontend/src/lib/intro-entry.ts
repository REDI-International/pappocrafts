/** Client-readable cookie: intro splash dismissed for this browser. */
export const INTRO_COOKIE = "papposhop-intro-dismissed";
const INTRO_STORAGE_KEY = "papposhop-intro-dismissed-local";
const INTRO_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Request header set by middleware — matches {@link isIntroHiddenPath}. */
export const INTRO_ELIGIBLE_HEADER = "x-papposhop-intro-eligible";

export function isIntroHiddenPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/checkout")
  );
}

export function writeIntroDismissedCookie(): void {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? ";Secure" : "";
  document.cookie = `${INTRO_COOKIE}=1;path=/;max-age=${INTRO_COOKIE_MAX_AGE};SameSite=Lax${secure}`;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(INTRO_STORAGE_KEY, "1");
  }
}

export function readIntroDismissedFromDocument(): boolean {
  if (typeof document === "undefined") return false;
  if (document.cookie.split("; ").some((row) => row.startsWith(`${INTRO_COOKIE}=`))) return true;
  if (typeof window !== "undefined" && window.localStorage.getItem(INTRO_STORAGE_KEY) === "1") return true;
  return false;
}
