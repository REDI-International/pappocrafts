"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { type Product, mapSupabaseProduct } from "@/lib/products";
import { useLocale } from "@/lib/locale-context";
import { translateShopCategory } from "@/lib/translations";
import { trackMarketplaceEvent, trackViewContent } from "@/components/Analytics";
import { parseProductMetaTags } from "@/lib/product-listing-meta";

type AccountSession = { email: string; role: string; name: string };

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, formatProductRegionalPrice } = useLocale();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [galleryIndex, setGalleryIndex] = useState(0);

  const [accountSession, setAccountSession] = useState<AccountSession | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestAddress, setGuestAddress] = useState("");

  const [orderBusy, setOrderBusy] = useState(false);
  const [orderNotice, setOrderNotice] = useState<"success" | "error" | null>(null);
  /** Server-provided success copy (accurate when buyer email fails). */
  const [orderSuccessDetail, setOrderSuccessDetail] = useState<string | null>(null);
  /** Last POST /api/public/product-order emailDelivery (for warning styling). */
  const [orderEmailDelivery, setOrderEmailDelivery] = useState<{
    sellerSent?: boolean;
    buyerSent?: boolean;
  } | null>(null);

  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const meta = useMemo(() => parseProductMetaTags(product?.tags ?? []), [product]);

  useEffect(() => {
    if (!product) {
      setSelectedSize(null);
      return;
    }
    const { sizes } = parseProductMetaTags(product.tags);
    setSelectedSize(sizes.length > 0 ? sizes[0] : null);
  }, [product]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") : null;
    if (!token) {
      setSessionResolved(true);
      return;
    }
    fetch("/api/admin/auth", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: AccountSession | null) => {
        if (data?.email) setAccountSession(data);
      })
      .finally(() => setSessionResolved(true));
  }, []);

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

  /** Any authenticated marketplace/admin account — session email + profile phone used server-side. */
  const canQuickOrder =
    accountSession &&
    ["user", "seller", "admin", "superadmin"].includes(accountSession.role);

  async function postOrder(body: Record<string, unknown>) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch("/api/public/product-order", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      emailDelivery?: { sellerSent?: boolean; buyerSent?: boolean };
    };
    if (!res.ok) {
      throw new Error(typeof data.error === "string" ? data.error : "Order failed");
    }
    return data;
  }

  async function handleOrderClick() {
    if (!product || orderBusy) return;
    setOrderNotice(null);
    setOrderSuccessDetail(null);
    setOrderEmailDelivery(null);

    const m = parseProductMetaTags(product.tags);
    if (m.sizes.length > 0 && !selectedSize) return;

    const orderPayload: Record<string, unknown> = { productId: product.id };
    if (m.sizes.length > 0 && selectedSize) orderPayload.selectedSize = selectedSize;

    if (canQuickOrder) {
      setOrderBusy(true);
      try {
        const data = await postOrder(orderPayload);
        setOrderSuccessDetail(typeof data.message === "string" ? data.message : null);
        setOrderEmailDelivery(data.emailDelivery ?? null);
        setOrderNotice("success");
      } catch {
        setOrderNotice("error");
      } finally {
        setOrderBusy(false);
      }
      return;
    }

    setGuestEmail(accountSession?.email || "");
    setGuestPhone("");
    setGuestAddress("");
    setGuestModalOpen(true);
  }

  async function handleGuestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || orderBusy) return;
    setOrderBusy(true);
    setOrderNotice(null);
    setOrderSuccessDetail(null);
    setOrderEmailDelivery(null);
    try {
      const m = parseProductMetaTags(product.tags);
      const orderPayload: Record<string, unknown> = {
        productId: product.id,
        guest: {
          email: guestEmail.trim(),
          phone: guestPhone.trim(),
          address: guestAddress.trim(),
        },
      };
      if (m.sizes.length > 0 && selectedSize) orderPayload.selectedSize = selectedSize;
      const data = await postOrder(orderPayload);
      setOrderSuccessDetail(typeof data.message === "string" ? data.message : null);
      setOrderEmailDelivery(data.emailDelivery ?? null);
      setGuestModalOpen(false);
      setOrderNotice("success");
    } catch {
      setOrderNotice("error");
    } finally {
      setOrderBusy(false);
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

              {(meta.sellerGender === "f" || meta.sellerGender === "m") && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                      meta.sellerGender === "f"
                        ? "bg-pink-100 text-pink-900"
                        : "bg-sky-100 text-sky-900"
                    }`}
                  >
                    {meta.sellerGender === "f"
                      ? t("product.badgeFemaleEntrepreneur")
                      : t("product.badgeMaleEntrepreneur")}
                  </span>
                </div>
              )}

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

              <p className="mt-4 text-sm text-charcoal/70">
                <span className="text-charcoal/50">{t("product.listingPhoneLabel")}: </span>
                {product.phone ? (
                  <a href={`tel:${product.phone.replace(/\s/g, "")}`} className="font-semibold text-green hover:underline">
                    {product.phone}
                  </a>
                ) : (
                  <span className="text-charcoal/45">{t("product.phoneNotListed")}</span>
                )}
              </p>

              <p className="mt-6 text-charcoal/70 leading-relaxed">{product.longDescription}</p>

              {meta.sizes.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal/45">
                    {t("product.availableSizes")}
                  </p>
                  <div className="flex flex-wrap gap-2" role="group" aria-label={t("product.availableSizes")}>
                    {meta.sizes.map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(sz)}
                        className={`min-w-[2.75rem] rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                          selectedSize === sz
                            ? "border-green bg-green text-white shadow-md shadow-green/20"
                            : "border-charcoal/15 bg-white text-charcoal hover:border-green/35"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3">
                {orderNotice === "success" && (
                  <p
                    className={`rounded-xl border px-4 py-3 text-sm text-charcoal ${
                      orderEmailDelivery?.sellerSent === true && orderEmailDelivery?.buyerSent === false
                        ? "border-amber-200 bg-amber-50"
                        : "border-green/25 bg-green/5"
                    }`}
                  >
                    {orderSuccessDetail?.trim() || t("product.orderSuccess")}
                  </p>
                )}
                {orderNotice === "error" && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {t("product.orderError")}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleOrderClick}
                  disabled={orderBusy || !sessionResolved}
                  className="w-full rounded-full bg-green py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-green/25 hover:bg-green-dark transition-all disabled:opacity-60"
                >
                  {orderBusy ? t("product.orderSending") : t("product.orderButton")}
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {meta.displayTags.map((tag, idx) => (
                  <span key={`${tag}-${idx}`} className="rounded-full bg-light-dark px-3 py-1 text-xs text-charcoal/50">
                    {tag}
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

      {guestModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-charcoal/55 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="guest-order-title"
            className="w-full max-w-md rounded-2xl border border-white/20 bg-white p-6 shadow-2xl sm:p-7"
          >
            <h2 id="guest-order-title" className="font-serif text-xl font-bold text-charcoal">
              {t("product.guestOrderTitle")}
            </h2>
            <p className="mt-2 text-sm text-charcoal/60">{t("product.guestOrderIntro")}</p>
            <form onSubmit={handleGuestSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="guest-email" className="block text-xs font-medium text-charcoal/60 mb-1">
                  {t("checkout.email")}
                </label>
                <input
                  id="guest-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-green/40"
                />
              </div>
              <div>
                <label htmlFor="guest-phone" className="block text-xs font-medium text-charcoal/60 mb-1">
                  {t("checkout.phone")}
                </label>
                <input
                  id="guest-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-green/40"
                />
              </div>
              <div>
                <label htmlFor="guest-address" className="block text-xs font-medium text-charcoal/60 mb-1">
                  {t("checkout.address")}
                </label>
                <textarea
                  id="guest-address"
                  autoComplete="street-address"
                  required
                  rows={3}
                  value={guestAddress}
                  onChange={(e) => setGuestAddress(e.target.value)}
                  className="w-full rounded-xl border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-green/40"
                />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setGuestModalOpen(false)}
                  className="rounded-full border border-charcoal/15 px-5 py-2.5 text-sm font-semibold text-charcoal/70 hover:bg-charcoal/5"
                >
                  {t("product.orderModalClose")}
                </button>
                <button
                  type="submit"
                  disabled={orderBusy}
                  className="rounded-full bg-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-dark disabled:opacity-60"
                >
                  {orderBusy ? t("product.orderSending") : t("product.orderButton")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
