/**
 * Canonical logo used in the UI when site_settings has no logo_url (or before fetch).
 * Served from production so local/preview match papposhop.org branding.
 * (Avoid ?dpl= cache-busters in repo — they expire when that deployment rolls off.)
 */
export const SITE_LOGO_URL = "https://papposhop.org/pappocrafts-logo.png";
