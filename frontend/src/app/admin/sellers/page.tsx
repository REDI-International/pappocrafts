"use client";

import { useEffect, useState } from "react";

const COUNTRIES = ["North Macedonia", "Serbia", "Albania"] as const;
const GENDERS = [
  { value: "M", label: "Male (M)" },
  { value: "F", label: "Female (F)" },
] as const;

export default function AdminSellersPage() {
  const [sellers, setSellers] = useState<
    {
      id: string;
      email: string;
      name: string;
      business_name: string;
      business_slug: string;
      base_country: string | null;
      phone: string;
      contact_email: string;
      gender: "M" | "F" | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    contactEmail: "",
    gender: "F" as "M" | "F",
    baseCountry: "North Macedonia" as (typeof COUNTRIES)[number],
    password: "",
  });
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    contactEmail: "",
    gender: "F" as "M" | "F",
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
          phone: form.phone.trim(),
          contactEmail: form.contactEmail.trim(),
          gender: form.gender,
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
      setForm({ email: "", password: "", name: "", phone: "", contactEmail: "", gender: "F", businessName: "", baseCountry: "North Macedonia" });
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
      phone: s.phone || "",
      contactEmail: s.contact_email || s.email,
      gender: s.gender === "M" ? "M" : "F",
      baseCountry: (COUNTRIES.includes(s.base_country as (typeof COUNTRIES)[number])
        ? s.base_country
        : "North Macedonia") as (typeof COUNTRIES)[number],
      password: "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
    setEditForm({ name: "", businessName: "", email: "", phone: "", contactEmail: "", gender: "F", baseCountry: "North Macedonia", password: "" });
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
        phone: editForm.phone.trim(),
        contactEmail: editForm.contactEmail.trim(),
        gender: editForm.gender,
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
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  email: e.target.value,
                  contactEmail: f.contactEmail ? f.contactEmail : e.target.value,
                }))
              }
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1117] px-4 py-2.5 text-sm text-white"
            />
          </div>
          <div>
            <label className="text-xs text-white/40">Direct order email</label>
            <input
              required
              type="email"
              value={form.contactEmail}
              onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1117] px-4 py-2.5 text-sm text-white"
              placeholder="Shown to buyers for product orders"
            />
          </div>
          <div>
            <label className="text-xs text-white/40">Gender (donor reporting)</label>
            <select
              required
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as "M" | "F" }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1117] px-4 py-2.5 text-sm text-white"
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-white/40">Phone</label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-[#0F1117] px-4 py-2.5 text-sm text-white"
              placeholder="+389..."
            />
          </div>
          <div>
            <label className="text-xs text-white/40">Initial password</label>
            <div className="relative mt-1">
              <input
                required
                type={showCreatePassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-xl border border-white/10 bg-[#0F1117] px-4 py-2.5 pr-10 text-sm text-white"
              />
              <button
                type="button"
                aria-label={showCreatePassword ? "Hide password" : "Show password"}
                title={showCreatePassword ? "Hide password" : "Show password"}
                onClick={() => setShowCreatePassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/75 transition-colors"
              >
                {showCreatePassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
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
                      {s.name} · login: {s.email} · orders: {s.contact_email || "—"} · {s.gender || "—"} · {s.phone || "—"} · {s.base_country || "—"} · /?business={s.business_slug}
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
                      <label className="text-xs text-white/40">Direct order email</label>
                      <input
                        type="email"
                        value={editForm.contactEmail}
                        onChange={(e) => setEditForm((f) => ({ ...f, contactEmail: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#1A1D27] px-3 py-2 text-sm text-white"
                      />
                      <p className="text-[10px] text-white/30 mt-1">Displayed after buyers request product contact details.</p>
                    </div>
                    <div>
                      <label className="text-xs text-white/40">Gender (donor reporting)</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm((f) => ({ ...f, gender: e.target.value as "M" | "F" }))}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#1A1D27] px-3 py-2 text-sm text-white"
                      >
                        {GENDERS.map((g) => (
                          <option key={g.value} value={g.value}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-white/40">Phone</label>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-[#1A1D27] px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40">New password (optional)</label>
                      <div className="relative mt-1">
                        <input
                          type={showEditPassword ? "text" : "password"}
                          value={editForm.password}
                          onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                          placeholder="Leave blank to keep current"
                          className="w-full rounded-lg border border-white/10 bg-[#1A1D27] px-3 py-2 pr-10 text-sm text-white placeholder:text-white/25"
                        />
                        <button
                          type="button"
                          aria-label={showEditPassword ? "Hide password" : "Show password"}
                          title={showEditPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowEditPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/75 transition-colors"
                        >
                          {showEditPassword ? (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          )}
                        </button>
                      </div>
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
