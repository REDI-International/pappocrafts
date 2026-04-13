import { NextRequest, NextResponse } from "next/server";
import { validateSession, type Session } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALLOWED_SELLER_COUNTRIES,
  insertSellerUser,
  isValidSellerPhone,
  normalizeSellerPhone,
  nextUniqueBusinessSlug,
  sha256Password,
} from "@/lib/admin-user-provision";

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

function isStaff(s: Session | null) {
  return s && (s.role === "superadmin" || s.role === "admin");
}

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!isStaff(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("admin_users")
    .select("id, email, name, role, base_country, business_name, business_slug, phone, created_at")
    .eq("role", "seller")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sellers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!isStaff(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    const businessName = String(body.businessName || body.business_name || "").trim();
    const baseCountry = String(body.baseCountry || body.base_country || "").trim();
    const phone = normalizeSellerPhone(body.phone);

    if (!email || !password || !name || !businessName || !isValidSellerPhone(phone)) {
      return NextResponse.json(
        { error: "email, password, name, businessName, and phone are required." },
        { status: 400 }
      );
    }
    if (!ALLOWED_SELLER_COUNTRIES.includes(baseCountry as (typeof ALLOWED_SELLER_COUNTRIES)[number])) {
      return NextResponse.json(
        { error: "baseCountry must be North Macedonia, Serbia, or Albania." },
        { status: 400 }
      );
    }

    const { data, error } = await insertSellerUser({
      email,
      password,
      name,
      businessName,
      baseCountry: baseCountry as (typeof ALLOWED_SELLER_COUNTRIES)[number],
      phone,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email or business slug already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request);
  if (!isStaff(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json({ error: "Query parameter id is required." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: row, error: fetchErr } = await db
    .from("admin_users")
    .select("id, role")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (row.role !== "seller") {
    return NextResponse.json({ error: "Only seller accounts can be removed from this screen." }, { status: 403 });
  }

  const { error } = await db.from("admin_users").delete().eq("id", id).eq("role", "seller");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!isStaff(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const id = String(body.id || "").trim();
    if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

    const db = createAdminClient();
    const { data: row, error: fetchErr } = await db
      .from("admin_users")
      .select("id, email, role, business_name, business_slug")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (!row) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (row.role !== "seller") {
      return NextResponse.json({ error: "Only seller accounts can be updated here." }, { status: 403 });
    }

    const updates: Record<string, string> = {};

    if (body.name !== undefined && body.name !== null) {
      const name = String(body.name).trim();
      if (!name) return NextResponse.json({ error: "name cannot be empty." }, { status: 400 });
      updates.name = name;
    }

    if (body.businessName !== undefined || body.business_name !== undefined) {
      const businessName = String(body.businessName ?? body.business_name ?? "").trim();
      if (!businessName) return NextResponse.json({ error: "businessName cannot be empty." }, { status: 400 });
      updates.business_name = businessName;
      updates.business_slug = await nextUniqueBusinessSlug(db, businessName, id);
    }

    if (body.baseCountry !== undefined || body.base_country !== undefined) {
      const baseCountry = String(body.baseCountry ?? body.base_country ?? "").trim();
      if (!ALLOWED_SELLER_COUNTRIES.includes(baseCountry as (typeof ALLOWED_SELLER_COUNTRIES)[number])) {
        return NextResponse.json(
          { error: "baseCountry must be North Macedonia, Serbia, or Albania." },
          { status: 400 }
        );
      }
      updates.base_country = baseCountry;
    }

    if (body.phone !== undefined && body.phone !== null) {
      const phone = normalizeSellerPhone(body.phone);
      if (!isValidSellerPhone(phone)) {
        return NextResponse.json({ error: "phone cannot be empty." }, { status: 400 });
      }
      updates.phone = phone;
    }

    if (body.email !== undefined && body.email !== null) {
      const email = String(body.email).trim().toLowerCase();
      if (!email) return NextResponse.json({ error: "email cannot be empty." }, { status: 400 });
      if (email !== row.email.toLowerCase()) {
        await db.from("admin_sessions").delete().eq("email", row.email);
        updates.email = email;
      }
    }

    if (body.password !== undefined && body.password !== null && String(body.password).length > 0) {
      const password = String(body.password);
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
      }
      updates.password_hash = sha256Password(password);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No changes provided." }, { status: 400 });
    }

    const { data: updated, error } = await db
      .from("admin_users")
      .update(updates)
      .eq("id", id)
      .eq("role", "seller")
      .select("id, email, name, business_name, business_slug, base_country, phone")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Email or business slug already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (updates.business_name !== undefined || updates.business_slug !== undefined) {
      await db
        .from("products")
        .update({
          business_name: updated.business_name,
          business_slug: updated.business_slug,
        })
        .eq("seller_id", id);
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
