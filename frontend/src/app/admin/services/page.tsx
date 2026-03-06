"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { serviceCategories } from "@/lib/services";

interface DBService {
  id: string;
  name: string;
  title: string;
  description: string;
  long_description: string;
  category: string;
  hourly_rate: number;
  fixed_rate_from: number | null;
  currency: string;
  rating: number;
  review_count: number;
  location: string;
  country: string;
  image: string;
  badges: string[];
  available: boolean;
  response_time: string;
  completed_jobs: number;
  created_at: string;
  updated_at: string;
}

type EditableService = Omit<DBService, "created_at" | "updated_at">;

const emptyService: EditableService = {
  id: "", name: "", title: "", description: "", long_description: "",
  category: serviceCategories[1].name, hourly_rate: 0, fixed_rate_from: null,
  currency: "EUR", rating: 5, review_count: 0, location: "", country: "",
  image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=300&h=300&fit=crop",
  badges: [], available: true, response_time: "Under 1 hour", completed_jobs: 0,
};

function getToken() {
  return localStorage.getItem("admin-token") || "";
}

export default function AdminServices() {
  const [services, setServices] = useState<DBService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditableService | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [badgeInput, setBadgeInput] = useState("");

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/services", { headers: { Authorization: `Bearer ${getToken()}` } });
      if (res.ok) setServices(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const filtered = services.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "All" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  function openNew() {
    setEditing({ ...emptyService, id: `service-${Date.now()}` });
    setIsNew(true);
    setBadgeInput("");
  }

  async function saveService() {
    if (!editing || !editing.name.trim()) return;
    setSaving(true);
    try {
      const method = isNew ? "POST" : "PATCH";
      await fetch("/api/admin/services", {
        method,
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      await fetchServices();
      setEditing(null);
      setIsNew(false);
    } catch { /* ignore */ }
    setSaving(false);
  }

  async function deleteService(id: string) {
    if (!confirm("Delete this service provider? This cannot be undone.")) return;
    await fetch(`/api/admin/services?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    await fetchServices();
    if (editing?.id === id) { setEditing(null); setIsNew(false); }
  }

  function addBadge() {
    if (!editing || !badgeInput.trim()) return;
    if (!editing.badges.includes(badgeInput.trim())) {
      setEditing({ ...editing, badges: [...editing.badges, badgeInput.trim()] });
    }
    setBadgeInput("");
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-white/5 rounded-lg" />
          <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="text-sm text-white/40 mt-1">{services.length} providers · {services.filter(s => s.available).length} available</p>
        </div>
        <button onClick={openNew} className="mt-3 sm:mt-0 rounded-xl bg-[#4A9B3F] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#3D8234] transition-colors shadow-lg shadow-[#4A9B3F]/20">
          + Add Provider
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or title..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50"
        />
        <select
          value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#4A9B3F]"
        >
          {serviceCategories.map((c) => <option key={c.name} value={c.name} className="bg-[#1A1D27]">{c.name}</option>)}
        </select>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { setEditing(null); setIsNew(false); }}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#1A1D27] border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white mb-5">{isNew ? "Add Service Provider" : "Edit Provider"}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Provider Name *</label>
                  <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Dragan P." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Title</label>
                  <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. Licensed Plumber" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Description</label>
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={2} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Full Description</label>
                <textarea value={editing.long_description} onChange={(e) => setEditing({ ...editing, long_description: e.target.value })} rows={3} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Category</label>
                <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 text-white text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50">
                  {serviceCategories.filter((c) => c.name !== "All").map((c) => <option key={c.name} value={c.name} className="bg-[#1A1D27]">{c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Hourly Rate (&euro;)</label>
                  <input type="number" min={0} step={0.5} value={editing.hourly_rate} onChange={(e) => setEditing({ ...editing, hourly_rate: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Location</label>
                  <input value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} placeholder="e.g. Belgrade" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Country</label>
                  <input value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} placeholder="e.g. Serbia" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Image URL</label>
                <input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Response Time</label>
                <input value={editing.response_time} onChange={(e) => setEditing({ ...editing, response_time: e.target.value })} placeholder="e.g. Under 1 hour" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5">Badges</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {editing.badges.map((badge) => (
                    <span key={badge} className="inline-flex items-center gap-1 bg-[#4A9B3F]/10 text-[#4A9B3F] text-xs px-2.5 py-1 rounded-lg">
                      {badge}
                      <button onClick={() => setEditing({ ...editing, badges: editing.badges.filter(b => b !== badge) })} className="text-[#4A9B3F]/50 hover:text-red-400 ml-0.5">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={badgeInput} onChange={(e) => setBadgeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBadge())} placeholder="e.g. Verified, Top Rated" className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#4A9B3F]" />
                  <button onClick={addBadge} className="rounded-xl bg-white/5 px-4 py-2 text-xs text-white/60 hover:bg-white/10">Add</button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={editing.available} onChange={(e) => setEditing({ ...editing, available: e.target.checked })} className="sr-only peer" />
                  <div className="w-9 h-5 bg-white/10 peer-focus:ring-2 peer-focus:ring-[#4A9B3F]/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4A9B3F]"></div>
                </label>
                <span className="text-xs text-white/60">Available</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={saveService} disabled={saving} className="flex-1 rounded-xl bg-[#4A9B3F] py-2.5 text-sm font-semibold text-white hover:bg-[#3D8234] disabled:opacity-50 transition-colors">
                {saving ? "Saving..." : "Save Provider"}
              </button>
              <button onClick={() => { setEditing(null); setIsNew(false); }} className="flex-1 rounded-xl bg-white/5 py-2.5 text-sm text-white/60 hover:bg-white/10 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Providers List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-white/20">No services found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((provider) => (
            <div key={provider.id} className="rounded-2xl bg-[#1A1D27] border border-white/5 p-4 flex gap-4 items-center hover:border-white/10 transition-colors">
              <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                <Image src={provider.image} alt={provider.name} fill className="object-cover" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white truncate">{provider.name}</h3>
                  {provider.badges.map((b) => (
                    <span key={b} className="text-[10px] font-bold text-[#4A9B3F] bg-[#4A9B3F]/10 rounded-full px-2 py-0.5">{b}</span>
                  ))}
                  {!provider.available && <span className="text-[10px] text-red-400 bg-red-500/10 rounded-full px-2 py-0.5">Unavailable</span>}
                </div>
                <p className="text-xs text-white/40 truncate">{provider.title} &middot; {provider.location}, {provider.country}</p>
                <p className="text-xs text-white/20">{provider.category} &middot; &euro;{Number(provider.hourly_rate)}/hr &middot; {Number(provider.rating)}/5 ({provider.review_count} reviews) &middot; {provider.completed_jobs} jobs</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => {
                    setEditing({
                      id: provider.id, name: provider.name, title: provider.title,
                      description: provider.description, long_description: provider.long_description,
                      category: provider.category, hourly_rate: Number(provider.hourly_rate),
                      fixed_rate_from: provider.fixed_rate_from ? Number(provider.fixed_rate_from) : null,
                      currency: provider.currency, rating: Number(provider.rating),
                      review_count: provider.review_count, location: provider.location,
                      country: provider.country, image: provider.image, badges: provider.badges,
                      available: provider.available, response_time: provider.response_time,
                      completed_jobs: provider.completed_jobs,
                    });
                    setIsNew(false);
                    setBadgeInput("");
                  }}
                  className="rounded-xl bg-white/5 px-4 py-2 text-xs text-white/60 hover:bg-white/10 transition-colors"
                >
                  Edit
                </button>
                <button onClick={() => deleteService(provider.id)} className="rounded-xl bg-red-500/10 px-4 py-2 text-xs text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
