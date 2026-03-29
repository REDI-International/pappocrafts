"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  created_at: string;
  status: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  service_title: string;
  service_category: string;
  service_description: string;
  hourly_rate?: number | null;
  currency?: string | null;
  location: string;
  country: string;
  notes: string | null;
  image_url?: string | null;
};

export default function AdminServiceRequestsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"pending" | "all">("pending");

  const load = () => {
    const token = localStorage.getItem("admin-token");
    if (!token) return;
    setLoading(true);
    fetch(`/api/admin/service-listing-requests?status=${filter}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.requests) setRows(d.requests);
        else if (d.error) setError(d.error);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filter changes
  }, [filter]);

  async function setStatus(id: string, status: "approved" | "rejected") {
    const token = localStorage.getItem("admin-token");
    if (!token) return;
    const res = await fetch("/api/admin/service-listing-requests", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) load();
  }

  if (loading && rows.length === 0) {
    return <div className="p-8 text-white/40 text-sm">Loading…</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Service listing requests</h1>
          <p className="mt-1 text-sm text-white/45">
            Public submissions from people who want to offer a service. Approve after you create or link their provider
            profile in Services.
          </p>
        </div>
        <div className="flex rounded-lg border border-white/10 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 ${filter === "pending" ? "bg-[#4A9B3F]/20 text-[#4A9B3F]" : "text-white/50 hover:bg-white/5"}`}
          >
            Pending
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-4 py-2 border-l border-white/10 ${filter === "all" ? "bg-[#4A9B3F]/20 text-[#4A9B3F]" : "text-white/50 hover:bg-white/5"}`}
          >
            All
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="rounded-2xl border border-white/10 bg-[#1A1D27] divide-y divide-white/5">
        {rows.length === 0 ? (
          <p className="p-8 text-sm text-white/35">No requests.</p>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{r.service_title}</p>
                  <p className="text-xs text-white/45 mt-1">
                    {r.service_category} · {r.contact_name} · {r.contact_email}
                    {r.contact_phone ? ` · ${r.contact_phone}` : ""}
                    {r.hourly_rate != null && r.currency
                      ? ` · ${r.hourly_rate} ${r.currency}/hr`
                      : ""}
                  </p>
                  <p className="text-xs text-white/35 mt-1">
                    {r.location || "—"}
                    {r.country ? `, ${r.country}` : ""} · submitted{" "}
                    {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded shrink-0 ${
                    r.status === "pending"
                      ? "bg-amber-500/15 text-amber-200"
                      : r.status === "approved"
                        ? "bg-green-500/15 text-green-300"
                        : "bg-red-500/15 text-red-300"
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <p className="text-sm text-white/70 whitespace-pre-wrap">{r.service_description}</p>
              {r.image_url ? (
                <p className="text-xs text-white/45 mt-2">
                  Photo:{" "}
                  <a href={r.image_url} target="_blank" rel="noopener noreferrer" className="text-[#4A9B3F] hover:underline break-all">
                    {r.image_url}
                  </a>
                </p>
              ) : null}
              {r.notes && <p className="text-xs text-white/40">Notes: {r.notes}</p>}
              {r.status === "pending" && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStatus(r.id, "approved")}
                    className="rounded-lg bg-[#4A9B3F] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3d8535]"
                  >
                    Mark approved
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(r.id, "rejected")}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
