"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { categories } from "@/lib/products";

interface UserInfo {
  email: string;
  role: "superadmin" | "admin" | "user" | "seller";
  name: string;
  userId?: string | null;
}

const SELLER_COUNTRIES = ["North Macedonia", "Serbia", "Albania"] as const;

function SellerDashboard() {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") : "";
  const [profile, setProfile] = useState<{
    business_name: string;
    business_slug: string;
    base_country: string | null;
  } | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "Pottery & Ceramics",
    image: "",
    country: "North Macedonia" as (typeof SELLER_COUNTRIES)[number],
    artisan: "",
  });

  const load = useCallback(() => {
    if (!token) return;
    fetch("/api/seller/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.business_name) setProfile(d);
      })
      .catch(() => {});
    fetch("/api/seller/products", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setRows(d.products || []))
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    const res = await fetch("/api/seller/products", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        category: form.category,
        image: form.image || "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=600&fit=crop",
        country: form.country,
        artisan: form.artisan || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Failed to submit product.");
      return;
    }
    setMsg("Product submitted — it will appear in the shop after admin approval (within 24 hours).");
    setForm((f) => ({
      ...f,
      name: "",
      description: "",
      price: "",
      image: "",
      artisan: "",
    }));
    load();
  }

  return (
    <div className="space-y-8">
      {profile && (
        <div className="rounded-xl border border-green/15 bg-green/5 px-4 py-3 text-sm text-charcoal/80">
          <p className="font-semibold text-charcoal">{profile.business_name}</p>
          <p className="text-xs text-charcoal/50 mt-1">
            {profile.base_country && `${profile.base_country} · `}
            Public shop filter:{" "}
            <Link href={`/shop?business=${encodeURIComponent(profile.business_slug)}`} className="text-green font-medium hover:underline">
              View your catalogue
            </Link>
          </p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-charcoal/40 uppercase tracking-wider mb-3">Your products</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-charcoal/45">No products yet. Add your first listing below.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li
                key={String(r.id)}
                className="flex items-center justify-between gap-3 rounded-xl border border-charcoal/8 px-4 py-3 text-sm"
              >
                <span className="font-medium text-charcoal truncate">{String(r.name)}</span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    r.approval_status === "approved"
                      ? "bg-green/10 text-green"
                      : r.approval_status === "rejected"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {String(r.approval_status || "pending")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-charcoal/40 uppercase tracking-wider mb-4">Add product</h2>
        <form onSubmit={submit} className="space-y-4 max-w-lg">
          <div>
            <label className="text-xs text-charcoal/50">Product name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Description</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-charcoal/50">Price (EUR)</label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-charcoal/50">Country (product)</label>
              <select
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value as (typeof SELLER_COUNTRIES)[number] }))}
                className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
              >
                {SELLER_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
            >
              {categories
                .filter((c) => c !== "All")
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Image URL</label>
            <input
              value={form.image}
              onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              placeholder="https://…"
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Maker / contact name on listing (optional)</label>
            <input
              value={form.artisan}
              onChange={(e) => setForm((f) => ({ ...f, artisan: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
              placeholder="Defaults to your account name"
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green">{msg}</p>}
          <button
            type="submit"
            className="rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-dark"
          >
            Submit for approval
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [checking, setChecking] = useState(true);

  const verify = useCallback(async () => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      const res = await fetch("/api/admin/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        localStorage.removeItem("admin-token");
        localStorage.removeItem("admin-user");
        router.replace("/login");
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch {
      router.replace("/login");
    }
    setChecking(false);
  }, [router]);

  useEffect(() => {
    verify();
  }, [verify]);

  function handleLogout() {
    const token = localStorage.getItem("admin-token");
    if (token) {
      fetch("/api/admin/auth", { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
    localStorage.removeItem("admin-token");
    localStorage.removeItem("admin-user");
    router.push("/login");
  }

  if (checking) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16">
          <div className="text-charcoal/40 text-sm">Loading...</div>
        </div>
      </>
    );
  }

  if (!user) return null;

  const isStaff = user.role === "superadmin" || user.role === "admin";
  const roleLabel =
    user.role === "superadmin"
      ? "Super Admin"
      : user.role === "admin"
        ? "Admin"
        : user.role === "seller"
          ? "Entrepreneur"
          : "Customer";
  const roleColor =
    user.role === "superadmin"
      ? "bg-purple-100 text-purple-700"
      : user.role === "admin"
        ? "bg-blue-100 text-blue-700"
        : user.role === "seller"
          ? "bg-amber-100 text-amber-800"
          : "bg-green/10 text-green";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#f8f6f3] pt-24 pb-16 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="bg-white rounded-2xl border border-charcoal/8 shadow-lg shadow-charcoal/5 overflow-hidden">
            <div className="bg-gradient-to-r from-green/10 via-green/5 to-transparent px-8 py-8 border-b border-charcoal/5">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-green to-green-dark flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-green/25">
                  {user.name?.charAt(0) || "U"}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-charcoal">{user.name}</h1>
                  <p className="text-sm text-charcoal/50 mt-0.5">{user.email}</p>
                  <span className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold ${roleColor}`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-8">
              {user.role === "seller" && (
                <>
                  <SellerDashboard />
                  <div className="mt-10 pt-8 border-t border-charcoal/8">
                    <h2 className="text-sm font-semibold text-charcoal/40 uppercase tracking-wider mb-4">Explore</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Link
                        href="/shop"
                        className="flex items-center gap-4 rounded-xl border border-charcoal/8 p-5 hover:border-green/30 transition-all"
                      >
                        <p className="text-sm font-semibold text-charcoal">Browse shop</p>
                      </Link>
                      <Link
                        href="/services"
                        className="flex items-center gap-4 rounded-xl border border-charcoal/8 p-5 hover:border-blue/30 transition-all"
                      >
                        <p className="text-sm font-semibold text-charcoal">Services</p>
                      </Link>
                    </div>
                  </div>
                </>
              )}

              {user.role !== "seller" && (
                <>
                  <h2 className="text-sm font-semibold text-charcoal/40 uppercase tracking-wider mb-4">Quick Actions</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Link
                      href="/shop"
                      className="flex items-center gap-4 rounded-xl border border-charcoal/8 p-5 hover:border-green/30 hover:shadow-md transition-all group"
                    >
                      <div className="h-11 w-11 rounded-lg bg-green/10 flex items-center justify-center group-hover:bg-green/20 transition-colors">
                        <svg className="h-5 w-5 text-green" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-charcoal">Browse Shop</p>
                        <p className="text-xs text-charcoal/40 mt-0.5">Explore handmade products</p>
                      </div>
                    </Link>

                    <Link
                      href="/services"
                      className="flex items-center gap-4 rounded-xl border border-charcoal/8 p-5 hover:border-blue/30 hover:shadow-md transition-all group"
                    >
                      <div className="h-11 w-11 rounded-lg bg-blue/10 flex items-center justify-center group-hover:bg-blue/20 transition-colors">
                        <svg className="h-5 w-5 text-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-charcoal">Find Services</p>
                        <p className="text-xs text-charcoal/40 mt-0.5">Hire skilled artisans</p>
                      </div>
                    </Link>

                    {isStaff && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-4 rounded-xl border border-charcoal/8 p-5 hover:border-purple-300 hover:shadow-md transition-all group sm:col-span-2"
                      >
                        <div className="h-11 w-11 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                          <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-charcoal">Admin Dashboard</p>
                          <p className="text-xs text-charcoal/40 mt-0.5">Manage products, orders, and analytics</p>
                        </div>
                      </Link>
                    )}
                  </div>
                </>
              )}

              <p className="mt-8 text-xs text-charcoal/40">
                Accounts are created by the PappoShop team. Use <Link href="/login" className="text-green hover:underline">Sign in</Link> only — there is no public registration.
              </p>

              <div className="mt-6 pt-6 border-t border-charcoal/8">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
