import { NextRequest, NextResponse } from "next/server";
import { resolveUserIdFromEmail, validateSession } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";

function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

async function requireSeller(request: NextRequest) {
  const session = getSession(request);
  if (!session || session.role !== "seller") return null;
  let userId = session.userId;
  if (!userId) userId = await resolveUserIdFromEmail(session.email);
  if (!userId) return null;
  return { session, userId };
}

export async function GET(request: NextRequest) {
  const ctx = await requireSeller(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("seller_id", ctx.userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data ?? [] });
}

export async function POST(request: NextRequest) {
  const ctx = await requireSeller(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data: profile } = await db
    .from("admin_users")
    .select("business_name, business_slug, name, base_country")
    .eq("id", ctx.userId)
    .single();

  if (!profile) return NextResponse.json({ error: "Seller profile missing" }, { status: 400 });

  try {
    const body = await request.json();
    const id = String(body.id || `product-${Date.now()}`);
    const artisan = String(body.artisan || profile.name || "").trim() || profile.name;

    const row = {
      id,
      name: body.name,
      description: body.description || "",
      long_description: body.longDescription || body.long_description || "",
      price: body.price ?? 0,
      currency: body.currency || "EUR",
      category: body.category || "",
      artisan,
      country: String(body.country || profile.base_country || "").trim() || "North Macedonia",
      image: body.image || "",
      tags: body.tags || [],
      in_stock: body.inStock ?? body.in_stock ?? true,
      seller_id: ctx.userId,
      business_name: String(profile.business_name || "").trim() || artisan,
      business_slug: String(profile.business_slug || "").trim(),
      approval_status: "pending",
      submitted_at: new Date().toISOString(),
    };

    const { data, error } = await db.from("products").insert(row).select().single();
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
    if (!body.id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

    const db = createAdminClient();
    const { data: existing } = await db.from("products").select("id, seller_id").eq("id", body.id).single();
    if (!existing || existing.seller_id !== ctx.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.longDescription !== undefined) updates.long_description = body.longDescription;
    if (body.long_description !== undefined) updates.long_description = body.long_description;
    if (body.price !== undefined) updates.price = body.price;
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.category !== undefined) updates.category = body.category;
    if (body.artisan !== undefined) updates.artisan = body.artisan;
    if (body.country !== undefined) updates.country = body.country;
    if (body.image !== undefined) updates.image = body.image;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.inStock !== undefined) updates.in_stock = body.inStock;
    if (body.in_stock !== undefined) updates.in_stock = body.in_stock;

    updates.approval_status = "pending";
    updates.submitted_at = new Date().toISOString();
    updates.reviewed_at = null;

    const { data, error } = await db.from("products").update(updates).eq("id", body.id).select().single();
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
  const { data: existing } = await db.from("products").select("seller_id").eq("id", id).single();
  if (!existing || existing.seller_id !== ctx.userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await db.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
