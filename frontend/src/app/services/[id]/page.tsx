"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getServiceProvider, serviceProviders, mapSupabaseServiceRow, type ServiceProvider } from "@/lib/services";
import { useLocale } from "@/lib/locale-context";
import { translateServiceCategory } from "@/lib/translations";
import { trackMarketplaceEvent } from "@/components/Analytics";

export default function ServiceProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [provider, setProvider] = useState<ServiceProvider | null>(() => getServiceProvider(id) ?? null);
  const [loading, setLoading] = useState(true);

  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [revealCount, setRevealCount] = useState<number | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealError, setRevealError] = useState("");

  const { t, formatRegionalPrice } = useLocale();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/services?id=${encodeURIComponent(id)}`);
        if (r.ok) {
          const d = await r.json();
          if (!cancelled && d?.id) {
            const mapped = mapSupabaseServiceRow(d);
            setProvider(mapped);
            trackMarketplaceEvent({
              eventType: "service_view",
              listingId: mapped.id,
              sellerName: mapped.sellerName || mapped.name || undefined,
              pagePath: `/services/${mapped.id}`,
            });
            setLoading(false);
            return;
          }
        }
      } catch {
        /* keep static fallback */
      }
      if (!cancelled) {
        setProvider((p) => p ?? getServiceProvider(id) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-24 pb-24 px-4 text-center text-charcoal/40 text-sm">Loading…</main>
        <Footer />
      </>
    );
  }

  if (!provider) notFound();

  const svc = provider!;
  const sellerProfileName = svc.sellerName || svc.name || "";
  const hasSellerProfile =
    svc != null &&
    Boolean(
      (svc.sellerBiography && svc.sellerBiography.trim()) ||
        (svc.sellerLogoUrl && svc.sellerLogoUrl.trim())
    );

  const related = serviceProviders
    .filter((p) => p.category === svc.category && p.id !== svc.id)
    .slice(0, 3);

  async function handleRevealContact() {
    if (revealLoading || revealedPhone) return;
    setRevealError("");
    setRevealLoading(true);
    try {
      const res = await fetch("/api/public/reveal-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "service", id: svc.id }),
      });
      const data = await res.json().catch(() => ({}));
      const phone =
        typeof data.phone === "string" && data.phone.trim()
          ? data.phone.trim()
          : typeof data.contact === "string" && data.contact.trim()
            ? data.contact.trim()
            : "";
      if (res.ok && phone) {
        setRevealedPhone(phone);
        setRevealCount(typeof data.contactRevealCount === "number" ? data.contactRevealCount : null);
        return;
      }
      if (svc.phone?.trim()) {
        setRevealedPhone(svc.phone.trim());
        setRevealCount(null);
        return;
      }
                      setRevealError(typeof data.error === "string" ? data.error : t("listing.error"));
    } catch {
      if (svc.phone?.trim()) {
        setRevealedPhone(svc.phone.trim());
        setRevealCount(null);
      } else {
        setRevealError(t("listing.error"));
      }
    } finally {
      setRevealLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 text-sm text-charcoal/50">
            <Link href="/services" className="hover:text-green transition-colors">{t("nav.services")}</Link>
            <span>/</span>
            <Link href={`/services?category=${encodeURIComponent(provider.category)}`} className="hover:text-green transition-colors">
              {translateServiceCategory(provider.category, t)}
            </Link>
            <span>/</span>
            <span className="text-charcoal">{provider.name}</span>
          </nav>

          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex items-start gap-5 mb-6">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-light">
                  <Image src={provider.image} alt={provider.name} fill className="object-cover" sizes="80px" priority unoptimized />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-serif text-3xl font-bold text-charcoal">{provider.name}</h1>
                    {provider.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          badge === "Top Rated" ? "bg-green/10 text-green" :
                          badge === "Certified" ? "bg-blue/10 text-blue" :
                          "bg-charcoal/5 text-charcoal/60"
                        }`}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <p className="text-lg text-charcoal/60 mt-1">{provider.title}</p>
                  <div className="mt-2 flex items-center gap-4 text-sm text-charcoal/50 flex-wrap">
                    <span className="flex items-center gap-1">
                      <svg className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                      </svg>
                      {provider.rating} ({provider.reviewCount} {t("service.reviews").toLowerCase()})
                    </span>
                    <span>{provider.location}, {provider.country}</span>
                    <span>{provider.completedJobs} {t("service.jobsDone").toLowerCase()}</span>
                  </div>
                </div>
              </div>

              {(provider.yearsExperience || provider.languagesSpoken) && (
                <div className="mt-6 rounded-xl border border-charcoal/10 bg-light/60 p-4 text-sm text-charcoal/75 space-y-2">
                  {provider.yearsExperience && (
                    <p><span className="font-semibold text-charcoal">Experience:</span> {provider.yearsExperience}</p>
                  )}
                  {provider.languagesSpoken && (
                    <p><span className="font-semibold text-charcoal">Languages:</span> {provider.languagesSpoken}</p>
                  )}
                </div>
              )}

              <div className="prose prose-charcoal max-w-none">
                <h2 className="font-serif text-xl font-bold text-charcoal mt-8 mb-3">{t("service.about")}</h2>
                {provider.summary && provider.summary !== provider.description && (
                  <p className="text-charcoal/80 font-medium mb-3">{provider.summary}</p>
                )}
                <p className="text-charcoal/70 leading-relaxed">{provider.longDescription}</p>
              </div>

              {hasSellerProfile && (
                <div className="mt-6 rounded-xl border border-charcoal/10 bg-light/60 p-4">
                  <div className="flex items-start gap-3">
                    {svc.sellerLogoUrl ? (
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border border-charcoal/10 bg-white">
                        <Image
                          src={svc.sellerLogoUrl}
                          alt={`${sellerProfileName} logo`}
                          fill
                          className="object-cover"
                          sizes="56px"
                          unoptimized
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-charcoal">{sellerProfileName}</p>
                      {svc.sellerBiography ? (
                        <p className="mt-1 text-sm leading-relaxed text-charcoal/70 whitespace-pre-line">
                          {svc.sellerBiography}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl bg-green/5 border border-green/10 p-4 text-center">
                  <p className="text-2xl font-bold text-green">{provider.completedJobs}</p>
                  <p className="text-xs text-charcoal/50 mt-1">{t("service.jobsDone")}</p>
                </div>
                <div className="rounded-xl bg-blue/5 border border-blue/10 p-4 text-center">
                  <p className="text-2xl font-bold text-blue">{provider.rating}</p>
                  <p className="text-xs text-charcoal/50 mt-1">{t("service.rating")}</p>
                </div>
                <div className="rounded-xl bg-green/5 border border-green/10 p-4 text-center">
                  <p className="text-2xl font-bold text-green">{provider.responseTime}</p>
                  <p className="text-xs text-charcoal/50 mt-1">{t("service.response")}</p>
                </div>
                <div className="rounded-xl bg-blue/5 border border-blue/10 p-4 text-center">
                  <p className="text-2xl font-bold text-blue">{provider.reviewCount}</p>
                  <p className="text-xs text-charcoal/50 mt-1">{t("service.reviews")}</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-2xl bg-white border border-charcoal/5 p-6 shadow-sm">
                <div className="text-center mb-6">
                  <div className="text-sm text-charcoal/50 mb-1">{t("service.startingFrom")}</div>
                  <div className="flex items-baseline justify-center gap-2">
                    {provider.hourlyRate > 0 && (
                      <span className="text-3xl font-bold text-green">{formatRegionalPrice(provider.hourlyRate)}<span className="text-base font-normal text-charcoal/50">{t("services.perHour")}</span></span>
                    )}
                  </div>
                  {provider.fixedRateFrom && (
                    <p className="text-sm text-charcoal/50 mt-1">{t("service.fixedFrom")} {formatRegionalPrice(provider.fixedRateFrom)}</p>
                  )}
                </div>

                <div className="space-y-3">
                  {provider.bookingCalendarUrl && (
                    <a
                      href={provider.bookingCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full rounded-full border-2 border-green py-3 text-center text-sm font-semibold text-green hover:bg-green hover:text-white transition-all"
                    >
                      View availability & book
                    </a>
                  )}

                  {provider.phone && !revealedPhone && (
                    <a
                      href={`tel:${provider.phone.replace(/\s/g, "")}`}
                      className="block w-full rounded-full bg-green py-3 text-center text-sm font-semibold text-white shadow-lg shadow-green/25 hover:bg-green-dark transition-all"
                    >
                      Call {provider.phone}
                    </a>
                  )}

                  {!revealedPhone ? (
                    <button
                      type="button"
                      onClick={handleRevealContact}
                      disabled={revealLoading}
                      className="w-full rounded-full bg-green py-3 text-center text-sm font-semibold text-white shadow-lg shadow-green/25 hover:bg-green-dark transition-all disabled:opacity-60"
                    >
                      {revealLoading ? t("listing.submitting") : t("listing.revealContactDetails")}
                    </button>
                  ) : (
                    <div className="rounded-2xl border border-green/20 bg-green/5 px-4 py-4">
                      <p className="text-sm text-charcoal/60">
                        <span className="text-charcoal/45">{t("service.providerPhone")}: </span>
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
                  {revealError && <p className="text-xs text-red-600 text-center">{revealError}</p>}
                </div>

                <div className="mt-6 pt-4 border-t border-charcoal/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-charcoal/50">
                    <svg className="h-4 w-4 text-green" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                    {t("service.verified")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-charcoal/50">
                    <svg className="h-4 w-4 text-green" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                    </svg>
                    {t("service.respondsIn")} {provider.responseTime.toLowerCase()}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-charcoal/50">
                    <svg className="h-4 w-4 text-green" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                    {provider.rating} {t("services.from")} {provider.reviewCount} {t("service.reviews").toLowerCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-24">
              <h2 className="font-serif text-2xl font-bold text-charcoal mb-8">
                {t("service.otherProviders")} {translateServiceCategory(provider.category, t)}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <Link
                    key={p.id}
                    href={`/services/${p.id}`}
                    className="group rounded-2xl bg-white border border-charcoal/5 p-5 hover:shadow-lg hover:border-green/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-light">
                        <Image src={p.image} alt={p.name} fill className="object-cover" sizes="48px" unoptimized />
                      </div>
                      <div>
                        <h3 className="font-semibold text-charcoal group-hover:text-green transition-colors">{p.name}</h3>
                        <p className="text-sm text-charcoal/50">{p.title}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-charcoal/60 line-clamp-2">{p.description}</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="font-bold text-green">
                        {p.hourlyRate > 0 ? `${formatRegionalPrice(p.hourlyRate)}${t("services.perHour")}` : `${t("services.from")} ${formatRegionalPrice(p.fixedRateFrom!)}`}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-charcoal/40">
                        <svg className="h-3.5 w-3.5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                        </svg>
                        {p.rating} ({p.reviewCount})
                      </span>
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
