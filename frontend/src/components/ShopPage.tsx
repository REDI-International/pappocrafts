"use client";

import { useState, useMemo, useEffect, useCallback, useRef, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { categories, type Product, mapSupabaseProduct, shopCategoryChips } from "@/lib/products";
import { amountInListingCurrencyToEur } from "@/lib/eur-fallback-rates";
import { useLocale } from "@/lib/locale-context";
import { translateShopCategory } from "@/lib/translations";
import { hasFeaturedMarker } from "@/lib/listing-featured";
import { trackMarketplaceEvent } from "@/components/Analytics";

const PRODUCTS_PER_PAGE = 12;

function normalizeBrandLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function ShopContent() {
  const router = useRouter();
  const pathname = usePathname();
  const listingBase = pathname === "/shop" ? "/shop" : "/";
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const artisanFilter = searchParams.get("artisan") || "";
  const businessFilter = searchParams.get("business") || "";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<"featured" | "price-asc" | "price-desc">("featured");
  const [countryFilter, setCountryFilter] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [activeArtisan, setActiveArtisan] = useState(artisanFilter);
  const [activeBusinessSlug, setActiveBusinessSlug] = useState(businessFilter);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t, formatProductRegionalPrice } = useLocale();

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data.map(mapSupabaseProduct));
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    setActiveArtisan(searchParams.get("artisan") || "");
    setActiveBusinessSlug(searchParams.get("business") || "");
    const cat = searchParams.get("category");
    if (cat && categories.includes(cat)) setActiveCategory(cat);
  }, [searchParams]);

  const trackedProfileVisitKeyRef = useRef<string>("");
  useEffect(() => {
    const businessSlug = searchParams.get("business") || "";
    const artisan = searchParams.get("artisan") || "";
    if (!businessSlug && !artisan) return;
    const visitKey = businessSlug ? `business:${businessSlug}` : `artisan:${artisan}`;
    if (trackedProfileVisitKeyRef.current === visitKey) return;
    trackedProfileVisitKeyRef.current = visitKey;
    trackMarketplaceEvent({
      eventType: "profile_visit",
      sellerSlug: businessSlug || undefined,
      sellerName: artisan || undefined,
      pagePath: `${listingBase}${window.location.search}`,
    });
  }, [searchParams, listingBase]);

  const countryOptions = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.country?.trim()) set.add(p.country.trim());
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filterLabel = useMemo(() => {
    if (activeBusinessSlug) {
      const p = products.find((x) => x.businessSlug === activeBusinessSlug);
      return p?.businessName || activeBusinessSlug;
    }
    return activeArtisan;
  }, [activeBusinessSlug, activeArtisan, products]);

  const activeBusinessName = useMemo(() => {
    if (!activeBusinessSlug) return "";
    const p = products.find((x) => x.businessSlug === activeBusinessSlug);
    return p?.businessName || "";
  }, [activeBusinessSlug, products]);

  const clearMakerFilter = () => {
    setActiveArtisan("");
    setActiveBusinessSlug("");
    const cat = activeCategory !== "All" ? `?category=${encodeURIComponent(activeCategory)}` : "";
    router.replace(`${listingBase}${cat}`);
  };

  const filtered = useMemo(() => {
    let result = products;
    if (activeBusinessSlug) {
      const slug = activeBusinessSlug.trim();
      const targetBusiness = normalizeBrandLabel(activeBusinessName);
      result = result.filter((p) => {
        if (p.businessSlug === slug) return true;
        if (!targetBusiness) return false;
        return normalizeBrandLabel(p.businessName) === targetBusiness;
      });
    } else if (activeArtisan) {
      result = result.filter((p) => p.artisan === activeArtisan);
    }
    if (activeCategory !== "All") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (countryFilter) {
      result = result.filter((p) => p.country === countryFilter);
    }
    if (inStockOnly) {
      result = result.filter((p) => p.inStock);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.artisan.toLowerCase().includes(q) ||
          p.businessName.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, activeArtisan, activeBusinessSlug, activeBusinessName, search, products, countryFilter, inStockOnly]);

  const sortedProducts = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const af = hasFeaturedMarker(a.tags);
      const bf = hasFeaturedMarker(b.tags);
      if (af !== bf) return af ? -1 : 1;
      if (sortMode === "price-asc")
        return (
          amountInListingCurrencyToEur(a.price, a.currency) -
          amountInListingCurrencyToEur(b.price, b.currency)
        );
      if (sortMode === "price-desc")
        return (
          amountInListingCurrencyToEur(b.price, b.currency) -
          amountInListingCurrencyToEur(a.price, a.currency)
        );
      return 0;
    });
    return copy;
  }, [filtered, sortMode]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE));
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const rawPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const currentPage = Math.min(rawPage, totalPages);

  const paginatedProducts = useMemo(
    () =>
      sortedProducts.slice(
        (currentPage - 1) * PRODUCTS_PER_PAGE,
        currentPage * PRODUCTS_PER_PAGE
      ),
    [sortedProducts, currentPage]
  );

  const filterKey = `${activeCategory}|${search}|${countryFilter}|${inStockOnly}|${activeArtisan}|${activeBusinessSlug}|${sortMode}`;
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
        router.replace(q ? `${listingBase}?${q}` : listingBase, { scroll: false });
      }
    }
  }, [filterKey, listingBase, router, searchParams]);

  useEffect(() => {
    if (loading || error || sortedProducts.length === 0) return;
    if (rawPage <= totalPages) return;
    const u = new URLSearchParams(searchParams.toString());
    if (totalPages <= 1) u.delete("page");
    else u.set("page", String(totalPages));
    const q = u.toString();
    router.replace(q ? `${listingBase}?${q}` : listingBase, { scroll: false });
  }, [
    loading,
    error,
    rawPage,
    totalPages,
    sortedProducts.length,
    listingBase,
    router,
    searchParams,
  ]);

  const goToPage = useCallback(
    (next: number) => {
      const u = new URLSearchParams(searchParams.toString());
      if (next <= 1) u.delete("page");
      else u.set("page", String(next));
      const q = u.toString();
      router.replace(q ? `${listingBase}?${q}` : listingBase);
    },
    [listingBase, router, searchParams]
  );

  const paginationInfo = t("shop.paginationInfo")
    .replace("{current}", String(currentPage))
    .replace("{total}", String(totalPages));

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center max-w-3xl mx-auto">
            <div className="relative flex-1 min-w-[200px] max-w-sm mx-auto sm:mx-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-charcoal/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder={t("shop.searchPlaceholder")}
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
                <option value="featured">{t("shop.sortFeatured")}</option>
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
            <label className="flex items-center gap-2 text-xs text-charcoal/60 cursor-pointer justify-center sm:justify-start">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded border-charcoal/20 text-green focus:ring-green"
              />
              {t("shop.inStockOnly")}
            </label>
          </div>

          <div className="mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
            <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-charcoal/40 mb-2">
              {t("cat.badge")}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory sm:flex-wrap sm:justify-center sm:overflow-visible">
              {shopCategoryChips.map((cat) => (
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
                    {translateShopCategory(cat.name, t)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {(activeArtisan || activeBusinessSlug) && (
            <div className="mb-8 flex items-center gap-3 rounded-xl bg-green/5 border border-green/10 px-5 py-3">
              <svg className="h-5 w-5 text-green flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <p className="text-sm text-charcoal/70 flex-1">
                Showing products from <strong className="text-charcoal">{filterLabel}</strong>
              </p>
              <button
                type="button"
                onClick={clearMakerFilter}
                className="text-xs font-medium text-green hover:text-green-dark transition-colors"
              >
                Show all
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border border-charcoal/5 overflow-hidden animate-pulse p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 flex-shrink-0 rounded-xl bg-charcoal/5" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-charcoal/5 rounded w-3/4" />
                      <div className="h-3 bg-charcoal/5 rounded w-1/2" />
                      <div className="h-3 bg-charcoal/5 rounded w-full" />
                    </div>
                  </div>
                  <div className="mt-3 h-8 bg-charcoal/5 rounded w-full" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-charcoal/50 text-lg">Something went wrong loading products.</p>
              <button
                onClick={loadProducts}
                className="mt-4 text-green font-medium hover:text-green-dark transition-colors"
              >
                Try again
              </button>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-charcoal/50 text-lg">{t("shop.noProducts")}</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("All");
                  setCountryFilter("");
                  setInStockOnly(false);
                  setSortMode("featured");
                }}
                className="mt-4 text-green font-medium hover:text-green-dark transition-colors"
              >
                {t("shop.clearFilters")}
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProducts.map((product, pageIdx) => {
                  const isFirstOnPage = pageIdx === 0;
                  const isFeatured = hasFeaturedMarker(product.tags);
                  return (
                  <Link
                    key={product.id}
                    href={`/shop/${product.id}`}
                    className={`group block text-left rounded-2xl bg-white overflow-hidden transition-all border ${
                      isFirstOnPage
                        ? "ring-2 ring-green/30 ring-offset-2 ring-offset-white border-green/35 shadow-md hover:shadow-lg"
                        : isFeatured
                          ? "border-green/25 hover:shadow-lg hover:border-green/35"
                          : "border-charcoal/5 hover:shadow-lg hover:border-green/20"
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-light">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-charcoal group-hover:text-green transition-colors truncate">
                              {product.name}
                            </h3>
                            {isFeatured && (
                              <span className="flex-shrink-0 rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-bold text-green uppercase tracking-wide">
                                {t("listing.featuredBadge")}
                              </span>
                            )}
                            {!product.inStock && (
                              <span className="flex-shrink-0 rounded-full bg-charcoal/10 px-2 py-0.5 text-[10px] font-bold text-charcoal/50">
                                OUT
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-charcoal/60 truncate">
                            {translateShopCategory(product.category, t)}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-charcoal/50">
                            <span className="truncate max-w-[140px]">{product.businessName}</span>
                            <span>{product.country}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-charcoal/60 line-clamp-2">{product.description}</p>
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-green">
                          {formatProductRegionalPrice(product.price, product.currency)}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-charcoal/40">
                          <span className={`h-2 w-2 rounded-full ${product.inStock ? "bg-green" : "bg-charcoal/25"}`} />
                          {product.inStock ? "In stock" : "Out of stock"}
                        </div>
                      </div>
                      <p className="mt-3 text-xs font-medium text-green">Open full product page</p>
                    </div>
                  </Link>
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

      <Footer />
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] pt-24 flex items-center justify-center text-charcoal/40 text-sm">Loading…</div>}>
      <ShopContent />
    </Suspense>
  );
}
