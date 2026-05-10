"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/lib/locale-context";
import { useSiteSettings } from "@/lib/site-settings-context";
import { categories } from "@/lib/products";
import { serviceCategories } from "@/lib/services";
import { translateShopCategory, translateServiceCategory } from "@/lib/translations";

const COUNTRY_KEYS = ["Albania", "Serbia", "N. Macedonia"] as const;

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
            <div className="inline-flex rounded-xl bg-white p-3">
              <Image src={logo_url} alt="PappoShop" width={200} height={60} className="h-12 w-auto object-contain" unoptimized />
            </div>
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
              <p className="mt-3">
                <Link
                  href="/feedback"
                  className="text-sm font-medium text-green-light hover:text-green transition-colors"
                >
                  {t("footer.feedbackForm")}
                </Link>
              </p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wide">{t("footer.social")}</h4>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <a
                    href="https://www.facebook.com/profile.php?id=61579800626419"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-green-light transition-colors"
                    aria-label="PappoShop on Facebook"
                  >
                    <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Facebook
                  </a>
                  <a
                    href="https://www.instagram.com/papposhopcom/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-white/60 hover:text-green-light transition-colors"
                    aria-label="PappoShop on Instagram"
                  >
                    <svg className="h-5 w-5 shrink-0" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    Instagram
                  </a>
                </div>
              </div>
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
                  {translateServiceCategory(cat.name, t)}
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
