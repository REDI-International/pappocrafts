import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-store";
import { createAdminClient, isSupabaseMissingColumnError } from "@/lib/supabase/admin";
import { productImageDbPayload } from "@/lib/product-images";
import { normalizeProductSellerGender, productTagsWithGender } from "@/lib/product-gender";

type ProductWritePayload = Record<string, unknown>;
type SupabaseWriteError = { message?: string; code?: string } | null;

function removeMissingRolloutColumn(payload: ProductWritePayload, error: SupabaseWriteError): boolean {
  if (isSupabaseMissingColumnError(error, "contact_email") && "contact_email" in payload) {
    delete payload.contact_email;
    return true;
  }
  if (isSupabaseMissingColumnError(error, "seller_gender") && "seller_gender" in payload) {
    delete payload.seller_gender;
    return true;
  }
  return false;
}

function productWriteErrorResponse(error: SupabaseWriteError) {
  return NextResponse.json({ error: error?.message || "Product save failed." }, { status: 500 });
}

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

function productTagsFromRow(row: { tags?: unknown } | null | undefined): string[] {
  return Array.isArray(row?.tags)
    ? row.tags.filter((tag): tag is string => typeof tag === "string")
    : [];
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
    const db = createAdminClient();
    const { image, images } = productImageDbPayload(
      body.images !== undefined ? body.images : body.image ? [body.image] : []
    );
    const sellerGender = normalizeProductSellerGender(body.sellerGender ?? body.seller_gender);
    const row: ProductWritePayload = {
      id: body.id || `product-${Date.now()}`,
      name: body.name,
      description: body.description || "",
      long_description: body.longDescription || body.long_description || "",
      price: body.price || 0,
      currency: body.currency || "EUR",
      category: body.category || "",
      artisan: body.artisan || "",
      country: body.country || "",
      phone: String(body.phone ?? body.contactPhone ?? "").trim(),
      image,
      images,
      tags: productTagsWithGender(body.tags, sellerGender),
      in_stock: body.inStock ?? body.in_stock ?? true,
      business_name: body.businessName ?? body.business_name ?? body.artisan ?? "",
      business_slug: body.businessSlug ?? body.business_slug ?? "",
      contact_email: body.contactEmail ?? body.contact_email ?? "",
      submitter_email: body.contactEmail ?? body.contact_email ?? "",
      seller_gender: sellerGender,
      approval_status: "approved",
      reviewed_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
    };

    let data = null;
    let error: SupabaseWriteError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await db.from("products").insert(row).select().single();
      data = result.data;
      error = result.error;
      if (!error || !removeMissingRolloutColumn(row, error)) break;
    }

    if (error) return productWriteErrorResponse(error);
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

    const updates: ProductWritePayload = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.longDescription !== undefined) updates.long_description = body.longDescription;
    if (body.long_description !== undefined) updates.long_description = body.long_description;
    if (body.price !== undefined) updates.price = body.price;
    if (body.currency !== undefined) updates.currency = body.currency;
    if (body.category !== undefined) updates.category = body.category;
    if (body.artisan !== undefined) updates.artisan = body.artisan;
    if (body.country !== undefined) updates.country = body.country;
    if (body.images !== undefined) {
      const { image, images } = productImageDbPayload(body.images);
      updates.image = image;
      updates.images = images;
    } else if (body.image !== undefined) {
      const { image, images } = productImageDbPayload([body.image]);
      updates.image = image;
      updates.images = images;
    }
    const sellerGender =
      body.sellerGender !== undefined || body.seller_gender !== undefined
        ? normalizeProductSellerGender(body.sellerGender ?? body.seller_gender)
        : undefined;
    if (body.tags !== undefined) updates.tags = productTagsWithGender(body.tags, sellerGender);
    if (body.inStock !== undefined) updates.in_stock = body.inStock;
    if (body.in_stock !== undefined) updates.in_stock = body.in_stock;
    if (body.businessName !== undefined) updates.business_name = body.businessName;
    if (body.business_name !== undefined) updates.business_name = body.business_name;
    if (body.businessSlug !== undefined) updates.business_slug = body.businessSlug;
    if (body.business_slug !== undefined) updates.business_slug = body.business_slug;
    if (body.phone !== undefined || body.contactPhone !== undefined) {
      updates.phone = String(body.phone ?? body.contactPhone ?? "").trim();
    }
    if (body.approval_status !== undefined) updates.approval_status = body.approval_status;
    if (body.approvalStatus !== undefined) updates.approval_status = body.approvalStatus;
    if (body.contactEmail !== undefined) {
      updates.contact_email = body.contactEmail;
      updates.submitter_email = body.contactEmail;
    }
    if (body.contact_email !== undefined) {
      updates.contact_email = body.contact_email;
      updates.submitter_email = body.contact_email;
    }
    const db = createAdminClient();
    if (sellerGender !== undefined) {
      updates.seller_gender = sellerGender;
      if (updates.tags === undefined) {
        const { data: existing } = await db
          .from("products")
          .select("tags")
          .eq("id", body.id)
          .maybeSingle();
        updates.tags = productTagsWithGender(existing?.tags, sellerGender);
      }
    }
    if (updates.approval_status !== undefined) {
      updates.reviewed_at = new Date().toISOString();
    }

    let data = null;
    let error: SupabaseWriteError = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const result = await db.from("products").update(updates).eq("id", body.id).select().single();
      data = result.data;
      error = result.error;
      if (!error || !removeMissingRolloutColumn(updates, error)) break;
    }
    if (error) return productWriteErrorResponse(error);
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
