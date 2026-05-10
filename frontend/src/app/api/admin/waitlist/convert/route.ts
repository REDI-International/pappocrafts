import { NextRequest, NextResponse } from "next/server";
import { validateSession, type Session } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALLOWED_SELLER_COUNTRIES,
  insertBuyerUser,
  insertSellerUser,
  isValidSellerGender,
  normalizeSellerGender,
  normalizeSellerPhone,
} from "@/lib/admin-user-provision";

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

function isStaff(s: Session | null) {
  return s && (s.role === "superadmin" || s.role === "admin");
}

type ConvertAction =
  | "create_buyer"
  | "create_product_seller"
  | "create_service_provider"
  | "dismiss";

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!isStaff(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const waitlistId = Number(body.waitlistId);
    const action = body.action as ConvertAction;

    if (!Number.isFinite(waitlistId) || waitlistId < 1) {
      return NextResponse.json({ error: "waitlistId is required." }, { status: 400 });
    }

    const validActions: ConvertAction[] = [
      "create_buyer",
      "create_product_seller",
      "create_service_provider",
      "dismiss",
    ];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const db = createAdminClient();
    const { data: row, error: fetchErr } = await db
      .from("waitlist")
      .select("id, email, role, status")
      .eq("id", waitlistId)
      .maybeSingle();

    if (fetchErr) {
      console.error("[waitlist/convert] fetch:", fetchErr);
      return NextResponse.json({ error: "Failed to load waitlist entry." }, { status: 500 });
    }
    if (!row) return NextResponse.json({ error: "Waitlist entry not found." }, { status: 404 });

    if ((row.status ?? "pending") !== "pending") {
      return NextResponse.json(
        { error: "This entry has already been processed. Only pending rows can be converted." },
        { status: 409 }
      );
    }

    const signupRole = row.role === "seller" ? "seller" : "buyer";

    if (action === "dismiss") {
      const { error } = await db.from("waitlist").update({ status: "dismissed" }).eq("id", waitlistId);
      if (error) {
        console.error("[waitlist/convert] dismiss:", error);
        return NextResponse.json({ error: "Failed to dismiss entry." }, { status: 500 });
      }
      return NextResponse.json({ ok: true, status: "dismissed" });
    }

    const password = String(body.password || "");
    const name = String(body.name || "").trim();
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (action === "create_buyer") {
      if (signupRole !== "buyer") {
        return NextResponse.json(
          { error: "This person signed up as a seller. Use a seller option instead." },
          { status: 400 }
        );
      }
      const { data, error } = await insertBuyerUser({
        email: row.email,
        password,
        name,
      });
      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { error: "An account with this email already exists." },
            { status: 409 }
          );
        }
        console.error("[waitlist/convert] buyer:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "Account insert returned no row." }, { status: 500 });
      }
      const { error: upErr } = await db
        .from("waitlist")
        .update({ status: "buyer_created", linked_admin_user_id: data.id })
        .eq("id", waitlistId);
      if (upErr) {
        console.error("[waitlist/convert] waitlist update after buyer:", upErr);
        return NextResponse.json(
          { error: "Account was created but waitlist could not be updated. Fix in Supabase." },
          { status: 500 }
        );
      }
      return NextResponse.json({
        ok: true,
        status: "buyer_created",
        adminUser: data,
        message: "Buyer can sign in at /login with this email and the password you set.",
      });
    }

    if (action === "create_product_seller" || action === "create_service_provider") {
      if (signupRole !== "seller") {
        return NextResponse.json(
          { error: "This person signed up as a buyer. Create a buyer account instead." },
          { status: 400 }
        );
      }
      const businessName = String(body.businessName || body.business_name || "").trim();
      const baseCountry = String(body.baseCountry || body.base_country || "").trim();
      const phone = normalizeSellerPhone(body.phone);
      const gender = normalizeSellerGender(body.gender);
      if (!businessName) {
        return NextResponse.json({ error: "Business / display name is required." }, { status: 400 });
      }
      if (!ALLOWED_SELLER_COUNTRIES.includes(baseCountry as (typeof ALLOWED_SELLER_COUNTRIES)[number])) {
        return NextResponse.json(
          { error: "baseCountry must be North Macedonia, Serbia, or Albania." },
          { status: 400 }
        );
      }
      if (!isValidSellerGender(gender)) {
        return NextResponse.json({ error: "gender must be M or F." }, { status: 400 });
      }

      const { data, error } = await insertSellerUser({
        email: row.email,
        password,
        name,
        businessName,
        baseCountry: baseCountry as (typeof ALLOWED_SELLER_COUNTRIES)[number],
        phone,
        contactEmail: row.email,
        gender,
      });

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { error: "An account with this email or business slug already exists." },
            { status: 409 }
          );
        }
        console.error("[waitlist/convert] seller:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "Account insert returned no row." }, { status: 500 });
      }

      const nextStatus =
        action === "create_product_seller" ? "product_seller_created" : "service_provider_created";

      const { error: upErr } = await db
        .from("waitlist")
        .update({ status: nextStatus, linked_admin_user_id: data.id })
        .eq("id", waitlistId);

      if (upErr) {
        console.error("[waitlist/convert] waitlist update after seller:", upErr);
        return NextResponse.json(
          { error: "Seller account was created but waitlist could not be updated. Fix in Supabase." },
          { status: 500 }
        );
      }

      const response: Record<string, unknown> = {
        ok: true,
        status: nextStatus,
        adminUser: data,
        message:
          action === "create_product_seller"
            ? "Product seller account created. They can sign in at /login. Manage listings under Sellers / Products."
            : "Service provider account created. Add their public service listing under Services (linked to this seller).",
      };

      if (action === "create_service_provider") {
        response.servicesUrl = `/admin/services?prefillSellerId=${data.id}`;
      }

      return NextResponse.json(response);
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
