"use client";

import { useCallback, useEffect, useState } from "react";

type BookingRow = {
  id: string;
  created_at: string;
  status: string;
  provider_id: string;
  provider_name: string;
  provider_category: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  preferred_date: string | null;
  time_window_start: string | null;
  time_window_end: string | null;
  duration_hours: number | null;
  hourly_rate_eur: number | null;
  estimated_total_eur: number | null;
  message: string | null;
  locale: string | null;
};

function statusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-500/20 text-amber-200 border-amber-500/30";
    case "confirmed":
      return "bg-[#4A9B3F]/20 text-green-light border-[#4A9B3F]/35";
    case "declined":
      return "bg-red-500/15 text-red-300 border-red-500/30";
    case "completed":
      return "bg-blue-500/15 text-blue-200 border-blue-500/30";
    case "cancelled":
      return "bg-white/10 text-white/50 border-white/15";
    default:
      return "bg-white/10 text-white/60 border-white/15";
  }
}

export default function AdminBookingsPage() {
  const [entries, setEntries] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/admin/bookings", { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({}));
          throw new Error(j.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data: { entries?: BookingRow[] }) => {
        setEntries(data.entries ?? []);
        setError(null);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    const token = localStorage.getItem("admin-token");
    if (!token) return;
    setUpdatingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Update failed");
        return;
      }
      load();
    } catch {
      setError("Update request failed");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <h1 className="text-2xl font-bold text-white mb-1">Service booking requests</h1>
      <p className="text-sm text-white/45 mb-8">
        <strong className="text-white/70">Approve</strong> when you have confirmed with the provider and customer. Use{" "}
        <strong className="text-white/70">Decline</strong> if you cannot fulfil the request.{" "}
        <strong className="text-white/70">Complete</strong> after the service has been delivered.
      </p>

      {loading && <p className="text-white/40 text-sm">Loading…</p>}
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {!loading && !error && entries.length === 0 && (
        <p className="text-white/40 text-sm">No booking requests yet.</p>
      )}

      <div className="space-y-4">
        {entries.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border border-white/10 bg-[#1A1D27] p-4 text-sm text-white/80"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="font-semibold text-white">{row.provider_name}</span>
              <span
                className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${statusBadgeClass(row.status)}`}
              >
                {row.status}
              </span>
            </div>
            <p className="text-xs text-white/45 mb-2">
              {new Date(row.created_at).toLocaleString()} · {row.provider_category || "—"} · {row.locale || "—"}
            </p>
            <p className="text-white/70">
              <strong className="text-white/90">Customer:</strong> {row.customer_name} ·{" "}
              <a href={`mailto:${row.customer_email}`} className="text-[#4A9B3F] hover:underline">
                {row.customer_email}
              </a>
              {row.customer_phone ? ` · ${row.customer_phone}` : ""}
            </p>
            <p className="mt-1 text-white/60">
              <strong className="text-white/80">When:</strong> {row.preferred_date || "—"}{" "}
              {row.time_window_start && row.time_window_end
                ? `${row.time_window_start}–${row.time_window_end}`
                : ""}
              {row.duration_hours != null ? ` (${row.duration_hours}h)` : ""}
            </p>
            {row.estimated_total_eur != null && (
              <p className="mt-1 text-[#4A9B3F] font-medium">
                Est. total: €{Number(row.estimated_total_eur).toFixed(2)}
                {row.hourly_rate_eur != null ? ` @ €${Number(row.hourly_rate_eur).toFixed(2)}/h` : ""}
              </p>
            )}
            {row.message && (
              <p className="mt-2 text-white/55 border-t border-white/5 pt-2 whitespace-pre-wrap">{row.message}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-3">
              {row.status === "pending" && (
                <>
                  <button
                    type="button"
                    disabled={updatingId === row.id}
                    onClick={() => setStatus(row.id, "confirmed")}
                    className="rounded-lg bg-[#4A9B3F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#2D7A25] disabled:opacity-50"
                  >
                    {updatingId === row.id ? "…" : "Approve"}
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === row.id}
                    onClick={() => {
                      if (confirm("Decline this booking request?")) setStatus(row.id, "declined");
                    }}
                    className="rounded-lg border border-red-500/35 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </>
              )}
              {row.status === "confirmed" && (
                <>
                  <button
                    type="button"
                    disabled={updatingId === row.id}
                    onClick={() => setStatus(row.id, "completed")}
                    className="rounded-lg bg-blue-600/80 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {updatingId === row.id ? "…" : "Mark completed"}
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === row.id}
                    onClick={() => {
                      if (confirm("Cancel this booking?")) setStatus(row.id, "cancelled");
                    }}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/5 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              )}
              {(row.status === "declined" || row.status === "cancelled" || row.status === "completed") && (
                <button
                  type="button"
                  disabled={updatingId === row.id}
                  onClick={() => {
                    if (confirm("Re-open as pending?")) setStatus(row.id, "pending");
                  }}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/5 disabled:opacity-50"
                >
                  Re-open as pending
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
