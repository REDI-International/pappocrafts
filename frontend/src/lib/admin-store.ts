import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
export type AdminRole = "superadmin" | "admin";

export interface StoredOrder {
  id: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    notes: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    artisan: string;
    country: string;
  }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: "online" | "later";
  paymentStatus: "pending" | "paid" | "refunded";
  status: OrderStatus;
  region: string;
  shippingZone: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  token: string;
  email: string;
  role: AdminRole;
  name: string;
  createdAt: number;
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

const FALLBACK_USERS = [
  { email: "petrica@redi-ngo.eu", passwordHash: sha256("Ppapadie83*"), role: "superadmin" as AdminRole, name: "Petrica" },
  { email: "richard@redi-ngo.eu", passwordHash: sha256("Welcome2REDI*"), role: "admin" as AdminRole, name: "Richard" },
];

const sessions: Map<string, Session> = new Map();

function supabase() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export async function authenticate(email: string, password: string): Promise<Session | null> {
  const hash = sha256(password);
  const db = supabase();

  let user: { email: string; role: AdminRole; name: string } | null = null;

  if (db) {
    const { data } = await db
      .from("admin_users")
      .select("email, role, name, password_hash")
      .eq("email", email.toLowerCase())
      .single();

    if (data && data.password_hash === hash) {
      user = { email: data.email, role: data.role as AdminRole, name: data.name };
    }
  }

  if (!user) {
    const fallback = FALLBACK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === hash
    );
    if (fallback) user = { email: fallback.email, role: fallback.role, name: fallback.name };
  }

  if (!user) return null;

  const token = randomBytes(32).toString("hex");
  const session: Session = { token, email: user.email, role: user.role, name: user.name, createdAt: Date.now() };
  sessions.set(token, session);

  if (db) {
    try {
      await db.from("admin_sessions").upsert({
        token,
        email: user.email,
        role: user.role,
        name: user.name,
      });
    } catch { /* ignore */ }
  }

  return session;
}

