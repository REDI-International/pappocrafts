"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/lib/locale-context";
import { useSiteSettings } from "@/lib/site-settings-context";
import { categories } from "@/lib/products";
import { serviceCategories } from "@/lib/services";
import { translateShopCategory } from "@/lib/translations";

const COUNTRY_KEYS = ["Albania", "Serbia", "Kosovo", "N. Macedonia", "Bosnia", "Montenegro"] as const;

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLocale();
  const { logo_url, footer_description } = useSiteSettings();

  const productCats = categories.filter((c) => c !== "All");
  const serviceCats = serviceCategories.filter((c) => c.name !== "All");

  return (
    <footer className="bg-charcoal border-t border-charcoal-light">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <Image src={logo_url} alt="PappoShop" width={140} height={42} className="h-10 w-auto brightness-0 invert" unoptimized />
            <p className="mt-3 text-sm text-white/50 leading-relaxed max-w-xs">
              {footer_description || t("footer.desc")}
            </p>
            <div id="contact" className="mt-6 scroll-mt-24 rounded-xl border border-white/10 bg-charcoal-light/30 p-4">
              <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wide">{t("footer.contact")}</h3>
              <p className="mt-2 text-sm text-white/55">{t("footer.managersReach")}</p>
              <p className="mt-2 text-sm font-medium text-green-light select-all" translate="no">
                {t("footer.supportEmail")}
              </p>
              <p className="mt-3 text-xs text-white/40">
                {t("footer.techIssues")}{" "}
                <span className="text-white/60 select-all" translate="no">
                  {t("footer.supportEmail")}
                </span>
              </p>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide">{t("footer.countries")}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {COUNTRY_KEYS.map((country) => (
                <span
                  key={country}
                  className="inline-block rounded-full bg-green/15 border border-green/25 px-3 py-1.5 text-xs font-medium text-green-light"
                >
                  {country}
                </span>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">{t("footer.shop")}</h3>
            <div className="mt-3 flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
              <Link href="/" className="text-sm text-white/50 hover:text-green transition-colors shrink-0">
                {t("footer.allProducts")}
              </Link>
              {productCats.map((cat) => (
                <Link
                  key={cat}
                  href={`/?category=${encodeURIComponent(cat)}`}
                  className="text-sm text-white/50 hover:text-green transition-colors shrink-0"
                >
                  {translateShopCategory(cat, t)}
                </Link>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">{t("footer.services")}</h3>
            <div className="mt-3 flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
              <Link href="/services" className="text-sm text-white/50 hover:text-blue-light transition-colors shrink-0">
                {t("footer.allServices")}
              </Link>
              {serviceCats.map((cat) => (
                <Link
                  key={cat.name}
                  href={`/services?category=${encodeURIComponent(cat.name)}`}
                  className="text-sm text-white/50 hover:text-blue-light transition-colors shrink-0"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-charcoal-light pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">&copy; {currentYear} PappoShop. All rights reserved.</p>
          <div className="flex flex-wrap gap-6 justify-center">
            <Link href="/privacy" className="text-xs text-white/40 hover:text-white/60 transition-colors">{t("footer.privacy")}</Link>
            <Link href="/terms" className="text-xs text-white/40 hover:text-white/60 transition-colors">{t("footer.terms")}</Link>
            <span className="text-xs text-white/40 select-all" translate="no">
              {t("footer.supportEmail")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
