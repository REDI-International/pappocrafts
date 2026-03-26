import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugifyBusinessName } from "@/lib/slug";

function sha256(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

function isStaff(s: ReturnType<typeof validateSession>) {
  return s && (s.role === "superadmin" || s.role === "admin");
}

const ALLOWED_COUNTRIES = ["North Macedonia", "Serbia", "Albania"] as const;

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!isStaff(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("admin_users")
    .select("id, email, name, role, base_country, business_name, business_slug, created_at")
    .eq("role", "seller")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sellers: data ?? [] });
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
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

    if (!email || !password || !name || !businessName) {
      return NextResponse.json(
        { error: "email, password, name, and businessName are required." },
        { status: 400 }
      );
    }
    if (!ALLOWED_COUNTRIES.includes(baseCountry as (typeof ALLOWED_COUNTRIES)[number])) {
      return NextResponse.json(
        { error: "baseCountry must be North Macedonia, Serbia, or Albania." },
        { status: 400 }
      );
    }

    const db = createAdminClient();
    let baseSlug = slugifyBusinessName(businessName);
    let slug = baseSlug;
    for (let i = 0; i < 20; i++) {
      const { data: existing } = await db.from("admin_users").select("id").eq("business_slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${i + 2}`;
    }

    const { data, error } = await db
      .from("admin_users")
      .insert({
        email,
        password_hash: sha256(password),
        role: "seller",
        name,
        business_name: businessName,
        business_slug: slug,
        base_country: baseCountry,
      })
      .select("id, email, name, business_name, business_slug, base_country")
      .single();

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
