"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { categories } from "@/lib/products";
import { serviceCategories } from "@/lib/services";
import { MAX_PRODUCT_IMAGES, normalizeProductImageUrls } from "@/lib/product-images";
import { useLocale } from "@/lib/locale-context";
import type { CurrencyCode } from "@/lib/locale-context";
import { currencyForListingCountry } from "@/lib/country-currency";
import { isListingCurrency } from "@/lib/eur-fallback-rates";

interface UserInfo {
  email: string;
  role: "superadmin" | "admin" | "user" | "seller";
  name: string;
  userId?: string | null;
}

const SELLER_COUNTRIES = ["North Macedonia", "Serbia", "Albania"] as const;
const DEFAULT_PRODUCT_CATEGORY = categories[1] ?? "Pottery & Ceramics";
const DEFAULT_SERVICE_CATEGORY =
  serviceCategories.find((c) => c.name === "Home Repair")?.name || serviceCategories[1]?.name || "Home Repair";

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

interface SellerServiceRow {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  long_description?: string;
  category?: string;
  hourly_rate?: number | string;
  fixed_rate_from?: number | string | null;
  currency?: string;
  location?: string;
  country?: string;
  phone?: string;
  image?: string;
  available?: boolean;
  response_time?: string;
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
  viewsByDay: {
    product: Record<string, number>;
    service: Record<string, number>;
    profile: Record<string, number>;
  };
  orders: {
    total: number;
    newLast7Days: number;
    revenueEur: number;
    statusCounts: Record<string, number>;
    recent: Array<{
      id: string;
      status: string;
      paymentStatus: string;
      createdAt: string;
      sellerItems: number;
      sellerTotalEur: number;
    }>;
  };
}

