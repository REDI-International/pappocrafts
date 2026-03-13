"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/lib/locale-context";
import { useSiteSettings } from "@/lib/site-settings-context";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useLocale();
  const { logo_url, footer_description } = useSiteSettings();

  return (
    <footer className="bg-charcoal border-t border-charcoal-light">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Image src={logo_url} alt="PappoShop" width={140} height={42} className="h-10 w-auto brightness-0 invert" unoptimized />
            <p className="mt-3 text-sm text-white/50 leading-relaxed max-w-xs">
              {footer_description || t("footer.desc")}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">{t("footer.shop")}</h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/shop" className="text-sm text-white/50 hover:text-green transition-colors">{t("footer.allProducts")}</Link>
              <Link href="/shop?category=Pottery+%26+Ceramics" className="text-sm text-white/50 hover:text-green transition-colors">{t("cat.pottery")}</Link>
              <Link href="/shop?category=Textiles+%26+Weaving" className="text-sm text-white/50 hover:text-green transition-colors">{t("cat.textiles")}</Link>
              <Link href="/shop?category=Jewelry+%26+Metalwork" className="text-sm text-white/50 hover:text-green transition-colors">{t("cat.jewelry")}</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">{t("footer.services")}</h3>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/services" className="text-sm text-white/50 hover:text-blue-light transition-colors">{t("footer.allServices")}</Link>
              <Link href="/services?category=Home+Repair" className="text-sm text-white/50 hover:text-blue-light transition-colors">{t("footer.homeRepair")}</Link>
              <Link href="/services?category=Pet+Care" className="text-sm text-white/50 hover:text-blue-light transition-colors">{t("footer.petCare")}</Link>
              <Link href="/services?category=Cleaning" className="text-sm text-white/50 hover:text-blue-light transition-colors">{t("footer.cleaning")}</Link>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">{t("footer.countries")}</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Albania", "Serbia", "Kosovo", "N. Macedonia", "Bosnia", "Montenegro"].map((country) => (
                <span key={country} className="inline-block rounded-full bg-charcoal-light px-3 py-1 text-xs text-white/50">
                  {country}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-charcoal-light pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">&copy; {currentYear} PappoShop. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-xs text-white/40 hover:text-white/60 transition-colors">{t("footer.privacy")}</Link>
            <Link href="/terms" className="text-xs text-white/40 hover:text-white/60 transition-colors">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
