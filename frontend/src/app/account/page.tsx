"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { categories } from "@/lib/products";
import { MAX_PRODUCT_IMAGES, normalizeProductImageUrls } from "@/lib/product-images";
import { useLocale } from "@/lib/locale-context";
import { DEFAULT_LISTING_PHONE } from "@/lib/listing-phone";
import { currencyForListingCountry } from "@/lib/country-currency";

interface UserInfo {
  email: string;
  role: "superadmin" | "admin" | "user" | "seller";
  name: string;
  userId?: string | null;
}

const SELLER_COUNTRIES = ["North Macedonia", "Serbia", "Albania"] as const;
const DEFAULT_PRODUCT_CATEGORY = categories[1] ?? "Pottery & Ceramics";

interface SellerProductRow {
  id: string;
  name: string;
  approval_status?: string;
  description?: string;
  price?: number | string;
  category?: string;
  country?: string;
  artisan?: string;
  phone?: string;
  submitter_phone?: string;
  image?: string;
  images?: unknown;
  in_stock?: boolean;
  currency?: string;
}

interface SellerAnalytics {
  products: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    inStock: number;
    outOfStock: number;
    contactReveals: number;
  };
  services: {
    total: number;
    available: number;
    unavailable: number;
  };
  views: {
    product: number;
    service: number;
    profile: number;
  };
}

