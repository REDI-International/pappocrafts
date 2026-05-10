import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateSession } from "@/lib/admin-store";
import { getDomainConfigStatic } from "@/lib/domain-config";
import { parseProductMetaTags } from "@/lib/product-listing-meta";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSellerEmailHtml(params: {
  productName: string;
  productId: string;
  priceLabel: string;
  artisan: string;
  country: string;
  listingUrl: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress: string;
  selectedSize: string | null;
}): string {
  const {
    productName,
    productId,
    priceLabel,
    artisan,
    country,
    listingUrl,
    buyerName,
    buyerEmail,
    buyerPhone,
    buyerAddress,
    selectedSize,
  } = params;

  const sizeRow = selectedSize
    ? `<tr><td style="padding:4px 0;color:#888;">Size</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(selectedSize)}</td></tr>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2D2D2D;max-width:640px;margin:0 auto;padding:20px;">
  <div style="text-align:center;padding:24px 0;border-bottom:2px solid #4A9B3F;">
    <h1 style="margin:0;color:#4A9B3F;font-size:22px;">New product order request</h1>
    <p style="margin:6px 0 0;color:#888;font-size:13px;">PappoShop marketplace</p>
  </div>

  <div style="margin:20px 0;padding:16px;background:#f9faf9;border-radius:8px;">
    <p style="margin:0 0 8px;font-size:15px;font-weight:600;">${escapeHtml(productName)}</p>
    <table style="width:100%;font-size:14px;">
      <tr><td style="padding:4px 0;color:#888;width:120px;">Product ID</td><td style="padding:4px 0;font-family:monospace;">${escapeHtml(productId)}</td></tr>
      <tr><td style="padding:4px 0;color:#888;">Price</td><td style="padding:4px 0;">${escapeHtml(priceLabel)}</td></tr>
      ${sizeRow}
      <tr><td style="padding:4px 0;color:#888;">Maker</td><td style="padding:4px 0;">${escapeHtml(artisan)} (${escapeHtml(country)})</td></tr>
      <tr><td style="padding:4px 0;color:#888;">Listing</td><td style="padding:4px 0;"><a href="${listingUrl.replace(/"/g, "&quot;")}" style="color:#4A9B3F;">View product</a></td></tr>
    </table>
  </div>

  <h2 style="font-size:16px;margin:20px 0 8px;">Buyer</h2>
  <table style="width:100%;font-size:14px;">
    <tr><td style="padding:4px 0;color:#888;width:120px;">Name</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(buyerName)}</td></tr>
    <tr><td style="padding:4px 0;color:#888;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(buyerEmail)}" style="color:#4A9B3F;">${escapeHtml(buyerEmail)}</a></td></tr>
    <tr><td style="padding:4px 0;color:#888;">Phone</td><td style="padding:4px 0;">${escapeHtml(buyerPhone)}</td></tr>
    <tr><td style="padding:4px 0;color:#888;vertical-align:top;">Address</td><td style="padding:4px 0;white-space:pre-line;">${escapeHtml(buyerAddress)}</td></tr>
  </table>

  <div style="margin-top:28px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#aaa;font-size:12px;">
    <p style="margin:0;">Reply directly to the buyer using their email above.</p>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const session = token ? await validateSession(token) : null;

    const body = await request.json().catch(() => null);
    const productId = typeof body?.productId === "string" ? body.productId.trim() : "";
    const guest = body?.guest as { email?: string; phone?: string; address?: string } | undefined;

    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    const db = createAdminClient();
    const { data: row, error: pErr } = await db
      .from("products")
      .select("id, name, price, currency, artisan, country, image, seller_id, tags")
      .eq("id", productId)
      .eq("approval_status", "approved")
      .maybeSingle();

    if (pErr || !row) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const listingMeta = parseProductMetaTags(Array.isArray(row.tags) ? row.tags : []);
    const selectedSizeRaw =
      body && typeof body === "object" && typeof (body as Record<string, unknown>).selectedSize === "string"
        ? String((body as Record<string, unknown>).selectedSize).trim()
        : "";
    if (listingMeta.sizes.length > 0) {
      if (!selectedSizeRaw || !listingMeta.sizes.includes(selectedSizeRaw)) {
        return NextResponse.json({ error: "Please select a valid size." }, { status: 400 });
      }
    }
    const selectedSizeForEmail = listingMeta.sizes.length > 0 ? selectedSizeRaw : null;

    let sellerEmail: string | null = null;
    const sellerId = typeof row.seller_id === "string" ? row.seller_id : null;
    if (sellerId) {
      const { data: seller } = await db.from("admin_users").select("email").eq("id", sellerId).maybeSingle();
      if (seller?.email && typeof seller.email === "string") {
        sellerEmail = seller.email.trim().toLowerCase();
      }
    }

    if (!sellerEmail) {
      sellerEmail = (process.env.PRODUCT_ORDER_FALLBACK_EMAIL || "petrica@redi-ngo.eu").trim().toLowerCase();
    }

    let buyerName: string;
    let buyerEmail: string;
    let buyerPhone: string;
    let buyerAddress: string;

    const quickRoles =
      session &&
      (session.role === "user" ||
        session.role === "seller" ||
        session.role === "admin" ||
        session.role === "superadmin");

    if (quickRoles) {
      buyerName = session!.name?.trim() || session!.email.split("@")[0] || "Customer";
      buyerEmail = session!.email.trim();
      const { data: prof } = await db.from("admin_users").select("phone").eq("email", buyerEmail.toLowerCase()).maybeSingle();
      const ph = typeof prof?.phone === "string" ? prof.phone.trim() : "";
      buyerPhone = ph.length >= 8 ? ph : "Not on file — contact buyer by email";
      buyerAddress = "Shipping details to be agreed by email with the buyer.";
    } else {
      const email = typeof guest?.email === "string" ? guest.email.trim() : "";
      const phone = typeof guest?.phone === "string" ? guest.phone.trim() : "";
      const address = typeof guest?.address === "string" ? guest.address.trim() : "";

      if (!email || !phone || !address) {
        return NextResponse.json(
          { error: "Email, phone, and address are required for guests." },
          { status: 400 }
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
      }

      const phoneDigits = phone.replace(/[\s\-\(\)\.]/g, "");
      if (phoneDigits.length < 8) {
        return NextResponse.json(
          { error: "Please enter a valid phone number (at least 8 digits)." },
          { status: 400 }
        );
      }

      buyerName = email.split("@")[0] || "Customer";
      buyerEmail = email;
      buyerPhone = phone;
      buyerAddress = address;
    }

    const productName = String(row.name || "Product");
    const price = Number(row.price) || 0;
    const currency = String(row.currency || "EUR");
    const priceLabel = `${currency} ${price.toFixed(2)}`;
    const artisan = String(row.artisan || "");
    const country = String(row.country || "");

    const cfg = getDomainConfigStatic();
    const listingUrl = `${cfg.baseUrl.replace(/\/$/, "")}/shop/${encodeURIComponent(productId)}`;

    const html = buildSellerEmailHtml({
      productName,
      productId,
      priceLabel,
      artisan,
      country,
      listingUrl,
      buyerName,
      buyerEmail,
      buyerPhone,
      buyerAddress,
      selectedSize: selectedSizeForEmail,
    });

    const resend = getResend();
    const from =
      process.env.RESEND_ORDERS_FROM || "PappoShop <onboarding@resend.dev>";

    const bccRaw = process.env.PRODUCT_ORDER_BCC || "";
    const bcc = bccRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (resend) {
      await resend.emails.send({
        from,
        to: [sellerEmail],
        ...(bcc.length ? { bcc } : {}),
        replyTo: buyerEmail,
        subject: `Order request: ${productName} — ${buyerName}`,
        html,
      });
    }

    return NextResponse.json({
      success: true,
      message: resend
        ? "The seller has been notified by email."
        : "Request recorded. (Configure RESEND_API_KEY to send email.)",
    });
  } catch (e) {
    console.error("[product-order]", e);
    return NextResponse.json({ error: "Order request failed." }, { status: 500 });
  }
}