function SellerDashboard() {
  const { t } = useLocale();
  const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") : "";
  const productGalleryInputRef = useRef<HTMLInputElement>(null);
  const productCameraInputRef = useRef<HTMLInputElement>(null);
  const serviceGalleryInputRef = useRef<HTMLInputElement>(null);
  const serviceCameraInputRef = useRef<HTMLInputElement>(null);
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
  const [serviceRows, setServiceRows] = useState<SellerServiceRow[]>([]);
  const [analytics, setAnalytics] = useState<SellerAnalytics | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceMsg, setServiceMsg] = useState("");
  const [serviceErr, setServiceErr] = useState("");
  const [productUploadTargetIndex, setProductUploadTargetIndex] = useState<number | null>(null);
  const [productUploadingIndex, setProductUploadingIndex] = useState<number | null>(null);
  const [serviceUploading, setServiceUploading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: DEFAULT_PRODUCT_CATEGORY,
    images: Array(MAX_PRODUCT_IMAGES).fill("") as string[],
    country: "North Macedonia" as (typeof SELLER_COUNTRIES)[number],
    artisan: "",
    phone: "",
    currency: currencyForListingCountry("North Macedonia"),
    inStock: true,
  });
  const [serviceForm, setServiceForm] = useState({
    name: "",
    title: "",
    description: "",
    longDescription: "",
    category: DEFAULT_SERVICE_CATEGORY,
    hourlyRate: "",
    fixedRateFrom: "",
    currency: currencyForListingCountry("North Macedonia"),
    location: "",
    country: "North Macedonia" as (typeof SELLER_COUNTRIES)[number],
    phone: "",
    image: "",
    responseTime: "Within 24 hours",
    available: true,
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
    fetch("/api/seller/services", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setServiceRows(Array.isArray(d.services) ? d.services : []))
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
      phone: "",
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
    const rowCurrencyRaw =
      typeof row.currency === "string" && row.currency.trim()
        ? row.currency.trim().toUpperCase()
        : currencyForListingCountry(rowCountry);
    const rowCurrency: CurrencyCode = isListingCurrency(rowCurrencyRaw)
      ? (rowCurrencyRaw as CurrencyCode)
      : currencyForListingCountry(rowCountry);
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
      phone: "",
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

  function resetServiceForm() {
    setServiceForm({
      name: "",
      title: "",
      description: "",
      longDescription: "",
      category: DEFAULT_SERVICE_CATEGORY,
      hourlyRate: "",
      fixedRateFrom: "",
      currency: currencyForListingCountry("North Macedonia"),
      location: "",
      country: "North Macedonia",
      phone: "",
      image: "",
      responseTime: "Within 24 hours",
      available: true,
    });
  }

  function startEditService(row: SellerServiceRow) {
    const rowCountry = SELLER_COUNTRIES.includes((row.country || "") as (typeof SELLER_COUNTRIES)[number])
      ? (row.country as (typeof SELLER_COUNTRIES)[number])
      : "North Macedonia";
    const rowCategory =
      typeof row.category === "string" && serviceCategories.some((c) => c.name === row.category)
        ? row.category
        : DEFAULT_SERVICE_CATEGORY;
    setServiceErr("");
    setServiceMsg("");
    setEditingServiceId(row.id);
    setServiceForm({
      name: row.name || "",
      title: row.title || "",
      description: row.description || "",
      longDescription: row.long_description || "",
      category: rowCategory,
      hourlyRate: row.hourly_rate == null ? "" : String(row.hourly_rate),
      fixedRateFrom: row.fixed_rate_from == null ? "" : String(row.fixed_rate_from),
      currency: (() => {
        const candidate =
          typeof row.currency === "string" && row.currency.trim()
            ? row.currency.trim().toUpperCase()
            : currencyForListingCountry(rowCountry);
        return isListingCurrency(candidate)
          ? (candidate as CurrencyCode)
          : currencyForListingCountry(rowCountry);
      })(),
      location: row.location || "",
      country: rowCountry,
      phone: row.phone || "",
      image: row.image || "",
      responseTime: row.response_time || "Within 24 hours",
      available: row.available !== false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditService() {
    setEditingServiceId(null);
    setServiceErr("");
    setServiceMsg("");
    resetServiceForm();
  }

  async function submitService(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setServiceMsg("");
    setServiceErr("");
    const isEditing = !!editingServiceId;
    const res = await fetch("/api/seller/services", {
      method: isEditing ? "PATCH" : "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingServiceId || undefined,
        name: serviceForm.name,
        title: serviceForm.title,
        description: serviceForm.description,
        longDescription: serviceForm.longDescription || serviceForm.description,
        category: serviceForm.category,
        hourlyRate: parseFloat(serviceForm.hourlyRate) || 0,
        fixedRateFrom: serviceForm.fixedRateFrom.trim() ? parseFloat(serviceForm.fixedRateFrom) : null,
        currency: serviceForm.currency,
        location: serviceForm.location,
        country: serviceForm.country,
        phone: serviceForm.phone.trim(),
        image: serviceForm.image.trim(),
        responseTime: serviceForm.responseTime,
        available: serviceForm.available,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setServiceErr(typeof data?.error === "string" ? data.error : "Failed to save service.");
      return;
    }
    setServiceMsg(isEditing ? "Service updated successfully." : "Service added successfully.");
    setEditingServiceId(null);
    resetServiceForm();
    load();
  }

  async function removeService(id: string) {
    if (!token) return;
    const ok = window.confirm("Delete this service listing?");
    if (!ok) return;
    setServiceErr("");
    setServiceMsg("");
    const res = await fetch(`/api/seller/services?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setServiceErr(typeof data?.error === "string" ? data.error : "Failed to delete service.");
      return;
    }
    if (editingServiceId === id) {
      setEditingServiceId(null);
      resetServiceForm();
    }
    setServiceMsg("Service deleted.");
    load();
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
        phone: form.phone.trim() || undefined,
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

  function triggerServiceImagePicker(source: "gallery" | "camera") {
    if (serviceUploading) return;
    setServiceErr("");
    const input = source === "camera" ? serviceCameraInputRef.current : serviceGalleryInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  async function handleServiceImageChosen(file: File | null) {
    if (!file) return;
    setServiceErr("");
    setServiceUploading(true);
    try {
      const uploadedUrl = await uploadSellerListingImage(file);
      setServiceForm((prev) => ({ ...prev, image: uploadedUrl }));
    } catch (uploadError) {
      setServiceErr(uploadError instanceof Error ? uploadError.message : "Image upload failed.");
    } finally {
      setServiceUploading(false);
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
        {analytics?.viewsByDay && (
          <div className="mt-3 rounded-xl border border-charcoal/10 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-charcoal/45">Views in last 14 days</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Product", color: "bg-green/80", data: analytics.viewsByDay.product },
                { label: "Service", color: "bg-blue/80", data: analytics.viewsByDay.service },
                { label: "Profile", color: "bg-purple-500/80", data: analytics.viewsByDay.profile },
              ].map((series) => {
                const entries = Object.entries(series.data || {}).sort((a, b) =>
                  a[0].localeCompare(b[0])
                );
                const max = Math.max(
                  1,
                  ...entries.map(([, value]) =>
                    Number.isFinite(Number(value)) ? Number(value) : 0
                  )
                );
                const total = entries.reduce(
                  (sum, [, value]) => sum + (Number.isFinite(Number(value)) ? Number(value) : 0),
                  0
                );
                return (
                  <div key={series.label} className="rounded-lg border border-charcoal/8 p-3">
                    <p className="text-xs font-semibold text-charcoal/70">
                      {series.label} views: {total}
                    </p>
                    <div className="mt-2 flex h-12 items-end gap-1">
                      {entries.map(([day, value]) => {
                        const numeric = Number.isFinite(Number(value)) ? Number(value) : 0;
                        const h = Math.max(8, Math.round((numeric / max) * 100));
                        return (
                          <div
                            key={`${series.label}-${day}`}
                            title={`${day}: ${numeric}`}
                            className={`w-2 rounded-sm ${series.color}`}
                            style={{ height: `${h}%` }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {analytics?.orders && (
          <div className="mt-3 rounded-xl border border-charcoal/10 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-charcoal/45">Order overview</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-charcoal/8 p-3">
                <p className="text-xs text-charcoal/45">Total seller orders</p>
                <p className="mt-1 text-xl font-bold text-charcoal">{analytics.orders.total}</p>
              </div>
              <div className="rounded-lg border border-charcoal/8 p-3">
                <p className="text-xs text-charcoal/45">New in 7 days</p>
                <p className="mt-1 text-xl font-bold text-charcoal">{analytics.orders.newLast7Days}</p>
              </div>
              <div className="rounded-lg border border-charcoal/8 p-3">
                <p className="text-xs text-charcoal/45">Revenue share (EUR)</p>
                <p className="mt-1 text-xl font-bold text-charcoal">€{analytics.orders.revenueEur.toFixed(2)}</p>
              </div>
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-lg border border-charcoal/8 p-3">
                <p className="text-xs font-semibold text-charcoal/70">Order status markers</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.entries(analytics.orders.statusCounts || {}).map(([status, count]) => (
                    <span
                      key={status}
                      className="rounded-full border border-charcoal/12 px-2.5 py-1 text-[11px] font-semibold text-charcoal/70"
                    >
                      {status}: {count}
                    </span>
                  ))}
                  {Object.keys(analytics.orders.statusCounts || {}).length === 0 && (
                    <span className="text-xs text-charcoal/45">No seller orders yet</span>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-charcoal/8 p-3">
                <p className="text-xs font-semibold text-charcoal/70">Recent seller orders</p>
                {analytics.orders.recent.length === 0 ? (
                  <p className="mt-2 text-xs text-charcoal/45">No seller orders yet</p>
                ) : (
                  <ul className="mt-2 space-y-1.5 text-xs text-charcoal/65">
                    {analytics.orders.recent.slice(0, 5).map((order) => (
                      <li key={order.id} className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          {order.id} · {order.status} · {order.sellerItems} items
                        </span>
                        <span className="font-semibold text-charcoal">€{order.sellerTotalEur.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
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
          {editingProductId ? "Edit product post" : "Add product"}
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

      <div>
        <h2 className="text-sm font-semibold text-charcoal/40 uppercase tracking-wider mb-3">Your services</h2>
        {serviceRows.length === 0 ? (
          <p className="text-sm text-charcoal/45">No services yet. Add your first service below.</p>
        ) : (
          <ul className="space-y-2">
            {serviceRows.map((s) => (
              <li
                key={String(s.id)}
                className="flex items-center justify-between gap-3 rounded-xl border border-charcoal/8 px-4 py-3 text-sm"
              >
                <span className="font-medium text-charcoal truncate">
                  {String(s.title || s.name || "Service")}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      s.available === false ? "bg-red-50 text-red-600" : "bg-green/10 text-green"
                    }`}
                  >
                    {s.available === false ? "unavailable" : "available"}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEditService(s)}
                    className="rounded-lg border border-charcoal/15 px-2.5 py-1 text-xs font-semibold text-charcoal/70 hover:border-green/35 hover:text-green transition-colors"
                  >
                    Edit post
                  </button>
                  <button
                    type="button"
                    onClick={() => removeService(String(s.id))}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-charcoal/40 uppercase tracking-wider mb-4">
          {editingServiceId ? "Edit service post" : "Add service"}
        </h2>
        <form onSubmit={submitService} className="space-y-4 max-w-lg">
          <div>
            <label className="text-xs text-charcoal/50">Provider name</label>
            <input
              required
              value={serviceForm.name}
              onChange={(e) => setServiceForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Service title</label>
            <input
              required
              value={serviceForm.title}
              onChange={(e) => setServiceForm((f) => ({ ...f, title: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Description</label>
            <textarea
              required
              rows={3}
              value={serviceForm.description}
              onChange={(e) => setServiceForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Long description (optional)</label>
            <textarea
              rows={4}
              value={serviceForm.longDescription}
              onChange={(e) => setServiceForm((f) => ({ ...f, longDescription: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Category</label>
            <select
              value={serviceForm.category}
              onChange={(e) => setServiceForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
            >
              {serviceCategories
                .filter((c) => c.name !== "All")
                .map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-charcoal/50">Hourly rate ({serviceForm.currency})</label>
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={serviceForm.hourlyRate}
                onChange={(e) => setServiceForm((f) => ({ ...f, hourlyRate: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-charcoal/50">Fixed rate from (optional)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={serviceForm.fixedRateFrom}
                onChange={(e) => setServiceForm((f) => ({ ...f, fixedRateFrom: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-charcoal/50">Country (service)</label>
              <select
                value={serviceForm.country}
                onChange={(e) =>
                  setServiceForm((f) => {
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
            <div>
              <label className="text-xs text-charcoal/50">City / location</label>
              <input
                value={serviceForm.location}
                onChange={(e) => setServiceForm((f) => ({ ...f, location: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
                placeholder="e.g. Skopje"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Contact phone</label>
            <input
              required
              type="tel"
              minLength={6}
              value={serviceForm.phone}
              onChange={(e) => setServiceForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
              placeholder="+389…"
            />
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Service photo (optional)</label>
            <input
              ref={serviceGalleryInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleServiceImageChosen(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <input
              ref={serviceCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleServiceImageChosen(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => triggerServiceImagePicker("gallery")}
                disabled={serviceUploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green/35 bg-green/10 px-2.5 py-1 text-[11px] font-semibold text-green-dark shadow-sm shadow-green/10 hover:bg-green/15 hover:border-green/50 disabled:opacity-60"
              >
                Gallery
              </button>
              <button
                type="button"
                onClick={() => triggerServiceImagePicker("camera")}
                disabled={serviceUploading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue/35 bg-blue/10 px-2.5 py-1 text-[11px] font-semibold text-blue-dark shadow-sm shadow-blue/10 hover:bg-blue/15 hover:border-blue/50 disabled:opacity-60 sm:hidden"
              >
                Camera
              </button>
              {serviceUploading && (
                <span className="text-[11px] text-charcoal/45">Uploading…</span>
              )}
            </div>
            {serviceForm.image ? (
              <div className="mt-1 flex items-center gap-2 text-[11px] text-charcoal/60">
                <span>Photo uploaded</span>
                <button
                  type="button"
                  onClick={() => setServiceForm((f) => ({ ...f, image: "" }))}
                  className="font-medium text-charcoal/70 underline underline-offset-2 hover:text-charcoal"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-charcoal/50">Response time</label>
            <input
              value={serviceForm.responseTime}
              onChange={(e) => setServiceForm((f) => ({ ...f, responseTime: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm"
              placeholder="Within 24 hours"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-charcoal/70">
            <input
              type="checkbox"
              checked={serviceForm.available}
              onChange={(e) => setServiceForm((f) => ({ ...f, available: e.target.checked }))}
              className="h-4 w-4 rounded border-charcoal/30 text-green focus:ring-green/40"
            />
            Available
          </label>
          {serviceErr && <p className="text-sm text-red-600">{serviceErr}</p>}
          {serviceMsg && <p className="text-sm text-green">{serviceMsg}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="rounded-xl bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-dark"
            >
              {editingServiceId ? "Save service changes" : "Add service"}
            </button>
            {editingServiceId && (
              <button
                type="button"
                onClick={cancelEditService}
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
