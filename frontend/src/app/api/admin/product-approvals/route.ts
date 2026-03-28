import { NextRequest, NextResponse } from "next/server";
import { validateSession, type Session } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

function isStaff(s: Session | null) {
  return s && (s.role === "superadmin" || s.role === "admin");
}

const MS_24H = 24 * 60 * 60 * 1000;

/** Pending products for moderation; includes SLA hint (review within 24h). */
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!isStaff(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from("products")
    .select("*")
    .eq("approval_status", "pending")
    .order("submitted_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const now = Date.now();
  const items = (data ?? []).map((row: Record<string, unknown>) => {
    const submitted = row.submitted_at ? new Date(String(row.submitted_at)).getTime() : now;
    const deadline = submitted + MS_24H;
    const overdue = now > deadline;
    return {
      ...row,
      sla_deadline: new Date(deadline).toISOString(),
      sla_overdue: overdue,
      sla_hours_remaining: Math.max(0, (deadline - now) / (60 * 60 * 1000)),
    };
  });

  return NextResponse.json({ pending: items });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!isStaff(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const id = String(body.id || "");
    const status = body.approval_status || body.status;
    if (!id || (status !== "approved" && status !== "rejected")) {
      return NextResponse.json({ error: "id and approval_status (approved|rejected) required." }, { status: 400 });
    }

    const db = createAdminClient();
    const { data, error } = await db
      .from("products")
      .update({
        approval_status: status,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
