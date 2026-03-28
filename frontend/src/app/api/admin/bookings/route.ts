import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "user" || session.role === "seller") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = createAdminClient();
  const { data, error } = await db
    .from("service_bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/bookings]", error);
    return NextResponse.json({ error: "Failed to load bookings" }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [] });
}

const BOOKING_STATUSES = ["pending", "confirmed", "declined", "completed", "cancelled"] as const;
type BookingStatus = (typeof BOOKING_STATUSES)[number];

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role === "user" || session.role === "seller") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    const status = String(body.status || "").trim() as BookingStatus;

    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }
    if (!BOOKING_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${BOOKING_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    const db = createAdminClient();
    const { data, error } = await db
      .from("service_bookings")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[admin/bookings PATCH]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json({ booking: data });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
