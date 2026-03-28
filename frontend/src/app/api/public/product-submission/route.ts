import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidListingPhone, normalizeListingPhone } from "@/lib/listing-phone";
import { slugifyBusinessName } from "@/lib/slug";

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Anonymous product listing request; appears in admin product approvals (pending). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim();
    const description = String(body.description || "").trim();
    const longDescription = String(body.longDescription || body.long_description || "").trim();
    const artisan = String(body.artisan || body.makerName || body.businessName || "").trim();
    const contactEmail = String(body.contactEmail || body.email || "").trim().toLowerCase();
    const contactPhone = normalizeListingPhone(body.contactPhone || body.phone);
    const category = String(body.category || "").trim();
    const country = String(body.country || "").trim() || "North Macedonia";
    const image = String(body.image || body.imageUrl || "").trim();
    const price = Number(body.price);
    const currency = String(body.currency || "EUR").trim() || "EUR";

    if (name.length < 2) {
      return NextResponse.json({ error: "Product name is required." }, { status: 400 });
    }
    if (description.length < 10) {
      return NextResponse.json({ error: "Please add a short description (at least 10 characters)." }, { status: 400 });
    }
    if (contactEmail && !isValidEmail(contactEmail)) {
      return NextResponse.json({ error: "If provided, contact email must be valid." }, { status: 400 });
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
    if (!isValidListingPhone(contactPhone)) {
      return NextResponse.json({ error: "A valid contact phone number is required." }, { status: 400 });
    }

    const id = `pub-product-${crypto.randomUUID()}`;
    const baseSlug = slugifyBusinessName(artisan);
    const business_slug = `${baseSlug}-${id.slice(-10)}`;

    const db = createAdminClient();
    const row = {
      id,
      name,
      description,
      long_description: longDescription,
      price,
      currency,
      category,
      artisan,
      country,
      image: image || "",
      tags: [] as string[],
      in_stock: true,
      seller_id: null as string | null,
      business_name: artisan,
      business_slug,
      approval_status: "pending",
      submitted_at: new Date().toISOString(),
      submitter_email: contactEmail || null,
      submitter_phone: contactPhone,
      phone: contactPhone,
    };

    const { error } = await db.from("products").insert(row);
    if (error) {
      console.error("[public/product-submission]", error);
      return NextResponse.json({ error: "Could not save your submission. Please try again later." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      approval_status: "pending",
      message:
        "Your product was submitted for review. It will not appear in the shop until an administrator approves it.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
