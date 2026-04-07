"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { type Product, mapSupabaseProduct } from "@/lib/products";
import { useLocale } from "@/lib/locale-context";
import { translateShopCategory } from "@/lib/translations";
import { trackMarketplaceEvent, trackViewContent } from "@/components/Analytics";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, formatProductRegionalPrice } = useLocale();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [revealCount, setRevealCount] = useState<number | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState("");
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        const mapped = mapSupabaseProduct(data);
        setProduct(mapped);
        setGalleryIndex(0);
        trackViewContent({ id: mapped.id, name: mapped.name, price: mapped.price, category: mapped.category });
        trackMarketplaceEvent({
          eventType: "product_view",
          listingId: mapped.id,
          sellerSlug: mapped.businessSlug || undefined,
          sellerName: mapped.businessName || mapped.artisan || undefined,
          pagePath: `/shop/${mapped.id}`,
        });

        const relRes = await fetch(`/api/products?category=${encodeURIComponent(mapped.category)}`);
        if (relRes.ok) {
          const relData = await relRes.json();
          if (!cancelled && Array.isArray(relData)) {
            setRelated(
              relData
                .map(mapSupabaseProduct)
                .filter((p: Product) => p.id !== id)
                .slice(0, 3)
            );
          }
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleRevealContact() {
    if (!product || revealLoading || revealedPhone) return;
    setRevealError("");
    setRevealLoading(true);
    try {
      const res = await fetch("/api/public/reveal-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "product", id: product.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.phone === "string" && data.phone.trim()) {
        setRevealedPhone(data.phone.trim());
        setRevealCount(typeof data.contactRevealCount === "number" ? data.contactRevealCount : null);
        return;
      }
      setRevealError(typeof data.error === "string" ? data.error : t("listing.error"));
    } catch {
      setRevealError(t("listing.error"));
    } finally {
      setRevealLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-20 pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2 animate-pulse">
              <div className="aspect-square rounded-2xl bg-charcoal/5" />
              <div className="space-y-4 py-4">
                <div className="h-6 bg-charcoal/5 rounded w-1/3" />
                <div className="h-10 bg-charcoal/5 rounded w-3/4" />
                <div className="h-4 bg-charcoal/5 rounded w-1/2" />
                <div className="h-8 bg-charcoal/5 rounded w-1/4 mt-6" />
                <div className="h-20 bg-charcoal/5 rounded w-full mt-6" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const galleryImages =
    product && product.images.length > 0
      ? product.images
      : product?.image
        ? [product.image]
        : [];
  const mainImage = galleryImages[galleryIndex] || product?.image || "";
  const sellerProfileName = product?.sellerName || product?.businessName || product?.artisan || "";
  const hasSellerProfile =
    product != null &&
    Boolean(
      (product.sellerBiography && product.sellerBiography.trim()) ||
        (product.sellerLogoUrl && product.sellerLogoUrl.trim())
    );

  if (notFound || !product) {
    return (
      <>
        <Navbar />
        <main className="pt-20 pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center py-24">
            <h1 className="font-serif text-3xl font-bold text-charcoal">Product Not Found</h1>
            <p className="mt-4 text-charcoal/60">The product you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link href="/" className="mt-6 inline-block rounded-full bg-green px-6 py-3 text-white font-semibold hover:bg-green-dark transition-colors">
              Back to Shop
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 text-sm text-charcoal/50">
            <Link href="/" className="hover:text-green transition-colors">{t("nav.shop")}</Link>
            <span>/</span>
            <Link href={`/?category=${encodeURIComponent(product.category)}`} className="hover:text-green transition-colors">
              {translateShopCategory(product.category, t)}
            </Link>
            <span>/</span>
            <span className="text-charcoal">{product.name}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-light">
                {mainImage ? (
                  <Image
                    src={mainImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    unoptimized
                  />
                ) : null}
              </div>
              {galleryImages.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {galleryImages.map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      onClick={() => setGalleryIndex(i)}
                      className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                        i === galleryIndex ? "border-green ring-2 ring-green/30" : "border-charcoal/10 hover:border-charcoal/25"
                      }`}
                    >
                      <Image src={src} alt="" fill className="object-cover" sizes="64px" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-green/10 px-3 py-1 text-xs font-medium text-green">
                  {translateShopCategory(product.category, t)}
                </span>
                <span className="rounded-full bg-blue/10 px-3 py-1 text-xs font-medium text-blue">
                  {product.country}
                </span>
                {!product.inStock && (
                  <span className="rounded-full bg-charcoal/10 px-3 py-1 text-xs font-medium text-charcoal/50">
                    Out of stock
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal tracking-tight">
                {product.name}
              </h1>

              <p className="mt-2 text-charcoal/60">
                {t("product.handcraftedBy")}{" "}
                <Link
                  href={
                    product.businessSlug
                      ? `/?business=${encodeURIComponent(product.businessSlug)}`
                      : `/?artisan=${encodeURIComponent(product.artisan)}`
                  }
                  className="font-bold text-charcoal hover:text-green transition-colors"
                >
                  {product.businessName}
                </Link>
              </p>

              {hasSellerProfile && (
                <div className="mt-4 rounded-xl border border-charcoal/10 bg-light/60 p-4">
                  <div className="flex items-start gap-3">
                    {product.sellerLogoUrl ? (
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-charcoal/10 bg-white">
                        <Image
                          src={product.sellerLogoUrl}
                          alt={`${sellerProfileName} logo`}
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-charcoal">
                        {sellerProfileName}
                      </p>
                      {product.sellerBiography ? (
                        <p className="mt-1 text-sm leading-relaxed text-charcoal/70 whitespace-pre-line">
                          {product.sellerBiography}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              <p className="mt-6 text-3xl font-bold text-green">
                {formatProductRegionalPrice(product.price, product.currency)}
              </p>

              <p className="mt-6 text-charcoal/70 leading-relaxed">{product.longDescription}</p>

              <div className="mt-8 flex flex-col gap-3">
                {!revealedPhone ? (
                  <button
                    type="button"
                    onClick={handleRevealContact}
                    disabled={revealLoading}
                    className="w-full rounded-full bg-green py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-green/25 hover:bg-green-dark transition-all disabled:opacity-60"
                  >
                    {revealLoading ? t("listing.submitting") : t("listing.revealContactDetails")}
                  </button>
                ) : (
                  <div className="rounded-2xl border border-green/20 bg-green/5 px-5 py-4">
                    <p className="text-sm text-charcoal/60">
                      <span className="text-charcoal/50">{t("product.contactPhone")}: </span>
                      <a href={`tel:${revealedPhone.replace(/\s/g, "")}`} className="font-semibold text-green hover:underline">
                        {revealedPhone}
                      </a>
                    </p>
                    {revealCount != null && (
                      <p className="mt-2 text-xs text-charcoal/45">
                        {t("listing.contactRevealCount").replace("{count}", String(revealCount))}
                      </p>
                    )}
                  </div>
                )}
                {revealError && <p className="text-sm text-red-600">{revealError}</p>}
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-light-dark px-3 py-1 text-xs text-charcoal/50">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-charcoal/10 pt-6">
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-green" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-2.25 0h-2.25m0 0v6.75m0-6.75H5.625" />
                  </svg>
                  <span className="text-sm text-charcoal/60">{t("product.freeShipping")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="h-5 w-5 text-green" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  <span className="text-sm text-charcoal/60">{t("product.authenticity")}</span>
                </div>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-24">
              <h2 className="font-serif text-2xl font-bold text-charcoal mb-8">{t("product.related")}</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/shop/${p.id}`}
                    className="group rounded-2xl bg-white border border-charcoal/5 overflow-hidden hover:shadow-lg hover:border-green/20 transition-all"
                  >
                    <div className="relative aspect-square overflow-hidden bg-light">
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-charcoal group-hover:text-green transition-colors">{p.name}</h3>
                      <p className="text-xs text-charcoal/50 mt-0.5">{t("shop.by")} {p.businessName} · {p.country}</p>
                      <p className="mt-2 text-lg font-bold text-green">
                        {formatProductRegionalPrice(p.price, p.currency)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
