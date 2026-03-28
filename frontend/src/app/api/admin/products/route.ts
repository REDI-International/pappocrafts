import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidListingPhone, normalizeListingPhone } from "@/lib/listing-phone";

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await db.from("products").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  }

  const { data, error } = await db.from("products").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const phone = normalizeListingPhone(body.phone ?? body.contactPhone);
    if (!isValidListingPhone(phone)) {
      return NextResponse.json({ error: "phone is required (min 6 characters)." }, { status: 400 });
    }
    const db = createAdminClient();
    const { data, error } = await db.from("products").insert({
      id: body.id || `product-${Date.now()}`,
      name: body.name,
      description: body.description || "",
      long_description: body.longDescription || body.long_description || "",
      price: body.price || 0,
      currency: body.currency || "EUR",
      category: body.category || "",
      artisan: body.artisan || "",
      country: body.country || "",
      phone,
      image: body.image || "",
      tags: body.tags || [],
      in_stock: body.inStock ?? body.in_stock ?? true,
      business_name: body.businessName ?? body.business_name ?? body.artisan ?? "",
      business_slug: body.businessSlug ?? body.business_slug ?? "",
      approval_status: "approved",
      reviewed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

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
    if (body.businessName !== undefined) updates.business_name = body.businessName;
    if (body.business_name !== undefined) updates.business_name = body.business_name;
    if (body.businessSlug !== undefined) updates.business_slug = body.businessSlug;
    if (body.business_slug !== undefined) updates.business_slug = body.business_slug;
    if (body.phone !== undefined || body.contactPhone !== undefined) {
      const phone = normalizeListingPhone(body.phone ?? body.contactPhone);
      if (!isValidListingPhone(phone)) {
        return NextResponse.json({ error: "phone is required (min 6 characters)." }, { status: 400 });
      }
      updates.phone = phone;
    }
    if (body.approval_status !== undefined) updates.approval_status = body.approval_status;
    if (body.approvalStatus !== undefined) updates.approval_status = body.approvalStatus;
    if (updates.approval_status !== undefined) {
      updates.reviewed_at = new Date().toISOString();
    }

    const db = createAdminClient();
    const { data, error } = await db.from("products").update(updates).eq("id", body.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
