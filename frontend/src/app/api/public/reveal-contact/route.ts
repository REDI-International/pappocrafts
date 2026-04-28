import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type RpcRow = { out_contact?: string; out_phone?: string; out_count: number };

/** Atomically increment reveal counter and return email for products or phone for services. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const kind = String(body.kind || body.type || "").trim().toLowerCase();
    const id = String(body.id || "").trim();

    if (kind !== "product" && kind !== "service") {
      return NextResponse.json({ error: "kind must be product or service." }, { status: 400 });
    }
    if (!id) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const db = createAdminClient();
    const { data, error } = await db.rpc("increment_listing_contact_reveal", {
      p_kind: kind,
      p_id: id,
    });

    if (error) {
      console.error("[reveal-contact]", error);
      return NextResponse.json({ error: "Could not reveal contact." }, { status: 500 });
    }

    const rows = (data as RpcRow[] | null) ?? [];
    const row = rows[0];
    const contact = String(row?.out_contact || row?.out_phone || "").trim();
    if (!contact) {
      return NextResponse.json(
        {
          error:
            kind === "product"
              ? "Seller contact email has not been added for this product yet."
              : "Listing not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      contact,
      ...(kind === "product" ? { email: contact } : { phone: contact }),
      contactRevealCount: row.out_count,
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
