import type { NextRequest } from "next/server";

/**
 * Verifies a Cloudflare Turnstile token from public listing forms.
 * Set `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to enforce.
 * If the secret is unset, verification is skipped (local dev).
 */
export async function verifyTurnstileFromRequest(
  token: unknown,
  request: NextRequest
): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (!secret) {
    if (siteKey && process.env.NODE_ENV === "production") {
      console.error("[turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY is set but TURNSTILE_SECRET_KEY is missing.");
      return { ok: false, error: "Server configuration error." };
    }
    return { ok: true };
  }

  const t = typeof token === "string" ? token.trim() : "";
  if (!t) {
    return { ok: false, error: "Please complete the security check." };
  }

  const forwarded =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", t);
  if (forwarded) body.set("remoteip", forwarded);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
  if (!data.success) {
    return { ok: false, error: "Security check failed. Please try again." };
  }
  return { ok: true };
}
