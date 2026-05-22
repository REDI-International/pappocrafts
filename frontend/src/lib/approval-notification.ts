/**
 * Email notifications for the Serbian regional review team.
 *
 * When a product or service listing is submitted from Serbia, an email is sent
 * to SERBIA_REVIEW_EMAIL containing a summary of the submission and one-click
 * Approve / Reject links that do not require an admin login.
 */

import { Resend } from "resend";

const SERBIA_REVIEW_EMAIL =
  process.env.SERBIA_REVIEW_EMAIL || "rediserbia@redi-ngo.eu";

// Additional CC recipients (comma-separated). Defaults to cboldis@yahoo.com.
function getCcRecipients(): string[] {
  const raw = process.env.SERBIA_REVIEW_CC ?? "cboldis@yahoo.com";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isSerbianListing(country: string): boolean {
  return country.trim().toLowerCase().includes("serbia");
}

function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://papposhop.org"
  ).replace(/\/$/, "");
}

function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.AUTH_EMAIL_FROM ||
    "PappoShop <onboarding@resend.dev>"
  );
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function approvalLink(token: string, action: "approve" | "reject", type: "product" | "service") {
  return `${getSiteUrl()}/api/public/direct-approval?token=${encodeURIComponent(token)}&action=${action}&type=${type}`;
}

function actionButton(label: string, href: string, bg: string) {
  return `<a href="${href}" style="display:inline-block;background:${bg};color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:700;font-size:15px;margin:0 8px;">${label}</a>`;
}

// ── Product notification ────────────────────────────────────────────────────

export interface ProductNotificationInput {
  /** Approval token stored in DB. If null (migration not yet applied) the email
   *  is sent as a plain notification with a link to the admin panel instead. */
  token: string | null;
  id: string;
  name: string;
  artisan: string;
  category: string;
  country: string;
  price: number;
  currency: string;
  description: string;
  submitterEmail?: string | null;
  submitterPhone?: string | null;
}

