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

  const roleParam = request.nextUrl.searchParams.get("role");
  const statusParam = request.nextUrl.searchParams.get("status");
  const db = createAdminClient();
  let q = db
    .from("waitlist")
    .select("id, email, role, created_at, status, linked_admin_user_id")
    .order("created_at", { ascending: false });

  if (roleParam === "buyer" || roleParam === "seller") {
    q = q.eq("role", roleParam);
  }

  if (statusParam === "pending") {
    q = q.eq("status", "pending");
  } else if (statusParam === "dismissed") {
    q = q.eq("status", "dismissed");
  } else if (statusParam === "done") {
    q = q.in("status", ["buyer_created", "product_seller_created", "service_provider_created"]);
  }

  const { data, error } = await q;

  if (error) {
    console.error("[Waitlist] Admin fetch failed:", error);
    return NextResponse.json({ error: "Failed to load waitlist" }, { status: 500 });
  }

  const rows = data ?? [];
  const linkedIds = [...new Set(rows.map((r) => r.linked_admin_user_id).filter(Boolean))] as string[];
  const linkedMap = new Map<string, { id: string; email: string; name: string; role: string }>();
  if (linkedIds.length > 0) {
    const { data: users, error: uErr } = await db
      .from("admin_users")
      .select("id, email, name, role")
      .in("id", linkedIds);
    if (uErr) {
      console.error("[Waitlist] Linked users fetch failed:", uErr);
    } else {
      users?.forEach((u) => linkedMap.set(u.id, u));
    }
  }

  const entries = rows.map((r) => ({
    ...r,
    linked_user: r.linked_admin_user_id
      ? linkedMap.get(r.linked_admin_user_id as string) ?? null
      : null,
  }));

  return NextResponse.json({ entries });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.role === "user" || session.role === "seller") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const idParam = request.nextUrl.searchParams.get("id");
  const id = idParam ? parseInt(idParam, 10) : NaN;
  if (!Number.isFinite(id) || id < 1) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const db = createAdminClient();
  const { error } = await db.from("waitlist").delete().eq("id", id);

  if (error) {
    console.error("[Waitlist] Admin delete failed:", error);
    return NextResponse.json({ error: "Failed to remove entry" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
