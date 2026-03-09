"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { categories } from "@/lib/products";

interface DBProduct {
  id: string;
  name: string;
  description: string;
  long_description: string;
  price: number;
  currency: string;
  category: string;
  artisan: string;
  country: string;
  image: string;
  tags: string[];
  in_stock: boolean;
  created_at: string;
  updated_at: string;
}

const emptyProduct: Omit<DBProduct, "created_at" | "updated_at"> = {
  id: "", name: "", description: "", long_description: "", price: 0, currency: "EUR",
  category: categories[1], artisan: "", country: "",
  image: "",
  tags: [], in_stock: true,
};

function getToken() {
  return localStorage.getItem("admin-token") || "";
}

export default function AdminProducts() {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Omit<DBProduct, "created_at" | "updated_at"> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageMode, setImageMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/products", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setProducts(await res.json());
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
  }

  async function saveProduct() {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    try {
      const method = isNew ? "POST" : "PATCH";
      const body = {
        id: editing.id,
        name: editing.name,
        description: editing.description,
        long_description: editing.long_description,
        price: editing.price,
        currency: editing.currency,
        category: editing.category,
        artisan: editing.artisan,
        country: editing.country,
        image: editing.image,
        tags: editing.tags,
        in_stock: editing.in_stock,
      };
      await fetch("/api/admin/products", {
        method,
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await fetchProducts();
      setEditing(null);
      setIsNew(false);
    } catch { /* ignore */ }
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
        setEditing({ ...editing, image: data.url });
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
                  <input value={editing.artisan} onChange={(e) => setEditing({ ...editing, artisan: e.target.value })} placeholder="e.g. Dragan M." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Country</label>
                  <input value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} placeholder="e.g. Serbia" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-white/40">Product Image</label>
                  <div className="flex rounded-lg bg-white/5 p-0.5">
                    <button type="button" onClick={() => setImageMode("upload")} className={`px-3 py-1 text-[10px] font-medium rounded-md transition-colors ${imageMode === "upload" ? "bg-[#4A9B3F] text-white" : "text-white/40 hover:text-white/60"}`}>Upload</button>
                    <button type="button" onClick={() => setImageMode("url")} className={`px-3 py-1 text-[10px] font-medium rounded-md transition-colors ${imageMode === "url" ? "bg-[#4A9B3F] text-white" : "text-white/40 hover:text-white/60"}`}>URL</button>
                  </div>
                </div>
                {imageMode === "upload" ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-5 text-sm text-white/50 hover:border-[#4A9B3F]/50 hover:text-white/70 transition-all disabled:opacity-50"
                    >
                      {uploading ? (
                        <span className="inline-flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                          Uploading...
                        </span>
                      ) : (
                        <span className="flex flex-col items-center gap-1">
                          <svg className="h-6 w-6 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
                          Click to upload an image from your computer
                        </span>
                      )}
                    </button>
                  </div>
                ) : (
                  <input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="https://images.unsplash.com/..." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
                )}
                {editing.image && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-white/5 relative flex-shrink-0">
                      <Image src={editing.image} alt="Preview" fill className="object-cover" sizes="80px" unoptimized />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white/30 truncate">{editing.image}</p>
                      <button type="button" onClick={() => setEditing({ ...editing, image: "" })} className="mt-1 text-xs text-red-400 hover:text-red-300">Remove image</button>
                    </div>
                  </div>
                )}
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
                <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" sizes="400px" unoptimized />
                {!product.in_stock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-xs font-bold text-red-400 bg-red-500/20 px-3 py-1 rounded-full">OUT OF STOCK</span>
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm px-2 py-0.5 rounded-full">{product.category}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{product.name}</h3>
                    <p className="text-xs text-white/30 mt-0.5">{product.artisan} &middot; {product.country}</p>
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
                        id: product.id, name: product.name, description: product.description,
                        long_description: product.long_description, price: Number(product.price),
                        currency: product.currency, category: product.category, artisan: product.artisan,
                        country: product.country, image: product.image, tags: product.tags, in_stock: product.in_stock,
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
