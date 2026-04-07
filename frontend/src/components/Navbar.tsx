"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLocale, locales, currencies } from "@/lib/locale-context";
import { useSiteSettings } from "@/lib/site-settings-context";
import CartSidebar from "./CartSidebar";
import ListingOfferModal from "./ListingOfferModal";

function useLoggedIn() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("admin-token"));
  }, []);
  return loggedIn;
}

function LanguageSelector({ variant }: { variant: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { locale, setLocale, localeConfig } = useLocale();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={
          variant === "desktop"
            ? "flex items-center gap-1.5 rounded-full border border-charcoal/10 px-3 py-1.5 text-xs font-medium text-charcoal/70 hover:border-green/30 hover:text-charcoal transition-all"
            : "flex items-center gap-1 p-2 text-charcoal"
        }
        title="Change language"
      >
        <span className={variant === "desktop" ? "text-base leading-none" : "text-lg"}>
          {localeConfig.flag}
        </span>
        {variant === "desktop" && (
          <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-charcoal/10 bg-white py-1.5 shadow-xl z-50">
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                locale === l.code
                  ? "bg-green/5 text-green font-medium"
                  : "text-charcoal/70 hover:bg-light-dark"
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              <span className="flex-1 text-left">{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CurrencySelector({ variant }: { variant: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { currency, setCurrency, currencyConfig, ratesSource } = useLocale();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={
          variant === "desktop"
            ? "flex items-center gap-1.5 rounded-full border border-charcoal/10 px-3 py-1.5 text-xs font-medium text-charcoal/70 hover:border-green/30 hover:text-charcoal transition-all"
            : "flex items-center gap-1 px-2 py-1 text-xs font-medium text-charcoal/70 border border-charcoal/10 rounded-full"
        }
        title="Change currency"
      >
        <span className="text-xs font-semibold">{currencyConfig.symbol}</span>
        {variant === "desktop" && (
          <>
            <span>{currency}</span>
            <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-charcoal/10 bg-white py-1.5 shadow-xl z-50">
          <div className="px-4 py-2 border-b border-charcoal/5">
            <p className="text-[10px] font-semibold text-charcoal/30 uppercase tracking-wider">Currency</p>
            {ratesSource === "live" && (
              <p className="text-[9px] text-green/60 mt-0.5">Live ECB rates</p>
            )}
          </div>
          {currencies.map((c) => (
            <button
              key={c.code}
              onClick={() => { setCurrency(c.code); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors ${
                currency === c.code
                  ? "bg-green/5 text-green font-medium"
                  : "text-charcoal/70 hover:bg-light-dark"
              }`}
            >
              <span className="text-base">{c.flag}</span>
              <span className="flex-1 text-left">{c.name}</span>
              <span className="text-xs text-charcoal/40 font-mono">{c.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [listingModalOpen, setListingModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLocale();
  const { logo_url } = useSiteSettings();
  const loggedIn = useLoggedIn();
  const supportHref = `${pathname === "/" ? "/" : pathname}#contact`;
  const shopActive = pathname === "/" || pathname.startsWith("/shop");
  const servicesActive = pathname.startsWith("/services");

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-charcoal/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-2">
            <Link
              href="/"
              className="flex min-w-0 flex-1 items-center md:flex-initial md:shrink-0"
            >
              <Image
                src={logo_url}
                alt="PappoShop"
                width={320}
                height={96}
                className="h-12 w-auto max-h-12 max-w-[min(42vw,11rem)] object-contain object-left sm:h-14 sm:max-h-14 sm:max-w-[min(48vw,13rem)] md:h-[4.5rem] md:max-h-none md:max-w-[min(100%,18rem)] lg:max-w-none"
                priority
                unoptimized
              />
            </Link>

            <div className="hidden md:flex items-center gap-5">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className={`text-lg font-semibold rounded-full px-4 py-1.5 transition-all ${
                    shopActive
                      ? "bg-green/15 text-green-dark shadow-sm shadow-green/10 ring-1 ring-green/35"
                      : "text-charcoal/75 hover:bg-green/10 hover:text-green-dark ring-1 ring-transparent hover:ring-green/20"
                  }`}
                >
                  {t("nav.shop")}
                </Link>
                <Link
                  href="/services"
                  className={`text-lg font-semibold rounded-full px-4 py-1.5 transition-all ${
                    servicesActive
                      ? "bg-blue/15 text-blue-dark shadow-sm shadow-blue/10 ring-1 ring-blue/35"
                      : "text-charcoal/75 hover:bg-blue/10 hover:text-blue-dark ring-1 ring-transparent hover:ring-blue/20"
                  }`}
                >
                  {t("nav.services")}
                </Link>
              </div>
              <Link href="/landing#how-it-works" className="text-sm font-medium text-charcoal/70 hover:text-green transition-colors">
                {t("nav.howItWorks")}
              </Link>
              <Link
                href={supportHref}
                className="text-sm font-medium text-charcoal/70 hover:text-green transition-colors"
              >
                {t("nav.support")}
              </Link>

              <div className="flex items-center gap-1.5">
                <CurrencySelector variant="desktop" />
                <LanguageSelector variant="desktop" />
              </div>

              <Link
                href={loggedIn ? "/account" : "/login"}
                className="p-2 text-charcoal/70 hover:text-green transition-colors"
                aria-label="Account"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </Link>

              <button
                type="button"
                onClick={() => setListingModalOpen(true)}
                className="inline-flex items-center justify-center rounded-full bg-green px-5 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-green-dark transition-colors"
              >
                ADD PRODUCT/SERVICE
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2 md:hidden *:shrink-0">
              <CurrencySelector variant="mobile" />
              <LanguageSelector variant="mobile" />
              <Link
                href={loggedIn ? "/account" : "/login"}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-charcoal hover:bg-charcoal/5"
                aria-label="Account"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-charcoal/20 bg-charcoal/[0.03] text-charcoal shadow-sm hover:bg-charcoal/10"
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-charcoal/10 bg-white">
            <div className="flex flex-col gap-1 px-4 py-3">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={`rounded-xl px-3 py-2.5 text-base font-semibold transition-colors ${
                  shopActive
                    ? "bg-green/15 text-green-dark ring-1 ring-green/30"
                    : "text-charcoal/75 hover:bg-green/10 hover:text-green-dark"
                }`}
              >
                {t("nav.shop")}
              </Link>
              <Link
                href="/services"
                onClick={() => setMobileOpen(false)}
                className={`rounded-xl px-3 py-2.5 text-base font-semibold transition-colors ${
                  servicesActive
                    ? "bg-blue/15 text-blue-dark ring-1 ring-blue/30"
                    : "text-charcoal/75 hover:bg-blue/10 hover:text-blue-dark"
                }`}
              >
                {t("nav.services")}
              </Link>
              <Link href="/landing#how-it-works" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 hover:bg-light-dark hover:text-green transition-colors">
                {t("nav.howItWorks")}
              </Link>
              <Link
                href={supportHref}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 hover:bg-light-dark hover:text-green transition-colors"
              >
                {t("nav.support")}
              </Link>
            </div>
          </div>
        )}
      </nav>
      <CartSidebar />
      <ListingOfferModal open={listingModalOpen} onClose={() => setListingModalOpen(false)} />
    </>
  );
}
