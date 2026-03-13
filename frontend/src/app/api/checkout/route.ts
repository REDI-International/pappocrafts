import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-01-28.clover" });
}

interface CheckoutItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface CheckoutBody {
  items: CheckoutItem[];
  orderId?: string;
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as CheckoutBody;
    const { items, orderId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = subtotal >= 75 ? 0 : 500;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: { name: "Shipping" },
          unit_amount: shippingCost,
        },
        quantity: 1,
      });
    }

    const origin = request.headers.get("origin") || "http://localhost:3000";

    const successParams = orderId
      ? `order=${encodeURIComponent(orderId)}&method=online&session_id={CHECKOUT_SESSION_ID}`
      : `session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/checkout/success?${successParams}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: orderId ? { order_id: orderId } : undefined,
      shipping_address_collection: {
        allowed_countries: [
          "AL", "BA", "ME", "MK", "RS",
          "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
          "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
          "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB", "US", "CA", "CH",
        ],
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
