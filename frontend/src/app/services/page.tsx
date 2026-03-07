"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { serviceProviders, serviceCategories } from "@/lib/services";
import { useLocale } from "@/lib/locale-context";
import { Suspense } from "react";

function ServicesContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [search, setSearch] = useState("");
  const { t, formatRegionalPrice } = useLocale();

  const filtered = useMemo(() => {
    let result = serviceProviders;
    if (activeCategory !== "All") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.country.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, search]);

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-charcoal tracking-tight">
              {t("services.title")}
            </h1>
            <p className="mt-4 text-lg text-charcoal/60 leading-relaxed">
              {t("services.desc")}
            </p>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-charcoal/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder={t("services.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-charcoal/10 bg-white py-3 pl-12 pr-5 text-sm text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3 mb-12">
            {serviceCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all ${
                  activeCategory === cat.name
                    ? "bg-green text-white shadow-md"
                    : "bg-white text-charcoal/70 border border-charcoal/5 hover:border-green/20 hover:shadow-sm"
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-medium leading-tight">{cat.name}</span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-charcoal/50 text-lg">{t("services.noProviders")}</p>
              <button
                onClick={() => { setSearch(""); setActiveCategory("All"); }}
                className="mt-4 text-green font-medium hover:text-green-dark transition-colors"
              >
                {t("services.clearFilters")}
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((provider) => (
                <Link
                  key={provider.id}
                  href={`/services/${provider.id}`}
                  className="group rounded-2xl bg-white border border-charcoal/5 overflow-hidden hover:shadow-lg hover:border-green/20 transition-all"
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-light">
                        <Image src={provider.image} alt={provider.name} fill className="object-cover" sizes="64px" unoptimized />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-charcoal group-hover:text-green transition-colors truncate">
                            {provider.name}
                          </h3>
                          {provider.badges.includes("Top Rated") && (
                            <span className="flex-shrink-0 rounded-full bg-green/10 px-2 py-0.5 text-[10px] font-bold text-green">TOP</span>
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
                    <p className="mt-3 text-sm text-charcoal/60 line-clamp-2">{provider.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm">
                        {provider.hourlyRate > 0 && (
                          <span className="font-bold text-green">{formatRegionalPrice(provider.hourlyRate)}{t("services.perHour")}</span>
                        )}
                        {provider.fixedRateFrom && (
                          <span className={`text-charcoal/50 ${provider.hourlyRate > 0 ? "ml-2" : ""}`}>
                            {provider.hourlyRate > 0 ? `${t("services.from")} ` : ""}{t("services.from")} {formatRegionalPrice(provider.fixedRateFrom)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-charcoal/40">
                        <span className="h-2 w-2 rounded-full bg-green" />
                        {provider.responseTime}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
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
