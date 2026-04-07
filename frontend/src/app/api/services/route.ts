import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redactPublicListingContact } from "@/lib/public-listing-response";

type ListingRow = Record<string, unknown>;

async function enrichWithSellerProfile(
  db: ReturnType<typeof createAdminClient>,
  rows: ListingRow[]
): Promise<ListingRow[]> {
  const sellerIds = Array.from(
    new Set(
      rows
        .map((row) => (typeof row.seller_id === "string" ? row.seller_id.trim() : ""))
        .filter((id) => id.length > 0)
    )
  );
  if (sellerIds.length === 0) return rows;

  // Keep endpoint resilient while migration is rolling out.
  let sellers:
    | Array<{ id: string; name?: string; business_name?: string; biography?: string; logo_url?: string }>
    | null = null;
  {
    const { data } = await db
      .from("admin_users")
      .select("id, name, business_name, biography, logo_url")
      .in("id", sellerIds);
    sellers = data;
  }
  if (!sellers) {
    const { data: fallback } = await db
      .from("admin_users")
      .select("id, name, business_name")
      .in("id", sellerIds);
    sellers = fallback;
  }
  if (!sellers) return rows;

  const byId = new Map(sellers.map((seller) => [seller.id, seller]));
  return rows.map((row) => {
    const sellerId = typeof row.seller_id === "string" ? row.seller_id.trim() : "";
    if (!sellerId) return row;
    const seller = byId.get(sellerId);
    if (!seller) return row;
    return {
      ...row,
      seller_name: String(seller.business_name || seller.name || ""),
      seller_biography: String(seller.biography || ""),
      seller_logo_url: String(seller.logo_url || ""),
    };
  });
}

/** Public catalog of service providers (no auth). */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const category = searchParams.get("category");

  try {
    const db = createAdminClient();

    if (id) {
      const { data, error } = await db.from("services").select("*").eq("id", id).single();
      if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const [enriched] = await enrichWithSellerProfile(db, [data as ListingRow]);
      return NextResponse.json(redactPublicListingContact(enriched || (data as ListingRow)), {
        headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
      });
    }

    let query = db.from("services").select("*").order("created_at", { ascending: false });
    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const enrichedRows = await enrichWithSellerProfile(
      db,
      ((data ?? []) as ListingRow[])
    );
    const rows = enrichedRows.map((r) => redactPublicListingContact(r));
    return NextResponse.json(rows, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}