export async function sendSerbiaProductNotification(
  input: ProductNotificationInput
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[approval-notification] RESEND_API_KEY not set — skipping Serbia notification email.");
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2D2D2D;max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;padding:20px 0 16px;border-bottom:2px solid #4A9B3F;">
    <h1 style="margin:0;color:#4A9B3F;font-size:22px;">PappoShop</h1>
    <p style="margin:4px 0 0;color:#888;font-size:13px;">New product submission from Serbia — review required</p>
  </div>

  <div style="padding:24px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;font-weight:600;width:140px;color:#555;">Product</td><td style="padding:8px 0;">${escapeHtml(input.name)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;color:#555;">Maker / artisan</td><td style="padding:8px 0;">${escapeHtml(input.artisan)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;color:#555;">Category</td><td style="padding:8px 0;">${escapeHtml(input.category)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;color:#555;">Country</td><td style="padding:8px 0;">${escapeHtml(input.country)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;color:#555;">Price</td><td style="padding:8px 0;">${input.price.toFixed(2)} ${escapeHtml(input.currency)}</td></tr>
      ${input.submitterEmail ? `<tr><td style="padding:8px 0;font-weight:600;color:#555;">Contact email</td><td style="padding:8px 0;">${escapeHtml(input.submitterEmail)}</td></tr>` : ""}
      ${input.submitterPhone ? `<tr><td style="padding:8px 0;font-weight:600;color:#555;">Contact phone</td><td style="padding:8px 0;">${escapeHtml(input.submitterPhone)}</td></tr>` : ""}
    </table>

    <div style="background:#f7f7f5;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555;">${escapeHtml(input.description)}</p>
    </div>

    ${input.token
      ? `<div style="text-align:center;margin:28px 0 16px;">
      ${actionButton("✓ Approve", approvalLink(input.token, "approve", "product"), "#4A9B3F")}
      ${actionButton("✗ Reject", approvalLink(input.token, "reject", "product"), "#c0392b")}
    </div>
    <p style="font-size:12px;color:#aaa;text-align:center;margin:8px 0 0;">
      Clicking a button above will immediately update the listing status.<br/>
      If the buttons do not work, copy these links into your browser:<br/>
      Approve: ${approvalLink(input.token, "approve", "product")}<br/>
      Reject: ${approvalLink(input.token, "reject", "product")}
    </p>`
      : `<p style="text-align:center;margin:20px 0;">
      <a href="${getSiteUrl()}/admin/approvals" style="display:inline-block;background:#4A9B3F;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:700;font-size:15px;">Review in admin panel</a>
    </p>`}
  </div>

  <div style="border-top:1px solid #eee;padding-top:12px;font-size:12px;color:#bbb;text-align:center;">
    PappoShop · <a href="https://papposhop.org" style="color:#4A9B3F;">papposhop.org</a>
  </div>
</body>
</html>`;

  const cc = getCcRecipients();
  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: [SERBIA_REVIEW_EMAIL],
      ...(cc.length ? { cc } : {}),
      subject: `[PappoShop] New Serbian product to review: ${input.name} by ${input.artisan}`,
      html,
    });
    if (result.error) {
      console.error("[approval-notification] product email error:", result.error);
    }
  } catch (err) {
    console.error("[approval-notification] product email unexpected error:", err);
  }
}

// ── Service notification ────────────────────────────────────────────────────

export interface ServiceNotificationInput {
  /** Approval token stored in DB. If null (migration not yet applied) the email
   *  is sent as a plain notification with a link to the admin panel instead. */
  token: string | null;
  id: string;
  serviceTitle: string;
  contactName: string;
  serviceCategory: string;
  country: string;
  location: string;
  hourlyRate: number;
  currency: string;
  serviceDescription: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export async function sendSerbiaServiceNotification(
  input: ServiceNotificationInput
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn("[approval-notification] RESEND_API_KEY not set — skipping Serbia notification email.");
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"/></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2D2D2D;max-width:600px;margin:0 auto;padding:20px;">
  <div style="text-align:center;padding:20px 0 16px;border-bottom:2px solid #4A9B3F;">
    <h1 style="margin:0;color:#4A9B3F;font-size:22px;">PappoShop</h1>
    <p style="margin:4px 0 0;color:#888;font-size:13px;">New service listing request from Serbia — review required</p>
  </div>

  <div style="padding:24px 0;">
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;font-weight:600;width:140px;color:#555;">Service</td><td style="padding:8px 0;">${escapeHtml(input.serviceTitle)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;color:#555;">Provider</td><td style="padding:8px 0;">${escapeHtml(input.contactName)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;color:#555;">Category</td><td style="padding:8px 0;">${escapeHtml(input.serviceCategory)}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600;color:#555;">Country</td><td style="padding:8px 0;">${escapeHtml(input.country)}</td></tr>
      ${input.location ? `<tr><td style="padding:8px 0;font-weight:600;color:#555;">Location</td><td style="padding:8px 0;">${escapeHtml(input.location)}</td></tr>` : ""}
      <tr><td style="padding:8px 0;font-weight:600;color:#555;">Hourly rate</td><td style="padding:8px 0;">${input.hourlyRate.toFixed(2)} ${escapeHtml(input.currency)}</td></tr>
      ${input.contactEmail ? `<tr><td style="padding:8px 0;font-weight:600;color:#555;">Contact email</td><td style="padding:8px 0;">${escapeHtml(input.contactEmail)}</td></tr>` : ""}
      ${input.contactPhone ? `<tr><td style="padding:8px 0;font-weight:600;color:#555;">Contact phone</td><td style="padding:8px 0;">${escapeHtml(input.contactPhone)}</td></tr>` : ""}
    </table>

    <div style="background:#f7f7f5;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="margin:0;font-size:14px;line-height:1.6;color:#555;">${escapeHtml(input.serviceDescription)}</p>
    </div>

    ${input.token
      ? `<div style="text-align:center;margin:28px 0 16px;">
      ${actionButton("✓ Approve", approvalLink(input.token, "approve", "service"), "#4A9B3F")}
      ${actionButton("✗ Reject", approvalLink(input.token, "reject", "service"), "#c0392b")}
    </div>
    <p style="font-size:12px;color:#aaa;text-align:center;margin:8px 0 0;">
      Clicking a button above will immediately update the listing status.<br/>
      If the buttons do not work, copy these links into your browser:<br/>
      Approve: ${approvalLink(input.token, "approve", "service")}<br/>
      Reject: ${approvalLink(input.token, "reject", "service")}
    </p>`
      : `<p style="text-align:center;margin:20px 0;">
      <a href="${getSiteUrl()}/admin/service-requests" style="display:inline-block;background:#4A9B3F;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:700;font-size:15px;">Review in admin panel</a>
    </p>`}

  </div>

  <div style="border-top:1px solid #eee;padding-top:12px;font-size:12px;color:#bbb;text-align:center;">
    PappoShop · <a href="https://papposhop.org" style="color:#4A9B3F;">papposhop.org</a>
  </div>
</body>
</html>`;

  const cc = getCcRecipients();
  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: [SERBIA_REVIEW_EMAIL],
      ...(cc.length ? { cc } : {}),
      subject: `[PappoShop] New Serbian service to review: ${input.serviceTitle} by ${input.contactName}`,
      html,
    });
    if (result.error) {
      console.error("[approval-notification] service email error:", result.error);
    }
  } catch (err) {
    console.error("[approval-notification] service email unexpected error:", err);
  }
}
