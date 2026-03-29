"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SITE_LOGO_URL } from "@/lib/site-logo";

export interface SiteSettings {
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

const DEFAULTS: SiteSettings = {
  logo_url: SITE_LOGO_URL,
  hero_badge: "Western Balkans Marketplace",
  hero_title1: "Handcrafted with",
  hero_title2: "Heart & Heritage",
  hero_description:
    "Discover authentic handmade products and local services from Roma entrepreneurs across the Western Balkans. Every purchase supports livelihoods and preserves cultural traditions.",
  footer_description:
    "Authentic handmade products and services from Roma entrepreneurs across the Western Balkans.",
  mission_badge: "Our Mission",
  mission_title: "Empowering Roma Artisans Across the Balkans",
  mission_desc1:
    "PappoShop connects talented Roma artisans and service providers with customers who value authenticity, quality, and social impact. Every purchase directly supports Roma entrepreneurs and their families.",
  mission_desc2:
    "We believe that economic empowerment is the most sustainable path to social inclusion. By providing a platform for Roma entrepreneurs, we help preserve centuries-old crafting traditions while creating new opportunities.",
};

const SiteSettingsContext = createContext<SiteSettings>(DEFAULTS);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object" && !data.error) {
          setSettings({ ...DEFAULTS, ...data });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
