"use client";

import { useEffect, useState } from "react";

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
  productViewsCount: number;
  serviceViewsCount: number;
  profileVisitsCount: number;
  recentOrders: { id: string; customer_name: string; total: number; status: string; created_at: string }[];
  productsByCategory: Record<string, number>;
}

function SimpleBarChart({ data, color, label }: { data: Record<string, number>; color: string; label: string }) {
  const entries = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div>
      <h3 className="text-xs font-semibold text-white/40 mb-3">{label}</h3>
      <div className="flex items-end gap-1 h-32">
        {entries.map(([day, value]) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-white/30">{value > 0 ? (label.includes("Revenue") ? `€${value.toFixed(0)}` : String(value)) : ""}</span>
            <div
              className={`w-full rounded-t ${color} transition-all`}
              style={{ height: `${Math.max((value / max) * 100, 2)}%`, minHeight: "2px" }}
            />
            <span className="text-[8px] text-white/20">{day.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      setTimeout(() => setLoading(false), 0);
      return;
    }
    fetch("/api/admin/analytics", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/5 rounded-lg" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const s = data;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-white/40 mt-1">Sales performance, product insights, and user behavior data.</p>
      </div>

      {/* Overview KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Revenue (30d)", value: s ? `€${s.monthlyRevenue.toFixed(2)}` : "€0", color: "text-emerald-400" },
          { label: "Orders (30d)", value: s ? String(s.monthlyOrders) : "0", color: "text-blue-400" },
          { label: "Avg Order", value: s ? `€${s.avgOrderValue.toFixed(2)}` : "€0", color: "text-cyan-400" },
          { label: "Items Sold (30d)", value: s ? String(s.totalItemsSold30d) : "0", color: "text-purple-400" },
          { label: "Waitlist", value: s ? String(s.waitlistCount) : "0", color: "text-indigo-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl bg-[#1A1D27] border border-white/5 p-4">
            <p className="text-[11px] text-white/30">{kpi.label}</p>
            <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Marketplace usage signals */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Product views", value: s ? String(s.productViewsCount) : "0", color: "text-emerald-400" },
          { label: "Service views", value: s ? String(s.serviceViewsCount) : "0", color: "text-blue-400" },
          { label: "Profile visits", value: s ? String(s.profileVisitsCount) : "0", color: "text-purple-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl bg-[#1A1D27] border border-white/5 p-4">
            <p className="text-[11px] text-white/30">{kpi.label}</p>
            <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue & Orders Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          {s && Object.keys(s.revenueByDay).length > 0 ? (
            <SimpleBarChart data={s.revenueByDay} color="bg-emerald-500" label="Daily Revenue (Last 14 days)" />
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-white/20">No revenue data yet. Revenue charts will appear as orders come in.</p>
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          {s && Object.keys(s.ordersByDay).length > 0 ? (
            <SimpleBarChart data={s.ordersByDay} color="bg-blue-500" label="Daily Orders (Last 14 days)" />
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-sm text-white/20">No order data yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Product Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Performing Products (30d)</h2>
          {s && s.topProducts.length > 0 ? (
            <div className="space-y-3">
              {s.topProducts.map((p, i) => {
                const maxRev = s.topProducts[0]?.revenue || 1;
                return (
                  <div key={p.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/20 w-5">{i + 1}</span>
                        <span className="text-xs text-white truncate max-w-[200px]">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-white/30">{p.quantity} sold</span>
                        <span className="text-xs font-bold text-emerald-400">€{p.revenue.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 ml-7">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(p.revenue / maxRev) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-white/20 py-8 text-center">No sales data yet.</p>
          )}
        </div>

        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Low Performing Products (30d)</h2>
          {s && s.lowProducts.length > 0 ? (
            <div className="space-y-3">
              {s.lowProducts.map((p, i) => (
                <div key={p.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white/20 w-5">{i + 1}</span>
                    <span className="text-xs text-white truncate max-w-[200px]">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-white/30">{p.quantity} sold</span>
                    <span className="text-xs font-bold text-red-400">€{p.revenue.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/20 py-8 text-center">No sales data yet.</p>
          )}
        </div>
      </div>

      {/* Inventory & Platform Health */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Inventory Status</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">In Stock</span>
                <span className="text-emerald-400 font-bold">{s?.inStockCount || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s && s.productCount ? (s.inStockCount / s.productCount) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">Out of Stock</span>
                <span className="text-red-400 font-bold">{s?.outOfStockCount || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-red-500" style={{ width: `${s && s.productCount ? (s.outOfStockCount / s.productCount) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Total Products</span>
                <span className="text-white font-bold">{s?.productCount || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Service Providers</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">Available</span>
                <span className="text-emerald-400 font-bold">{s?.availableServiceCount || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s && s.serviceCount ? (s.availableServiceCount / s.serviceCount) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">Unavailable</span>
                <span className="text-amber-400 font-bold">{(s?.serviceCount || 0) - (s?.availableServiceCount || 0)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${s && s.serviceCount ? (((s.serviceCount - s.availableServiceCount) / s.serviceCount) * 100) : 0}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Total Providers</span>
                <span className="text-white font-bold">{s?.serviceCount || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Payment Health</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">Paid Orders</span>
                <span className="text-emerald-400 font-bold">{s?.paidCount || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${s && s.totalOrders ? (s.paidCount / s.totalOrders) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-white/60">Pending Payments</span>
                <span className="text-amber-400 font-bold">{s?.pendingPaymentCount || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${s && s.totalOrders ? (s.pendingPaymentCount / s.totalOrders) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Online vs Pay Later</span>
                <span className="text-white font-bold">{s?.payOnlineCount || 0} / {s?.payLaterCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PostHog & Sentry Info */}
      <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-5">
        <h2 className="text-sm font-semibold text-white mb-2">External Analytics</h2>
        <p className="text-xs text-white/30 mb-4">PostHog and Sentry are integrated for deep user behavior tracking and error monitoring.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="https://us.posthog.com" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">PostHog Dashboard</p>
                <p className="text-[11px] text-white/30">Session recordings, funnels, drop-off analysis</p>
              </div>
            </div>
            <p className="text-[11px] text-white/20">Track where users drop off, which pages convert, and watch real session recordings.</p>
          </a>
          <a href="https://sentry.io" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-white/5 p-4 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                <svg className="h-4 w-4 text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors">Sentry Dashboard</p>
                <p className="text-[11px] text-white/30">Error tracking, performance monitoring</p>
              </div>
            </div>
            <p className="text-[11px] text-white/20">Monitor JavaScript errors, API failures, and performance bottlenecks in real-time.</p>
          </a>
        </div>
      </div>
    </div>
  );
}
