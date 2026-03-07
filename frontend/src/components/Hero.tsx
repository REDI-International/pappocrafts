"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { useSiteSettings } from "@/lib/site-settings-context";

export default function Hero() {
  const { t } = useLocale();
  const siteSettings = useSiteSettings();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
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

          <p className="mt-6 text-lg sm:text-xl text-charcoal/70 max-w-2xl mx-auto leading-relaxed">
            {siteSettings.hero_description || t("hero.desc")}
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/shop"
              className="inline-flex items-center justify-center rounded-full bg-green px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-green/25 hover:bg-green-dark hover:shadow-green/40 transition-all"
            >
              {t("hero.shopNow")}
            </Link>
            <Link
              href="/#mission"
              className="inline-flex items-center justify-center rounded-full border-2 border-charcoal/20 px-8 py-3.5 text-base font-semibold text-charcoal hover:border-green hover:text-green transition-colors"
            >
              {t("hero.learnStory")}
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            <div>
              <p className="font-serif text-3xl font-bold text-green">6+</p>
              <p className="mt-1 text-sm text-charcoal/60">{t("hero.stat1")}</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-green">100+</p>
              <p className="mt-1 text-sm text-charcoal/60">{t("hero.stat2")}</p>
            </div>
            <div>
              <p className="font-serif text-3xl font-bold text-green">1000+</p>
              <p className="mt-1 text-sm text-charcoal/60">{t("hero.stat3")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="h-6 w-6 text-charcoal/40" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
        </svg>
      </div>
    </section>
  );
}
