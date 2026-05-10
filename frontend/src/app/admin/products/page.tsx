"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { categories } from "@/lib/products";
import {
  galleryFromProductRow,
  imageSlotsForForm,
  MAX_PRODUCT_IMAGES,
  productImageDbPayload,
} from "@/lib/product-images";
import { productGenderFromRow, visibleProductTags } from "@/lib/product-gender";
import { PRODUCT_SIZE_OPTIONS, normalizeProductSizes } from "@/lib/product-sizes";

interface DBProduct {
  id: string;
  seller_id?: string | null;
  name: string;
  description: string;
  long_description: string;
  price: number;
  currency: string;
  category: string;
  artisan: string;
  business_name?: string;
  business_slug?: string;
  country: string;
  phone: string;
  contact_email?: string;
  seller_gender?: "M" | "F" | null;
  image: string;
  images?: string[] | null;
  available_sizes?: string[] | null;
  sizes?: string[] | null;
  tags: string[];
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

type EditableProduct = Omit<DBProduct, "created_at" | "updated_at"> & {
  /** Five URL slots for the form (may include empty strings). */
  imageSlots: string[];
};

interface SellerOption {
  id: string;
  email: string;
  name: string;
  business_name: string;
  business_slug: string;
  phone: string;
  contact_email: string;
  gender: "M" | "F" | null;
}

const emptyProduct: EditableProduct = {
  id: "", seller_id: "", name: "", description: "", long_description: "", price: 0, currency: "EUR",
  category: categories[1], artisan: "", business_name: "", business_slug: "", country: "",
  phone: "",
  contact_email: "",
  seller_gender: null,
  image: "",
  images: [],
  available_sizes: [],
  imageSlots: Array(MAX_PRODUCT_IMAGES).fill(""),
  tags: [], in_stock: true,
};

function getToken() {
  return localStorage.getItem("admin-token") || "";
}

export default function AdminProducts() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [sellers, setSellers] = useState<SellerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditableProduct | null>(null);
  const [photoUploadIndex, setPhotoUploadIndex] = useState(0);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch("/api/admin/products", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setProducts(await res.json());
      const sellerRes = await fetch("/api/admin/sellers", { headers: { Authorization: `Bearer ${token}` } });
      if (sellerRes.ok) {
        const data = await sellerRes.json();
        setSellers(Array.isArray(data.sellers) ? data.sellers : []);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.artisan.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  function openNew() {
    setEditing({ ...emptyProduct, id: `product-${Date.now()}` });
    setIsNew(true);
    setTagInput("");
    setSaveError("");
  }

  async function saveProduct() {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    setSaveError("");
    try {
      const method = isNew ? "POST" : "PATCH";
      const { image, images } = productImageDbPayload(editing.imageSlots);
      const body = {
        id: editing.id,
        seller_id: editing.seller_id || null,
        name: editing.name,
        description: editing.description,
        long_description: editing.long_description,
        price: editing.price,
        currency: editing.currency,
        category: editing.category,
        artisan: editing.artisan,
        business_name: editing.business_name || undefined,
        business_slug: editing.business_slug || undefined,
        country: editing.country,
        phone: editing.phone.trim(),
        contact_email: editing.contact_email?.trim() || "",
        seller_gender: editing.seller_gender || null,
        image,
        images,
        available_sizes: normalizeProductSizes(editing.available_sizes),
        tags: editing.tags,
        in_stock: editing.in_stock,
      };
      const res = await fetch("/api/admin/products", {
        method,
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(typeof data.error === "string" ? data.error : "Failed to save product.");
        return;
      }
      await fetchProducts();
      setEditing(null);
      setIsNew(false);
    } catch {
      setSaveError("Failed to save product.");
    }
    setSaving(false);
  }

  async function deleteProduct(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`/api/admin/products?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    await fetchProducts();
    if (editing?.id === id) { setEditing(null); setIsNew(false); }
  }

  function addTag() {
    if (!editing || !tagInput.trim()) return;
    if (!editing.tags.includes(tagInput.trim())) {
      setEditing({ ...editing, tags: [...editing.tags, tagInput.trim()] });
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    if (!editing) return;
    setEditing({ ...editing, tags: editing.tags.filter((t) => t !== tag) });
  }

  async function handleImageUpload(file: File) {
    if (!editing) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setEditing((e) => {
          if (!e) return e;
          const next = [...e.imageSlots];
          next[photoUploadIndex] = data.url as string;
          return { ...e, imageSlots: next };
        });
      } else {
        alert(`Image upload failed: ${data.error || "Unknown error"}`);
      }
    } catch (err) {
      alert(`Image upload failed: ${err instanceof Error ? err.message : "Network error"}`);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-white/5 rounded-lg" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-white/40 mt-1">{products.length} products · {products.filter(p => p.in_stock).length} in stock</p>
        </div>
        <button onClick={openNew} className="mt-3 sm:mt-0 rounded-xl bg-[#4A9B3F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3D8234] transition-colors shadow-lg shadow-[#4A9B3F]/20">
          + Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or artisan..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50"
        />
        <select
          value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#4A9B3F]"
        >
          {categories.map((c) => <option key={c} value={c} className="bg-[#1A1D27]">{c}</option>)}
        </select>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { setEditing(null); setIsNew(false); }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1A1D27] border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-5">{isNew ? "Add New Product" : "Edit Product"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Product Name *</label>
                <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Hand-Thrown Clay Bowl" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Short Description</label>
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} placeholder="Brief description shown in product cards" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Full Description</label>
                <textarea value={editing.long_description} onChange={(e) => setEditing({ ...editing, long_description: e.target.value })} rows={4} placeholder="Detailed description shown on product page" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Price (EUR)</label>
                  <input type="number" min={0} step={0.01} value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Category</label>
                  <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 text-white text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50">
                    {categories.filter((c) => c !== "All").map((c) => <option key={c} value={c} className="bg-[#1A1D27]">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Artisan Name</label>
                  <input value={editing.artisan} disabled={Boolean(editing.seller_id)} onChange={(e) => setEditing({ ...editing, artisan: e.target.value })} placeholder="e.g. Dragan M." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50 disabled:opacity-60" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Country</label>
                  <input value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} placeholder="e.g. Serbia" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Entrepreneur profile</label>
                <select
                  value={editing.seller_id || ""}
                  onChange={(e) => {
                    const sellerId = e.target.value;
                    const seller = sellers.find((s) => s.id === sellerId);
                    setEditing({
                      ...editing,
                      seller_id: sellerId,
                      artisan: seller ? seller.name : editing.artisan,
                      business_name: seller ? seller.business_name : editing.business_name,
                      business_slug: seller ? seller.business_slug : editing.business_slug,
                      contact_email: seller ? (seller.contact_email || seller.email) : editing.contact_email,
                      seller_gender: seller ? seller.gender : editing.seller_gender,
                      phone: seller?.phone || editing.phone,
                    });
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-white text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50"
                >
                  <option value="" className="bg-[#1A1D27]">No linked entrepreneur profile</option>
                  {sellers.map((seller) => (
                    <option key={seller.id} value={seller.id} className="bg-[#1A1D27]">
                      {seller.business_name || seller.name} ({seller.email})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-white/30">
                  Link products to entrepreneur accounts so profile email and gender changes flow from admin users.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Direct order email</label>
                <input
                  type="email"
                  disabled={Boolean(editing.seller_id)}
                  value={editing.contact_email || ""}
                  onChange={(e) => setEditing({ ...editing, contact_email: e.target.value })}
                  placeholder="seller@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50 disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Gender (donor reporting)</label>
                <select
                  value={editing.seller_gender || ""}
                  disabled={Boolean(editing.seller_id)}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      seller_gender: e.target.value === "M" || e.target.value === "F" ? e.target.value : null,
                    })
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 text-white text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50 disabled:opacity-60"
                >
                  <option value="" className="bg-[#1A1D27]">Not set</option>
                  <option value="M" className="bg-[#1A1D27]">Male (M)</option>
                  <option value="F" className="bg-[#1A1D27]">Female (F)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Phone (legacy / optional)</label>
                <input
                  value={editing.phone}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  placeholder="+389…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-2">Available clothing/textile sizes</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {PRODUCT_SIZE_OPTIONS.map((size) => {
                    const selected = normalizeProductSizes(editing.available_sizes).includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          const current = normalizeProductSizes(editing.available_sizes);
                          const next = selected ? current.filter((s) => s !== size) : [...current, size];
                          setEditing({ ...editing, available_sizes: next });
                        }}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                          selected
                            ? "border-[#4A9B3F] bg-[#4A9B3F] text-white"
                            : "border-white/10 bg-white/5 text-white/45 hover:border-white/25"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-1 text-[10px] text-white/30">
                  Leave all sizes unselected for products without size options. Selected sizes are shown as available; unselected sizes are marked unavailable.
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-white/40">Product photos (up to 5)</label>
                  <div className="flex rounded-lg bg-white/5 p-0.5">
                    <button type="button" onClick={() => setImageMode("upload")} className={`px-3 py-1 text-[10px] font-medium rounded-md transition-colors ${imageMode === "upload" ? "bg-[#4A9B3F] text-white" : "text-white/40 hover:text-white/60"}`}>Upload</button>
                    <button type="button" onClick={() => setImageMode("url")} className={`px-3 py-1 text-[10px] font-medium rounded-md transition-colors ${imageMode === "url" ? "bg-[#4A9B3F] text-white" : "text-white/40 hover:text-white/60"}`}>URL</button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImageUpload(f);
                  }}
                  className="hidden"
                />
                <div className="space-y-3">
                  {editing.imageSlots.map((slotUrl, slotIdx) => (
                    <div key={slotIdx} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-medium text-white/50">Photo {slotIdx + 1}</span>
                        {imageMode === "upload" && (
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoUploadIndex(slotIdx);
                              fileInputRef.current?.click();
                            }}
                            disabled={uploading}
                            className="text-[10px] font-medium text-[#4A9B3F] hover:text-white disabled:opacity-50"
                          >
                            Upload
                          </button>
                        )}
                      </div>
                      {imageMode === "url" ? (
                        <input
                          value={slotUrl}
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditing((ed) => {
                              if (!ed) return ed;
                              const next = [...ed.imageSlots];
                              next[slotIdx] = v;
                              return { ...ed, imageSlots: next };
                            });
                          }}
                          placeholder="https://…"
                          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#4A9B3F]/50"
                        />
                      ) : null}
                      {slotUrl ? (
                        <div className="flex items-center gap-2">
                          <div className="h-14 w-14 rounded-lg overflow-hidden bg-white/5 relative flex-shrink-0">
                            <Image src={slotUrl} alt="" fill className="object-cover" sizes="56px" unoptimized />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setEditing((ed) => {
                                if (!ed) return ed;
                                const next = [...ed.imageSlots];
                                next[slotIdx] = "";
                                return { ...ed, imageSlots: next };
                              })
                            }
                            className="text-[10px] text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Tags</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {editing.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-white/5 text-white/60 text-xs px-2.5 py-1 rounded-lg">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="text-white/30 hover:text-red-400 ml-0.5">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add a tag..." className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4A9B3F]" />
                  <button onClick={addTag} className="rounded-xl bg-white/5 px-4 py-2 text-xs text-white/60 hover:bg-white/10">Add</button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={editing.in_stock} onChange={(e) => setEditing({ ...editing, in_stock: e.target.checked })} className="sr-only peer" />
                  <div className="w-9 h-5 bg-white/10 peer-focus:ring-2 peer-focus:ring-[#4A9B3F]/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4A9B3F]"></div>
                </label>
                <span className="text-xs text-white/60">In Stock</span>
              </div>
            </div>
            {saveError && <p className="mt-4 text-sm text-red-400">{saveError}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={saveProduct} disabled={saving} className="flex-1 rounded-xl bg-[#4A9B3F] py-2.5 text-sm font-semibold text-white hover:bg-[#3D8234] disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : "Save Product"}
              </button>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm text-white/60 hover:bg-white/10 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-white/20">No products found. {search || catFilter !== "All" ? "Try adjusting your filters." : "Add your first product!"}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <div key={product.id} className="rounded-2xl bg-[#1A1D27] border border-white/5 overflow-hidden group hover:border-white/10 transition-colors">
              <div className="relative h-36 bg-white/5">
                <Image
                  src={galleryFromProductRow(product)[0] || product.image || "/placeholder.svg"}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="400px"
                  unoptimized
                />
                {!product.in_stock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-xs font-bold text-red-400 bg-red-500/20 px-3 py-1 rounded-full">OUT OF STOCK</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">{product.category}</span>
                </div>
                {productGenderFromRow(product) === "F" && (
                  <div className="absolute left-2 top-2">
                    <span className="text-[10px] font-bold text-white bg-[#4A9B3F] px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Women-led
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
                    <p className="text-xs text-white/30 mt-0.5">{product.business_name || product.artisan} &middot; {product.country}</p>
                  </div>
                  <span className="text-sm font-bold text-[#4A9B3F] shrink-0">&euro;{Number(product.price).toFixed(2)}</span>
                </div>
                {product.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {product.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setEditing({
                        id: product.id, seller_id: product.seller_id || "", name: product.name, description: product.description,
                        long_description: product.long_description, price: Number(product.price),
                        currency: product.currency, category: product.category, artisan: product.artisan,
                        business_name: product.business_name || "",
                        business_slug: product.business_slug || "",
                        country: product.country,
                        phone: (product as DBProduct).phone || "",
                        contact_email: (product as DBProduct).contact_email || "",
                        seller_gender: productGenderFromRow(product),
                        image: product.image,
                        images: product.images ?? [],
                        available_sizes: normalizeProductSizes(product.available_sizes ?? product.sizes),
                        imageSlots: imageSlotsForForm(galleryFromProductRow(product)),
                        tags: visibleProductTags(product.tags), in_stock: product.in_stock,
                      });
                      setIsNew(false);
                      setTagInput("");
                    }}
                    className="flex-1 rounded-xl bg-white/5 py-2 text-xs text-white/60 hover:bg-white/10 transition-colors"
                  >
                    Edit
                  </button>
                  <button onClick={() => deleteProduct(product.id)} className="rounded-xl bg-red-500/10 px-4 py-2 text-xs text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
