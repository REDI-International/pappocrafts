import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { validateSession } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_SIZE_OPTIONS, normalizeProductSizes, productSizesFromRow, type ProductSize } from "@/lib/product-sizes";

type ProductRow = Record<string, unknown>;

function getResend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

function money(amount: unknown, currency: unknown) {
  const value = Number(amount) || 0;
  const code = typeof currency === "string" && currency.trim() ? currency.trim().toUpperCase() : "EUR";
  return `${value.toFixed(2)} ${code}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEntrepreneurEmail(input: {
  product: ProductRow;
  customer: { name: string; email: string };
  selectedSize: string | null;
}) {
  const { product, customer, selectedSize } = input;
  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#2D2D2D;">
      <h1 style="margin:0 0 12px;color:#4A9B3F;">New PappoShop product order</h1>
      <p style="font-size:15px;line-height:1.6;">A logged-in customer wants to order your product.</p>

      <h2 style="font-size:16px;margin:24px 0 8px;">Customer details</h2>
      <table style="width:100%;font-size:14px;">
        <tr><td style="padding:4px 0;color:#777;width:120px;">Name</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(customer.name)}</td></tr>
        <tr><td style="padding:4px 0;color:#777;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(customer.email)}" style="color:#4A9B3F;">${escapeHtml(customer.email)}</a></td></tr>
      </table>

      <h2 style="font-size:16px;margin:24px 0 8px;">Product</h2>
      <table style="width:100%;font-size:14px;">
        <tr><td style="padding:4px 0;color:#777;width:120px;">Product</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(product.name)}</td></tr>
        <tr><td style="padding:4px 0;color:#777;">Price</td><td style="padding:4px 0;">${escapeHtml(money(product.price, product.currency))}</td></tr>
        ${selectedSize ? `<tr><td style="padding:4px 0;color:#777;">Selected size</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(selectedSize)}</td></tr>` : ""}
      </table>

      <p style="font-size:12px;color:#999;margin-top:28px;">Please contact the customer directly to confirm availability, delivery, and payment details.</p>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: "Please sign in to order this product." }, { status: 401 });
    }
    if (session.role === "seller") {
      return NextResponse.json({ error: "Entrepreneur accounts cannot order their own products from this page." }, { status: 403 });
    }

    const body = await request.json();
    const productId = String(body.productId || body.id || "").trim();
    const selectedSize = String(body.selectedSize || body.size || "").trim().toUpperCase();
    if (!productId) return NextResponse.json({ error: "Product ID is required." }, { status: 400 });

    const db = createAdminClient();
    const { data: product, error } = await db
      .from("products")
      .select("*")
      .eq("id", productId)
      .eq("approval_status", "approved")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const sizes = productSizesFromRow(product as ProductRow);
    if (sizes.length > 0) {
      const validSize = normalizeProductSizes([selectedSize])[0] as ProductSize | undefined;
      if (!validSize || !sizes.includes(validSize)) {
        return NextResponse.json({ error: "Please select an available size before ordering." }, { status: 400 });
      }
    }

    let entrepreneurEmail = String(product.contact_email || product.submitter_email || "").trim().toLowerCase();
    if (typeof product.seller_id === "string" && product.seller_id.trim()) {
      const { data: seller } = await db
        .from("admin_users")
        .select("email, contact_email")
        .eq("id", product.seller_id)
        .maybeSingle();
      entrepreneurEmail = String(seller?.contact_email || seller?.email || entrepreneurEmail).trim().toLowerCase();
    }

    if (!entrepreneurEmail) {
      return NextResponse.json({ error: "Seller email has not been configured for this product." }, { status: 400 });
    }

    const resend = getResend();
    if (!resend) {
      return NextResponse.json({ error: "Email sending is not configured." }, { status: 500 });
    }

    await resend.emails.send({
      from: "PappoShop Orders <onboarding@resend.dev>",
      to: [entrepreneurEmail],
      replyTo: session.email,
      subject: `New order request — ${String(product.name || "Product")}`,
      html: buildEntrepreneurEmail({
        product: product as ProductRow,
        customer: { name: session.name || session.email, email: session.email },
        selectedSize: sizes.length > 0 ? selectedSize : null,
      }),
    });

    return NextResponse.json({ success: true, message: "Order request sent to the entrepreneur." });
  } catch {
    return NextResponse.json({ error: "Order request failed." }, { status: 500 });
  }
}
