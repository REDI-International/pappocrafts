import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";

function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await db.from("services").select("*").eq("id", id).single();
    if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
  }

  const { data, error } = await db.from("services").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const db = createAdminClient();
    const { data, error } = await db.from("services").insert({
      id: body.id || `service-${Date.now()}`,
      name: body.name,
      title: body.title || "",
      description: body.description || "",
      long_description: body.longDescription || body.long_description || "",
      category: body.category || "",
      hourly_rate: body.hourlyRate ?? body.hourly_rate ?? 0,
      fixed_rate_from: body.fixedRateFrom ?? body.fixed_rate_from ?? null,
      currency: body.currency || "EUR",
      rating: body.rating ?? 5.0,
      review_count: body.reviewCount ?? body.review_count ?? 0,
      location: body.location || "",
      country: body.country || "",
      image: body.image || "",
      badges: body.badges || [],
      available: body.available ?? true,
      response_time: body.responseTime || body.response_time || "",
      completed_jobs: body.completedJobs ?? body.completed_jobs ?? 0,
      provider_name: body.providerName ?? body.provider_name ?? body.name ?? "",
      summary: body.summary ?? "",
      years_experience: body.yearsExperience ?? body.years_experience ?? "",
      languages_spoken: body.languagesSpoken ?? body.languages_spoken ?? "",
      booking_calendar_url: body.bookingCalendarUrl ?? body.booking_calendar_url ?? "",
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    if (!body.id) return NextResponse.json({ error: "Service ID required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.longDescription !== undefined) updates.long_description = body.longDescription;
    if (body.category !== undefined) updates.category = body.category;
    if (body.hourlyRate !== undefined) updates.hourly_rate = body.hourlyRate;
    if (body.fixedRateFrom !== undefined) updates.fixed_rate_from = body.fixedRateFrom;
    if (body.location !== undefined) updates.location = body.location;
    if (body.country !== undefined) updates.country = body.country;
    if (body.image !== undefined) updates.image = body.image;
    if (body.badges !== undefined) updates.badges = body.badges;
    if (body.available !== undefined) updates.available = body.available;
    if (body.responseTime !== undefined) updates.response_time = body.responseTime;
    if (body.providerName !== undefined) updates.provider_name = body.providerName;
    if (body.provider_name !== undefined) updates.provider_name = body.provider_name;
    if (body.summary !== undefined) updates.summary = body.summary;
    if (body.yearsExperience !== undefined) updates.years_experience = body.yearsExperience;
    if (body.years_experience !== undefined) updates.years_experience = body.years_experience;
    if (body.languagesSpoken !== undefined) updates.languages_spoken = body.languagesSpoken;
    if (body.languages_spoken !== undefined) updates.languages_spoken = body.languages_spoken;
    if (body.bookingCalendarUrl !== undefined) updates.booking_calendar_url = body.bookingCalendarUrl;
    if (body.booking_calendar_url !== undefined) updates.booking_calendar_url = body.booking_calendar_url;

    const db = createAdminClient();
    const { data, error } = await db.from("services").update(updates).eq("id", body.id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Service ID required" }, { status: 400 });

  const db = createAdminClient();
  const { error } = await db.from("services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
