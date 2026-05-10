import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isSupabaseMissingColumnError } from "@/lib/supabase/admin";
import { verifyTurnstileFromRequest } from "@/lib/verify-turnstile";
import { normalizeListingPhone } from "@/lib/listing-phone";
import { slugifyBusinessName } from "@/lib/slug";
import { isListingCurrency } from "@/lib/eur-fallback-rates";
import { normalizeProductImageUrls, productImageDbPayload } from "@/lib/product-images";

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function productSubmissionConfigErrorResponse() {
  return NextResponse.json(
    {
      error:
        "The server cannot reach the database. Check that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set on the deployment.",
    },
    { status: 500 }
  );
}

/** Anonymous product listing request; appears in admin product approvals (pending). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const captcha = await verifyTurnstileFromRequest(body.captchaToken ?? body.turnstileToken, request);
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const longDescription = String(body.longDescription || body.long_description || "").trim();
    const artisan = String(body.artisan || body.makerName || body.businessName || "").trim();
    const contactEmail = String(body.contactEmail || body.email || "").trim().toLowerCase();
    const contactPhone = normalizeListingPhone(body.contactPhone || body.phone);
    const category = String(body.category || "").trim();
    const country = String(body.country || "").trim() || "North Macedonia";
    const fromGallery = normalizeProductImageUrls(body.images);
    const legacySingle = String(body.image || body.imageUrl || "").trim();
    const { image, images } = productImageDbPayload(
      fromGallery.length ? fromGallery : legacySingle ? [legacySingle] : []
    );
    const price = Number(body.price);
    const inStock = body.inStock ?? body.in_stock;
    const normalizedInStock = inStock === undefined ? true : Boolean(inStock);
    const currency = String(body.currency || "EUR").trim().toUpperCase() || "EUR";

    if (name.length < 2) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }
    if (description.length < 10) {
      return NextResponse.json({ error: "Please add a short description (at least 10 characters)." }, { status: 400 });
    }
    if (!isValidEmail(contactEmail)) {
      return NextResponse.json({ error: "A valid contact email is required." }, { status: 400 });
    }
    if (!artisan || artisan.length < 2) {
      return NextResponse.json({ error: "Maker or business name is required." }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: "Category is required." }, { status: 400 });
    }
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Price must be zero or greater." }, { status: 400 });
    }
    if (!isListingCurrency(currency)) {
      return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
    }

    const id = `pub-product-${crypto.randomUUID()}`;
    const business_slug = slugifyBusinessName(artisan);

    let db;
    try {
      db = createAdminClient();
    } catch (e) {
      console.error("[public/product-submission] admin client", e);
      return productSubmissionConfigErrorResponse();
    }

    const row = {
      id,
      name,
      description,
      long_description: longDescription,
      price: Math.round(price * 100) / 100,
      currency,
      category,
      artisan,
      country,
      image,
      images,
      tags: [] as string[],
      in_stock: normalizedInStock,
      seller_id: null as string | null,
      business_name: artisan,
      business_slug,
      approval_status: "pending",
      submitted_at: new Date().toISOString(),
      submitter_email: contactEmail || null,
      submitter_phone: contactPhone,
      phone: contactPhone,
    };

    let { error } = await db.from("products").insert(row);
    if (error && isSupabaseMissingColumnError(error, "images")) {
      const { images: _omit, ...withoutImages } = row;
      ({ error } = await db.from("products").insert(withoutImages));
    }
    if (error) {
      console.error("[public/product-submission]", error.code, error.message, error.details, error.hint);
      return NextResponse.json({ error: "Could not save your submission. Please try again later." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      approval_status: "pending",
      message:
        "Your product was submitted for review. It will not appear in the shop until an administrator approves it.",
    });
  } catch (e) {
    console.error("[public/product-submission] unexpected", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
