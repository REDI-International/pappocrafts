import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function htmlPage(title: string, message: string) {
  return new NextResponse(
    `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
      </head>
      <body style="font-family:Arial,sans-serif;background:#f8f6f3;color:#2D2D2D;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;">
        <main style="max-width:520px;background:white;border:1px solid #e7e1d8;border-radius:24px;padding:32px;text-align:center;box-shadow:0 16px 48px rgba(0,0,0,.08);">
          <h1 style="margin:0 0 12px;color:#4A9B3F;">${title}</h1>
          <p style="font-size:16px;line-height:1.6;color:#666;">${message}</p>
          <a href="/login" style="display:inline-block;margin-top:18px;background:#4A9B3F;color:white;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Go to sign in</a>
        </main>
      </body>
    </html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token")?.trim() || "";
  if (!token) return htmlPage("Invalid verification link", "The verification token is missing.");

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const db = createAdminClient();
  const { data: user, error } = await db
    .from("admin_users")
    .select("id, email_verified")
    .eq("verification_token_hash", tokenHash)
    .maybeSingle();

  if (error || !user) {
    return htmlPage("Invalid verification link", "This verification link is invalid or has already been used.");
  }

  if (user.email_verified === true) {
    return htmlPage("Email already verified", "Your email address is already verified. You can sign in now.");
  }

  const { error: updateError } = await db
    .from("admin_users")
    .update({
      email_verified: true,
      verification_token_hash: null,
      verification_sent_at: null,
      verified_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return htmlPage("Verification failed", "We could not verify your email right now. Please try again later.");
  }

  return htmlPage("Email verified", "Your PappoShop account is now active. You can sign in and place orders.");
}
