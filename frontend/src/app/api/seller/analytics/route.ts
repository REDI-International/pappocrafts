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

type AnalyticsEventRow = {
  id: number;
  event_type?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
};

type OrderRow = {
  id: string;
  status?: string | null;
  payment_status?: string | null;
  created_at?: string | null;
  items?: unknown;
};

type SellerOrderSummary = {
  id: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  sellerItems: number;
  sellerTotalEur: number;
};

function toFiniteNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asOrderItems(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => asObject(entry))
    .filter((entry): entry is Record<string, unknown> => !!entry);
}

function dayKey(value: string | null | undefined): string {
  return String(value || "").slice(0, 10);
}

function makeLastNDaysMap(days: number): Record<string, number> {
  const out: Record<string, number> = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    out[d.toISOString().slice(0, 10)] = 0;
  }
  return out;
}

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
  const productIds = sellerProducts.map((p) => p.id).filter(Boolean) as string[];
  const serviceIds = sellerServices.map((s) => s.id).filter(Boolean) as string[];
  const productIdSet = new Set(productIds);
  const serviceIdSet = new Set(serviceIds);
  const businessSlug = String(profile?.business_slug || "").trim();
  const sellerName = String(profile?.business_name || profile?.name || "").trim();

  let productViewsCount = 0;
  let serviceViewsCount = 0;
  let profileVisitsCount = 0;
  const viewsByDay = {
    product: makeLastNDaysMap(14),
    service: makeLastNDaysMap(14),
    profile: makeLastNDaysMap(14),
  };

  const listingIds = [...new Set([...productIds, ...serviceIds])];
  if (listingIds.length > 0) {
    const { data: listingEvents } = await db
      .from("analytics_events")
      .select("id, event_type, created_at, metadata")
      .in("event_type", ["product_view", "service_view"])
      .in("metadata->>listing_id", listingIds);

    for (const raw of (listingEvents ?? []) as AnalyticsEventRow[]) {
      const meta = asObject(raw.metadata);
      const listingId = String(meta?.listing_id || "").trim();
      const eventType = String(raw.event_type || "");
      const dKey = dayKey(raw.created_at);
      if (eventType === "product_view" && productIdSet.has(listingId)) {
        productViewsCount += 1;
        if (dKey in viewsByDay.product) viewsByDay.product[dKey] += 1;
      } else if (eventType === "service_view" && serviceIdSet.has(listingId)) {
        serviceViewsCount += 1;
        if (dKey in viewsByDay.service) viewsByDay.service[dKey] += 1;
      }
    }
  }

  const profileEventsById = new Map<number, AnalyticsEventRow>();
  if (businessSlug) {
    const { data } = await db
      .from("analytics_events")
      .select("id, event_type, created_at, metadata")
      .eq("event_type", "profile_visit")
      .eq("metadata->>seller_slug", businessSlug);
    for (const row of (data ?? []) as AnalyticsEventRow[]) {
      profileEventsById.set(row.id, row);
    }
  }
  if (sellerName) {
    const { data } = await db
      .from("analytics_events")
      .select("id, event_type, created_at, metadata")
      .eq("event_type", "profile_visit")
      .eq("metadata->>seller_name", sellerName);
    for (const row of (data ?? []) as AnalyticsEventRow[]) {
      profileEventsById.set(row.id, row);
    }
  }
  for (const row of profileEventsById.values()) {
    profileVisitsCount += 1;
    const dKey = dayKey(row.created_at);
    if (dKey in viewsByDay.profile) viewsByDay.profile[dKey] += 1;
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

  const orderStatusCounts: Record<string, number> = {};
  const recentOrders: SellerOrderSummary[] = [];
  let totalOrders = 0;
  let newOrdersLast7Days = 0;
  let revenueEur = 0;

  if (productIdSet.size > 0) {
    const { data: orderRows } = await db
      .from("orders")
      .select("id, status, payment_status, created_at, items")
      .order("created_at", { ascending: false })
      .limit(500);

    const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const order of (orderRows ?? []) as OrderRow[]) {
      const items = asOrderItems(order.items);
      const sellerItems = items.filter((item) =>
        productIdSet.has(String(item.id || "").trim())
      );
      if (sellerItems.length === 0) continue;

      totalOrders += 1;
      const status = String(order.status || "pending");
      orderStatusCounts[status] = (orderStatusCounts[status] || 0) + 1;

      const createdAt = String(order.created_at || "");
      if (createdAt) {
        const createdMs = new Date(createdAt).getTime();
        if (Number.isFinite(createdMs) && createdMs >= sevenDaysAgoMs) {
          newOrdersLast7Days += 1;
        }
      }

      const sellerTotalEur = sellerItems.reduce(
        (sum, item) => sum + toFiniteNumber(item.price) * Math.max(1, Math.floor(toFiniteNumber(item.quantity))),
        0
      );
      revenueEur += sellerTotalEur;

      if (recentOrders.length < 8) {
        recentOrders.push({
          id: String(order.id || ""),
          status,
          paymentStatus: String(order.payment_status || "pending"),
          createdAt,
          sellerItems: sellerItems.reduce(
            (sum, item) => sum + Math.max(1, Math.floor(toFiniteNumber(item.quantity))),
            0
          ),
          sellerTotalEur: Math.round(sellerTotalEur * 100) / 100,
        });
      }
    }
  }

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
    viewsByDay,
    orders: {
      total: totalOrders,
      newLast7Days: newOrdersLast7Days,
      revenueEur: Math.round(revenueEur * 100) / 100,
      statusCounts: orderStatusCounts,
      recent: recentOrders,
    },
  });
}
