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
    .select("id, email, name, business_name, business_slug, base_country, role")
    .eq("id", userId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data);
}