function SellerDashboard() {
  const { t } = useLocale();
  const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") : "";
  const productGalleryInputRef = useRef<HTMLInputElement>(null);
  const productCameraInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<{
    business_name: string;
    business_slug: string;
    base_country: string | null;
    biography?: string;
    logo_url?: string;
  } | null>(null);
  const [profileForm, setProfileForm] = useState({
    biography: "",
    logoUrl: "",
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");
  const [rows, setRows] = useState<SellerProductRow[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productUploadTargetIndex, setProductUploadTargetIndex] = useState<number | null>(null);
  const [productUploadingIndex, setProductUploadingIndex] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: DEFAULT_PRODUCT_CATEGORY,
    images: Array(MAX_PRODUCT_IMAGES).fill("") as string[],
    country: "North Macedonia" as (typeof SELLER_COUNTRIES)[number],
    artisan: "",
    phone: DEFAULT_LISTING_PHONE,
    currency: currencyForListingCountry("North Macedonia"),
    inStock: true,
  });

  const load = useCallback(() => {
    if (!token) return;
    fetch("/api/seller/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.business_name) {
          setProfile(d);
          setProfileForm({
            biography: typeof d.biography === "string" ? d.biography : "",
            logoUrl: typeof d.logo_url === "string" ? d.logo_url : "",
          });
        }
      })
      .catch(() => {});
    fetch("/api/seller/products", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setRows(Array.isArray(d.products) ? d.products : []))
      .catch(() => {});
    fetch("/api/seller/analytics", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d === "object") setAnalytics(d);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  function rowImageSlots(row: SellerProductRow): string[] {
    const fromGallery = Array.isArray(row.images)
      ? row.images.filter((v): v is string => typeof v === "string" && v.trim().length > 0).map((v) => v.trim())
      : [];
    if (fromGallery.length > 0) return [...fromGallery.slice(0, MAX_PRODUCT_IMAGES), ...Array(MAX_PRODUCT_IMAGES).fill("")].slice(0, MAX_PRODUCT_IMAGES);
    const single = typeof row.image === "string" ? row.image.trim() : "";
    if (!single) return Array(MAX_PRODUCT_IMAGES).fill("");
    return [single, ...Array(MAX_PRODUCT_IMAGES - 1).fill("")];
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      price: "",
      category: DEFAULT_PRODUCT_CATEGORY,
      images: Array(MAX_PRODUCT_IMAGES).fill(""),
      country: "North Macedonia",
      artisan: "",
      phone: DEFAULT_LISTING_PHONE,
      currency: currencyForListingCountry("North Macedonia"),
      inStock: true,
    });
  }

  function startEditProduct(row: SellerProductRow) {
    const rowCountry = SELLER_COUNTRIES.includes((row.country || "") as (typeof SELLER_COUNTRIES)[number])
      ? (row.country as (typeof SELLER_COUNTRIES)[number])
      : "North Macedonia";
    const rowCategory =
      typeof row.category === "string" && categories.includes(row.category)
        ? row.category
        : DEFAULT_PRODUCT_CATEGORY;
    const rowPrice =
      typeof row.price === "number"
        ? String(row.price)
        : typeof row.price === "string"
          ? row.price
          : "";
    const rowCurrency =
      typeof row.currency === "string" && row.currency.trim()
        ? row.currency.trim().toUpperCase()
        : currencyForListingCountry(rowCountry);
    const rowPhone =
      (typeof row.phone === "string" && row.phone.trim()) ||
      (typeof row.submitter_phone === "string" && row.submitter_phone.trim()) ||
      DEFAULT_LISTING_PHONE;

    setErr("");
    setMsg("");
    setEditingProductId(row.id);
    setForm({
      name: row.name || "",
      description: row.description || "",
      price: rowPrice,
      category: rowCategory,
      images: rowImageSlots(row),
      country: rowCountry,
      artisan: row.artisan || "",
      phone: rowPhone,
      currency: rowCurrency,
      inStock: row.in_stock !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingProductId(null);
    setErr("");
    setMsg("");
    resetForm();
  }

  async function saveSellerProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setProfileSaving(true);
    setProfileErr("");
    setProfileMsg("");
    try {
      const res = await fetch("/api/seller/me", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          biography: profileForm.biography,
          logoUrl: profileForm.logoUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProfileErr(data.error || "Failed to save profile.");
        return;
      }
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              biography: typeof data.biography === "string" ? data.biography : profileForm.biography,
              logo_url: typeof data.logo_url === "string" ? data.logo_url : profileForm.logoUrl,
            }
          : prev
      );
      setProfileForm({
        biography: typeof data.biography === "string" ? data.biography : profileForm.biography,
        logoUrl: typeof data.logo_url === "string" ? data.logo_url : profileForm.logoUrl,
      });
      setProfileMsg("Public profile saved.");
    } catch {
      setProfileErr("Failed to save profile.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setErr("");
    const isEditing = !!editingProductId;
    const res = await fetch("/api/seller/products", {
      method: isEditing ? "PATCH" : "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingProductId || undefined,
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        category: form.category,
        images: normalizeProductImageUrls(form.images),
        country: form.country,
        artisan: form.artisan || undefined,
        phone: form.phone.trim(),
        inStock: form.inStock,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error || "Failed to submit product.");
      return;
    }
    setMsg(
      isEditing
        ? "Product updated — changes were sent for admin review."
        : "Product submitted — it will appear in the shop after admin approval (within 24 hours)."
    );
    setEditingProductId(null);
    resetForm();
    load();
  }

  async function uploadSellerListingImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/public/upload", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
    if (!res.ok || !data.url) {
      throw new Error(data.error || "Image upload failed.");
    }
    return data.url;
  }

  function triggerProductImagePicker(index: number, source: "gallery" | "camera") {
    if (productUploadingIndex !== null) return;
    setErr("");
    setProductUploadTargetIndex(index);
    const input = source === "camera" ? productCameraInputRef.current : productGalleryInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  async function handleProductImageChosen(file: File | null) {
    const slotIndex = productUploadTargetIndex;
    if (!file || slotIndex === null) return;
    setErr("");
    setProductUploadingIndex(slotIndex);
    try {
      const uploadedUrl = await uploadSellerListingImage(file);
      setForm((prev) => {
        const next = [...prev.images];
        next[slotIndex] = uploadedUrl;
        return { ...prev, images: next };
      });
    } catch (uploadError) {
      setErr(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setProductUploadingIndex(null);
      setProductUploadTargetIndex(null);
    }
  }

  return (
    <div className="space-y-8">
      {profile && (
        <div className="rounded-xl border border-green/15 bg-green/5 px-4 py-3 text-sm text-charcoal/80">
          <p className="font-semibold text-charcoal">{profile.business_name}</p>
          <p className="text-xs text-charcoal/50 mt-1">
            {profile.base_country && `${profile.base_country} · `}
            Public shop filter:{" "}
            <Link href={`/?business=${encodeURIComponent(profile.business_slug)}`} className="text-green font-medium hover:underline">
              View your catalogue
            </Link>
          </p>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-charcoal/40 uppercase tracking-wider mb-3">Your dashboard</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-charcoal/10 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-charcoal/45">Product views</p>
            <p className="mt-1 text-2xl font-bold text-charcoal">{analytics?.views.product ?? 0}</p>
            <p className="mt-1 text-xs text-charcoal/45">How many times your product pages were opened</p>
          </div>
          <div className="rounded-xl border border-charcoal/10 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-charcoal/45">Profile visits</p>
            <p className="mt-1 text-2xl font-bold text-charcoal">{analytics?.views.profile ?? 0}</p>
            <p className="mt-1 text-xs text-charcoal/45">Visits to your public catalogue/profile filter</p>
          </div>
          <div className="rounded-xl border border-charcoal/10 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-charcoal/45">Contact reveals</p>
            <p className="mt-1 text-2xl font-bold text-charcoal">{analytics?.products.contactReveals ?? 0}</p>
            <p className="mt-1 text-xs text-charcoal/45">How often buyers revealed your phone number</p>
          </div>
          <div className="rounded-xl border border-charcoal/10 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-charcoal/45">Product status</p>
            <div className="mt-2 space-y-1 text-xs text-charcoal/65">
              <p>
                <span className="font-semibold text-green">{analytics?.products.approved ?? 0}</span> approved
              </p>
              <p>
                <span className="font-semibold text-amber-700">{analytics?.products.pending ?? 0}</span> pending
              </p>
              <p>
                <span className="font-semibold text-red-600">{analytics?.products.rejected ?? 0}</span> rejected
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-charcoal/10 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-charcoal/45">Stock snapshot</p>
            <div className="mt-2 space-y-1 text-xs text-charcoal/65">
              <p>
                <span className="font-semibold text-green">{analytics?.products.inStock ?? 0}</span> in stock
              </p>
              <p>
                <span className="font-semibold text-charcoal/70">{analytics?.products.outOfStock ?? 0}</span> out of stock
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-charcoal/10 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-charcoal/45">Services snapshot</p>
            <div className="mt-2 space-y-1 text-xs text-charcoal/65">
              <p>
                <span className="font-semibold text-green">{analytics?.services.available ?? 0}</span> available
              </p>
              <p>
                <span className="font-semibold text-charcoal/70">{analytics?.services.unavailable ?? 0}</span> unavailable
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-charcoal/40 uppercase tracking-wider mb-4">Public profile</h2>
        <form onSubmit={saveSellerProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="text-xs text-charcoal/50">Seller biography (optional)</label>
            <textarea
              rows={4}
              maxLength={1500}
              value={profileForm.biography}
              onChange={(e) => setProfileForm((f) => ({ ...f, biography: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
              placeholder="Tell buyers about your story, craft, and work."
            />
            <p className="mt-1 text-[11px] text-charcoal/45">
              {profileForm.biography.length}/1500
            </p>
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Seller logo URL (optional)</label>
            <input
              type="url"
              value={profileForm.logoUrl}
              onChange={(e) => setProfileForm((f) => ({ ...f, logoUrl: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
              placeholder="https://..."
            />
            <p className="mt-1 text-[11px] text-charcoal/45">Use a direct image URL (JPG/PNG/WebP).</p>
          </div>
          {profileErr && <p className="text-sm text-red-600">{profileErr}</p>}
          {profileMsg && <p className="text-sm text-green">{profileMsg}</p>}
          <button
            type="submit"
            disabled={profileSaving}
            className="rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-dark disabled:opacity-60"
          >
            {profileSaving ? "Saving..." : "Save public profile"}
          </button>
        </form>
      </div>

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
                <div className="flex items-center gap-2">
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
                  <button
                    type="button"
                    onClick={() => startEditProduct(r)}
                    className="rounded-lg border border-charcoal/15 px-2.5 py-1 text-xs font-semibold text-charcoal/70 hover:border-green/35 hover:text-green transition-colors"
                  >
                    Edit post
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-charcoal/40 uppercase tracking-wider mb-4">
          {editingProductId ? "Edit product post" : "Add product/service"}
        </h2>
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
            <div className="sm:col-span-2">
              <label className="text-xs text-charcoal/50">
              Price ({form.currency})
              </label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
              />
              <p className="mt-1 text-[11px] text-charcoal/45">{t("listing.priceCurrencyNote")}</p>
            </div>
            <div>
              <label className="text-xs text-charcoal/50">Country (product)</label>
              <select
                value={form.country}
                onChange={(e) =>
                  setForm((f) => {
                    const nextCountry = e.target.value as (typeof SELLER_COUNTRIES)[number];
                    return {
                      ...f,
                      country: nextCountry,
                      currency: currencyForListingCountry(nextCountry),
                    };
                  })
                }
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
          <div className="space-y-2">
            <p className="text-xs text-charcoal/50">{t("listing.productPhotosHelp")}</p>
            <input
              ref={productGalleryInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleProductImageChosen(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <input
              ref={productCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleProductImageChosen(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {form.images.map((url, i) => (
              <div key={i}>
                <label className="text-xs text-charcoal/50">
                  {t("listing.photoNumber").replace("{n}", String(i + 1))}
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => triggerProductImagePicker(i, "gallery")}
                    disabled={productUploadingIndex !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-green/35 bg-green/10 px-2.5 py-1 text-[11px] font-semibold text-green-dark shadow-sm shadow-green/10 hover:bg-green/15 hover:border-green/50 disabled:opacity-60"
                  >
                    Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerProductImagePicker(i, "camera")}
                    disabled={productUploadingIndex !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue/35 bg-blue/10 px-2.5 py-1 text-[11px] font-semibold text-blue-dark shadow-sm shadow-blue/10 hover:bg-blue/15 hover:border-blue/50 disabled:opacity-60 sm:hidden"
                  >
                    Camera
                  </button>
                  {productUploadingIndex === i && (
                    <span className="text-[11px] text-charcoal/45">Uploading…</span>
                  )}
                </div>
                {url ? (
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-charcoal/60">
                    <span>Photo uploaded</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => {
                          const next = [...f.images];
                          next[i] = "";
                          return { ...f, images: next };
                        })
                      }
                      className="font-medium text-charcoal/70 underline underline-offset-2 hover:text-charcoal"
                    >
                      Remove
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
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
          <div>
            <label className="text-xs text-charcoal/50">Contact phone (shown to buyers after approval)</label>
            <input
              required
              type="tel"
              minLength={6}
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
              placeholder="+389…"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-charcoal/70">
            <input
              type="checkbox"
              checked={form.inStock}
              onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
              className="h-4 w-4 rounded border-charcoal/30 text-green focus:ring-green/40"
            />
            In stock
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green">{msg}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-dark"
            >
              {editingProductId ? "Save changes for approval" : "Submit for approval"}
            </button>
            {editingProductId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-xl border border-charcoal/20 px-5 py-2.5 text-sm font-semibold text-charcoal/70 hover:bg-charcoal/5"
              >
                Cancel edit
              </button>
            )}
          </div>
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
        <div className="min-h-screen flex items-center justify-center pt-20">
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
                        href="/"
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
                      href="/"
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
