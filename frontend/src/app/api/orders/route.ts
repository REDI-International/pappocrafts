import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { addOrder, type StoredOrder } from "@/lib/admin-store";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  artisan: string;
  country: string;
  image?: string;
}

interface OrderPayload {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    notes: string;
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: "online" | "later";
  region: string;
  shippingZone: string;
  currency: string;
}

function generateOrderId(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PC-${y}${m}${d}-${rand}`;
}

function buildEmailHtml(order: OrderPayload, orderId: string): string {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;width:60px;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" width="56" height="56" style="border-radius:8px;object-fit:cover;display:block;" />` : `<div style="width:56px;height:56px;border-radius:8px;background:#f0f0f0;"></div>`}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;">${item.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;">${item.artisan} (${item.country})</td>
        <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:500;">€${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const paymentLabel =
    order.paymentMethod === "online"
      ? '<span style="color:#4A9B3F;font-weight:600;">Online (Stripe)</span>'
      : '<span style="color:#E67E22;font-weight:600;">Pay Later (Cash / Bank Transfer)</span>';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2D2D2D;max-width:640px;margin:0 auto;padding:20px;">
  <div style="text-align:center;padding:24px 0;border-bottom:2px solid #4A9B3F;">
    <h1 style="margin:0;color:#4A9B3F;font-size:24px;">PappoCrafts</h1>
    <p style="margin:4px 0 0;color:#888;font-size:13px;">New Order Received</p>
  </div>

  <div style="background:#f9faf9;border-radius:8px;padding:16px;margin:20px 0;">
    <table style="width:100%;font-size:14px;">
      <tr><td style="padding:4px 0;color:#888;">Order ID</td><td style="padding:4px 0;font-weight:600;">${orderId}</td></tr>
      <tr><td style="padding:4px 0;color:#888;">Date</td><td style="padding:4px 0;">${new Date().toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}</td></tr>
      <tr><td style="padding:4px 0;color:#888;">Payment</td><td style="padding:4px 0;">${paymentLabel}</td></tr>
      <tr><td style="padding:4px 0;color:#888;">Region / Zone</td><td style="padding:4px 0;">${order.region} / ${order.shippingZone}</td></tr>
    </table>
  </div>

  <h2 style="font-size:16px;margin:24px 0 8px;color:#2D2D2D;">Customer Details</h2>
  <table style="width:100%;font-size:14px;">
    <tr><td style="padding:4px 0;color:#888;width:120px;">Name</td><td style="padding:4px 0;font-weight:600;">${order.customer.name}</td></tr>
    <tr><td style="padding:4px 0;color:#888;">Email</td><td style="padding:4px 0;"><a href="mailto:${order.customer.email}" style="color:#4A9B3F;">${order.customer.email}</a></td></tr>
    <tr><td style="padding:4px 0;color:#888;">Phone</td><td style="padding:4px 0;"><a href="tel:${order.customer.phone}" style="color:#4A9B3F;">${order.customer.phone}</a></td></tr>
    <tr><td style="padding:4px 0;color:#888;">Address</td><td style="padding:4px 0;">${order.customer.address}</td></tr>
    <tr><td style="padding:4px 0;color:#888;">City</td><td style="padding:4px 0;">${order.customer.city} ${order.customer.postalCode}</td></tr>
    <tr><td style="padding:4px 0;color:#888;">Country</td><td style="padding:4px 0;">${order.customer.country}</td></tr>
    ${order.customer.notes ? `<tr><td style="padding:4px 0;color:#888;">Notes</td><td style="padding:4px 0;"><em>${order.customer.notes}</em></td></tr>` : ""}
  </table>

  <h2 style="font-size:16px;margin:24px 0 8px;color:#2D2D2D;">Order Items</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <thead>
      <tr style="background:#f0f0f0;">
        <th style="padding:8px 12px;text-align:left;">Image</th>
        <th style="padding:8px 12px;text-align:left;">Product</th>
        <th style="padding:8px 12px;text-align:center;">Qty</th>
        <th style="padding:8px 12px;text-align:left;">Artisan</th>
        <th style="padding:8px 12px;text-align:right;">Price</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div style="margin-top:16px;padding:16px;background:#f9faf9;border-radius:8px;font-size:14px;">
    <table style="width:100%;">
      <tr><td style="padding:4px 0;color:#888;">Subtotal</td><td style="padding:4px 0;text-align:right;">€${order.subtotal.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0;color:#888;">Shipping</td><td style="padding:4px 0;text-align:right;">${order.shippingCost === 0 ? '<span style="color:#4A9B3F;">FREE</span>' : `€${order.shippingCost.toFixed(2)}`}</td></tr>
      <tr><td style="padding:8px 0 4px;font-weight:700;font-size:16px;border-top:2px solid #4A9B3F;">TOTAL</td><td style="padding:8px 0 4px;text-align:right;font-weight:700;font-size:16px;border-top:2px solid #4A9B3F;">€${order.total.toFixed(2)}</td></tr>
    </table>
  </div>

  <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;text-align:center;color:#aaa;font-size:12px;">
    <p>This email was sent automatically by PappoCrafts.</p>
  </div>
</body>
</html>`;
}

function buildCustomerEmailHtml(order: OrderPayload, orderId: string): string {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;width:68px;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" width="64" height="64" style="border-radius:10px;object-fit:cover;display:block;" />` : `<div style="width:64px;height:64px;border-radius:10px;background:#f5f5f5;"></div>`}
        </td>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;">
          <strong style="color:#2D2D2D;">${item.name}</strong><br>
          <span style="color:#888;font-size:12px;">by ${item.artisan}</span>
        </td>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:14px;">${item.quantity}</td>
        <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#2D2D2D;">&euro;${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const paymentNote =
    order.paymentMethod === "online"
      ? `<p style="color:#4A9B3F;font-weight:600;">Payment received online via Stripe. No further action needed.</p>`
      : `<div style="background:#FFF8F0;border:1px solid #F5DEB3;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 4px;font-weight:600;color:#E67E22;">Payment: Pay Later</p>
          <p style="margin:0;color:#666;font-size:13px;">Our team will contact you shortly with payment details. You can pay by cash on delivery or bank transfer.</p>
        </div>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2D2D2D;max-width:640px;margin:0 auto;padding:20px;background:#ffffff;">
  <div style="text-align:center;padding:28px 0;border-bottom:2px solid #4A9B3F;">
    <h1 style="margin:0;color:#4A9B3F;font-size:28px;">PappoCrafts</h1>
    <p style="margin:8px 0 0;color:#666;font-size:14px;">Handcrafted with Heart &amp; Heritage</p>
  </div>

  <div style="padding:32px 0 24px;text-align:center;">
    <div style="display:inline-block;background:#E8F5E6;border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;margin-bottom:16px;">&#10003;</div>
    <h2 style="margin:0 0 8px;font-size:22px;color:#2D2D2D;">Thank you for your order, ${order.customer.name.split(" ")[0]}!</h2>
    <p style="margin:0;color:#888;font-size:14px;">We have received your order and our team will be in touch soon.</p>
  </div>

  <div style="background:#f9faf9;border-radius:8px;padding:16px;margin:0 0 24px;">
    <table style="width:100%;font-size:14px;">
      <tr><td style="padding:4px 0;color:#888;">Order Number</td><td style="padding:4px 0;font-weight:700;font-size:15px;font-family:monospace;">${orderId}</td></tr>
      <tr><td style="padding:4px 0;color:#888;">Date</td><td style="padding:4px 0;">${new Date().toLocaleString("en-GB", { dateStyle: "long", timeStyle: "short" })}</td></tr>
    </table>
  </div>

  ${paymentNote}

  <h3 style="font-size:15px;margin:24px 0 8px;color:#2D2D2D;">Your Items</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:10px 12px;text-align:left;font-weight:600;"></th>
        <th style="padding:10px 12px;text-align:left;font-weight:600;">Product</th>
        <th style="padding:10px 12px;text-align:center;font-weight:600;">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-weight:600;">Price</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div style="margin-top:16px;padding:16px;background:#f9faf9;border-radius:8px;font-size:14px;">
    <table style="width:100%;">
      <tr><td style="padding:4px 0;color:#888;">Subtotal</td><td style="padding:4px 0;text-align:right;">&euro;${order.subtotal.toFixed(2)}</td></tr>
      <tr><td style="padding:4px 0;color:#888;">Shipping</td><td style="padding:4px 0;text-align:right;">${order.shippingCost === 0 ? '<span style="color:#4A9B3F;font-weight:500;">FREE</span>' : `&euro;${order.shippingCost.toFixed(2)}`}</td></tr>
      <tr><td style="padding:10px 0 4px;font-weight:700;font-size:17px;border-top:2px solid #4A9B3F;">Total</td><td style="padding:10px 0 4px;text-align:right;font-weight:700;font-size:17px;border-top:2px solid #4A9B3F;">&euro;${order.total.toFixed(2)}</td></tr>
    </table>
  </div>

  <h3 style="font-size:15px;margin:24px 0 8px;color:#2D2D2D;">Shipping To</h3>
  <div style="background:#f9faf9;border-radius:8px;padding:16px;font-size:14px;color:#555;">
    <p style="margin:0;font-weight:600;color:#2D2D2D;">${order.customer.name}</p>
    <p style="margin:4px 0 0;">${order.customer.address}</p>
    <p style="margin:2px 0 0;">${order.customer.city}${order.customer.postalCode ? ` ${order.customer.postalCode}` : ""}</p>
    <p style="margin:2px 0 0;">${order.customer.country}</p>
  </div>

  <div style="margin-top:32px;padding:24px;background:#f0f7ef;border-radius:8px;text-align:center;">
    <p style="margin:0 0 8px;font-weight:600;color:#2D2D2D;">Questions about your order?</p>
    <p style="margin:0;font-size:14px;color:#666;">
      Email us at <a href="mailto:petrica@redi-ngo.eu" style="color:#4A9B3F;font-weight:600;">petrica@redi-ngo.eu</a>
      and include your order number <strong>${orderId}</strong>.
    </p>
  </div>

  <div style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;text-align:center;">
    <p style="color:#888;font-size:13px;margin:0 0 4px;">Your purchase supports Roma artisans in the Western Balkans.</p>
    <p style="color:#aaa;font-size:12px;margin:0;">&copy; ${new Date().getFullYear()} PappoCrafts. All rights reserved.</p>
  </div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const order = (await request.json()) as OrderPayload;

    if (!order.customer?.name || !order.customer?.email || !order.customer?.phone) {
      return NextResponse.json(
        { error: "Name, email, and phone number are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(order.customer.email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const phoneDigits = order.customer.phone.replace(/[\s\-\(\)\.]/g, "");
    if (phoneDigits.length < 8) {
      return NextResponse.json(
        { error: "Please enter a valid phone number (at least 8 digits)." },
        { status: 400 }
      );
    }

    if (!order.items || order.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const orderId = generateOrderId();

    const storedOrder: StoredOrder = {
      id: orderId,
      customer: order.customer,
      items: order.items,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentMethod === "online" ? "paid" : "pending",
      status: "pending",
      region: order.region,
      shippingZone: order.shippingZone,
      currency: order.currency,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await addOrder(storedOrder);

    const resend = getResend();

    if (resend) {
      await Promise.allSettled([
        resend.emails.send({
          from: "PappoCrafts Orders <onboarding@resend.dev>",
          to: ["petrica@redi-ngo.eu", "lejla@redi-ngo.eu"],
          replyTo: order.customer.email,
          subject: `New Order ${orderId} — ${order.customer.name} (${order.paymentMethod === "online" ? "Paid Online" : "Pay Later"})`,
          html: buildEmailHtml(order, orderId),
        }),
        resend.emails.send({
          from: "PappoCrafts <onboarding@resend.dev>",
          to: [order.customer.email],
          replyTo: "petrica@redi-ngo.eu",
          subject: `Order Confirmed — ${orderId}`,
          html: buildCustomerEmailHtml(order, orderId),
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      orderId,
      message: resend
        ? "Order placed and confirmations sent."
        : "Order placed. (Email not configured — add RESEND_API_KEY)",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Order submission failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
