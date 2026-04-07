import { NextRequest, NextResponse } from "next/server";
import { resolveUserIdFromEmail, validateSession } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";

type ProductRow = {
  id: string;
  approval_status?: string | null;
  in_stock?: boolean | null;
  contact_reveal_count?: number | null;
};

type ServiceRow = {
  id: string;
  available?: boolean | null;
};

async function getSession(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  return validateSession(token);
}

async function requireSeller(request: NextRequest) {
  const session = await getSession(request);
  if (!session || session.role !== "seller") return null;
  let userId = session.userId;
  if (!userId) userId = await resolveUserIdFromEmail(session.email);
  if (!userId) return null;
  return { session, userId };
}

export async function GET(request: NextRequest) {
  const ctx = await requireSeller(request);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createAdminClient();

  const [{ data: profile }, { data: products }, { data: services }] = await Promise.all([
    db
      .from("admin_users")
      .select("business_slug, business_name, name")
      .eq("id", ctx.userId)
      .single(),
    db
      .from("products")
      .select("id, approval_status, in_stock, contact_reveal_count")
      .eq("seller_id", ctx.userId),
    db
      .from("services")
      .select("id, available")
      .eq("seller_id", ctx.userId),
  ]);

  const sellerProducts = (products ?? []) as ProductRow[];
  const sellerServices = (services ?? []) as ServiceRow[];
  const productIds = sellerProducts.map((p) => p.id).filter(Boolean);
  const serviceIds = sellerServices.map((s) => s.id).filter(Boolean);
  const businessSlug = String(profile?.business_slug || "").trim();
  const sellerName = String(profile?.business_name || profile?.name || "").trim();

  let productViewsCount = 0;
  let serviceViewsCount = 0;
  let profileVisitsCount = 0;

  if (productIds.length > 0) {
    const { count } = await db
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "product_view")
      .in("metadata->>listing_id", productIds);
    productViewsCount = count || 0;
  }

  if (serviceIds.length > 0) {
    const { count } = await db
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "service_view")
      .in("metadata->>listing_id", serviceIds);
    serviceViewsCount = count || 0;
  }

  if (businessSlug) {
    const { count } = await db
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "profile_visit")
      .eq("metadata->>seller_slug", businessSlug);
    profileVisitsCount += count || 0;
  }
  if (sellerName) {
    const { count } = await db
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "profile_visit")
      .eq("metadata->>seller_name", sellerName);
    profileVisitsCount += count || 0;
  }

  const approvedProducts = sellerProducts.filter((p) => p.approval_status === "approved").length;
  const pendingProducts = sellerProducts.filter(
    (p) => !p.approval_status || p.approval_status === "pending"
  ).length;
  const rejectedProducts = sellerProducts.filter((p) => p.approval_status === "rejected").length;
  const inStockProducts = sellerProducts.filter((p) => p.in_stock !== false).length;
  const totalContactReveals = sellerProducts.reduce(
    (sum, p) => sum + (Number(p.contact_reveal_count) || 0),
    0
  );
  const availableServices = sellerServices.filter((s) => s.available !== false).length;

  return NextResponse.json({
    products: {
      total: sellerProducts.length,
      approved: approvedProducts,
      pending: pendingProducts,
      rejected: rejectedProducts,
      inStock: inStockProducts,
      outOfStock: Math.max(0, sellerProducts.length - inStockProducts),
      contactReveals: totalContactReveals,
    },
    services: {
      total: sellerServices.length,
      available: availableServices,
      unavailable: Math.max(0, sellerServices.length - availableServices),
    },
    views: {
      product: productViewsCount,
      service: serviceViewsCount,
      profile: profileVisitsCount,
    },
  });
}
