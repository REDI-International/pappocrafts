"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

interface SiteSettings {
  logo_url: string;
  hero_badge: string;
  hero_title1: string;
  hero_title2: string;
  hero_description: string;
  footer_description: string;
  mission_badge: string;
  mission_title: string;
  mission_desc1: string;
  mission_desc2: string;
  [key: string]: string;
}

function SectionCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[#1A1D27] border border-white/5 p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <p className="text-xs text-white/30 mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}

function FieldInput({ label, value, onChange, multiline }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/40 focus:border-[#4A9B3F]/40 transition-all resize-none"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#4A9B3F]/40 focus:border-[#4A9B3F]/40 transition-all"
        />
      )}
    </div>
  );
}

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) return;
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setSettings(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function updateField(key: string, value: string) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setSaved(false);
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setSaved(false);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    const token = localStorage.getItem("admin-token");

    try {
      const formData = new FormData();
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      const { logo_url, ...textSettings } = settings;
      void logo_url;
      formData.append("settings", JSON.stringify(textSettings));

      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setLogoFile(null);
        setLogoPreview(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // error handling
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-white/5 rounded-lg" />
          <div className="h-64 bg-white/5 rounded-2xl" />
          <div className="h-64 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-white/40">Failed to load settings.</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Settings</h1>
          <p className="text-sm text-white/40 mt-1">Edit your site logo and text content. Changes apply to the live site.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all ${
            saved
              ? "bg-emerald-600"
              : "bg-[#4A9B3F] hover:bg-[#3D8234]"
          } disabled:opacity-50`}
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </span>
          ) : saved ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              Saved
            </span>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      {/* Logo Section */}
      <SectionCard title="Site Logo" description="Upload a new logo to replace the current one. Recommended: PNG with transparent background, at least 320px wide.">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-48 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center p-3 overflow-hidden">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="New logo preview" className="max-h-full max-w-full object-contain" />
              ) : settings.logo_url ? (
                <Image
                  src={settings.logo_url}
                  alt="Current logo"
                  width={160}
                  height={48}
                  className="max-h-full max-w-full object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-xs text-white/20">No logo</span>
              )}
            </div>
            <p className="text-[10px] text-white/20 mt-2">
              {logoPreview ? "New logo (unsaved)" : "Current logo"}
            </p>
          </div>

          <div className="flex-1 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border border-dashed border-white/20 bg-white/5 px-6 py-4 text-sm text-white/50 hover:border-[#4A9B3F]/50 hover:text-white/70 transition-all w-full text-center"
            >
              <svg className="h-6 w-6 mx-auto mb-2 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Click to upload a new logo
            </button>
            {logoFile && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#4A9B3F]">{logoFile.name}</span>
                <button
                  onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Hero Section */}
      <SectionCard title="Hero Section" description="The main banner visitors see when they land on your site.">
        <div className="space-y-4">
          <FieldInput label="Badge Text" value={settings.hero_badge} onChange={(v) => updateField("hero_badge", v)} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldInput label="Title Line 1" value={settings.hero_title1} onChange={(v) => updateField("hero_title1", v)} />
            <FieldInput label="Title Line 2 (highlighted)" value={settings.hero_title2} onChange={(v) => updateField("hero_title2", v)} />
          </div>
          <FieldInput label="Description" value={settings.hero_description} onChange={(v) => updateField("hero_description", v)} multiline />
        </div>
      </SectionCard>

      {/* Mission Section */}
      <SectionCard title="Mission Section" description="Tell visitors about your mission and values.">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldInput label="Badge Text" value={settings.mission_badge} onChange={(v) => updateField("mission_badge", v)} />
            <FieldInput label="Section Title" value={settings.mission_title} onChange={(v) => updateField("mission_title", v)} />
          </div>
          <FieldInput label="Paragraph 1" value={settings.mission_desc1} onChange={(v) => updateField("mission_desc1", v)} multiline />
          <FieldInput label="Paragraph 2" value={settings.mission_desc2} onChange={(v) => updateField("mission_desc2", v)} multiline />
        </div>
      </SectionCard>

      {/* Footer */}
      <SectionCard title="Footer" description="The description shown in the footer across all pages.">
        <FieldInput label="Footer Description" value={settings.footer_description} onChange={(v) => updateField("footer_description", v)} multiline />
      </SectionCard>
    </div>
  );
}
