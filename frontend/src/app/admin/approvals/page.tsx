"use client";

import { useEffect, useState } from "react";

type PendingRow = Record<string, unknown> & {
  id: string;
  name?: string;
  artisan?: string;
  business_name?: string;
  submitted_at?: string;
  sla_overdue?: boolean;
  sla_hours_remaining?: number;
};

export default function AdminApprovalsPage() {
  const [pending, setPending] = useState<PendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = () => {
    const token = localStorage.getItem("admin-token");
    if (!token) return;
    fetch("/api/admin/product-approvals", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.pending) setPending(d.pending);
        else if (d.error) setError(d.error);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function decide(id: string, approval_status: "approved" | "rejected") {
    const token = localStorage.getItem("admin-token");
    if (!token) return;
    const res = await fetch("/api/admin/product-approvals", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id, approval_status }),
    });
    if (res.ok) load();
  }

  if (loading) return <div className="p-8 text-white/40 text-sm">Loading…</div>;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Product approvals</h1>
        <p className="mt-1 text-sm text-white/45">
          Review entrepreneur submissions. Target: within 24 hours (overdue items are highlighted).
        </p>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="rounded-2xl border border-white/10 bg-[#1A1D27] divide-y divide-white/5">
        {pending.length === 0 ? (
          <p className="p-8 text-sm text-white/35">No pending products.</p>
        ) : (
          pending.map((p) => (
            <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{p.name || p.id}</p>
                <p className="text-xs text-white/45 mt-1">
                  {(p.business_name || p.artisan) as string} · submitted {p.submitted_at ? new Date(String(p.submitted_at)).toLocaleString() : "—"}
                </p>
                {p.sla_overdue ? (
                  <span className="inline-block mt-2 text-[11px] font-semibold uppercase tracking-wide text-red-300 bg-red-500/15 px-2 py-0.5 rounded">
                    Over 24h — review now
                  </span>
                ) : (
                  <span className="inline-block mt-2 text-[11px] text-white/35">
                    ~{typeof p.sla_hours_remaining === "number" ? p.sla_hours_remaining.toFixed(1) : "—"}h left in SLA window
                  </span>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => decide(p.id, "approved")}
                  className="rounded-lg bg-[#4A9B3F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2D7A25]"
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => decide(p.id, "rejected")}
                  className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/5"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
