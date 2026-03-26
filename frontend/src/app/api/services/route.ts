import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      return NextResponse.json(data, {
        headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
      });
    }

    let query = db.from("services").select("*").order("created_at", { ascending: false });
    if (category && category !== "All") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? [], {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}
