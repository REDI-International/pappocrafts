import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-store";
import { createAdminClient, isSupabaseMissingColumnError } from "@/lib/supabase/admin";
import { productImageDbPayload } from "@/lib/product-images";
import { normalizeProductSellerGender, productTagsWithGender } from "@/lib/product-gender";
import { normalizeProductSizes, productSizesDbPayload, productTagsWithSizes } from "@/lib/product-sizes";

type ProductWritePayload = Record<string, unknown>;
type SupabaseWriteError = { message?: string; code?: string } | null;
type SellerProfile = {
  id: string;
  email?: string;
  name?: string;
  business_name?: string;
  business_slug?: string;
  phone?: string;
  contact_email?: string;
  gender?: string;
};

function removeMissingRolloutColumn(payload: ProductWritePayload, error: SupabaseWriteError): boolean {
  if (isSupabaseMissingColumnError(error, "contact_email") && "contact_email" in payload) {
    delete payload.contact_email;
    return true;
  }
  if (isSupabaseMissingColumnError(error, "seller_gender") && "seller_gender" in payload) {
    delete payload.seller_gender;
    return true;
  }
  if (isSupabaseMissingColumnError(error, "available_sizes") && "available_sizes" in payload) {
    delete payload.available_sizes;
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

async function loadSellerProfile(
  db: ReturnType<typeof createAdminClient>,
  sellerId: unknown
): Promise<SellerProfile | null> {
  const id = String(sellerId ?? "").trim();
  if (!id) return null;

  const { data } = await db
    .from("admin_users")
    .select("id, email, name, business_name, business_slug, phone, contact_email, gender")
    .eq("id", id)
    .eq("role", "seller")
    .maybeSingle();

  return (data as SellerProfile | null) ?? null;
}

async function enrichProductsWithSellers(
  db: ReturnType<typeof createAdminClient>,
  rows: ProductWritePayload[]
): Promise<ProductWritePayload[]> {
  const sellerIds = Array.from(
    new Set(
      rows
        .map((row) => (typeof row.seller_id === "string" ? row.seller_id.trim() : ""))
        .filter(Boolean)
    )
  );
  if (sellerIds.length === 0) return rows;

  const { data: sellers } = await db
    .from("admin_users")
    .select("id, email, name, business_name, business_slug, phone, contact_email, gender")
    .in("id", sellerIds);

  const byId = new Map(((sellers as SellerProfile[] | null) ?? []).map((seller) => [seller.id, seller]));
  return rows.map((row) => {
    const sellerId = typeof row.seller_id === "string" ? row.seller_id.trim() : "";
    const seller = byId.get(sellerId);
    if (!seller) return row;
    const gender = normalizeProductSellerGender(seller.gender);
    return {
      ...row,
      artisan: seller.name || row.artisan,
      business_name: seller.business_name || row.business_name,
      business_slug: seller.business_slug || row.business_slug,
      contact_email: seller.contact_email || seller.email || row.contact_email,
      submitter_email: seller.contact_email || seller.email || row.submitter_email,
      seller_gender: gender,
      tags: productTagsWithGender(row.tags, gender),
      phone: seller.phone || row.phone,
    };
  });
}

function applySellerProfile(
  payload: ProductWritePayload,
  seller: SellerProfile | null,
  fallbackGender: "M" | "F" | null
) {
  if (!seller) {
    payload.seller_id = null;
    payload.tags = productTagsWithGender(payload.tags, fallbackGender);
    payload.seller_gender = fallbackGender;
    return;
  }

  const gender = normalizeProductSellerGender(seller.gender);
  payload.seller_id = seller.id;
  payload.artisan = seller.name || payload.artisan || "";
  payload.business_name = seller.business_name || payload.business_name || seller.name || "";
  payload.business_slug = seller.business_slug || payload.business_slug || "";
  payload.contact_email = seller.contact_email || seller.email || payload.contact_email || "";
  payload.submitter_email = seller.contact_email || seller.email || payload.submitter_email || "";
  payload.seller_gender = gender;
  payload.tags = productTagsWithGender(payload.tags, gender);
  payload.phone = seller.phone || payload.phone || "";
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
    return NextResponse.json(data ? (await enrichProductsWithSellers(db, [data as ProductWritePayload]))[0] : data);
  }

  const { data, error } = await db.from("products").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(await enrichProductsWithSellers(db, (data ?? []) as ProductWritePayload[]));
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
    const seller = await loadSellerProfile(db, body.sellerId ?? body.seller_id);
    const row: ProductWritePayload = {
      id: body.id || `product-${Date.now()}`,
      seller_id: null,
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
      tags: productTagsWithSizes(productTagsWithGender(body.tags, sellerGender), body.availableSizes ?? body.available_sizes),
      available_sizes: normalizeProductSizes(body.availableSizes ?? body.available_sizes),
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
    applySellerProfile(row, seller, sellerGender);

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

    const db = createAdminClient();
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
    const sellerFieldProvided = body.sellerId !== undefined || body.seller_id !== undefined;
    const seller = sellerFieldProvided ? await loadSellerProfile(db, body.sellerId ?? body.seller_id) : undefined;
    const sellerGender =
      body.sellerGender !== undefined || body.seller_gender !== undefined
        ? normalizeProductSellerGender(body.sellerGender ?? body.seller_gender)
        : undefined;
    if (body.tags !== undefined) updates.tags = productTagsWithGender(body.tags, sellerGender);
    if (body.availableSizes !== undefined || body.available_sizes !== undefined) {
      const rawSizes = body.availableSizes ?? body.available_sizes;
      updates.available_sizes = normalizeProductSizes(rawSizes);
      updates.tags = productTagsWithSizes(updates.tags ?? body.tags, rawSizes);
    }
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
    if (sellerFieldProvided) {
      applySellerProfile(updates, seller ?? null, sellerGender ?? null);
    }
    if (sellerGender !== undefined && updates.tags === undefined) {
      const { data: existing } = await db
        .from("products")
        .select("tags")
        .eq("id", body.id)
        .maybeSingle();
      updates.tags = existing?.tags;
    }
    if (sellerGender !== undefined) {
      updates.seller_gender = sellerGender;
      updates.tags = productTagsWithGender(updates.tags, sellerGender);
      if (body.availableSizes !== undefined || body.available_sizes !== undefined) {
        updates.tags = productTagsWithSizes(updates.tags, body.availableSizes ?? body.available_sizes);
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
