"use client";

import { useEffect, useState } from "react";

const COUNTRIES = ["North Macedonia", "Serbia", "Albania"] as const;

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<
    { id: string; email: string; name: string; business_name: string; business_slug: string; base_country: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    businessName: "",
    email: "",
    baseCountry: "North Macedonia" as (typeof COUNTRIES)[number],
    password: "",
  });
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    businessName: "",
    baseCountry: "North Macedonia" as (typeof COUNTRIES)[number],
  });

  const load = () => {
    const token = localStorage.getItem("admin-token");
    if (!token) return;
    fetch("/api/admin/sellers", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.sellers) setSellers(d.sellers);
        else if (d.error) setError(d.error);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("admin-token");
    if (!token) return;
    setSubmitting(true);
    setError("");
    setOk("");
    try {
      const res = await fetch("/api/admin/sellers", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          businessName: form.businessName.trim(),
          baseCountry: form.baseCountry,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create seller");
        setSubmitting(false);
        return;
      }
      setOk(`Seller created: ${data.email}. Share login credentials securely.`);
      setForm({ email: "", password: "", name: "", businessName: "", baseCountry: "North Macedonia" });
      load();
    } catch {
      setError("Request failed");
    }
    setSubmitting(false);
  }

  async function handleDeleteSeller(id: string, label: string) {
    if (!confirm(`Remove seller account "${label}"? Their products keep seller_id cleared (not deleted).`)) return;
    const token = localStorage.getItem("admin-token");
    if (!token) return;
    setDeletingId(id);
    setError("");
    setOk("");
    try {
      const res = await fetch(`/api/admin/sellers?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Delete failed");
        return;
      }
      setOk("Seller account removed.");
      load();
    } catch {
      setError("Delete request failed");
    } finally {
      setDeletingId(null);
    }
  }

  function openEdit(s: (typeof sellers)[0]) {
    setEditingId(s.id);
    setEditError("");
    setError("");
    setOk("");
    setEditForm({
      name: s.name,
      businessName: s.business_name,
      email: s.email,
      baseCountry: (COUNTRIES.includes(s.base_country as (typeof COUNTRIES)[number])
        ? s.base_country
        : "North Macedonia") as (typeof COUNTRIES)[number],
      password: "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
    setEditForm({ name: "", businessName: "", email: "", baseCountry: "North Macedonia", password: "" });
  }

  async function handleSaveEdit(sellerId: string) {
    const token = localStorage.getItem("admin-token");
    if (!token) return;
    setSavingId(sellerId);
    setEditError("");
    setError("");
    setOk("");
    try {
      const payload: Record<string, string> = {
        id: sellerId,
        name: editForm.name.trim(),
        businessName: editForm.businessName.trim(),
        email: editForm.email.trim().toLowerCase(),
        baseCountry: editForm.baseCountry,
      };
      if (editForm.password.trim()) payload.password = editForm.password;
      const res = await fetch("/api/admin/sellers", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditError(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
      setOk("Seller updated.");
      cancelEdit();
      load();
    } catch {
      setEditError("Save request failed");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <div className="p-8 text-white/40 text-sm">Loading…</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-10 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Entrepreneur accounts</h1>
        <p className="mt-1 text-sm text-white/45">
          Create Roma entrepreneur logins (no public registration). They manage only their own products; listings go live after admin approval.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1A1D27] p-6">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide">Create seller</h2>
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label className="text-xs text-white/40">Business / shop name</label>
            <input
              required
              value={form.businessName}
              onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1117] px-4 py-2.5 text-sm text-white"
              placeholder="e.g. Mira&apos;s Textiles"
            />
          </div>
          <div>
            <label className="text-xs text-white/40">Country (operations)</label>
            <select
              value={form.baseCountry}
              onChange={(e) => setForm((f) => ({ ...f, baseCountry: e.target.value as (typeof COUNTRIES)[number] }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1117] px-4 py-2.5 text-sm text-white"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40">Contact name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1117] px-4 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/40">Email (login)</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1117] px-4 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/40">Initial password</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1117] px-4 py-2.5 text-sm text-white"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {ok && <p className="text-sm text-[#4A9B3F]">{ok}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#4A9B3F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#2D7A25] disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create seller account"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#1A1D27] overflow-hidden">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide px-6 pt-6">Existing sellers</h2>
        <ul className="mt-4 divide-y divide-white/5">
          {sellers.length === 0 ? (
            <li className="px-6 py-8 text-sm text-white/35">No seller accounts yet.</li>
          ) : (
            sellers.map((s) => (
              <li key={s.id} className="px-6 py-4 text-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{s.business_name}</p>
                    <p className="text-white/45 text-xs mt-0.5">
                      {s.name} · {s.email} · {s.base_country || "—"} · /shop?business={s.business_slug}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={deletingId === s.id || savingId === s.id}
                      onClick={() => openEdit(s)}
                      className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === s.id || editingId === s.id}
                      onClick={() => handleDeleteSeller(s.id, s.business_name || s.email)}
                      className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      {deletingId === s.id ? "Removing…" : "Delete seller"}
                    </button>
                  </div>
                </div>
                {editingId === s.id && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-[#0F1117] p-4 space-y-3">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Edit seller</p>
                    {editError && <p className="text-sm text-red-400">{editError}</p>}
                    <div>
                      <label className="text-xs text-white/40">Business / shop name</label>
                      <input
                        value={editForm.businessName}
                        onChange={(e) => setEditForm((f) => ({ ...f, businessName: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#1A1D27] px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40">Country</label>
                      <select
                        value={editForm.baseCountry}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, baseCountry: e.target.value as (typeof COUNTRIES)[number] }))
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#1A1D27] px-3 py-2 text-sm text-white"
                      >
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-white/40">Contact name</label>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#1A1D27] px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40">Email (login)</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#1A1D27] px-3 py-2 text-sm text-white"
                      />
                      <p className="text-[10px] text-white/30 mt-1">Changing email signs the seller out everywhere until they log in again.</p>
                    </div>
                    <div>
                      <label className="text-xs text-white/40">New password (optional)</label>
                      <input
                        type="password"
                        value={editForm.password}
                        onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Leave blank to keep current"
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#1A1D27] px-3 py-2 text-sm text-white placeholder:text-white/25"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        disabled={savingId === s.id}
                        onClick={() => handleSaveEdit(s.id)}
                        className="rounded-lg bg-[#4A9B3F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2D7A25] disabled:opacity-50"
                      >
                        {savingId === s.id ? "Saving…" : "Save changes"}
                      </button>
                      <button
                        type="button"
                        disabled={savingId === s.id}
                        onClick={cancelEdit}
                        className="rounded-lg border border-white/15 px-4 py-2 text-xs font-medium text-white/70 hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