export function validateSession(token: string): Session | null {
  const session = sessions.get(token);
  if (!session) return null;
  const maxAge = 24 * 60 * 60 * 1000;
  if (Date.now() - session.createdAt > maxAge) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function logout(token: string): void {
  sessions.delete(token);
  const db = supabase();
  if (db) {
    try { db.from("admin_sessions").delete().eq("token", token); } catch { /* ignore */ }
  }
}

function orderToRow(order: StoredOrder) {
  return {
    id: order.id,
    customer_name: order.customer.name,
    customer_email: order.customer.email,
    customer_phone: order.customer.phone,
    customer_address: order.customer.address,
    customer_city: order.customer.city,
    customer_postal_code: order.customer.postalCode,
    customer_country: order.customer.country,
    customer_notes: order.customer.notes,
    items: order.items,
    subtotal: order.subtotal,
    shipping_cost: order.shippingCost,
    total: order.total,
    payment_method: order.paymentMethod,
    payment_status: order.paymentStatus,
    status: order.status,
    region: order.region,
    shipping_zone: order.shippingZone,
    currency: order.currency,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOrder(row: any): StoredOrder {
  return {
    id: row.id,
    customer: {
      name: row.customer_name,
      email: row.customer_email,
      phone: row.customer_phone,
      address: row.customer_address,
      city: row.customer_city,
      postalCode: row.customer_postal_code,
      country: row.customer_country,
      notes: row.customer_notes,
    },
    items: row.items,
    subtotal: Number(row.subtotal),
    shippingCost: Number(row.shipping_cost),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    region: row.region,
    shippingZone: row.shipping_zone,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function addOrder(order: StoredOrder): Promise<void> {
  const db = supabase();
  if (db) {
    await db.from("orders").insert(orderToRow(order));
  }
}

export async function getOrder(id: string): Promise<StoredOrder | undefined> {
  const db = supabase();
  if (!db) return undefined;
  const { data } = await db.from("orders").select("*").eq("id", id).single();
  return data ? rowToOrder(data) : undefined;
}

export async function getAllOrders(): Promise<StoredOrder[]> {
  const db = supabase();
  if (!db) return [];
  const { data } = await db.from("orders").select("*").order("created_at", { ascending: false });
  return (data || []).map(rowToOrder);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<StoredOrder | null> {
  const db = supabase();
  if (!db) return null;
  const updates: Record<string, string> = { status };
  if (status === "cancelled") updates.payment_status = "refunded";
  const { data } = await db.from("orders").update(updates).eq("id", id).select().single();
  return data ? rowToOrder(data) : null;
}

export async function updatePaymentStatus(
  id: string,
  paymentStatus: "pending" | "paid" | "refunded"
): Promise<StoredOrder | null> {
  const db = supabase();
  if (!db) return null;
  const { data } = await db.from("orders").update({ payment_status: paymentStatus }).eq("id", id).select().single();
  return data ? rowToOrder(data) : null;
}

export async function deleteOrder(id: string): Promise<boolean> {
  const db = supabase();
  if (!db) return false;
  const { error } = await db.from("orders").delete().eq("id", id);
  return !error;
}

export async function getStats() {
  const all = await getAllOrders();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const thisMonth = all.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const today = all.filter(
    (o) => new Date(o.createdAt).toDateString() === now.toDateString()
  );
  const last30Days = all.filter((o) => new Date(o.createdAt) >= thirtyDaysAgo);
  const last7Days = all.filter((o) => new Date(o.createdAt) >= sevenDaysAgo);

  const nonCancelled = all.filter((o) => o.status !== "cancelled");
  const totalRevenue = nonCancelled.reduce((s, o) => s + o.total, 0);
  const monthlyRevenue = thisMonth.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const paidOrders = all.filter((o) => o.paymentStatus === "paid");
  const pendingPayments = all.filter((o) => o.paymentStatus === "pending" && o.status !== "cancelled");

  const statusCounts: Record<string, number> = {};
  for (const o of all) statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;

  const countryCounts: Record<string, number> = {};
  for (const o of all) {
    const c = o.customer.country || "Unknown";
    countryCounts[c] = (countryCounts[c] || 0) + 1;
  }

  const avgOrderValue = nonCancelled.length > 0 ? totalRevenue / nonCancelled.length : 0;

  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const o of last30Days) {
    if (o.status === "cancelled") continue;
    for (const item of o.items) {
      if (!productSales[item.id]) productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
      productSales[item.id].quantity += item.quantity;
      productSales[item.id].revenue += item.price * item.quantity;
    }
  }

  const topProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([id, data]) => ({ id, ...data }));

  const lowProducts = Object.entries(productSales)
    .sort((a, b) => a[1].revenue - b[1].revenue)
    .slice(0, 5)
    .map(([id, data]) => ({ id, ...data }));

  const totalItemsSold30d = last30Days
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.items.reduce((si, item) => si + item.quantity, 0), 0);

  const revenueByDay: Record<string, number> = {};
  for (const o of last30Days) {
    if (o.status === "cancelled") continue;
    const day = new Date(o.createdAt).toISOString().split("T")[0];
    revenueByDay[day] = (revenueByDay[day] || 0) + o.total;
  }

  const ordersByDay: Record<string, number> = {};
  for (const o of last30Days) {
    const day = new Date(o.createdAt).toISOString().split("T")[0];
    ordersByDay[day] = (ordersByDay[day] || 0) + 1;
  }

  return {
    totalOrders: all.length,
    todayOrders: today.length,
    monthlyOrders: thisMonth.length,
    weeklyOrders: last7Days.length,
    totalRevenue,
    monthlyRevenue,
    avgOrderValue: avgOrderValue || 0,
    paidCount: paidOrders.length,
    pendingPaymentCount: pendingPayments.length,
    statusCounts,
    countryCounts,
    payOnlineCount: all.filter((o) => o.paymentMethod === "online").length,
    payLaterCount: all.filter((o) => o.paymentMethod === "later").length,
    topProducts,
    lowProducts,
    totalItemsSold30d,
    revenueByDay,
    ordersByDay,
    conversionRate: 0,
    activeUsers: 0,
  };
}
