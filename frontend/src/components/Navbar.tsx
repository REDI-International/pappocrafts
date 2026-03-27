"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { useLocale, locales, currencies } from "@/lib/locale-context";
import { useSiteSettings } from "@/lib/site-settings-context";
import CartSidebar from "./CartSidebar";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { t } = useLocale();
  const { logo_url } = useSiteSettings();
  const loggedIn = useLoggedIn();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-charcoal/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image src={logo_url} alt="PappoShop" width={220} height={64} className="w-auto" style={{ height: "3.5rem" }} priority unoptimized />
            </Link>

            <div className="hidden md:flex items-center gap-5">
              <Link href="/" className="text-sm font-medium text-charcoal/70 hover:text-green transition-colors">
                {t("nav.shop")}
              </Link>
              <Link href="/services" className="text-sm font-medium text-charcoal/70 hover:text-blue transition-colors">
                {t("nav.services")}
              </Link>
              <Link href="/landing#how-it-works" className="text-sm font-medium text-charcoal/70 hover:text-green transition-colors">
                {t("nav.howItWorks")}
              </Link>
              <a
                href={`mailto:${t("footer.supportEmail")}`}
                className="text-sm font-medium text-charcoal/70 hover:text-green transition-colors"
              >
                {t("nav.support")}
              </a>

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
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-charcoal/70 hover:text-green transition-colors"
                aria-label="Shopping cart"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green text-[10px] font-bold text-white">
                    {totalItems}
                  </span>
                )}
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-green px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-dark transition-colors"
              >
                {t("nav.browseProducts")}
              </Link>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <CurrencySelector variant="mobile" />
              <LanguageSelector variant="mobile" />
              <Link href={loggedIn ? "/account" : "/login"} className="p-2 text-charcoal" aria-label="Account">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </Link>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-charcoal"
                aria-label="Shopping cart"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-green text-[10px] font-bold text-white">
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 text-charcoal"
                aria-label="Toggle menu"
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
              <Link href="/" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 hover:bg-light-dark hover:text-green transition-colors">
                {t("nav.shop")}
              </Link>
              <Link href="/services" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 hover:bg-light-dark hover:text-blue transition-colors">
                {t("nav.services")}
              </Link>
              <Link href="/landing#how-it-works" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 hover:bg-light-dark hover:text-green transition-colors">
                {t("nav.howItWorks")}
              </Link>
              <a
                href={`mailto:${t("footer.supportEmail")}`}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-charcoal/70 hover:bg-light-dark hover:text-green transition-colors"
              >
                {t("nav.support")}
              </a>
              <Link href="/" onClick={() => setMobileOpen(false)} className="mt-2 inline-flex items-center justify-center rounded-full bg-green px-5 py-2 text-sm font-semibold text-white hover:bg-green-dark transition-colors">
                {t("nav.browseProducts")}
              </Link>
            </div>
          </div>
        )}
      </nav>
      <CartSidebar />
    </>
  );
}
