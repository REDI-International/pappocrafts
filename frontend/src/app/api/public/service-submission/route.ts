import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidListingPhone, normalizeListingPhone } from "@/lib/listing-phone";

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

/** Anonymous service provider listing request; reviewed in admin (not on public services list). */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contactName = String(body.contactName || body.name || "").trim();
    const contactEmail = String(body.contactEmail || body.email || "").trim().toLowerCase();
    const contactPhone = normalizeListingPhone(body.contactPhone || body.phone);
    const serviceTitle = String(body.serviceTitle || body.title || "").trim();
    const serviceCategory = String(body.serviceCategory || body.category || "").trim();
    const serviceDescription = String(body.serviceDescription || body.description || "").trim();
    const location = String(body.location || "").trim();
    const country = String(body.country || "").trim() || "North Macedonia";
    const notes = String(body.notes || "").trim() || null;

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

    const db = createAdminClient();
    const payload = {
      status: "pending",
      contact_name: contactName,
      contact_email: contactEmail || "",
      contact_phone: contactPhone,
      service_title: serviceTitle,
      service_category: serviceCategory,
      service_description: serviceDescription,
      location,
      country,
      notes,
    };

    const { error } = await db.from("service_listing_requests").insert(payload);
    if (error) {
      console.error("[public/service-submission]", error);
      return NextResponse.json({ error: "Could not save your request. Please try again later." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: "pending",
      message:
        "Thank you. Our team will review your service listing and may contact you for more details before it goes live.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
