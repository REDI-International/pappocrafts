import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";
import { BALKANS_CONFIG } from "@/lib/domain-config";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function createVerificationToken() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function verificationFromAddress() {
  return (
    process.env.AUTH_EMAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    "PappoShop <onboarding@resend.dev>"
  );
}

export function verificationUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || BALKANS_CONFIG.baseUrl;
  return `${base.replace(/\/$/, "")}/api/verify-email?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail(input: {
  email: string;
  name: string;
  token: string;
  role: "user" | "seller";
}) {
  const resend = getResend();
  if (!resend) {
    return { ok: false, error: "Email sending is not configured." };
  }

  const url = verificationUrl(input.token);
  const roleLabel = input.role === "seller" ? "entrepreneur" : "customer";
  const result = await resend.emails.send({
    from: verificationFromAddress(),
    to: [input.email],
    subject: "Verify your PappoShop email",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333;">
        <h1 style="margin:0 0 12px;color:#4A9B3F;">Verify your email</h1>
        <p style="font-size:16px;line-height:1.6;">Hi ${escapeHtml(input.name)},</p>
        <p style="font-size:16px;line-height:1.6;">Please verify your email address to activate your PappoShop ${roleLabel} account.</p>
        <p style="margin:24px 0;">
          <a href="${url}" style="display:inline-block;background:#4A9B3F;color:#fff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Verify email</a>
        </p>
        <p style="font-size:13px;line-height:1.6;color:#777;">If the button does not work, copy and paste this link into your browser:<br>${url}</p>
      </div>
    `,
  });

  if (result.error) {
    return { ok: false, error: result.error.message || "Verification email failed." };
  }
  return { ok: true, error: "" };
}
