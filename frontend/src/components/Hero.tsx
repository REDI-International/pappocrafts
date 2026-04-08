"use client";

import { useLocale } from "@/lib/locale-context";
import { useSiteSettings } from "@/lib/site-settings-context";

export default function Hero() {
  const { t } = useLocale();
  const siteSettings = useSiteSettings();

  return (
    <section className="relative flex min-h-[55vh] items-center justify-center overflow-hidden pt-24 pb-12">
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="balkans-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0L60 30L30 60L0 30Z" fill="none" stroke="#2D2D2D" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#balkans-pattern)" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 inline-block rounded-full bg-green/10 px-4 py-1.5 text-sm font-semibold text-green tracking-wide uppercase">
            {siteSettings.hero_badge || t("hero.badge")}
          </p>

          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-charcoal leading-[1.1] tracking-tight">
            {siteSettings.hero_title1 || t("hero.title1")}
            <br />
            <span className="text-green">{siteSettings.hero_title2 || t("hero.title2")}</span>
          </h1>
        </div>
      </div>
    </section>
  );
}
