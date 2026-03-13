"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { categories, type Product, mapSupabaseProduct } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";
import { trackAddToCart } from "@/components/Analytics";
import { Suspense } from "react";

function ShopContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const artisanFilter = searchParams.get("artisan") || "";

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const [activeArtisan, setActiveArtisan] = useState(artisanFilter);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { addItem } = useCart();
  const { t, formatRegionalPrice } = useLocale();

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

  const filtered = useMemo(() => {
    let result = products;
    if (activeArtisan) {
      result = result.filter((p) => p.artisan === activeArtisan);
    }
    if (activeCategory !== "All") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.artisan.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, activeArtisan, search, products]);

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-charcoal tracking-tight">
              {t("shop.title")}
            </h1>
            <p className="mt-4 text-lg text-charcoal/60 leading-relaxed">
              {t("shop.desc")}
            </p>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder={t("shop.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-charcoal/10 bg-white py-3 pl-12 pr-5 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
              />
            </div>
          </div>

          <div className="relative mb-12">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeCategory === cat
                      ? "bg-green text-white shadow-sm"
                      : "bg-white text-charcoal/60 border border-charcoal/10 hover:border-green/30 hover:text-green"
                  }`}
                >
                  {cat === "All" ? t("shop.all") : cat}
                </button>
              ))}
            </div>
          </div>

          {activeArtisan && (
            <div className="mb-8 flex items-center gap-3 rounded-xl bg-green/5 border border-green/10 px-5 py-3">
              <svg className="h-5 w-5 text-green flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              <p className="text-sm text-charcoal/70 flex-1">
                Showing products by <strong className="text-charcoal">{activeArtisan}</strong>
              </p>
              <button
                onClick={() => setActiveArtisan("")}
                className="text-xs font-medium text-green hover:text-green-dark transition-colors"
              >
                Show all
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border border-charcoal/5 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-charcoal/5" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-charcoal/5 rounded w-3/4" />
                    <div className="h-3 bg-charcoal/5 rounded w-1/2" />
                    <div className="h-3 bg-charcoal/5 rounded w-full" />
                    <div className="h-10 bg-charcoal/5 rounded-full" />
                  </div>
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-charcoal/50 text-lg">{t("shop.noProducts")}</p>
              <button
                onClick={() => { setSearch(""); setActiveCategory("All"); }}
                className="mt-4 text-green font-medium hover:text-green-dark transition-colors"
              >
                {t("shop.clearFilters")}
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((product) => (
                <div key={product.id} className="group rounded-2xl bg-white border border-charcoal/5 overflow-hidden hover:shadow-lg hover:border-green/20 transition-all">
                  <Link href={`/shop/${product.id}`} className="block">
                    <div className="relative aspect-square overflow-hidden bg-light">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        unoptimized
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/shop/${product.id}`}>
                          <h3 className="font-semibold text-charcoal truncate group-hover:text-green transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-charcoal/50 mt-0.5">
                          {t("shop.by")}{" "}
                          <button
                            onClick={(e) => { e.preventDefault(); setActiveArtisan(product.artisan); }}
                            className="font-medium text-charcoal/70 hover:text-green transition-colors"
                          >
                            {product.artisan}
                          </button>
                          {" "}&middot; {product.country}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-green whitespace-nowrap">
                        {formatRegionalPrice(product.price)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-charcoal/60 line-clamp-2">{product.description}</p>
                    {product.inStock ? (
                      <button
                        onClick={() => { addItem(product); trackAddToCart({ id: product.id, name: product.name, price: product.price }); }}
                        className="mt-3 w-full rounded-full bg-green/10 py-2 text-sm font-semibold text-green hover:bg-green hover:text-white transition-colors"
                      >
                        {t("shop.addToCart")}
                      </button>
                    ) : (
                      <div className="mt-3 w-full rounded-full bg-charcoal/5 py-2 text-sm font-semibold text-charcoal/40 text-center">
                        Out of Stock
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense>
      <ShopContent />
    </Suspense>
  );
}
