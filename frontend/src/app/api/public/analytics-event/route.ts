import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_EVENT_TYPES = new Set(["product_view", "service_view", "profile_visit"]);

function normalizeShortText(value: unknown, maxLen = 200): string {
  return String(value || "").trim().slice(0, maxLen);
}

function firstIpToken(forwardedFor: string | null): string {
  if (!forwardedFor) return "";
  const token = forwardedFor.split(",")[0]?.trim() || "";
  return token.slice(0, 100);
}

/**
 * Lightweight public analytics ingestion for marketplace usage signals.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      eventType?: unknown;
      listingId?: unknown;
      sellerSlug?: unknown;
      sellerName?: unknown;
      pagePath?: unknown;
      sessionId?: unknown;
    };

    const eventType = normalizeShortText(body.eventType, 64);
    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: "Unsupported event type." }, { status: 400 });
    }

    const listingId = normalizeShortText(body.listingId, 200);
    const sellerSlug = normalizeShortText(body.sellerSlug, 120);
    const sellerName = normalizeShortText(body.sellerName, 200);
    const pagePath = normalizeShortText(body.pagePath, 500);
    const sessionId = normalizeShortText(body.sessionId, 120);
    const userAgent = normalizeShortText(request.headers.get("user-agent"), 400);
    const referrer = normalizeShortText(request.headers.get("referer"), 500);
    const country = normalizeShortText(
      request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry"),
      20
    );
    const clientIp = firstIpToken(request.headers.get("x-forwarded-for"));

    const db = createAdminClient();
    const { error } = await db.from("analytics_events").insert({
      event_type: eventType,
      page_path: pagePath || null,
      session_id: sessionId || null,
      user_agent: userAgent || null,
      referrer: referrer || null,
      country: country || null,
      metadata: {
        listing_id: listingId || null,
        seller_slug: sellerSlug || null,
        seller_name: sellerName || null,
        client_ip: clientIp || null,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
