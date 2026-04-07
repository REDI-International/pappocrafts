import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, isPostgrestSchemaMismatch } from "@/lib/supabase/admin";
import { verifyTurnstileFromRequest } from "@/lib/verify-turnstile";
import { isValidListingPhone, normalizeListingPhone } from "@/lib/listing-phone";
import { isListingCurrency } from "@/lib/eur-fallback-rates";

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function serviceSubmissionConfigErrorResponse() {
  return NextResponse.json(
    {
      error:
        "The server cannot reach the database. Check that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set on the deployment.",
    },
    { status: 500 }
  );
}

/** Anonymous service provider listing request; reviewed in admin (not on public services list). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const captcha = await verifyTurnstileFromRequest(body.captchaToken ?? body.turnstileToken, request);
    if (!captcha.ok) {
      return NextResponse.json({ error: captcha.error }, { status: 400 });
    }
    const contactName = String(body.contactName || body.name || "").trim();
    const contactEmail = String(body.contactEmail || body.email || "").trim().toLowerCase();
    const contactPhone = normalizeListingPhone(body.contactPhone || body.phone);
    const serviceTitle = String(body.serviceTitle || body.title || "").trim();
    const serviceCategory = String(body.serviceCategory || body.category || "").trim();
    const serviceDescription = String(body.serviceDescription || body.description || "").trim();
    const location = String(body.location || "").trim();
    const country = String(body.country || "").trim() || "North Macedonia";
    const notes = String(body.notes || "").trim() || null;
    const hourlyRaw = body.hourlyRate ?? body.hourly_rate;
    const hourlyRate = typeof hourlyRaw === "number" ? hourlyRaw : Number(String(hourlyRaw ?? "").replace(",", "."));
    const currency = String(body.currency || "EUR").trim().toUpperCase() || "EUR";
    const imageUrl = String(body.imageUrl || body.image_url || body.photoUrl || "").trim();
    const available = body.available !== false;

    if (contactName.length < 2) {
      return NextResponse.json({ error: "Your name is required." }, { status: 400 });
    }
    if (contactEmail && !isValidEmail(contactEmail)) {
      return NextResponse.json({ error: "If provided, email must be valid." }, { status: 400 });
    }
    if (!isValidListingPhone(contactPhone)) {
      return NextResponse.json({ error: "A valid contact phone number is required." }, { status: 400 });
    }
    if (serviceTitle.length < 2) {
      return NextResponse.json({ error: "Service title is required." }, { status: 400 });
    }
    if (!serviceCategory) {
      return NextResponse.json({ error: "Service category is required." }, { status: 400 });
    }
    if (serviceDescription.length < 20) {
      return NextResponse.json(
        { error: "Please describe your service in at least 20 characters." },
        { status: 400 }
      );
    }
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0) {
      return NextResponse.json({ error: "Hourly rate must be zero or greater." }, { status: 400 });
    }
    if (!isListingCurrency(currency)) {
      return NextResponse.json({ error: "Unsupported currency." }, { status: 400 });
    }
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      return NextResponse.json({ error: "If provided, photo must be a valid http(s) URL." }, { status: 400 });
    }

    let db;
    try {
      db = createAdminClient();
    } catch (e) {
      console.error("[public/service-submission] admin client", e);
      return serviceSubmissionConfigErrorResponse();
    }

    const payload = {
      status: "pending" as const,
      contact_name: contactName,
      contact_email: contactEmail || "",
      contact_phone: contactPhone,
      service_title: serviceTitle,
      service_category: serviceCategory,
      service_description: serviceDescription,
      location,
      country,
      notes,
      hourly_rate: Math.round(hourlyRate * 100) / 100,
      currency,
      image_url: imageUrl,
      available,
    };

    const legacyPayload = {
      status: "pending" as const,
      contact_name: contactName,
      contact_email: contactEmail || "",
      contact_phone: contactPhone,
      service_title: serviceTitle,
      service_category: serviceCategory,
      service_description: serviceDescription,
      location,
      country,
      notes,
      available,
    };

    let { error } = await db.from("service_listing_requests").insert(payload);
    if (error && isPostgrestSchemaMismatch(error)) {
      ({ error } = await db.from("service_listing_requests").insert(legacyPayload));
    }
    if (error) {
      console.error("[public/service-submission]", error.code, error.message, error.details, error.hint);
      return NextResponse.json({ error: "Could not save your request. Please try again later." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      message:
        "Thank you. Our team will review your service listing and may contact you for more details before it goes live.",
    });
  } catch (e) {
    console.error("[public/service-submission] unexpected", e);
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
