import { NextRequest, NextResponse } from "next/server";
import { resolveUserIdFromEmail, validateSession } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidListingPhone, normalizeListingPhone } from "@/lib/listing-phone";
import { isListingCurrency } from "@/lib/eur-fallback-rates";

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

async function requireSeller(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== "seller") return null;
  let userId = session.userId;
  if (!userId) userId = await resolveUserIdFromEmail(session.email);
  if (!userId) return null;
  return { session, userId };
}

function parseRate(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
}

export async function GET(request: NextRequest) {
  const ctx = await requireSeller(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("services")
    .select("*")
    .eq("seller_id", ctx.userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ services: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await requireSeller(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: profile } = await db
    .from("admin_users")
    .select("name, base_country")
    .eq("id", ctx.userId)
    .single();
  if (!profile) return NextResponse.json({ error: "Seller profile missing" }, { status: 400 });

  try {
    const body = await request.json();
    const id = String(body.id || `service-${Date.now()}`);
    const providerName = String(body.name || body.providerName || profile.name || "").trim();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const longDescription = String(body.longDescription || body.long_description || description).trim();
    const category = String(body.category || "").trim();
    const location = String(body.location || "").trim();
    const country = String(body.country || profile.base_country || "").trim() || "North Macedonia";
    const phone = normalizeListingPhone(body.phone ?? body.contactPhone);
    const image = String(body.image || "").trim();
    const responseTime = String(body.responseTime || body.response_time || "Within 24 hours").trim();
    const currency = String(body.currency || "EUR").trim().toUpperCase();
    const available = body.available !== false;
    const hourlyRate = parseRate(body.hourlyRate ?? body.hourly_rate);
    const fixedRateFrom = parseRate(body.fixedRateFrom ?? body.fixed_rate_from);

    if (!providerName) return NextResponse.json({ error: "Provider name is required." }, { status: 400 });
    if (!title) return NextResponse.json({ error: "Service title is required." }, { status: 400 });
    if (!description) return NextResponse.json({ error: "Service description is required." }, { status: 400 });
    if (!category) return NextResponse.json({ error: "Service category is required." }, { status: 400 });
    if (!isValidListingPhone(phone)) {
      return NextResponse.json({ error: "A valid contact phone number is required." }, { status: 400 });
    }
    if (!isListingCurrency(currency)) {
      return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
    }
    if (hourlyRate === null) {
      return NextResponse.json({ error: "Hourly rate must be zero or greater." }, { status: 400 });
    }
    if (image && !/^https?:\/\//i.test(image)) {
      return NextResponse.json({ error: "Service image URL must be valid http(s)." }, { status: 400 });
    }

    const { data, error } = await db
      .from("services")
      .insert({
        id,
        name: providerName,
        provider_name: providerName,
        title,
        summary: description,
        description,
        long_description: longDescription,
        category,
        hourly_rate: hourlyRate,
        fixed_rate_from: fixedRateFrom,
        currency,
        location,
        country,
        phone,
        image,
        badges: [],
        available,
        response_time: responseTime,
        completed_jobs: 0,
        seller_id: ctx.userId,
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const ctx = await requireSeller(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Service ID required" }, { status: 400 });

    const db = createAdminClient();
    const { data: existing } = await db.from("services").select("id, seller_id").eq("id", body.id).single();
    if (!existing || existing.seller_id !== ctx.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined || body.providerName !== undefined || body.provider_name !== undefined) {
      const providerName = String(body.name || body.providerName || body.provider_name || "").trim();
      if (!providerName) return NextResponse.json({ error: "Provider name is required." }, { status: 400 });
      updates.name = providerName;
      updates.provider_name = providerName;
    }
    if (body.title !== undefined) updates.title = String(body.title || "").trim();
    if (body.description !== undefined) {
      const desc = String(body.description || "").trim();
      updates.description = desc;
      updates.summary = desc;
    }
    if (body.longDescription !== undefined || body.long_description !== undefined) {
      updates.long_description = String(body.longDescription || body.long_description || "").trim();
    }
    if (body.category !== undefined) updates.category = String(body.category || "").trim();
    if (body.location !== undefined) updates.location = String(body.location || "").trim();
    if (body.country !== undefined) updates.country = String(body.country || "").trim();
    if (body.phone !== undefined || body.contactPhone !== undefined) {
      const phone = normalizeListingPhone(body.phone ?? body.contactPhone);
      if (!isValidListingPhone(phone)) {
        return NextResponse.json({ error: "A valid contact phone number is required." }, { status: 400 });
      }
      updates.phone = phone;
    }
    if (body.image !== undefined) {
      const image = String(body.image || "").trim();
      if (image && !/^https?:\/\//i.test(image)) {
        return NextResponse.json({ error: "Service image URL must be valid http(s)." }, { status: 400 });
      }
      updates.image = image;
    }
    if (body.responseTime !== undefined || body.response_time !== undefined) {
      updates.response_time = String(body.responseTime || body.response_time || "").trim();
    }
    if (body.available !== undefined) updates.available = Boolean(body.available);
    if (body.currency !== undefined) {
      const currency = String(body.currency || "").trim().toUpperCase();
      if (!isListingCurrency(currency)) {
        return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
      }
      updates.currency = currency;
    }
    if (body.hourlyRate !== undefined || body.hourly_rate !== undefined) {
      const rate = parseRate(body.hourlyRate ?? body.hourly_rate);
      if (rate === null) {
        return NextResponse.json({ error: "Hourly rate must be zero or greater." }, { status: 400 });
      }
      updates.hourly_rate = rate;
    }
    if (body.fixedRateFrom !== undefined || body.fixed_rate_from !== undefined) {
      updates.fixed_rate_from = parseRate(body.fixedRateFrom ?? body.fixed_rate_from);
    }

    const { data, error } = await db.from("services").update(updates).eq("id", body.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const ctx = await requireSeller(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = createAdminClient();
  const { data: existing } = await db.from("services").select("seller_id").eq("id", id).single();
  if (!existing || existing.seller_id !== ctx.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await db.from("services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
