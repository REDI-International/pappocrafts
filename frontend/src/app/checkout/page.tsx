"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useCart } from "@/lib/cart-context";
import { useLocale } from "@/lib/locale-context";

type PaymentMethod = "online" | "later";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const {
    t, formatPrice, formatRegionalPrice, getRegionalEurPrice,
    getShippingCost, shippingEstimate, regionLabel, region, shippingZone, currency,
  } = useLocale();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("later");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const markTouched = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  const regionalTotal = items.reduce(
    (sum, item) => sum + getRegionalEurPrice(item.product.price) * item.quantity,
    0
  );
  const shipping = getShippingCost(regionalTotal);
  const grandTotal = regionalTotal + shipping.cost;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneValid = phone.replace(/[\s\-\(\)\.]/g, "").length >= 8;
  const formValid = name.trim().length > 0 && emailValid && phoneValid && address.trim().length > 0 && city.trim().length > 0 && country.trim().length > 0;

  async function submitOrder() {
    setLoading(true);
    setError("");

    const orderPayload = {
      customer: { name, email, phone, address, city, postalCode, country, notes },
      items: items.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: getRegionalEurPrice(item.product.price),
        quantity: item.quantity,
        artisan: item.product.artisan,
        country: item.product.country,
        image: item.product.image,
      })),
      subtotal: regionalTotal,
      shippingCost: shipping.cost,
      total: grandTotal,
      paymentMethod,
      region: regionLabel,
      shippingZone,
      currency,
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to place order.");
        setLoading(false);
        return;
      }

      if (paymentMethod === "online") {
        const stripeRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              id: item.product.id,
              name: item.product.name,
              price: getRegionalEurPrice(item.product.price),
              quantity: item.quantity,
              image: item.product.image,
            })),
          }),
        });

        const stripeData = await stripeRes.json();

        if (stripeData.url) {
          window.location.href = stripeData.url;
          return;
        }
      }

      if (posthog.__loaded) {
        posthog.capture("purchase_completed", {
          order_id: data.orderId,
          total: totalPrice,
          item_count: items.length,
          payment_method: paymentMethod,
        });
      }
      clearCart();
      router.push(`/checkout/success?order=${data.orderId}&method=${paymentMethod}`);
    } catch {
      setError("Connection error. Please try again.");
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (posthog.__loaded) {
      posthog.capture("checkout_started", { item_count: items.length, total: totalPrice });
    }
    setTouched({ name: true, email: true, phone: true, address: true, city: true, country: true });
    if (!formValid) return;
    submitOrder();
  }

  const inputCls = (field: string, valid: boolean) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-green/40 ${
      touched[field] && !valid
        ? "border-red-300 bg-red-50/30"
        : "border-charcoal/10 bg-white"
    }`;

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal tracking-tight mb-2">
            {t("checkout.title")}
          </h1>
          <p className="text-charcoal/60 mb-8">{t("checkout.review")}</p>

          {items.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-charcoal/5">
              <svg className="h-16 w-16 text-charcoal/20 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <p className="text-charcoal/50 mb-4">{t("checkout.emptyCart")}</p>
              <Link href="/shop" className="inline-flex rounded-full bg-green px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-dark transition-colors">
                {t("checkout.browseProducts")}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="grid gap-8 lg:grid-cols-5">
                {/* Left: Cart + Form */}
                <div className="lg:col-span-3 space-y-8">
                  {/* Cart Items */}
                  <section>
                    <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green text-xs text-white font-bold">1</span>
                      {t("cart.title")} ({items.length})
                    </h2>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.product.id} className="flex gap-3 bg-white rounded-xl border border-charcoal/5 p-3">
                          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-light">
                            <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="64px" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-charcoal truncate">{item.product.name}</h3>
                            <p className="text-xs text-charcoal/50">{t("shop.by")} {item.product.artisan}</p>
                            <div className="mt-1.5 flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="h-6 w-6 rounded border border-charcoal/10 flex items-center justify-center text-xs text-charcoal/60 hover:border-green hover:text-green transition-colors">-</button>
                                <span className="text-xs font-medium w-5 text-center">{item.quantity}</span>
                                <button type="button" onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="h-6 w-6 rounded border border-charcoal/10 flex items-center justify-center text-xs text-charcoal/60 hover:border-green hover:text-green transition-colors">+</button>
                                <button type="button" onClick={() => removeItem(item.product.id)} className="ml-2 text-xs text-charcoal/30 hover:text-red-500 transition-colors">{t("checkout.remove")}</button>
                              </div>
                              <p className="text-sm font-bold text-green">{formatRegionalPrice(item.product.price * item.quantity)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Customer Details */}
                  <section>
                    <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green text-xs text-white font-bold">2</span>
                      {t("checkout.customerDetails")}
                    </h2>
                    <div className="bg-white rounded-xl border border-charcoal/5 p-5 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-charcoal/70 mb-1">
                            {t("checkout.fullName")} <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text" required value={name} onChange={(e) => setName(e.target.value)}
                            onBlur={() => markTouched("name")}
                            className={inputCls("name", name.trim().length > 0)}
                            placeholder="e.g. Maria Petrović"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-charcoal/70 mb-1">
                            {t("checkout.email")} <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => markTouched("email")}
                            className={inputCls("email", emailValid || email.length === 0)}
                            placeholder="email@example.com"
                          />
                          {touched.email && !emailValid && email.length > 0 && (
                            <p className="text-xs text-red-500 mt-1">Please enter a valid email address.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-charcoal/70 mb-1">
                          {t("checkout.phone")} <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                          onBlur={() => markTouched("phone")}
                          className={inputCls("phone", phoneValid || phone.length === 0)}
                          placeholder="+381 61 234 5678"
                        />
                        {touched.phone && !phoneValid && phone.length > 0 && (
                          <p className="text-xs text-red-500 mt-1">Please enter a valid phone number (min. 8 digits).</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-charcoal/70 mb-1">
                          {t("checkout.address")} <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text" required value={address} onChange={(e) => setAddress(e.target.value)}
                          onBlur={() => markTouched("address")}
                          className={inputCls("address", address.trim().length > 0)}
                          placeholder="Knez Mihailova 12"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                          <label className="block text-xs font-medium text-charcoal/70 mb-1">
                            {t("checkout.city")} <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                            onBlur={() => markTouched("city")}
                            className={inputCls("city", city.trim().length > 0)}
                            placeholder="Belgrade"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-charcoal/70 mb-1">
                            {t("checkout.postalCode")}
                          </label>
                          <input
                            type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)}
                            className="w-full rounded-lg border border-charcoal/10 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green/40"
                            placeholder="11000"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-charcoal/70 mb-1">
                            {t("checkout.country")} <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text" required value={country} onChange={(e) => setCountry(e.target.value)}
                            onBlur={() => markTouched("country")}
                            className={inputCls("country", country.trim().length > 0)}
                            placeholder="Serbia"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-charcoal/70 mb-1">
                          {t("checkout.orderNotes")}
                        </label>
                        <textarea
                          value={notes} onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          className="w-full rounded-lg border border-charcoal/10 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green/40 resize-none"
                          placeholder={t("checkout.orderNotesPlaceholder")}
                        />
                      </div>
                    </div>
                  </section>

                  {/* Payment Method */}
                  <section>
                    <h2 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green text-xs text-white font-bold">3</span>
                      {t("checkout.paymentMethod")}
                    </h2>
                    <div className="space-y-3">
                      <label
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === "later"
                            ? "border-green bg-green/5"
                            : "border-charcoal/10 bg-white hover:border-charcoal/20"
                        }`}
                      >
                        <input
                          type="radio" name="payment" value="later"
                          checked={paymentMethod === "later"}
                          onChange={() => setPaymentMethod("later")}
                          className="mt-0.5 accent-green"
                        />
                        <div>
                          <p className="font-semibold text-charcoal text-sm">{t("checkout.payLater")}</p>
                          <p className="text-xs text-charcoal/50 mt-0.5">{t("checkout.payLaterDesc")}</p>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === "online"
                            ? "border-green bg-green/5"
                            : "border-charcoal/10 bg-white hover:border-charcoal/20"
                        }`}
                      >
                        <input
                          type="radio" name="payment" value="online"
                          checked={paymentMethod === "online"}
                          onChange={() => setPaymentMethod("online")}
                          className="mt-0.5 accent-green"
                        />
                        <div>
                          <p className="font-semibold text-charcoal text-sm">{t("checkout.payOnline")}</p>
                          <p className="text-xs text-charcoal/50 mt-0.5">{t("checkout.payOnlineDesc")}</p>
                        </div>
                      </label>
                    </div>
                  </section>
                </div>

                {/* Right: Order Summary */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl border border-charcoal/5 p-6 sticky top-24">
                    <h2 className="font-semibold text-charcoal mb-1">{t("checkout.title")}</h2>
                    <p className="text-xs text-charcoal/40 mb-4">
                      {t("checkout.shippingTo")}: {regionLabel}
                    </p>

                    <div className="space-y-3 border-b border-charcoal/10 pb-4 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-charcoal/60">{t("checkout.subtotal")}</span>
                        <span className="text-charcoal">{formatPrice(regionalTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-charcoal/60">{t("checkout.shipping")}</span>
                        <span className="text-green font-medium">
                          {shipping.isFree ? t("checkout.shippingFree") : formatPrice(shipping.cost)}
                        </span>
                      </div>
                      {!shipping.isFree && shipping.freeAbove !== null && (
                        <p className="text-xs text-charcoal/40">
                          {t("checkout.freeShippingAbove")} {formatPrice(shipping.freeAbove)}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-charcoal/40">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-2.25 0h-2.25m0 0v6.75m0-6.75H5.625" />
                        </svg>
                        {t("checkout.estDelivery")}: {shippingEstimate}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                      <span className="font-semibold text-charcoal">{t("checkout.total")}</span>
                      <span className="text-2xl font-bold text-charcoal">
                        {formatPrice(grandTotal)}
                      </span>
                    </div>

                    {error && (
                      <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-full bg-green py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-green/25 hover:bg-green-dark disabled:opacity-50 transition-all"
                    >
                      {loading
                        ? t("checkout.processing")
                        : paymentMethod === "online"
                          ? t("checkout.payStripe")
                          : t("checkout.placeOrder")}
                    </button>

                    {paymentMethod === "later" && (
                      <p className="mt-3 text-xs text-charcoal/40 text-center">
                        {t("checkout.payLaterDesc")}
                      </p>
                    )}

                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-charcoal/40">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      {t("checkout.secure")}
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
