import { NextRequest, NextResponse } from "next/server";
import { resolveUserIdFromEmail, validateSession } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== "seller") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId = session.userId;
  if (!userId) userId = await resolveUserIdFromEmail(session.email);
  if (!userId) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("admin_users")
    .select("id, email, name, business_name, business_slug, base_country, role, phone, contact_email, gender, biography, logo_url")
    .eq("id", userId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== "seller") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let userId = session.userId;
  if (!userId) userId = await resolveUserIdFromEmail(session.email);
  if (!userId) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  try {
    const body = (await request.json()) as {
      biography?: unknown;
      logoUrl?: unknown;
      logo_url?: unknown;
    };

    const updates: Record<string, string> = {};

    if (body.biography !== undefined) {
      updates.biography = String(body.biography || "").trim().slice(0, 1500);
    }

    if (body.logoUrl !== undefined || body.logo_url !== undefined) {
      const rawLogo = String(body.logoUrl ?? body.logo_url ?? "").trim();
      if (!rawLogo) {
        updates.logo_url = "";
      } else {
        try {
          const parsed = new URL(rawLogo);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return NextResponse.json({ error: "Logo URL must use http or https." }, { status: 400 });
          }
          updates.logo_url = rawLogo;
        } catch {
          return NextResponse.json({ error: "Invalid logo URL." }, { status: 400 });
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No profile fields to update." }, { status: 400 });
    }

    const db = createAdminClient();
    const { data, error } = await db
      .from("admin_users")
      .update(updates)
      .eq("id", userId)
      .select("id, email, name, business_name, business_slug, base_country, role, phone, contact_email, gender, biography, logo_url")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to update profile." }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
}
