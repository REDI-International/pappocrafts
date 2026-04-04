"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import {
  translateServiceCategory,
  translateShopCategory,
  type TranslationKey,
} from "@/lib/translations";
import { categories } from "@/lib/products";
import { serviceCategoryNames } from "@/lib/services";
import { MAX_PRODUCT_IMAGES, normalizeProductImageUrls } from "@/lib/product-images";
import ListingTurnstile, { isListingTurnstileConfigured } from "@/components/ListingTurnstile";

/** Matches seller regions; values align with product `country` field (full MK name). */
const LISTING_COUNTRIES = ["Albania", "Serbia", "North Macedonia"] as const;

function listingCountryLabel(country: string, t: (key: TranslationKey) => string) {
  if (country === "Albania") return t("listing.countryAlbania");
  if (country === "Serbia") return t("listing.countrySerbia");
  if (country === "North Macedonia") return t("listing.countryNorthMacedonia");
  return country;
}

type Tab = "product" | "service";

export default function ListingOfferModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t, currency } = useLocale();
  const [tab, setTab] = useState<Tab>("product");
  const [done, setDone] = useState<"product" | "service" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productLong, setProductLong] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState(categories[1] ?? "Pottery & Ceramics");
  const [productArtisan, setProductArtisan] = useState("");
  const [productCountry, setProductCountry] = useState<string>(LISTING_COUNTRIES[2]);
  const [productImages, setProductImages] = useState<string[]>(() => Array(MAX_PRODUCT_IMAGES).fill(""));
  const [productEmail, setProductEmail] = useState("");
  const [productPhone, setProductPhone] = useState("");

  const [svcName, setSvcName] = useState("");
  const [svcEmail, setSvcEmail] = useState("");
  const [svcPhone, setSvcPhone] = useState("");
  const [svcTitle, setSvcTitle] = useState("");
  const [svcCategory, setSvcCategory] = useState(
    serviceCategoryNames.find((c) => c !== "All") ?? "Plumbing"
  );
  const [svcDesc, setSvcDesc] = useState("");
  const [svcHourlyRate, setSvcHourlyRate] = useState("");
  const [svcLocation, setSvcLocation] = useState("");
  const [svcCountry, setSvcCountry] = useState<string>(LISTING_COUNTRIES[2]);
  const [svcNotes, setSvcNotes] = useState("");
  const [svcImageUrl, setSvcImageUrl] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaRemountKey, setCaptchaRemountKey] = useState(0);
  const [productUploadingIndex, setProductUploadingIndex] = useState<number | null>(null);
  const [productUploadTargetIndex, setProductUploadTargetIndex] = useState<number | null>(null);
  const [serviceUploading, setServiceUploading] = useState(false);
  const productGalleryInputRef = useRef<HTMLInputElement>(null);
  const productCameraInputRef = useRef<HTMLInputElement>(null);
  const serviceGalleryInputRef = useRef<HTMLInputElement>(null);
  const serviceCameraInputRef = useRef<HTMLInputElement>(null);

  const captchaRequired = isListingTurnstileConfigured();
  const onCaptchaToken = useCallback((token: string | null) => {
    setCaptchaToken(token);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setCaptchaToken(null);
  }, [open, tab]);

  function resetAll() {
    setDone(null);
    setError("");
    setProductName("");
    setProductDesc("");
    setProductLong("");
    setProductPrice("");
    setProductCategory(categories[1] ?? "Pottery & Ceramics");
    setProductArtisan("");
    setProductCountry(LISTING_COUNTRIES[2]);
    setProductImages(Array(MAX_PRODUCT_IMAGES).fill(""));
    setProductEmail("");
    setProductPhone("");
    setSvcName("");
    setSvcEmail("");
    setSvcPhone("");
    setSvcTitle("");
    setSvcCategory(serviceCategoryNames.find((c) => c !== "All") ?? "Plumbing");
    setSvcDesc("");
    setSvcHourlyRate("");
    setSvcLocation("");
    setSvcCountry(LISTING_COUNTRIES[2]);
    setSvcNotes("");
    setSvcImageUrl("");
    setCaptchaToken(null);
    setCaptchaRemountKey(0);
    setProductUploadingIndex(null);
    setProductUploadTargetIndex(null);
    setServiceUploading(false);
  }

  if (!open) return null;

  async function submitProduct(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const price = parseFloat(productPrice.replace(",", "."));
      const res = await fetch("/api/public/product-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          description: productDesc,
          longDescription: productLong,
          price: Number.isFinite(price) ? price : 0,
          currency,
          category: productCategory,
          artisan: productArtisan,
          country: productCountry,
          images: normalizeProductImageUrls(productImages),
          contactEmail: productEmail.trim() || undefined,
          contactPhone: productPhone,
          captchaToken: captchaToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("listing.error"));
        setCaptchaToken(null);
        setCaptchaRemountKey((k) => k + 1);
        return;
      }
      setDone("product");
    } catch {
      setError(t("listing.error"));
      setCaptchaToken(null);
      setCaptchaRemountKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitService(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const hourly = parseFloat(svcHourlyRate.replace(",", "."));
      const res = await fetch("/api/public/service-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName: svcName,
          contactEmail: svcEmail.trim() || undefined,
          contactPhone: svcPhone,
          serviceTitle: svcTitle,
          serviceCategory: svcCategory,
          serviceDescription: svcDesc,
          hourlyRate: Number.isFinite(hourly) ? hourly : 0,
          currency,
          location: svcLocation,
          country: svcCountry,
          notes: svcNotes || undefined,
          imageUrl: svcImageUrl.trim() || undefined,
          captchaToken: captchaToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("listing.error"));
        setCaptchaToken(null);
        setCaptchaRemountKey((k) => k + 1);
        return;
      }
      setDone("service");
    } catch {
      setError(t("listing.error"));
      setCaptchaToken(null);
      setCaptchaRemountKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/35 focus:border-green focus:outline-none focus:ring-1 focus:ring-green/30";
  const labelClass = "block text-xs font-medium text-charcoal/70";

  function handleFieldInvalid(
    e: React.InvalidEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const el = e.currentTarget;
    if (el.validity.valueMissing) {
      el.setCustomValidity(t("listing.validationRequired"));
    } else if (el.validity.tooShort && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) {
      el.setCustomValidity(
        t("listing.validationMinLength")
          .replace(/\{min\}/g, String(el.minLength))
          .replace(/\{count\}/g, String(el.value.length))
      );
    } else if (el.validity.typeMismatch && el instanceof HTMLInputElement) {
      if (el.type === "email") el.setCustomValidity(t("listing.validationEmail"));
      else if (el.type === "url") el.setCustomValidity(t("listing.validationUrl"));
      else el.setCustomValidity(t("listing.validationRequired"));
    } else {
      el.setCustomValidity(t("listing.validationRequired"));
    }
  }

  function clearFieldValidity(e: {
    currentTarget: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  }) {
    e.currentTarget.setCustomValidity("");
  }

  async function uploadPublicListingImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/public/upload", {
      method: "POST",
      body: formData,
    });
    const data = (await res.json().catch(() => ({}))) as { error?: unknown; url?: unknown };
    if (!res.ok || typeof data.url !== "string") {
      throw new Error(typeof data.error === "string" ? data.error : t("listing.error"));
    }
    return data.url;
  }

  function triggerProductImagePicker(index: number, source: "gallery" | "camera") {
    if (submitting || productUploadingIndex !== null || serviceUploading) return;
    setError("");
    setProductUploadTargetIndex(index);
    const input = source === "camera" ? productCameraInputRef.current : productGalleryInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  async function handleProductImageChosen(file: File | null) {
    const slotIndex = productUploadTargetIndex;
    if (!file || slotIndex === null) return;
    setError("");
    setProductUploadingIndex(slotIndex);
    try {
      const url = await uploadPublicListingImage(file);
      setProductImages((prev) => {
        const next = [...prev];
        while (next.length < MAX_PRODUCT_IMAGES) next.push("");
        next[slotIndex] = url;
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("listing.error"));
    } finally {
      setProductUploadingIndex(null);
      setProductUploadTargetIndex(null);
    }
  }

  function triggerServiceImagePicker(source: "gallery" | "camera") {
    if (submitting || productUploadingIndex !== null || serviceUploading) return;
    setError("");
    const input = source === "camera" ? serviceCameraInputRef.current : serviceGalleryInputRef.current;
    if (!input) return;
    input.value = "";
    input.click();
  }

  async function handleServiceImageChosen(file: File | null) {
    if (!file) return;
    setError("");
    setServiceUploading(true);
    try {
      const url = await uploadPublicListingImage(file);
      setSvcImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("listing.error"));
    } finally {
      setServiceUploading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-offer-title"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-charcoal/10">
        <button
          type="button"
          onClick={() => {
            resetAll();
            onClose();
          }}
          className="absolute right-3 top-3 rounded-full p-2 text-charcoal/45 hover:bg-charcoal/5 hover:text-charcoal z-10"
          aria-label={t("listing.close")}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-8">
          <h2 id="listing-offer-title" className="text-lg font-semibold text-charcoal pr-10">
            {t("listing.title")}
          </h2>
          <p className="mt-1 text-sm text-charcoal/55">{t("listing.subtitle")}</p>

          {done ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl bg-green/8 border border-green/20 px-4 py-3">
                <p className="text-sm font-semibold text-green-dark">
                  {done === "product" ? t("listing.successProductTitle") : t("listing.successServiceTitle")}
                </p>
                <p className="mt-2 text-sm text-charcoal/75">
                  {done === "product" ? t("listing.successProductBody") : t("listing.successServiceBody")}
                </p>
                <p className="mt-3 text-xs font-medium text-amber-800/90 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  {t("listing.statusPending")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetAll();
                  setTab(done);
                }}
                className="w-full rounded-full border border-charcoal/15 py-2.5 text-sm font-medium text-charcoal/80 hover:bg-charcoal/5"
              >
                {t("listing.submitAnother")}
              </button>
            </div>
          ) : (
            <>
              <div className="mt-5 flex rounded-full bg-charcoal/5 p-1">
                <button
                  type="button"
                  onClick={() => setTab("product")}
                  className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
                    tab === "product" ? "bg-white text-green shadow-sm" : "text-charcoal/50"
                  }`}
                >
                  {t("listing.tabProduct")}
                </button>
                <button
                  type="button"
                  onClick={() => setTab("service")}
                  className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
                    tab === "service" ? "bg-white text-blue shadow-sm" : "text-charcoal/50"
                  }`}
                >
                  {t("listing.tabService")}
                </button>
              </div>

              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {captchaRequired && (
                <div className="mt-4 space-y-2 rounded-xl border border-charcoal/10 bg-charcoal/[0.02] px-3 py-3">
                  <p className="text-[11px] text-charcoal/50 leading-snug">{t("listing.captchaHint")}</p>
                  <ListingTurnstile key={`${tab}-${captchaRemountKey}`} onToken={onCaptchaToken} />
                </div>
              )}

              {tab === "product" ? (
                <form onSubmit={submitProduct} className="mt-5 space-y-3">
                  <p className="text-xs text-charcoal/50 leading-snug">{t("listing.requiredLegend")}</p>
                  <div>
                    <label className={labelClass}>{t("listing.productName")} *</label>
                    <input
                      className={inputClass}
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      required
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.productDesc")} *</label>
                    <textarea
                      className={`${inputClass} min-h-[72px]`}
                      value={productDesc}
                      onChange={(e) => setProductDesc(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      required
                      minLength={10}
                      maxLength={2000}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.productLongDesc")}</label>
                    <textarea
                      className={`${inputClass} min-h-[64px]`}
                      value={productLong}
                      onChange={(e) => setProductLong(e.target.value)}
                      maxLength={8000}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>
                        {t("listing.priceEur")} ({currency}) *
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={inputClass}
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        onInvalid={handleFieldInvalid}
                        onInput={clearFieldValidity}
                        required
                        placeholder="0"
                      />
                      <p className="mt-1 text-[11px] text-charcoal/45 leading-snug">{t("listing.priceCurrencyNote")}</p>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className={labelClass}>{t("listing.category")} *</label>
                      <select
                        className={inputClass}
                        value={productCategory}
                        onChange={(e) => {
                          clearFieldValidity(e);
                          setProductCategory(e.target.value);
                        }}
                        onInvalid={handleFieldInvalid}
                        required
                      >
                        {categories.filter((c) => c !== "All").map((c) => (
                          <option key={c} value={c}>
                            {translateShopCategory(c, t)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.artisan")} *</label>
                    <input
                      className={inputClass}
                      value={productArtisan}
                      onChange={(e) => setProductArtisan(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      required
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.country")} *</label>
                    <select
                      className={inputClass}
                      value={productCountry}
                      onChange={(e) => {
                        clearFieldValidity(e);
                        setProductCountry(e.target.value);
                      }}
                      onInvalid={handleFieldInvalid}
                      required
                    >
                      {LISTING_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {listingCountryLabel(c, t)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <p className={labelClass}>{t("listing.productPhotosHelp")}</p>
                    <input
                      ref={productGalleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleProductImageChosen(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <input
                      ref={productCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleProductImageChosen(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    {Array.from({ length: MAX_PRODUCT_IMAGES }, (_, i) => (
                      <div key={i}>
                        <label className={labelClass}>
                          {t("listing.photoNumber").replace("{n}", String(i + 1))}
                        </label>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => triggerProductImagePicker(i, "gallery")}
                            disabled={submitting || productUploadingIndex !== null || serviceUploading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 px-2.5 py-1 text-[11px] font-medium text-charcoal/70 hover:bg-charcoal/5 disabled:opacity-60"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.7}
                              aria-hidden="true"
                            >
                              <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                              <circle cx="9" cy="10" r="1.5" />
                              <path d="M4.5 16.5l5-4.5 3.5 3 3.5-3 3 2.5" />
                            </svg>
                            Gallery
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerProductImagePicker(i, "camera")}
                            disabled={submitting || productUploadingIndex !== null || serviceUploading}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 px-2.5 py-1 text-[11px] font-medium text-charcoal/70 hover:bg-charcoal/5 disabled:opacity-60 sm:hidden"
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={1.7}
                              aria-hidden="true"
                            >
                              <path d="M4 9.5h3l1.2-2h7.6l1.2 2h3v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                              <circle cx="12" cy="13.5" r="3" />
                            </svg>
                            Camera
                          </button>
                          {productUploadingIndex === i && (
                            <span className="text-[11px] text-charcoal/45">Uploading…</span>
                          )}
                        </div>
                        <input
                          type="url"
                          className={inputClass}
                          value={productImages[i] ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setProductImages((prev) => {
                              const next = [...prev];
                              while (next.length < MAX_PRODUCT_IMAGES) next.push("");
                              next[i] = v;
                              return next;
                            });
                          }}
                          onInvalid={handleFieldInvalid}
                          onInput={clearFieldValidity}
                          placeholder="https://"
                          maxLength={2000}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.contactEmail")}</label>
                    <input
                      type="email"
                      className={inputClass}
                      value={productEmail}
                      onChange={(e) => setProductEmail(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.contactPhone")} *</label>
                    <input
                      type="tel"
                      className={inputClass}
                      value={productPhone}
                      onChange={(e) => setProductPhone(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      required
                      minLength={6}
                      autoComplete="tel"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      productUploadingIndex !== null ||
                      serviceUploading ||
                      (captchaRequired && !captchaToken)
                    }
                    className="mt-2 w-full rounded-full bg-green py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-dark disabled:opacity-60"
                  >
                    {submitting ? t("listing.submitting") : t("listing.submitProduct")}
                  </button>
                </form>
              ) : (
                <form onSubmit={submitService} className="mt-5 space-y-3">
                  <p className="text-xs text-charcoal/50 leading-snug">{t("listing.requiredLegend")}</p>
                  <div>
                    <label className={labelClass}>{t("listing.contactName")} *</label>
                    <input
                      className={inputClass}
                      value={svcName}
                      onChange={(e) => setSvcName(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      required
                      maxLength={120}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.contactEmail")}</label>
                    <input
                      type="email"
                      className={inputClass}
                      value={svcEmail}
                      onChange={(e) => setSvcEmail(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.contactPhone")} *</label>
                    <input
                      type="tel"
                      className={inputClass}
                      value={svcPhone}
                      onChange={(e) => setSvcPhone(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      required
                      minLength={6}
                      autoComplete="tel"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.servicePhotoUrl")}</label>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => triggerServiceImagePicker("gallery")}
                        disabled={submitting || productUploadingIndex !== null || serviceUploading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 px-2.5 py-1 text-[11px] font-medium text-charcoal/70 hover:bg-charcoal/5 disabled:opacity-60"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          aria-hidden="true"
                        >
                          <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                          <circle cx="9" cy="10" r="1.5" />
                          <path d="M4.5 16.5l5-4.5 3.5 3 3.5-3 3 2.5" />
                        </svg>
                        Gallery
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerServiceImagePicker("camera")}
                        disabled={submitting || productUploadingIndex !== null || serviceUploading}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 px-2.5 py-1 text-[11px] font-medium text-charcoal/70 hover:bg-charcoal/5 disabled:opacity-60 sm:hidden"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.7}
                          aria-hidden="true"
                        >
                          <path d="M4 9.5h3l1.2-2h7.6l1.2 2h3v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                          <circle cx="12" cy="13.5" r="3" />
                        </svg>
                        Camera
                      </button>
                      {serviceUploading && <span className="text-[11px] text-charcoal/45">Uploading…</span>}
                    </div>
                    <input
                      ref={serviceGalleryInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleServiceImageChosen(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <input
                      ref={serviceCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleServiceImageChosen(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <input
                      type="url"
                      className={inputClass}
                      value={svcImageUrl}
                      onChange={(e) => setSvcImageUrl(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      placeholder="https://"
                      maxLength={2000}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.serviceTitle")} *</label>
                    <input
                      className={inputClass}
                      value={svcTitle}
                      onChange={(e) => setSvcTitle(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      required
                      maxLength={200}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.serviceCategory")} *</label>
                    <select
                      className={inputClass}
                      value={svcCategory}
                      onChange={(e) => {
                        clearFieldValidity(e);
                        setSvcCategory(e.target.value);
                      }}
                      onInvalid={handleFieldInvalid}
                      required
                    >
                      {serviceCategoryNames
                        .filter((c) => c !== "All")
                        .map((c) => (
                          <option key={c} value={c}>
                            {translateServiceCategory(c, t)}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {t("listing.hourlyRate")} ({currency}) *
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className={inputClass}
                      value={svcHourlyRate}
                      onChange={(e) => setSvcHourlyRate(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      required
                      placeholder="0"
                    />
                    <p className="mt-1 text-[11px] text-charcoal/45 leading-snug">
                      {t("listing.hourlyRateCurrencyNote")}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.serviceDesc")} *</label>
                    <textarea
                      className={`${inputClass} min-h-[100px]`}
                      value={svcDesc}
                      onChange={(e) => setSvcDesc(e.target.value)}
                      onInvalid={handleFieldInvalid}
                      onInput={clearFieldValidity}
                      required
                      minLength={20}
                      maxLength={4000}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.location")}</label>
                    <input className={inputClass} value={svcLocation} onChange={(e) => setSvcLocation(e.target.value)} maxLength={200} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.country")} *</label>
                    <select
                      className={inputClass}
                      value={svcCountry}
                      onChange={(e) => {
                        clearFieldValidity(e);
                        setSvcCountry(e.target.value);
                      }}
                      onInvalid={handleFieldInvalid}
                      required
                    >
                      {LISTING_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {listingCountryLabel(c, t)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.notes")}</label>
                    <textarea className={`${inputClass} min-h-[56px]`} value={svcNotes} onChange={(e) => setSvcNotes(e.target.value)} maxLength={2000} />
                  </div>
                  <button
                    type="submit"
                    disabled={
                      submitting ||
                      productUploadingIndex !== null ||
                      serviceUploading ||
                      (captchaRequired && !captchaToken)
                    }
                    className="mt-2 w-full rounded-full bg-blue py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-dark disabled:opacity-60"
                  >
                    {submitting ? t("listing.submitting") : t("listing.submitService")}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
