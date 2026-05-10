"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { serviceProviders, serviceCategories, mapSupabaseServiceRow, type ServiceProvider } from "@/lib/services";
import { useLocale } from "@/lib/locale-context";
import { translateServiceCategory } from "@/lib/translations";
import { hasFeaturedMarker } from "@/lib/listing-featured";

const SERVICES_PER_PAGE = 12;
const SERVICES_LISTING_BASE = "/services";

function ServicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"rating" | "price-asc" | "price-desc" | "reviews">("rating");
  const [countryFilter, setCountryFilter] = useState("");
  const [list, setList] = useState<ServiceProvider[]>(serviceProviders);
  const [preview, setPreview] = useState<ServiceProvider | null>(null);
  const { t, formatRegionalPrice } = useLocale();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data) && data.length > 0) {
          setList(data.map(mapSupabaseServiceRow));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const countryOptions = useMemo(() => {
    const s = new Set<string>();
    list.forEach((p) => {
      if (p.country?.trim()) s.add(p.country.trim());
    });
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [list]);

  const filtered = useMemo(() => {
    let result = list;
    if (activeCategory !== "All") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (countryFilter) {
      result = result.filter((p) => p.country === countryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.summary && p.summary.toLowerCase().includes(q)) ||
          p.location.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q) ||
          (p.languagesSpoken && p.languagesSpoken.toLowerCase().includes(q))
      );
    }
    return result;
  }, [activeCategory, search, list, countryFilter]);

  const sortedProviders = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const af = hasFeaturedMarker(a.badges);
      const bf = hasFeaturedMarker(b.badges);
      if (af !== bf) return af ? -1 : 1;
      if (sortMode === "price-asc") return (a.hourlyRate || 0) - (b.hourlyRate || 0);
      if (sortMode === "price-desc") return (b.hourlyRate || 0) - (a.hourlyRate || 0);
      if (sortMode === "reviews") return b.reviewCount - a.reviewCount;
      return b.rating - a.rating;
    });
    return copy;
  }, [filtered, sortMode]);

  const totalPages = Math.max(1, Math.ceil(sortedProviders.length / SERVICES_PER_PAGE));
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const rawPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const currentPage = Math.min(rawPage, totalPages);

  const paginatedProviders = useMemo(
    () =>
      sortedProviders.slice(
        (currentPage - 1) * SERVICES_PER_PAGE,
        currentPage * SERVICES_PER_PAGE
      ),
    [sortedProviders, currentPage]
  );

  const filterKey = `${activeCategory}|${search}|${countryFilter}|${sortMode}`;
  const prevFilterKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevFilterKeyRef.current === null) {
      prevFilterKeyRef.current = filterKey;
      return;
    }
    if (prevFilterKeyRef.current !== filterKey) {
      prevFilterKeyRef.current = filterKey;
      if (searchParams.get("page")) {
        const u = new URLSearchParams(searchParams.toString());
        u.delete("page");
        const q = u.toString();
        router.replace(q ? `${SERVICES_LISTING_BASE}?${q}` : SERVICES_LISTING_BASE, { scroll: false });
      }
    }
  }, [filterKey, router, searchParams]);

  useEffect(() => {
    if (sortedProviders.length === 0) return;
    if (rawPage <= totalPages) return;
    const u = new URLSearchParams(searchParams.toString());
    if (totalPages <= 1) u.delete("page");
    else u.set("page", String(totalPages));
    const q = u.toString();
    router.replace(q ? `${SERVICES_LISTING_BASE}?${q}` : SERVICES_LISTING_BASE, { scroll: false });
  }, [rawPage, totalPages, sortedProviders.length, router, searchParams]);

  const goToPage = useCallback(
    (next: number) => {
      const u = new URLSearchParams(searchParams.toString());
      if (next <= 1) u.delete("page");
      else u.set("page", String(next));
      const q = u.toString();
      router.replace(q ? `${SERVICES_LISTING_BASE}?${q}` : SERVICES_LISTING_BASE);
    },
    [router, searchParams]
  );

  const paginationInfo = t("shop.paginationInfo")
    .replace("{current}", String(currentPage))
    .replace("{total}", String(totalPages));

  const closePreview = useCallback(() => setPreview(null), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePreview();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePreview]);

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="sr-only">{t("services.title")}</h1>
          <div className="text-center max-w-2xl mx-auto mb-5">
            <p className="text-base text-charcoal/60 leading-relaxed">
              {t("services.desc")}
            </p>
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center max-w-3xl mx-auto">
            <div className="relative flex-1 min-w-[200px] max-w-sm mx-auto sm:mx-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder={t("services.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-charcoal/10 bg-white py-2 pl-9 pr-3 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-charcoal/60 whitespace-nowrap justify-center sm:justify-start">
              <span className="text-charcoal/50">{t("shop.sortBy")}</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as typeof sortMode)}
                className="rounded-full border border-charcoal/10 bg-white py-2 pl-3 pr-8 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-green"
              >
                <option value="rating">{t("service.rating")}</option>
                <option value="reviews">{t("service.reviews")}</option>
                <option value="price-asc">{t("shop.sortPriceAsc")}</option>
                <option value="price-desc">{t("shop.sortPriceDesc")}</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-charcoal/60 whitespace-nowrap justify-center sm:justify-start">
              <span className="text-charcoal/50">{t("shop.filterCountry")}</span>
              <select
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                className="rounded-full border border-charcoal/10 bg-white py-2 pl-3 pr-8 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-green max-w-[160px]"
              >
                <option value="">{t("shop.countryAll")}</option>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-charcoal/40 mb-2">
              {t("cat.badge")}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory sm:flex-wrap sm:justify-center sm:overflow-visible">
              {serviceCategories.map((cat) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setActiveCategory(cat.name)}
                  className={`flex flex-col items-center gap-1 rounded-xl p-2.5 min-w-[5.5rem] sm:min-w-0 flex-shrink-0 snap-start text-center transition-all ${
                    activeCategory === cat.name
                      ? "bg-green text-white shadow-md"
                      : "bg-white text-charcoal/70 border border-charcoal/5 hover:border-green/20 hover:shadow-sm"
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{cat.icon}</span>
                  <span className="text-[10px] sm:text-xs font-medium leading-tight max-w-[5rem]">
                    {translateServiceCategory(cat.name, t)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {sortedProviders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-charcoal/50 text-lg">{t("services.noProviders")}</p>
              <button
                type="button"
                onClick={() => { setSearch(""); setActiveCategory("All"); setCountryFilter(""); setSortMode("rating"); }}
                className="mt-4 text-green font-medium hover:text-green-dark transition-colors"
              >
                {t("services.clearFilters")}
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProviders.map((provider, pageIdx) => {
                  const isFirstOnPage = pageIdx === 0;
                  const isFeatured = hasFeaturedMarker(provider.badges);
                  return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => setPreview(provider)}
                    className={`group text-left rounded-2xl bg-white overflow-hidden transition-all border ${
                      isFirstOnPage
                        ? "ring-2 ring-green/30 ring-offset-2 ring-offset-white border-green/35 shadow-md hover:shadow-lg"
                        : isFeatured
                          ? "border-green/25 hover:shadow-lg hover:border-green/35"
                          : "border-charcoal/5 hover:shadow-lg hover:border-green/20"
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-light">
                          <Image src={provider.image} alt={provider.name} fill className="object-cover" sizes="64px" unoptimized />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-charcoal group-hover:text-green transition-colors truncate">
                              {provider.name}
                            </h3>
                            {isFeatured && (
                              <span className="flex-shrink-0 rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-bold text-green uppercase tracking-wide">
                                {t("listing.featuredBadge")}
                              </span>
                            )}
                            {provider.badges.includes("Top Rated") && (
                              <span className="flex-shrink-0 rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-bold text-green uppercase tracking-wide">
                                TOP
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-charcoal/60">{provider.title}</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-charcoal/50">
                            <span className="flex items-center gap-1">
                              <svg className="h-3.5 w-3.5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                              </svg>
                              {provider.rating} ({provider.reviewCount})
                            </span>
                            <span>{provider.location}, {provider.country}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-charcoal/60 line-clamp-2">{provider.summary || provider.description}</p>
                      {(provider.yearsExperience || provider.languagesSpoken) && (
                        <p className="mt-2 text-xs text-charcoal/45 line-clamp-2">
                          {provider.yearsExperience && <span>{provider.yearsExperience}</span>}
                          {provider.yearsExperience && provider.languagesSpoken && <span> · </span>}
                          {provider.languagesSpoken && <span>{provider.languagesSpoken}</span>}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm">
                          {provider.hourlyRate > 0 && (
                            <span className="font-bold text-green">{formatRegionalPrice(provider.hourlyRate)}{t("services.perHour")}</span>
                          )}
                          {provider.fixedRateFrom != null && provider.fixedRateFrom > 0 && (
                            <span className={`text-charcoal/50 ${provider.hourlyRate > 0 ? "ml-2" : ""}`}>
                              {provider.hourlyRate > 0 ? `${t("services.from")} ` : `${t("services.from")} `}{formatRegionalPrice(provider.fixedRateFrom)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-charcoal/40">
                          <span className="h-2 w-2 rounded-full bg-green" />
                          {provider.responseTime}
                        </div>
                      </div>
                      {provider.phone ? (
                        <p className="mt-2 text-xs font-medium text-green">Phone contact available</p>
                      ) : null}
                      <p className="mt-3 text-xs font-medium text-green">Quick preview — click for details</p>
                    </div>
                  </button>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <nav
                  className="mt-10 flex flex-wrap items-center justify-center gap-3"
                  aria-label={paginationInfo}
                >
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => goToPage(currentPage - 1)}
                    className="rounded-full border border-charcoal/15 bg-white px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-green/30 hover:text-green disabled:pointer-events-none disabled:opacity-40"
                  >
                    {t("shop.paginationPrev")}
                  </button>
                  <p className="min-w-[8rem] text-center text-sm text-charcoal/60 tabular-nums">{paginationInfo}</p>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                    className="rounded-full border border-charcoal/15 bg-white px-4 py-2 text-sm font-medium text-charcoal transition-colors hover:border-green/30 hover:text-green disabled:pointer-events-none disabled:opacity-40"
                  >
                    {t("shop.paginationNext")}
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </main>

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-preview-title"
          onClick={closePreview}
        >
          <div
            className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-charcoal/10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePreview}
              className="absolute right-4 top-4 rounded-full p-2 text-charcoal/40 hover:bg-charcoal/5 hover:text-charcoal z-10"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="p-6 pt-10">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-light">
                  <Image src={preview.image} alt={preview.name} fill className="object-cover" sizes="80px" unoptimized />
                </div>
                <div>
                  <h2 id="service-preview-title" className="font-serif text-2xl font-bold text-charcoal pr-8">
                    {preview.name}
                  </h2>
                  <p className="text-sm text-charcoal/60 mt-0.5">{preview.title}</p>
                  <p className="text-xs text-charcoal/45 mt-1">{preview.location}, {preview.country}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-charcoal/70 leading-relaxed">{preview.summary || preview.description}</p>
              {(preview.yearsExperience || preview.languagesSpoken) && (
                <div className="mt-4 rounded-xl bg-light/80 border border-charcoal/5 p-4 text-sm space-y-2">
                  {preview.yearsExperience && (
                    <p><span className="font-semibold text-charcoal/80">Experience:</span> {preview.yearsExperience}</p>
                  )}
                  {preview.languagesSpoken && (
                    <p><span className="font-semibold text-charcoal/80">Languages:</span> {preview.languagesSpoken}</p>
                  )}
                </div>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                {preview.hourlyRate > 0 && (
                  <span className="font-bold text-green text-lg">{formatRegionalPrice(preview.hourlyRate)}{t("services.perHour")}</span>
                )}
                {preview.fixedRateFrom != null && preview.fixedRateFrom > 0 && (
                  <span className="text-charcoal/60">{t("services.from")} {formatRegionalPrice(preview.fixedRateFrom)}</span>
                )}
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {preview.bookingCalendarUrl ? (
                  <a
                    href={preview.bookingCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl bg-green py-3 text-center text-sm font-semibold text-white hover:bg-green-dark transition-colors"
                  >
                    Book a time slot
                  </a>
                ) : null}
                <Link
                  href={`/services/${preview.id}`}
                  className={`rounded-xl border-2 border-green py-3 text-center text-sm font-semibold text-green hover:bg-green hover:text-white transition-colors ${preview.bookingCalendarUrl ? "flex-1" : "w-full"}`}
                >
                  Full profile page & phone contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}

export default function ServicesPage() {
  return (
    <Suspense>
      <ServicesContent />
    </Suspense>
  );
}
