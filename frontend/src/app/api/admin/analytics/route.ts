import { NextRequest, NextResponse } from "next/server";
import { validateSession, getStats } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";

function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();
  const stats = await getStats();

  const { count: productCount } = await db.from("products").select("*", { count: "exact", head: true });
  const { count: serviceCount } = await db.from("services").select("*", { count: "exact", head: true });
  const { count: inStockCount } = await db.from("products").select("*", { count: "exact", head: true }).eq("in_stock", true);
  const { count: outOfStockCount } = await db.from("products").select("*", { count: "exact", head: true }).eq("in_stock", false);
  const { count: availableServiceCount } = await db.from("services").select("*", { count: "exact", head: true }).eq("available", true);
  const { count: waitlistCount } = await db.from("waitlist").select("*", { count: "exact", head: true });

  const { data: recentOrders } = await db
    .from("orders")
    .select("id, customer_name, customer_email, total, status, payment_status, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  const { data: productsByCategory } = await db
    .from("products")
    .select("category");

  const categoryCounts: Record<string, number> = {};
  for (const p of productsByCategory || []) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }

  return NextResponse.json({
    ...stats,
    productCount: productCount || 0,
    serviceCount: serviceCount || 0,
    inStockCount: inStockCount || 0,
    outOfStockCount: outOfStockCount || 0,
    availableServiceCount: availableServiceCount || 0,
    waitlistCount: waitlistCount || 0,
    recentOrders: recentOrders || [],
    productsByCategory: categoryCounts,
  });
}
