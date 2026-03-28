"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/locale-context";
import { categories } from "@/lib/products";
import { serviceCategoryNames } from "@/lib/services";

const LISTING_COUNTRIES = [
  "Albania",
  "Serbia",
  "Kosovo",
  "North Macedonia",
  "Bosnia",
  "Montenegro",
] as const;

type Tab = "product" | "service";

export default function ListingOfferModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const [tab, setTab] = useState<Tab>("product");
  const [done, setDone] = useState<"product" | "service" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [productLong, setProductLong] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productCategory, setProductCategory] = useState(categories[1] ?? "Other");
  const [productArtisan, setProductArtisan] = useState("");
  const [productCountry, setProductCountry] = useState<string>(LISTING_COUNTRIES[3]);
  const [productImage, setProductImage] = useState("");
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
  const [svcLocation, setSvcLocation] = useState("");
  const [svcCountry, setSvcCountry] = useState<string>(LISTING_COUNTRIES[3]);
  const [svcNotes, setSvcNotes] = useState("");

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

  function resetAll() {
    setDone(null);
    setError("");
    setProductName("");
    setProductDesc("");
    setProductLong("");
    setProductPrice("");
    setProductCategory(categories[1] ?? "Other");
    setProductArtisan("");
    setProductCountry(LISTING_COUNTRIES[3]);
    setProductImage("");
    setProductEmail("");
    setProductPhone("");
    setSvcName("");
    setSvcEmail("");
    setSvcPhone("");
    setSvcTitle("");
    setSvcCategory(serviceCategoryNames.find((c) => c !== "All") ?? "Plumbing");
    setSvcDesc("");
    setSvcLocation("");
    setSvcCountry(LISTING_COUNTRIES[3]);
    setSvcNotes("");
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
          category: productCategory,
          artisan: productArtisan,
          country: productCountry,
          image: productImage,
          contactEmail: productEmail.trim() || undefined,
          contactPhone: productPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("listing.error"));
        return;
      }
      setDone("product");
    } catch {
      setError(t("listing.error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function submitService(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
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
          location: svcLocation,
          country: svcCountry,
          notes: svcNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : t("listing.error"));
        return;
      }
      setDone("service");
    } catch {
      setError(t("listing.error"));
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-charcoal/15 bg-white px-3 py-2 text-sm text-charcoal placeholder:text-charcoal/35 focus:border-green focus:outline-none focus:ring-1 focus:ring-green/30";
  const labelClass = "block text-xs font-medium text-charcoal/70";

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

              {tab === "product" ? (
                <form onSubmit={submitProduct} className="mt-5 space-y-3">
                  <div>
                    <label className={labelClass}>{t("listing.productName")} *</label>
                    <input
                      className={inputClass}
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
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
                    <div>
                      <label className={labelClass}>{t("listing.priceEur")} *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={inputClass}
                        value={productPrice}
                        onChange={(e) => setProductPrice(e.target.value)}
                        required
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>{t("listing.category")} *</label>
                      <select
                        className={inputClass}
                        value={productCategory}
                        onChange={(e) => setProductCategory(e.target.value)}
                      >
                        {categories.filter((c) => c !== "All").map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.artisan")} *</label>
                    <input className={inputClass} value={productArtisan} onChange={(e) => setProductArtisan(e.target.value)} required maxLength={120} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.country")} *</label>
                    <select className={inputClass} value={productCountry} onChange={(e) => setProductCountry(e.target.value)}>
                      {LISTING_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.imageUrl")}</label>
                    <input
                      type="url"
                      className={inputClass}
                      value={productImage}
                      onChange={(e) => setProductImage(e.target.value)}
                      placeholder="https://"
                      maxLength={2000}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.contactEmail")}</label>
                    <input
                      type="email"
                      className={inputClass}
                      value={productEmail}
                      onChange={(e) => setProductEmail(e.target.value)}
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
                      required
                      minLength={6}
                      autoComplete="tel"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 w-full rounded-full bg-green py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-dark disabled:opacity-60"
                  >
                    {submitting ? t("listing.submitting") : t("listing.submitProduct")}
                  </button>
                </form>
              ) : (
                <form onSubmit={submitService} className="mt-5 space-y-3">
                  <div>
                    <label className={labelClass}>{t("listing.contactName")} *</label>
                    <input className={inputClass} value={svcName} onChange={(e) => setSvcName(e.target.value)} required maxLength={120} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.contactEmail")}</label>
                    <input
                      type="email"
                      className={inputClass}
                      value={svcEmail}
                      onChange={(e) => setSvcEmail(e.target.value)}
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
                      required
                      minLength={6}
                      autoComplete="tel"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.serviceTitle")} *</label>
                    <input className={inputClass} value={svcTitle} onChange={(e) => setSvcTitle(e.target.value)} required maxLength={200} />
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.serviceCategory")} *</label>
                    <select className={inputClass} value={svcCategory} onChange={(e) => setSvcCategory(e.target.value)}>
                      {serviceCategoryNames
                        .filter((c) => c !== "All")
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t("listing.serviceDesc")} *</label>
                    <textarea
                      className={`${inputClass} min-h-[100px]`}
                      value={svcDesc}
                      onChange={(e) => setSvcDesc(e.target.value)}
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
                    <select className={inputClass} value={svcCountry} onChange={(e) => setSvcCountry(e.target.value)}>
                      {LISTING_COUNTRIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
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
                    disabled={submitting}
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
