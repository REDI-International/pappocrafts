"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AnalyticsData {
  totalOrders: number;
  todayOrders: number;
  monthlyOrders: number;
  weeklyOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  avgOrderValue: number;
  paidCount: number;
  pendingPaymentCount: number;
  statusCounts: Record<string, number>;
  countryCounts: Record<string, number>;
  payOnlineCount: number;
  payLaterCount: number;
  topProducts: { id: string; name: string; quantity: number; revenue: number }[];
  lowProducts: { id: string; name: string; quantity: number; revenue: number }[];
  totalItemsSold30d: number;
  revenueByDay: Record<string, number>;
  ordersByDay: Record<string, number>;
  productCount: number;
  serviceCount: number;
  inStockCount: number;
  outOfStockCount: number;
  availableServiceCount: number;
  waitlistCount: number;
  recentOrders: { id: string; customer_name: string; customer_email: string; total: number; status: string; payment_status: string; created_at: string }[];
  productsByCategory: Record<string, number>;
}

function StatCard({ label, value, sub, icon, color, trend }: { label: string; value: string; sub?: string; icon: string; color: string; trend?: string }) {
  return (
    <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5 hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center`}>
          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        {trend && <span className="text-[10px] font-bold text-[#4A9B3F] bg-[#4A9B3F]/10 px-2 py-0.5 rounded-full">{trend}</span>}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-white/25 mt-1">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1.5 rounded-full bg-white/5 flex-1">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) return;
    fetch("/api/admin/analytics", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/5 rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const s = data;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Welcome back. Here&apos;s what&apos;s happening with PappoCrafts.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/admin/products" className="rounded-xl bg-[#4A9B3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3D8234] transition-colors">
            + Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Revenue"
          value={s ? `€${s.totalRevenue.toLocaleString("en", { minimumFractionDigits: 2 })}` : "€0"}
          sub={s ? `€${s.monthlyRevenue.toFixed(2)} this month` : undefined}
          icon="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          color="bg-gradient-to-br from-emerald-500 to-emerald-700"
        />
        <StatCard
          label="Total Orders"
          value={s ? String(s.totalOrders) : "0"}
          sub={s ? `${s.todayOrders} today · ${s.weeklyOrders} this week` : undefined}
          icon="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
          color="bg-gradient-to-br from-blue-500 to-blue-700"
        />
        <StatCard
          label="Products"
          value={s ? String(s.productCount) : "0"}
          sub={s ? `${s.inStockCount} in stock · ${s.outOfStockCount} out of stock` : undefined}
          icon="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
          color="bg-gradient-to-br from-purple-500 to-purple-700"
        />
        <StatCard
          label="Services"
          value={s ? String(s.serviceCount) : "0"}
          sub={s ? `${s.availableServiceCount} available` : undefined}
          icon="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085"
          color="bg-gradient-to-br from-orange-500 to-orange-700"
        />
      </div>

      {/* Second row KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Avg Order Value"
          value={s ? `€${s.avgOrderValue.toFixed(2)}` : "€0"}
          icon="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
          color="bg-gradient-to-br from-cyan-500 to-cyan-700"
        />
        <StatCard
          label="Pending Payments"
          value={s ? String(s.pendingPaymentCount) : "0"}
          sub={s ? `${s.paidCount} paid total` : undefined}
          icon="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          color="bg-gradient-to-br from-amber-500 to-amber-700"
        />
        <StatCard
          label="Items Sold (30d)"
          value={s ? String(s.totalItemsSold30d) : "0"}
          icon="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
          color="bg-gradient-to-br from-rose-500 to-rose-700"
        />
        <StatCard
          label="Waitlist Signups"
          value={s ? String(s.waitlistCount) : "0"}
          icon="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
          color="bg-gradient-to-br from-indigo-500 to-indigo-700"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-[#4A9B3F] hover:underline">View all</Link>
          </div>
          {s && s.recentOrders && s.recentOrders.length > 0 ? (
            <div className="space-y-2">
              {s.recentOrders.slice(0, 5).map((order) => {
                const statusColors: Record<string, string> = {
                  pending: "text-yellow-400 bg-yellow-500/10", confirmed: "text-blue-400 bg-blue-500/10",
                  processing: "text-purple-400 bg-purple-500/10", shipped: "text-cyan-400 bg-cyan-500/10",
                  delivered: "text-green-400 bg-green-500/10", cancelled: "text-red-400 bg-red-500/10",
                };
                return (
                  <div key={order.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{order.customer_name || "Guest"}</p>
                      <p className="text-[11px] text-white/30">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[order.status] || "text-white/40 bg-white/5"}`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-bold text-white">€{Number(order.total).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white/20 py-8 text-center">No orders yet. Orders will appear here as customers shop.</p>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Order Status</h2>
          {s && Object.keys(s.statusCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(s.statusCounts).map(([status, count]) => {
                const colors: Record<string, string> = {
                  pending: "bg-yellow-500", confirmed: "bg-blue-500", processing: "bg-purple-500",
                  shipped: "bg-cyan-500", delivered: "bg-green-500", cancelled: "bg-red-500",
                };
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="text-xs text-white/60 capitalize w-20">{status}</span>
                    <MiniBar value={count} max={s.totalOrders} color={colors[status] || "bg-gray-500"} />
                    <span className="text-xs font-bold text-white w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white/20 py-8 text-center">No orders yet.</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Products (30 days)</h2>
          {s && s.topProducts && s.topProducts.length > 0 ? (
            <div className="space-y-2">
              {s.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-1.5">
                  <span className="text-xs font-bold text-white/20 w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{p.name}</p>
                    <p className="text-[11px] text-white/30">{p.quantity} sold</p>
                  </div>
                  <span className="text-sm font-bold text-[#4A9B3F]">€{p.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/20 py-8 text-center">No sales data yet.</p>
          )}
        </div>

        {/* Products by Category */}
        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Products by Category</h2>
          {s && s.productsByCategory && Object.keys(s.productsByCategory).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(s.productsByCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-xs text-white/60 flex-1 truncate">{cat}</span>
                    <MiniBar value={count} max={s.productCount} color="bg-purple-500" />
                    <span className="text-xs font-bold text-white w-6 text-right">{count}</span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-white/20 py-8 text-center">No products yet.</p>
          )}
        </div>
      </div>

      {/* Payment Methods + Countries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Payment Methods</h2>
          {s && s.totalOrders > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">Online (Stripe)</p>
                  <p className="text-xs text-white/30">{s.payOnlineCount} orders</p>
                </div>
                <span className="text-lg font-bold text-white">{Math.round((s.payOnlineCount / s.totalOrders) * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">Pay Later</p>
                  <p className="text-xs text-white/30">{s.payLaterCount} orders</p>
                </div>
                <span className="text-lg font-bold text-white">{Math.round((s.payLaterCount / s.totalOrders) * 100)}%</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/20 py-8 text-center">No payment data yet.</p>
          )}
        </div>

        {/* Customer Regions */}
        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Customers by Country</h2>
          {s && Object.keys(s.countryCounts).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(s.countryCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([country, count]) => (
                  <span key={country} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:bg-white/10 transition-colors">
                    {country} <span className="font-bold text-white">{count}</span>
                  </span>
                ))}
            </div>
          ) : (
            <p className="text-sm text-white/20 py-8 text-center">No customer data yet.</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/orders", title: "Manage Orders", desc: "View, update status, and manage all orders", icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" },
          { href: "/admin/products", title: "Manage Products", desc: "Add, edit, or remove products from the shop", icon: "M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" },
          { href: "/admin/services", title: "Manage Services", desc: "Add, edit, or remove service providers", icon: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" },
          { href: "/admin/analytics", title: "View Analytics", desc: "Sales trends, user behavior, and performance", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5 hover:border-[#4A9B3F]/30 transition-all group">
            <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center mb-3 group-hover:bg-[#4A9B3F]/10 transition-colors">
              <svg className="h-4 w-4 text-white/40 group-hover:text-[#4A9B3F] transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-white group-hover:text-[#4A9B3F] transition-colors">{item.title}</h3>
            <p className="text-xs text-white/30 mt-1">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
